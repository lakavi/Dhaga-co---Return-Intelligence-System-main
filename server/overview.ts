import { GoogleGenAI } from '@google/genai';

export interface OverviewDraft {
  headline: string;
  bullets: string[];
  watch: string[];
  actions: string[];
  caveat: string;
}

export interface OverviewResult {
  ok: boolean;
  headline: string;
  bullets: string[];
  watch: string[];
  actions: string[];
  caveat: string;
  source: string;
  detail: string;
  error?: string | null;
}

export const OVERVIEW_PROMPT = `You are an analytics assistant briefing Neha (Lead Merchandiser / Sourcing Head) at Dhaga & Co.
Write a weekly return-intelligence overview from the FACTS JSON only.
Return JSON only:
{"headline":"<one sentence>","bullets":["<short bullet>","..."],"watch":["<SKU — why>","..."],"actions":["<what Neha should do this week>","..."],"caveat":"<one sentence about limits>"}
Rules:
- Use only numbers and names present in FACTS. Do not invent rupees, return-rate drops, or trends vs prior weeks.
- Prefer fit / SKU / vendor clusters and open review rows.
- Keep bullets short. Max 5 bullets, max 3 watch items, max 3 actions.
- Say this is one file snapshot treated as the week's Other returns for the MVP.
- If FACTS say leave_alone rows need no catalogue action, say so.`;

export function templateOverview(facts: Record<string, any>): OverviewResult {
  const total = facts.total_other_comments || 0;
  const counted = facts.counted || 0;
  const openN = facts.still_with_neha || 0;
  const areas = facts.areas || [];
  const topArea = areas.length > 0 ? areas[0] : null;
  const focus = facts.focus;

  const bullets: string[] = [
    `${counted} of ${total} Other comments are counted (${facts.counted_pct || 0}%). ${facts.auto_approved || 0} filed without a click.`,
  ];

  if (topArea) {
    bullets.push(
      `Largest bucket: ${topArea.title} — ${topArea.count} rows (${topArea.share_pct}%).`
    );
  }

  if (facts.leave_pct) {
    bullets.push(
      `${facts.leave_pct}% of counted rows need no catalogue change (vague dislike or not a product issue).`
    );
  }

  if (openN) {
    bullets.push(`${openN} still open for Neha (under 75% or no score).`);
  }

  const watch: string[] = [];
  for (const item of facts.top_skus || []) {
    watch.push(
      `${item.sku} (${item.vendor}) — ${item.count} counted, mostly ${item.top_title}`
    );
    if (watch.length >= 3) break;
  }

  const actions: string[] = [];
  if (openN) {
    actions.push(`Clear the review queue (${openN} open).`);
  }
  if (focus) {
    actions.push(
      `Check ${focus.sku} size ${focus.size} at ${focus.vendor}: ${focus.action}`
    );
  }
  if (actions.length === 0) {
    actions.push('No open review rows. Scan top SKUs if a vendor size chart looks wrong.');
  }

  const headline = total
    ? `Weekly overview · ${counted} labeled Other returns this file, ${openN} still with Neha.`
    : 'Weekly overview · upload a file to brief the week.';

  return {
    ok: true,
    headline,
    bullets: bullets.slice(0, 5),
    watch: watch.slice(0, 3),
    actions: actions.slice(0, 3),
    caveat:
      'One file snapshot treated as this week’s Other returns. Does not remeasure the brief’s 31% return rate or 44% Other share.',
    source: 'template',
    detail: 'Built from counted labels only. No model call.',
  };
}

