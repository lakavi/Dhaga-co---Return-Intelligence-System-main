export const BATCH_SIZE = 8;
export const TEXT_CAP = 1000;
export const ROW_CAP = 500;

export const REQUIRED = [
  'return_id',
  'sku',
  'category',
  'vendor',
  'size',
  'return_reason',
  'other_text',
] as const;

export interface RawReturn {
  return_id: string;
  sku: string;
  category: string;
  vendor: string;
  size: string;
  return_reason: string;
  other_text: string;
}

export interface CommentBatch {
  number: number;
  rows: RawReturn[];
}

export interface IngestReport {
  rows: RawReturn[];
  dropped: Array<{ reason: string; count: number }>;
}

export interface IntakeResult {
  rows: RawReturn[];
  batches: CommentBatch[];
  dropped: Array<{ reason: string; count: number }>;
  batch_size: number;
  loaded: number;
}

function normalizeHeader(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

// Simple RFC 4180 CSV parser handling quotes, commas, and newlines
export function parseCSV(content: string): IngestReport {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const text = content.replace(/^\uFEFF/, ''); // strip BOM if present

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        // Ignore or handle CRLF
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        lines.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        lines.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    lines.push(currentRow);
  }

  // Filter out empty lines
  const cleanLines = lines.filter((row) => row.some((field) => field.trim().length > 0));
  if (cleanLines.length === 0) {
    throw new Error('The file has no header row.');
  }

  const rawHeaders = cleanLines[0];
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[normalizeHeader(h)] = idx;
  });

  const missing = REQUIRED.filter((col) => !(col in headerMap));
  if (missing.length > 0) {
    throw new Error('Missing columns: ' + missing.join(', '));
  }

  const report: IngestReport = {
    rows: [],
    dropped: [],
  };

  const addDrop = (reason: string, count = 1) => {
    const existing = report.dropped.find((d) => d.reason === reason);
    if (existing) {
      existing.count += count;
    } else {
      report.dropped.push({ reason, count });
    }
  };

  const seen = new Set<string>();

  for (let r = 1; r < cleanLines.length; r++) {
    const row = cleanLines[r];
    const return_id = (row[headerMap['return_id']] || '').trim();
    const sku = (row[headerMap['sku']] || '').trim();
    const category = (row[headerMap['category']] || '').trim();
    const vendor = (row[headerMap['vendor']] || '').trim();
    const size = (row[headerMap['size']] || '').trim();
    const return_reason = (row[headerMap['return_reason']] || '').trim();
    let other_text = (row[headerMap['other_text']] || '').trim();

    if (!other_text) {
      addDrop('Empty comment');
      continue;
    }

    const reasonLower = return_reason.toLowerCase();
    if (reasonLower && reasonLower !== 'other' && reasonLower !== 'others') {
      addDrop('Reason is not Other');
      continue;
    }

    if (!return_id || !sku) {
      addDrop('Missing return id or SKU');
      continue;
    }

    if (seen.has(return_id)) {
      addDrop('Duplicate return id in this file');
      continue;
    }
    seen.add(return_id);

    if (other_text.length > TEXT_CAP) {
      other_text = other_text.slice(0, TEXT_CAP);
      addDrop('Trimmed to 1000 characters');
    }

    report.rows.push({
      return_id,
      sku,
      category,
      vendor,
      size,
      return_reason: return_reason || 'Other',
      other_text,
    });
  }

  if (report.rows.length > ROW_CAP) {
    const extra = report.rows.length - ROW_CAP;
    report.rows = report.rows.slice(0, ROW_CAP);
    addDrop('Over 500 rows in one run', extra);
  }

  return report;
}

export function loadAndBatch(content: string): IntakeResult {
  const report = parseCSV(content);
  const batches: CommentBatch[] = [];
  for (let start = 0; start < report.rows.length; start += BATCH_SIZE) {
    batches.push({
      number: Math.floor(start / BATCH_SIZE) + 1,
      rows: report.rows.slice(start, start + BATCH_SIZE),
    });
  }

  return {
    rows: report.rows,
    batches,
    dropped: report.dropped,
    batch_size: BATCH_SIZE,
    loaded: report.rows.length,
  };
}
