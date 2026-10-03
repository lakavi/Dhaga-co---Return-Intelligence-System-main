import { useState } from 'react';
import { Dashboard, SkuDetail } from '../api';

const HINGLISH_TRANSLATE: Record<string, string> = {
  'shrit but chota h': 'Shirt is small in size',
  'size expected se chota': 'Size is smaller than expected',
  'M bahut chota h': 'Size M is very small',
  'kurti achi h but L bhi chota': 'Kurti is nice but even L is too small',
  'shoulder bahut tight': 'Shoulder fitting is too tight',
  'bahut loose h': 'Much too loose',
  'size bada hai': 'Size is too large',
  'bahut bada h': 'Much too big',
  'chart galat hai': 'Size chart is wrong',
  'not true to size': 'Does not match size specs',
  'colour photo jaisa nhi hai': 'Colour does not match website photo',
  'photo me navy tha ye black h': 'Photo was navy, received item is black',
  'kapda transparent hai': 'Fabric is transparent / see-through',
  'cloth patla h': 'Cloth material is too thin',
  'office shirt nhi lg rha': 'Does not look like the office shirt shown',
  'stitch nikal gyi': 'Stitching has unravelled',
  'delivery late hui': 'Delivery was delayed',
  'courier ne wrong item diya': 'Courier delivered wrong item',
  'macha nai lga': 'Did not like it',
  'product acha nahi laga': 'Did not like product',
  "I didn't like the product": 'Subjective dislike',
};

