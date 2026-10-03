import {
  AREAS,
  AUTO_APPROVE_AT,
  LABEL_TITLES,
  suggestedAction,
} from './taxonomy';
import {
  OverviewResult,
  overviewPublic,
  templateOverview,
} from './overview';
import { modelsConfigured } from './classify';

export interface EventRecord {
  id: string;
  return_id: string;
  sku: string;
  category: string;
  vendor: string;
  size: string;
  return_reason: string;
  other_text: string;
  status: 'accepted' | 'review' | 'dismissed';
  label: string | null;
  confidence: number | null;
  evidence_span: string | null;
  short_reason: string;
  final_label: string | null;
  auto_approved: number;
}

export interface PipelineRecord {
  id: number;
  loaded: number;
  batches: number | null;
  batch_size: number;
  auto_approved: number;
  sent_to_neha: number;
  source: string;
  overview_json: OverviewResult | null;
}

const BATCH_SIZE = 8;

let eventsStore: EventRecord[] = [];
let pipelineStore: PipelineRecord | null = null;

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((100 * part) / whole);
}

function labelOf(row: EventRecord): string | null {
  return row.final_label || row.label;
}

export function toPublic(row: EventRecord): Record<string, any> {
  const label = labelOf(row);
  return {
    ...row,
    display_label: label ? LABEL_TITLES[label] || label : label,
    suggested_action: suggestedAction(label),
    confidence_pct: row.confidence !== null && row.confidence !== undefined ? Math.round(row.confidence * 100) : null,
  };
}

