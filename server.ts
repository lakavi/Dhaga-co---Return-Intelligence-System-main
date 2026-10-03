import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { AUTO_APPROVE_AT } from './server/taxonomy';
import {
  decide,
  getDashboard,
  getReviewQueue,
  getSkuDetail,
  replaceWithRun,
  resetToSample,
  savePipeline,
  seedIfEmpty,
  EventRecord,
} from './server/store';
import { loadAndBatch } from './server/ingest';
import { classifyComment, modelsConfigured } from './server/classify';
import { overviewPublic, writeWeeklyOverview } from './server/overview';
import {
  getResolutionCases,
  getResolutionStats,
  simulateNewReturn,
  updateCaseStage,
} from './server/resolutionAgent';

dotenv.config();

const app = express();
const port = 3000;
const host = '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload configuration (in-memory buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Seed data
seedIfEmpty();

// --- API Endpoints ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    models_configured: modelsConfigured(),
    auto_approve_pct: Math.round(AUTO_APPROVE_AT * 100),
  });
});

app.get('/api/dashboard', (_req: Request, res: Response) => {
  res.json(getDashboard());
});

app.get('/api/sku/:sku', (req: Request, res: Response) => {
  res.json(getSkuDetail(req.params.sku));
});

app.get('/api/review', (_req: Request, res: Response) => {
  res.json({ rows: getReviewQueue() });
});

app.post('/api/review/:event_id/approve', (req: Request, res: Response) => {
  try {
    const result = decide(req.params.event_id, 'approve');
    if (!result) {
      return res.status(404).json({ detail: 'That review row is not open.' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ detail: err.message });
  }
});

app.post('/api/review/:event_id/dismiss', (req: Request, res: Response) => {
  const result = decide(req.params.event_id, 'dismiss');
  if (!result) {
    return res.status(404).json({ detail: 'That review row is not open.' });
  }
  res.json({ ok: true });
});

app.post('/api/review/:event_id/edit', (req: Request, res: Response) => {
  try {
    const { label } = req.body;
    const result = decide(req.params.event_id, 'edit', label);
    if (!result) {
      return res.status(404).json({ detail: 'That review row is not open.' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ detail: err.message });
  }
});

app.post('/api/reset', (_req: Request, res: Response) => {
  resetToSample();
  res.json({ ok: true, message: 'Reset to sample data.' });
});

// --- Autonomous Resolution Agent Endpoints ---

app.get('/api/agent/cases', (_req: Request, res: Response) => {
  res.json(getResolutionCases());
});

app.get('/api/agent/stats', (_req: Request, res: Response) => {
  res.json(getResolutionStats());
});

app.post('/api/agent/simulate', (req: Request, res: Response) => {
  const result = simulateNewReturn(req.body);
  res.json(result);
});

app.post('/api/agent/action/:id/:stage', (req: Request, res: Response) => {
  const { id, stage } = req.params;
  const validStages = ['doorstep_exchange_confirmed', 'voice_call_triggered', 'rto_initiated'] as const;
  if (!validStages.includes(stage as any)) {
    return res.status(400).json({ detail: 'Invalid stage.' });
  }
  const updated = updateCaseStage(id, stage as any);
  if (!updated) {
    return res.status(404).json({ detail: 'Case not found.' });
  }
  res.json(updated);
});

app.get('/api/sample-csv', (_req: Request, res: Response) => {
  const samplePath = path.resolve('data/sample/returns_other.csv');
  if (fs.existsSync(samplePath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="returns_other.csv"');
    fs.createReadStream(samplePath).pipe(res);
  } else {
    res.status(404).json({ detail: 'Sample CSV file not found.' });
  }
});

app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ detail: 'No file uploaded.' });
  }

  let intake;
  try {
    const text = req.file.buffer.toString('utf-8');
    intake = loadAndBatch(text);
  } catch (err: any) {
    return res.status(400).json({ detail: err.message });
  }

  const intakeStep = {
    name: 'Intake',
    loaded: intake.loaded,
    batches: intake.batches.length,
    batch_size: intake.batch_size,
  };

  if (intake.rows.length === 0) {
    return res.json({
      classified: false,
      message: 'No Other comments were left to classify.',
      kept: 0,
      dropped: intake.dropped,
      unclassified: [],
      agents: { intake: intakeStep, review: null, overview: null },
    });
  }

  if (!modelsConfigured()) {
    return res.json({
      classified: false,
      message:
        'Intake loaded the comments. Review did not run because the model keys are missing. The dashboard was left unchanged.',
      kept: intake.loaded,
      dropped: intake.dropped,
      unclassified: intake.rows.slice(0, 30).map((row) => ({
        return_id: row.return_id,
        sku: row.sku,
        text: row.other_text,
      })),
      agents: { intake: intakeStep, review: null, overview: null },
    });
  }

  const records: EventRecord[] = [];

  for (const batch of intake.batches) {
    const outcomes = await Promise.all(
      batch.rows.map((row) => classifyComment(row.other_text))
    );

    for (let i = 0; i < batch.rows.length; i++) {
      const row = batch.rows[i];
      const outcome = outcomes[i];
      const auto = Boolean(
        outcome.ok &&
        outcome.confidence !== null &&
        outcome.confidence !== undefined &&
        outcome.confidence >= AUTO_APPROVE_AT
      );

      records.push({
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
        return_id: row.return_id,
        sku: row.sku,
        category: row.category,
        vendor: row.vendor,
        size: row.size,
        return_reason: row.return_reason,
        other_text: row.other_text,
        status: auto ? 'accepted' : 'review',
        label: outcome.label || null,
        confidence: outcome.ok ? outcome.confidence ?? null : null,
        evidence_span: outcome.ok ? outcome.evidence_span ?? null : null,
        short_reason: outcome.short_reason || outcome.error || '',
        final_label: auto ? outcome.label || null : null,
        auto_approved: auto ? 1 : 0,
      });
    }
  }

  replaceWithRun(records);
  const snap = getDashboard();
  const autoApproved = records.filter((r) => r.auto_approved === 1).length;
  const sentToNeha = records.length - autoApproved;

  const overview = await writeWeeklyOverview(
    snap.total,
    snap.accepted,
    snap.in_review,
    snap.insights,
    autoApproved
  );

  savePipeline(
    intake.loaded,
    intake.batches.length,
    autoApproved,
    sentToNeha,
    overview
  );

  const threshold = Math.round(AUTO_APPROVE_AT * 100);

  return res.json({
    classified: true,
    message: `Intake batched ${intake.loaded} comments. Review filed ${autoApproved} at ${threshold}% or above and sent ${sentToNeha} to Neha. Overview wrote the weekly brief.`,
    kept: intake.loaded,
    dropped: intake.dropped,
    accepted: autoApproved,
    in_review: sentToNeha,
    unclassified: [],
    agents: {
      intake: intakeStep,
      review: {
        name: 'Review',
        auto_approved: autoApproved,
        sent_to_neha: sentToNeha,
        threshold,
      },
      overview: overviewPublic(overview),
    },
  });
});

// --- Frontend Serving (Vite dev or production build) ---

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, host, () => {
    console.log(`Dhaga Return Intelligence server listening at http://${host}:${port}`);
  });
}

start();
