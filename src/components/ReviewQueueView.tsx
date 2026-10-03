import { useEffect, useState } from 'react';
import { Dashboard, ReviewRow } from '../api';

const HINGLISH_DICTIONARY: Record<string, string> = {
  'chota': 'small',
  'bada': 'big / large',
  'tight': 'tight fitting',
  'loose': 'loose fitting',
  'alg h': 'is different / unusual',
  'nikal gyi': 'came undone / unstitched',
  'patla': 'thin material',
  'transparent': 'see-through / sheer',
  'macha / acha nai lga': 'did not like it',
};

export function ReviewQueueView({
  data,
  queue,
  reviewSku,
  onSku,
  onAct,
}: {
  data: Dashboard;
  queue: ReviewRow[];
  reviewSku: string;
  onSku: (sku: string) => void;
  onAct: (id: string, kind: 'approve' | 'dismiss' | 'edit', label?: string) => Promise<void>;
}) {
  const board = data.insights.sku_board;
  const auto = data.agents.review.auto_approved;
  const open = data.in_review;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low_conf' | 'no_score'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (queue.length > 0) {
        const topRow = queue[0];
        if (e.key === 'a' || e.key === 'A') {
          if (topRow.label) {
            onAct(topRow.id, 'approve');
          }
        } else if (e.key === 'd' || e.key === 'D') {
          onAct(topRow.id, 'dismiss');
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queue, onAct]);

  const filteredQueue = queue.filter((row) => {
    if (reviewSku !== 'all' && row.sku !== reviewSku) return false;
    if (searchTerm) {
      const matchText = row.other_text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSku = row.sku.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchText && !matchSku) return false;
    }
    if (filterType === 'low_conf') {
      return row.confidence_pct !== null && row.confidence_pct < 75;
    }
    if (filterType === 'no_score') {
      return row.confidence_pct === null;
    }
    return true;
  });

  async function handleBatchApprove() {
    setBatchBusy(true);
    try {
      for (const id of selectedIds) {
        const row = queue.find((r) => r.id === id);
        if (row && row.label) {
          await onAct(id, 'approve');
        }
      }
      setSelectedIds([]);
    } finally {
      setBatchBusy(false);
    }
  }

  async function handleBatchDismiss() {
    setBatchBusy(true);
    try {
      for (const id of selectedIds) {
        await onAct(id, 'dismiss');
      }
      setSelectedIds([]);
    } finally {
      setBatchBusy(false);
    }
  }

  return (
    <div className="review-board">
      {/* Top Rail */}
      <section className="rail" aria-label="Review status">
        <div>
          <span>Auto-approved</span>
          <strong>{auto}</strong>
          <p>Filed at {data.auto_approve_pct}% or above. Already on the counts.</p>
        </div>
        <div>
          <span>Still open</span>
          <strong>{open}</strong>
          <p>{data.insights.low_confidence} under 75%, {data.insights.no_score} with no score.</p>
        </div>
        <div>
          <span>Showing now</span>
          <strong>{filteredQueue.length}</strong>
          <p>{reviewSku === 'all' ? 'All open rows.' : `Filtered by ${reviewSku}.`}</p>
        </div>
      </section>

      {/* SKU Filter Cards */}
      <section className="sku-board">
        <button
          type="button"
          className={reviewSku === 'all' ? 'sku-card on' : 'sku-card'}
          onClick={() => onSku('all')}
        >
          <span className="kicker">All SKUs</span>
          <h3>Whole queue</h3>
          <div className="sku-stats">
            <div><b>{auto}</b><em>auto-approved</em></div>
            <div><b>{open}</b><em>still open</em></div>
          </div>
        </button>
        {board.map((item) => (
          <button
            key={item.sku}
            type="button"
            className={reviewSku === item.sku ? 'sku-card on' : 'sku-card'}
            onClick={() => onSku(item.sku)}
          >
            <span className="kicker">{item.vendor}</span>
            <h3>{item.sku}</h3>
            <div className="sku-stats">
              <div><b>{item.auto_approved}</b><em>auto-approved</em></div>
              <div><b>{item.open}</b><em>still open</em></div>
            </div>
            {item.open > 0 ? (
              <p className="quiet" style={{ color: '#d97706', fontWeight: 600 }}>Needs Neha ({item.open} open)</p>
            ) : (
              <p className="quiet" style={{ color: '#059669' }}>Clear for this SKU</p>
            )}
          </button>
        ))}
      </section>

      {/* Interactive Filter & Batch Action Bar */}
      <section className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search comments or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--line)', width: '220px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`chip ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All Open ({queue.length})
              </button>
              <button
                type="button"
                className={`chip ${filterType === 'low_conf' ? 'active' : ''}`}
                onClick={() => setFilterType('low_conf')}
              >
                Low Conf &lt;75% ({data.insights.low_confidence})
              </button>
              <button
                type="button"
                className={`chip ${filterType === 'no_score' ? 'active' : ''}`}
                onClick={() => setFilterType('no_score')}
              >
                No Score ({data.insights.no_score})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>Shortcuts:</span>
              <span className="kbd">A</span> Approve
              <span className="kbd">D</span> Dismiss
            </div>

            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={batchBusy}
                  className="primary"
                  onClick={handleBatchApprove}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Approve ({selectedIds.length})
                </button>
                <button
                  type="button"
                  disabled={batchBusy}
                  className="danger"
                  onClick={handleBatchDismiss}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Dismiss ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vernacular Hints Bar */}
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', fontSize: '11px', color: 'var(--muted)' }}>
          <strong>Hinglish Guide:</strong>
          {Object.entries(HINGLISH_DICTIONARY).map(([term, meaning]) => (
            <span key={term} style={{ background: '#f5efe8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e5dacd' }}>
              <strong>{term}</strong>: {meaning}
            </span>
          ))}
        </div>
      </section>

      {/* Review Queue Stack */}
      <section className="stack">
        {filteredQueue.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
            <div style={{ fontSize: '28px' }}>🎉</div>
            <h3 style={{ margin: '8px 0 4px', fontFamily: 'Fraunces, serif' }}>Review queue is clear!</h3>
            <p className="empty" style={{ margin: 0 }}>
              Every customer return comment has been classified and counted.
            </p>
          </div>
        ) : null}

        {filteredQueue.map((row) => (
          <EnhancedReviewCard
            key={row.id}
            row={row}
            options={data.label_options}
            onAct={onAct}
            isSelected={selectedIds.includes(row.id)}
            onToggleSelect={(id) => {
              setSelectedIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              );
            }}
          />
        ))}
      </section>
    </div>
  );
}

function EnhancedReviewCard({
  row,
  options,
  onAct,
  isSelected,
  onToggleSelect,
}: {
  row: ReviewRow;
  options: { label: string; title: string }[];
  onAct: (id: string, kind: 'approve' | 'dismiss' | 'edit', label?: string) => Promise<void>;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const [label, setLabel] = useState(row.label || 'insufficient_evidence');
  const needsLabel = row.label == null;

  // Highlight key evidence
  let highlightedText = row.other_text;
  const isNoScore = row.confidence_pct === null;

  return (
    <article
      className="card review"
      style={{
        border: isSelected ? '1.5px solid var(--navy)' : '1px solid var(--line)',
        background: isSelected ? '#fbf8f3' : 'var(--card)',
      }}
    >
      <header>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(row.id)}
            style={{ marginTop: '6px', cursor: 'pointer' }}
          />
          <div>
            <p className="quote" style={{ fontSize: '22px' }}>
              &ldquo;{highlightedText}&rdquo;
            </p>
            <div className="pills">
              <span className="pill" style={{ fontWeight: 600 }}>{row.sku}</span>
              <span className="pill">Size: {row.size}</span>
              <span className="pill">{row.vendor}</span>
              {row.display_label && (
                <span className="pill ok" style={{ background: '#fef3c7', color: '#92400e' }}>
                  Proposed: {row.display_label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            className="pill"
            style={{
              background: isNoScore ? '#fee2e2' : '#fef3c7',
              color: isNoScore ? '#991b1b' : '#92400e',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            {isNoScore ? 'Validation Failed · No score' : `Confidence: ${row.confidence_pct}%`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            {isNoScore ? 'Manual decision required' : 'Below 75% auto-approval'}
          </div>
        </div>
      </header>

      {/* Rationale and inspection block */}
      <div
        style={{
          background: isNoScore ? '#fef2f2' : '#fffbeb',
          borderLeft: `4px solid ${isNoScore ? '#ef4444' : '#f59e0b'}`,
          padding: '10px 14px',
          borderRadius: '0 8px 8px 0',
          fontSize: '13px',
          color: isNoScore ? '#991b1b' : '#92400e',
          margin: '10px 0',
        }}
      >
        <strong>AI Audit Reason: </strong>
        {row.short_reason}
      </div>

      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="primary"
            type="button"
            disabled={needsLabel}
            onClick={() => onAct(row.id, 'approve')}
            style={{ fontSize: '13px', padding: '7px 14px' }}
          >
            ✓ Approve Label ({row.display_label || 'Select Below'})
          </button>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              aria-label="Edit label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              style={{ padding: '6px 10px', fontSize: '13px' }}
            >
              {options.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onAct(row.id, 'edit', label)}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              Save Custom Label
            </button>
          </div>
        </div>

        <button
          className="danger"
          type="button"
          onClick={() => onAct(row.id, 'dismiss')}
          style={{ fontSize: '13px', padding: '6px 12px' }}
        >
          ✕ Dismiss from Counts
        </button>
      </div>
    </article>
  );
}