export function computeInsights(rows: EventRecord[]): Record<string, any> {
  const accepted = rows.filter((r) => r.status === 'accepted');
  const review = rows.filter((r) => r.status === 'review');
  const counted = accepted.length;
  const total = rows.length;

  const noScore = review.filter((r) => r.confidence === null || r.confidence === undefined).length;
  const low = review.length - noScore;

  const areas: Array<{
    title: string;
    count: number;
    share_pct: number;
    actionable: boolean;
    note: string;
  }> = [];

  for (const [title, labels, actionable] of AREAS) {
    const matched = accepted.filter((r) => {
      const l = labelOf(r);
      return l ? labels.includes(l) : false;
    });

    let leadLabel: string | null = null;
    if (matched.length > 0) {
      const tally: Record<string, number> = {};
      for (const r of matched) {
        const l = labelOf(r) || '';
        tally[l] = (tally[l] || 0) + 1;
      }
      leadLabel = Object.keys(tally).reduce((a, b) => (tally[a] > tally[b] ? a : b));
    }

    areas.push({
      title,
      count: matched.length,
      share_pct: pct(matched.length, counted),
      actionable,
      note: leadLabel ? suggestedAction(leadLabel) : '',
    });
  }

  areas.sort((a, b) => b.count - a.count);

  const actionableAreas = areas.filter((a) => a.actionable && a.count > 0);
  let focus: any = null;

  if (actionableAreas.length > 0) {
    const lead = actionableAreas[0];
    const leadTuple = AREAS.find(([t]) => t === lead.title);
    const leadLabels = leadTuple ? leadTuple[1] : [];

    const cells: Record<string, number> = {};
    for (const r of accepted) {
      const l = labelOf(r);
      if (!l || !leadLabels.includes(l)) continue;
      const key = `${r.sku}__${r.vendor}__${r.size}__${l}`;
      cells[key] = (cells[key] || 0) + 1;
    }

    if (Object.keys(cells).length > 0) {
      const topKey = Object.keys(cells).reduce((a, b) => (cells[a] > cells[b] ? a : b));
      const [sku, vendor, size, label] = topKey.split('__');
      focus = {
        title: lead.title,
        count: lead.count,
        share_pct: lead.share_pct,
        sku,
        vendor,
        size,
        label: LABEL_TITLES[label] || label,
        cluster: cells[topKey],
        action: suggestedAction(label),
      };
    }
  }

  const bySku: Record<string, EventRecord[]> = {};
  for (const r of accepted) {
    if (!bySku[r.sku]) bySku[r.sku] = [];
    bySku[r.sku].push(r);
  }

  const products: Array<{
    sku: string;
    vendor: string;
    count: number;
    share_pct: number;
    top_title: string;
  }> = [];

  for (const [sku, items] of Object.entries(bySku)) {
    const tally: Record<string, number> = {};
    for (const r of items) {
      const l = labelOf(r) || '';
      tally[l] = (tally[l] || 0) + 1;
    }
    const top = Object.keys(tally).reduce((a, b) => (tally[a] > tally[b] ? a : b));
    products.push({
      sku,
      vendor: items[0]?.vendor || '',
      count: items.length,
      share_pct: pct(items.length, counted),
      top_title: LABEL_TITLES[top] || top,
    });
  }

  products.sort((a, b) => b.count - a.count);

  const board: Record<string, { sku: string; vendor: string; auto_approved: number; open: number; counted: number }> = {};
  for (const row of rows) {
    if (row.status === 'dismissed') continue;
    if (!board[row.sku]) {
      board[row.sku] = {
        sku: row.sku,
        vendor: row.vendor,
        auto_approved: 0,
        open: 0,
        counted: 0,
      };
    }
    if (row.status === 'review') {
      board[row.sku].open += 1;
    } else if (row.status === 'accepted') {
      board[row.sku].counted += 1;
      if (row.auto_approved) {
        board[row.sku].auto_approved += 1;
      }
    }
  }

  const sku_board = Object.values(board).sort((a, b) => {
    if (b.open !== a.open) return b.open - a.open;
    return b.counted - a.counted;
  });

  const attention = review.map((r) => {
    let why = '';
    if (r.confidence === null || r.confidence === undefined) {
      why = 'No score. Never auto-approved.';
    } else {
      why = `${Math.round(r.confidence * 100)}% — under 75%, so Neha decides.`;
    }
    return {
      sku: r.sku,
      size: r.size,
      vendor: r.vendor,
      text: r.other_text,
      why,
    };
  });

  const leave = areas
    .filter((a) => !a.actionable)
    .reduce((sum, a) => sum + a.count, 0);

  let headline = '';
  if (total === 0) {
    headline = 'Upload a file to see what the agents changed.';
  } else if (counted === 0) {
    headline = `Intake has ${total} comments. None are counted yet. ${review.length} are still with Neha.`;
  } else {
    headline = `These comments were only “Other.” Review has filed ${counted} of ${total} (${pct(counted, total)}%). ${review.length} of ${total} (${pct(review.length, total)}%) are still with Neha.`;
  }

  return {
    headline,
    counted,
    counted_pct: pct(counted, total),
    still_with_neha: review.length,
    still_pct: pct(review.length, total),
    low_confidence: low,
    no_score: noScore,
    leave_alone: leave,
    leave_pct: pct(leave, counted),
    areas,
    products,
    sku_board,
    attention,
    focus,
    limit:
      'Shares are this file only. The brief’s 31% return rate and 44% Other mix are not recomputed here. No rupee saving is shown until Dhaga gives a cost per product return.',
  };
}