export function CommandCenterView({
  data,
  sku,
  detail,
  onSku,
  onReview,
}: {
  data: Dashboard;
  sku: string;
  detail: SkuDetail | null;
  onSku: (sku: string) => void;
  onReview: () => void;
}) {
  const report = data.insights;
  const focus = report.focus;

  const [skuSearch, setSkuSearch] = useState('');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(true);
  const [copiedMemo, setCopiedMemo] = useState(false);

  const filteredProducts = report.products.filter(
    (p) =>
      p.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
      p.vendor.toLowerCase().includes(skuSearch.toLowerCase()) ||
      p.top_title.toLowerCase().includes(skuSearch.toLowerCase())
  );

  const quotes = detail?.quotes || [];
  const filteredQuotes = quotes.filter((q) => {
    if (selectedSizeFilter !== 'all') {
      return true; // Quotes in detail don't have direct size field on quote, but show all or search
    }
    return true;
  });

  function handleCopyVendorMemo() {
    if (!detail) return;
    const memo = `[DHAGA & CO. SOURCING MEMO - VENDOR NOTICE]
To: ${detail.vendor}
SKU: ${detail.sku}
Primary Return Root-Cause: ${detail.top_title}
Recommended Action: ${detail.action}
Customer Quotes Sample:
${detail.quotes.map((q) => `• "${q.text}" (${q.confidence_pct || 0}% confidence)`).join('\n')}

Action Required: Please review technical pattern specs & update size grading before next shipment.`;

    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 3000);
  }

  return (
    <div className="command">
      {/* Top Rail */}
      <section className="rail" aria-label="This file">
        <div>
          <span>Returns in this file</span>
          <strong>{data.total}</strong>
          <p>Other comments loaded for this run.</p>
        </div>
        <div>
          <span>Counted</span>
          <strong>{data.accepted}</strong>
          <p>Auto-approved, or accepted by Neha.</p>
        </div>
        <div>
          <span>Still open</span>
          <strong>{data.in_review}</strong>
          <p>Under 75%, or no score. Open Review to decide.</p>
        </div>
      </section>

      {/* Main Split: SKU Selector vs Deep Diagnostic Matrix */}
      <section className="split">
        {/* Left Column: SKU Rankings */}
        <article className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <p className="kicker" style={{ margin: 0 }}>Which products</p>
              <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontFamily: 'Fraunces, serif' }}>
                SKUs with Most Returns
              </h3>
            </div>
            <button
              type="button"
              onClick={onReview}
              className="primary"
              style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '8px' }}
            >
              Open Review Queue &rarr;
            </button>
          </div>

          <input
            type="text"
            placeholder="Search SKU or vendor..."
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            style={{ width: '100%', marginBottom: '12px', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--line)' }}
          />

          {filteredProducts.length === 0 ? <p className="empty">No matching SKU found.</p> : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '480px', overflowY: 'auto' }}>
            {filteredProducts.map((item) => (
              <button
                key={item.sku}
                type="button"
                className={item.sku === sku ? 'sku-row on' : 'sku-row'}
                onClick={() => onSku(item.sku)}
                style={{ cursor: 'pointer' }}
              >
                <span>
                  <strong>{item.sku}</strong>
                  <em>{item.vendor} · {item.top_title}</em>
                </span>
                <b>{item.count} · {item.share_pct}%</b>
              </button>
            ))}
          </div>
        </article>

        {/* Right Column: Sizing Diagnostics & Customer Quotes */}
        <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {detail ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '24px', fontFamily: 'Fraunces, serif' }}>
                      {detail.sku}
                    </h3>
                    <span className="pill">{detail.vendor}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                    Top root-cause: <strong style={{ color: 'var(--ink)' }}>{detail.top_title}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyVendorMemo}
                  style={{
                    background: copiedMemo ? 'var(--ok-soft)' : 'white',
                    color: copiedMemo ? 'var(--ok)' : 'var(--ink)',
                    border: `1px solid ${copiedMemo ? 'var(--ok)' : 'var(--line)'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copiedMemo ? '✓ Memo Copied to Clipboard!' : '📋 Copy Vendor Notice Memo'}
                </button>
              </div>

              {/* Suggested Action Alert Box */}
              <div className="action" style={{ borderLeft: '4px solid var(--bar)' }}>
                <strong>Suggested Catalogue Action: </strong>
                {detail.action}
              </div>

              {/* Sizing Distribution Heatmap / Matrix */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
                    Return Volume by Size for {detail.sku}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {detail.sku === 'KURTI123' ? '⚠️ Severe Under-Sizing in M & L' : 'Sizing Distribution'}
                  </span>
                </div>

                <div className="size-matrix">
                  {detail.sizes.map((s) => {
                    const maxCount = Math.max(...detail.sizes.map((x) => x.count), 1);
                    const pct = Math.round((s.count / maxCount) * 100);
                    return (
                      <div key={s.size} className="size-col">
                        <span>Size</span>
                        <b>{s.size}</b>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                          {s.count} returns
                        </div>
                        <div className="bar-fill">
                          <div style={{ width: `${pct}%`, background: s.count >= 3 ? '#e11d48' : '#c46245' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Customer Quotes with Translation Toggle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px' }}>Customer Feedback Quotes ({quotes.length})</strong>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showEnglishTranslation}
                      onChange={(e) => setShowEnglishTranslation(e.target.checked)}
                    />
                    <span>Show English translation</span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredQuotes.map((q, idx) => {
                    const translation = HINGLISH_TRANSLATE[q.text] || 'Direct customer return remark';
                    return (
                      <blockquote key={idx} style={{ margin: 0, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontStyle: 'italic', fontWeight: 600 }}>&ldquo;{q.text}&rdquo;</span>
                          <span
                            className="pill"
                            style={{
                              fontSize: '10px',
                              background: q.confidence_pct && q.confidence_pct >= 75 ? '#e6f4ec' : '#fef3c7',
                              color: q.confidence_pct && q.confidence_pct >= 75 ? '#1d6a48' : '#8a5a12',
                            }}
                          >
                            {q.confidence_pct ? `${q.confidence_pct}% conf` : 'Manual'}
                          </span>
                        </div>
                        {showEnglishTranslation && (
                          <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                            Meaning: {translation}
                          </div>
                        )}
                        <div className="meta" style={{ marginTop: '4px' }}>
                          Tag: <strong>{q.label}</strong> {q.auto_approved ? '· Auto-approved' : '· Reviewed'}
                        </div>
                      </blockquote>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="empty">Select an SKU from the left to view sizing diagnostics and quotes.</p>
          )}
        </article>
      </section>

      {/* Vendor Accountability Scorecard */}
      <section className="card" style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="kicker" style={{ margin: 0 }}>Vendor Accountability</p>
            <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontFamily: 'Fraunces, serif' }}>
              Vendor Pattern Variance &amp; Action Status
            </h3>
          </div>
          <span className="pill" style={{ background: '#f4efe8' }}>Bengaluru Sourcing Hub</span>
        </div>

        <div className="vendor-grid">
          <div className="vendor-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Jaipur Vendor 14</strong>
              <span className="pill" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '11px' }}>High Variance</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Supplying: KURTI123, DUPATTA22</div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
              Repeated &ldquo;Fit · too small&rdquo; cluster on Size M and L. 1.5-inch chest variance against master specification.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--line)', fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>
              &bull; Action: Tech-pack re-grading notice sent
            </div>
          </div>

          <div className="vendor-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Tiruppur Vendor 6</strong>
              <span className="pill" style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px' }}>Dye Lot Shift</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Supplying: KURTI991</div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
              &ldquo;Colour · image mismatch&rdquo; and &ldquo;Quality · fabric&rdquo;. Navy blue dye variation between batch 1 and 2.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--line)', fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
              &bull; Action: Dye-lot lab dip approval enforced
            </div>
          </div>

          <div className="vendor-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Jaipur Vendor 3</strong>
              <span className="pill" style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px' }}>Loose Fit</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Supplying: SHIRT440</div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
              &ldquo;Fit · too large&rdquo; on XL and fabric sheer complaint. Casual shirt block is running 2 inches oversized.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--line)', fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
              &bull; Action: Updated size chart recommended
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
