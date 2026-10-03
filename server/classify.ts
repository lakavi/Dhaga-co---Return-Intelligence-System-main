import { GoogleGenAI } from '@google/genai';
import { AUTO_APPROVE_AT, LABELS, Label } from './taxonomy';

export interface ModelOutcome {
  ok: boolean;
  label?: string | null;
  confidence?: number | null;
  evidence_span?: string | null;
  short_reason?: string;
  error?: string | null;
}

export function modelsConfigured(): boolean {
  if (process.env.GEMINI_API_KEY) return true;
  if (
    process.env.MODEL_A_API_KEY &&
    process.env.MODEL_A_NAME &&
    process.env.MODEL_B_API_KEY &&
    process.env.MODEL_B_NAME
  ) {
    return true;
  }
  return false;
}

export const CLASSIFY_PROMPT = `You classify one Dhaga & Co. return comment written in Hinglish, Hindi, or English.
Return JSON only:
{"issues":[{"label":"<one label>","confidence":0.0,"evidence_span":"<exact substring of the comment>"}],"needs_review":false,"short_reason":"<one sentence>"}
Allowed labels: ${LABELS.join(', ')}
Rules:
- evidence_span must be copied from the comment. Do not correct spelling.
- "acha nahi laga", "didn't like", and typos of that idea are insufficient_evidence when no fit, colour, or fabric fact is stated.
- A clear fit, colour, quality, size-chart, or delivery fact can be 75% or higher.
- If the comment does not support a product reason, use insufficient_evidence. Do not invent fit or fabric.
- confidence is 0 to 1.
- needs_review is true only when you are under 75% sure.`;

function quoteInText(span: string, text: string): string | null {
  if (!span) return null;
  if (text.includes(span)) return span;
  const lowerText = text.toLowerCase();
  const lowerSpan = span.toLowerCase();
  const idx = lowerText.indexOf(lowerSpan);
  if (idx !== -1) {
    return text.slice(idx, idx + span.length);
  }
  return null;
}

function parseClassification(raw: string, text: string): ModelOutcome {
  let body = raw.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch (err: any) {
    return { ok: false, error: `Validation failed. Invalid JSON: ${err.message}` };
  }

  if (!parsed || !Array.isArray(parsed.issues) || parsed.issues.length === 0) {
    return { ok: false, error: 'Validation failed. No issues returned in JSON.' };
  }

  // Find issue with max confidence
  let topIssue = parsed.issues[0];
  for (const issue of parsed.issues) {
    if (typeof issue.confidence === 'number' && issue.confidence > (topIssue.confidence || 0)) {
      topIssue = issue;
    }
  }

  if (!LABELS.includes(topIssue.label as Label)) {
    return { ok: false, error: `Validation failed. Unknown label: ${topIssue.label}` };
  }

  const quote = quoteInText(String(topIssue.evidence_span || '').trim(), text);
  if (!quote) {
    return {
      ok: false,
      error: 'Validation failed. The model quote was not in the customer’s text, so no score was stored.',
    };
  }

  const conf = typeof topIssue.confidence === 'number' ? Math.max(0, Math.min(1, topIssue.confidence)) : null;

  return {
    ok: true,
    label: topIssue.label,
    confidence: conf,
    evidence_span: quote,
    short_reason: String(parsed.short_reason || ''),
  };
}

async function callOpenAI(which: 'A' | 'B', text: string, prior?: string | null): Promise<string> {
  const key = process.env[`MODEL_${which}_API_KEY`];
  const name = process.env[`MODEL_${which}_NAME`];
  const base = (process.env[`MODEL_${which}_BASE_URL`] || 'https://api.openai.com/v1').replace(/\/$/, '');

  let userContent = `Comment:\n${text}`;
  if (prior) {
    userContent += `\n\nEarlier attempt to check:\n${prior}`;
  }

  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: name,
      temperature: 0,
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) {
    throw new Error(`Model ${which} call failed with status ${resp.status}`);
  }

  const data: any = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(text: string, prior?: string | null): Promise<string> {
  const ai = new GoogleGenAI({});
  let userContent = `Comment:\n${text}`;
  if (prior) {
    userContent += `\n\nEarlier attempt to check:\n${prior}`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: `${CLASSIFY_PROMPT}\n\n${userContent}` }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  });

  return response.text || '';
}

export async function classifyComment(text: string): Promise<ModelOutcome> {
  if (!modelsConfigured()) {
    return {
      ok: false,
      error: 'Model keys are missing. This row was not classified. Add MODEL_A and MODEL_B to .env.',
    };
  }

  // Prioritize Gemini if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGemini(text, null);
      const parsed = parseClassification(raw, text);
      return parsed;
    } catch (err: any) {
      return { ok: false, error: `Model call failed. ${err.message || err}` };
    }
  }

  // Fall back to Model A then Model B
  let first: ModelOutcome;
  try {
    const rawA = await callOpenAI('A', text, null);
    first = parseClassification(rawA, text);
  } catch (err: any) {
    first = { ok: false, error: `Model A failed. ${err.message || err}` };
  }

  if (first.ok && typeof first.confidence === 'number' && first.confidence >= AUTO_APPROVE_AT) {
    return first;
  }

  try {
    const rawB = await callOpenAI('B', text, first.short_reason || first.error);
    const second = parseClassification(rawB, text);
    if (second.ok) return second;
    if (first.ok) return first;
    return second;
  } catch (err: any) {
    const second: ModelOutcome = { ok: false, error: `Model B failed. ${err.message || err}` };
    if (first.ok) return first;
    return second;
  }
}