function sampleRows(): EventRecord[] {
  const acceptedData: Array<[string, string, string, string, string, number, string]> = [
    ['KURTI123', 'Jaipur Vendor 14', 'M', 'shrit but chota h', 'fit_too_small', 0.91, 'Size is small.'],
    ['KURTI123', 'Jaipur Vendor 14', 'M', 'size expected se chota', 'fit_too_small', 0.93, 'Smaller than expected.'],
    ['KURTI123', 'Jaipur Vendor 14', 'M', 'M bahut chota h', 'fit_too_small', 0.94, 'Size M is very small.'],
    ['KURTI123', 'Jaipur Vendor 14', 'L', 'kurti achi h but L bhi chota', 'fit_too_small', 0.86, 'Even L is small.'],
    ['KURTI123', 'Jaipur Vendor 14', 'L', 'shoulder bahut tight', 'fit_too_tight', 0.92, 'Shoulder is tight.'],
    ['KURTI123', 'Jaipur Vendor 14', 'XL', 'bahut loose h', 'fit_too_loose', 0.9, 'Too loose.'],
    ['KURTI123', 'Jaipur Vendor 14', 'L', 'size bada hai', 'fit_too_large', 0.89, 'Size is large.'],
    ['SHIRT440', 'Jaipur Vendor 3', 'XL', 'bahut bada h', 'fit_too_large', 0.88, 'Much too big.'],
    ['KURTI991', 'Tiruppur Vendor 6', 'M', 'chart galat hai', 'size_chart_mismatch', 0.87, 'Size chart is wrong.'],
    ['KURTI123', 'Jaipur Vendor 14', 'M', 'not true to size', 'size_chart_mismatch', 0.84, 'Not true to size.'],
    ['KURTI991', 'Tiruppur Vendor 6', 'M', 'colour photo jaisa nhi hai', 'colour_image_mismatch', 0.93, 'Colour does not match the photo.'],
    ['KURTI991', 'Tiruppur Vendor 6', 'M', 'photo me navy tha ye black h', 'colour_image_mismatch', 0.91, 'Photo was navy, item is black.'],
    ['KURTI991', 'Tiruppur Vendor 6', 'L', 'kapda transparent hai', 'quality_fabric', 0.9, 'Fabric is transparent.'],
    ['SHIRT440', 'Jaipur Vendor 3', 'M', 'cloth patla h', 'quality_fabric', 0.86, 'Cloth is thin.'],
    ['SHIRT440', 'Jaipur Vendor 3', 'L', 'office shirt nhi lg rha', 'description_or_look_mismatch', 0.81, 'Does not look like the office shirt described.'],
    ['DUPATTA22', 'Jaipur Vendor 14', 'Free', 'stitch nikal gyi', 'quality_stitching_or_damage', 0.92, 'Stitching came out.'],
    ['SHIRT440', 'Jaipur Vendor 3', 'M', 'delivery late hui', 'not_a_product_issue', 0.95, 'Late delivery, not the product.'],
    ['DUPATTA22', 'Jaipur Vendor 14', 'Free', 'courier ne wrong item diya', 'not_a_product_issue', 0.96, 'Wrong item from the courier.'],
    ['KURTI991', 'Tiruppur Vendor 6', 'M', 'macha nai lga', 'insufficient_evidence', 0.8, 'Reads like didn’t like it. No fit, colour, or fabric reason.'],
    ['KURTI123', 'Jaipur Vendor 14', 'L', 'product acha nahi laga', 'insufficient_evidence', 0.88, 'Reads like didn’t like it. No fit, colour, or fabric reason.'],
    ['SHIRT440', 'Jaipur Vendor 3', 'M', "I didn't like the product", 'insufficient_evidence', 0.9, 'Clear dislike. No product reason.'],
  ];

  const reviewData: Array<[string, string, string, string, string | null, number | null, string]> = [
    ['SHIRT440', 'Jaipur Vendor 3', 'M', 'shrit thoda alg h size', 'fit_too_tight', 0.58, 'Low confidence. The size direction is not clear.'],
    ['KURTI991', 'Tiruppur Vendor 6', 'S', 'ok return', null, null, 'Validation failed. The model quote was not in the customer’s text, so no score was stored.'],
  ];

  const rows: EventRecord[] = [];
  let num = 1;

  for (const [sku, vendor, size, text, label, conf, reason] of acceptedData) {
    const id = `s${String(num).padStart(3, '0')}`;
    rows.push({
      id,
      return_id: `R${String(num).padStart(3, '0')}`,
      sku,
      category: 'Womenswear',
      vendor,
      size,
      return_reason: 'Other',
      other_text: text,
      status: 'accepted',
      label,
      confidence: conf,
      evidence_span: label ? text : null,
      short_reason: reason,
      final_label: label,
      auto_approved: 1,
    });
    num++;
  }

  for (const [sku, vendor, size, text, label, conf, reason] of reviewData) {
    const id = `s${String(num).padStart(3, '0')}`;
    rows.push({
      id,
      return_id: `R${String(num).padStart(3, '0')}`,
      sku,
      category: 'Womenswear',
      vendor,
      size,
      return_reason: 'Other',
      other_text: text,
      status: 'review',
      label,
      confidence: conf,
      evidence_span: label ? text : null,
      short_reason: reason,
      final_label: null,
      auto_approved: 0,
    });
    num++;
  }

  return rows;
}