export function factsFromInsights(
  total: number,
  accepted: number,
  inReview: number,
  insights: any,
  autoApproved: number
): Record<string, any> {
  return {
    period: 'this_week_file_snapshot',
    total_other_comments: total,
    counted: accepted,
    counted_pct: insights?.counted_pct || 0,
    still_with_neha: inReview,
    auto_approved: autoApproved,
    leave_alone: insights?.leave_alone || 0,
    leave_pct: insights?.leave_pct || 0,
    areas: (insights?.areas || [])
      .filter((a: any) => a.count > 0)
      .map((a: any) => ({
        title: a.title,
        count: a.count,
        share_pct: a.share_pct,
        actionable: a.actionable,
      })),
    top_skus: (insights?.products || []).slice(0, 4).map((p: any) => ({
      sku: p.sku,
      vendor: p.vendor,
      count: p.count,
      top_title: p.top_title,
    })),
    focus: insights?.focus || null,
    open_examples: (insights?.attention || []).slice(0, 3).map((a: any) => ({
      sku: a.sku,
      size: a.size,
      text: a.text,
      why: a.why,
    })),
    limits: insights?.limit || '',
  };
}

export async function writeWeeklyOverview(
  total: number,
  accepted: number,
  inReview: number,
  insights: any,
  autoApproved: number
): Promise<OverviewResult> {
  const facts = factsFromInsights(total, accepted, inReview, insights, autoApproved);
  const fallback = templateOverview(facts);

  // Check if Gemini or OpenAI Model B is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  const modelBKey = process.env.MODEL_B_API_KEY;
  const modelBName = process.env.MODEL_B_NAME;

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${OVERVIEW_PROMPT}\n\nFACTS:\n${JSON.stringify(facts, null, 2)}` },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      });

      const text = response.text?.trim() || '';
      const clean = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean);

      if (parsed.headline && Array.isArray(parsed.bullets)) {
        return {
          ok: true,
          headline: String(parsed.headline).trim(),
          bullets: (parsed.bullets || []).map((b: any) => String(b).trim()).slice(0, 5),
          watch: (parsed.watch || []).map((w: any) => String(w).trim()).slice(0, 3),
          actions: (parsed.actions || []).map((a: any) => String(a).trim()).slice(0, 3),
          caveat: String(parsed.caveat || fallback.caveat).trim(),
          source: 'model',
          detail: 'Model (Gemini) wrote the brief from code-owned facts.',
        };
      }
    } catch (err: any) {
      fallback.source = 'template';
      fallback.detail = `Overview model failed; template used. ${err?.message || err}`;
      fallback.error = String(err);
      return fallback;
    }
  } else if (modelBKey && modelBName) {
    try {
      const base = (process.env.MODEL_B_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
      const resp = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${modelBKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelBName,
          temperature: 0,
          messages: [
            { role: 'system', content: OVERVIEW_PROMPT },
            { role: 'user', content: `FACTS:\n${JSON.stringify(facts)}` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!resp.ok) {
        throw new Error(`Model B returned status ${resp.status}`);
      }
      const data: any = await resp.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || '{}';
      const clean = raw.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean);

      if (parsed.headline && Array.isArray(parsed.bullets)) {
        return {
          ok: true,
          headline: String(parsed.headline).trim(),
          bullets: (parsed.bullets || []).map((b: any) => String(b).trim()).slice(0, 5),
          watch: (parsed.watch || []).map((w: any) => String(w).trim()).slice(0, 3),
          actions: (parsed.actions || []).map((a: any) => String(a).trim()).slice(0, 3),
          caveat: String(parsed.caveat || fallback.caveat).trim(),
          source: 'model',
          detail: 'Model B wrote the brief from code-owned facts.',
        };
      }
    } catch (err: any) {
      fallback.source = 'template';
      fallback.detail = `Overview model failed; template used. ${err?.message || err}`;
      fallback.error = String(err);
      return fallback;
    }
  }

  fallback.detail = 'Model key not set. Showing the template brief from counted labels.';
  return fallback;
}

export function overviewPublic(result?: OverviewResult | null) {
  if (!result) {
    result = templateOverview({
      total_other_comments: 0,
      counted: 0,
      counted_pct: 0,
      still_with_neha: 0,
      auto_approved: 0,
      leave_alone: 0,
      leave_pct: 0,
      areas: [],
      top_skus: [],
      focus: null,
      open_examples: [],
      limits: '',
    });
  }
  return {
    name: 'Overview',
    headline: result.headline,
    bullets: result.bullets,
    watch: result.watch,
    actions: result.actions,
    caveat: result.caveat,
    source: result.source,
    detail: result.detail,
  };
}