export function seedIfEmpty(): void {
  if (eventsStore.length === 0) {
    eventsStore = sampleRows();
  }
}

export function resetToSample(): void {
  eventsStore = sampleRows();
  pipelineStore = null;
}

function buildAgents(
  loaded: number,
  batches: number | null,
  autoApproved: number,
  sentToNeha: number,
  source: string,
  overviewPayload: any
) {
  const threshold = Math.round(AUTO_APPROVE_AT * 100);
  return {
    intake: {
      name: 'Intake',
      loaded,
      batches,
      batch_size: BATCH_SIZE,
      detail: batches
        ? `Loaded ${loaded} Other comments and split them into ${batches} batches of ${BATCH_SIZE}.`
        : `${loaded} comments are on the dashboard. Upload a CSV to batch them.`,
    },
    review: {
      name: 'Review',
      auto_approved: autoApproved,
      sent_to_neha: sentToNeha,
      threshold,
      detail: `Filed ${autoApproved} at ${threshold}% or above. Sent ${sentToNeha} to Neha because they are under ${threshold}% or have no score.`,
    },
    overview: overviewPayload || {
      name: 'Overview',
      headline: 'Weekly overview not ready yet.',
      bullets: [],
      watch: [],
      actions: [],
      caveat: 'Upload or open the dashboard after labels are counted.',
      source: 'none',
      detail: 'Waiting for counted labels.',
    },
    source,
  };
}

function overviewFromRows(rows: EventRecord[], stored?: OverviewResult | null) {
  const report = computeInsights(rows);
  const accepted = rows.filter((r) => r.status === 'accepted').length;
  const review = rows.filter((r) => r.status === 'review').length;
  const auto = rows.filter((r) => r.auto_approved === 1).length;

  if (stored && stored.headline && Array.isArray(stored.bullets)) {
    return { ...stored, name: 'Overview' };
  }

  const live = templateOverview({
    total_other_comments: rows.length,
    counted: accepted,
    counted_pct: report.counted_pct,
    still_with_neha: review,
    auto_approved: auto,
    leave_alone: report.leave_alone,
    leave_pct: report.leave_pct,
    areas: report.areas,
    top_skus: report.products.slice(0, 4),
    focus: report.focus,
    open_examples: report.attention.slice(0, 3),
    limits: report.limit,
  });

  return overviewPublic(live);
}

export function getDashboard() {
  seedIfEmpty();
  const rows = eventsStore;
  const accepted = rows.filter((r) => r.status === 'accepted');
  const review = rows.filter((r) => r.status === 'review');
  const dismissed = rows.filter((r) => r.status === 'dismissed');

  const counts: Record<string, number> = {};
  for (const r of accepted) {
    const l = labelOf(r);
    if (l) {
      counts[l] = (counts[l] || 0) + 1;
    }
  }

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      title: LABEL_TITLES[label] || label,
      count,
    }));

  const auto = rows.filter((r) => r.auto_approved === 1).length;
  const overview = overviewFromRows(rows, pipelineStore?.overview_json);

  const agents = pipelineStore
    ? buildAgents(
        pipelineStore.loaded,
        pipelineStore.batches,
        pipelineStore.auto_approved,
        pipelineStore.sent_to_neha,
        pipelineStore.source,
        overview
      )
    : buildAgents(rows.length, null, auto, review.length, 'sample', overview);

  const skus = Array.from(new Set(accepted.map((r) => r.sku))).sort();

  return {
    total: rows.length,
    accepted: accepted.length,
    in_review: review.length,
    dismissed: dismissed.length,
    labels: ranked,
    skus,
    sample_banner:
      'Sample file, not the case-study mix. The brief says 44% of returns are Other. It does not say how that bucket splits.',
    agents,
    insights: computeInsights(rows),
    models_configured: modelsConfigured(),
    auto_approve_pct: Math.round(AUTO_APPROVE_AT * 100),
    label_options: Object.entries(LABEL_TITLES).map(([label, title]) => ({ label, title })),
  };
}

export function getSkuDetail(sku: string) {
  seedIfEmpty();
  const rows = eventsStore.filter((r) => r.sku === sku && r.status === 'accepted');
  if (rows.length === 0) {
    return {
      sku,
      vendor: null,
      top_label: null,
      top_title: null,
      action: null,
      sizes: [],
      quotes: [],
    };
  }

  const pub = rows.map(toPublic);
  const counts: Record<string, number> = {};
  const sizes: Record<string, number> = {};

  for (const r of pub) {
    const l = r.final_label || r.label;
    if (l) {
      counts[l] = (counts[l] || 0) + 1;
    }
    sizes[r.size] = (sizes[r.size] || 0) + 1;
  }

  const top = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));

  return {
    sku,
    vendor: pub[0]?.vendor || null,
    top_label: top,
    top_title: LABEL_TITLES[top] || top,
    action: suggestedAction(top),
    sizes: Object.entries(sizes).map(([size, count]) => ({ size, count })),
    quotes: pub.slice(0, 6).map((r) => ({
      text: r.other_text,
      label: r.display_label,
      confidence_pct: r.confidence_pct,
      auto_approved: Boolean(r.auto_approved),
    })),
  };
}

export function getReviewQueue() {
  seedIfEmpty();
  const rows = eventsStore.filter((r) => r.status === 'review');
  return rows.map(toPublic);
}

export function decide(eventId: string, action: 'approve' | 'dismiss' | 'edit', label?: string) {
  seedIfEmpty();
  const index = eventsStore.findIndex((r) => r.id === eventId);
  if (index === -1) return null;
  const row = eventsStore[index];
  if (row.status !== 'review') return null;

  if (action === 'dismiss') {
    row.status = 'dismissed';
  } else if (action === 'approve') {
    if (!row.label) {
      throw new Error('Choose a label and save it. This row has no score.');
    }
    row.status = 'accepted';
    row.final_label = row.label;
    row.auto_approved = 0;
  } else if (action === 'edit') {
    if (!label || !LABEL_TITLES[label]) {
      throw new Error('That label is not in the taxonomy.');
    }
    row.status = 'accepted';
    row.label = label;
    row.final_label = label;
    row.auto_approved = 0;
  } else {
    throw new Error('Unknown action.');
  }

  if (pipelineStore) {
    pipelineStore.overview_json = null;
  }

  return { ok: true };
}

export function replaceWithRun(records: EventRecord[]) {
  eventsStore = records;
}

export function savePipeline(
  loaded: number,
  batches: number,
  autoApproved: number,
  sentToNeha: number,
  overview?: OverviewResult | null
) {
  pipelineStore = {
    id: 1,
    loaded,
    batches,
    batch_size: BATCH_SIZE,
    auto_approved: autoApproved,
    sent_to_neha: sentToNeha,
    source: 'upload',
    overview_json: overview || null,
  };
}
