import { useState, DragEvent } from 'react';
import { api, Dashboard, UploadResult } from '../api';

const SAMPLE_BATCHES = [
  {
    id: 'sizing',
    name: 'Sizing Variance Batch (14 rows)',
    desc: 'Heavy on "Fit · too small" and size chart mismatches on KURTI123 & KURTI991',
    csv: `return_id,sku,category,vendor,size,return_reason,other_text
R101,KURTI123,Womenswear,Jaipur Vendor 14,M,Other,shrit but chota h shoulder tight
R102,KURTI123,Womenswear,Jaipur Vendor 14,M,Other,size expected se chota
R103,KURTI123,Womenswear,Jaipur Vendor 14,L,Other,shoulder bahut tight
R104,KURTI123,Womenswear,Jaipur Vendor 14,M,Other,not true to size
R105,KURTI123,Womenswear,Jaipur Vendor 14,L,Other,size bada hai
R106,KURTI991,Womenswear,Tiruppur Vendor 6,M,Other,chart galat hai
R107,KURTI991,Womenswear,Tiruppur Vendor 6,M,Other,colour photo jaisa nhi hai
R108,KURTI991,Womenswear,Tiruppur Vendor 6,L,Other,kapda transparent hai
R109,SHIRT440,Womenswear,Jaipur Vendor 3,XL,Other,bahut bada h office shirt jaisa nahi
R110,SHIRT440,Womenswear,Jaipur Vendor 3,M,Other,cloth patla h
R111,DUPATTA22,Womenswear,Jaipur Vendor 14,Free,Other,stitch nikal gyi corner se
R112,SHIRT440,Womenswear,Jaipur Vendor 3,M,Other,shrit thoda alg h size
R113,KURTI991,Womenswear,Tiruppur Vendor 6,S,Other,macha nai lga
R114,KURTI123,Womenswear,Jaipur Vendor 14,L,Other,product acha nahi laga`,
  },
  {
    id: 'quality',
    name: 'Fabric & Stitching Defect Batch (8 rows)',
    desc: 'Transparent fabric, loose stitching, and colour bleeding',
    csv: `return_id,sku,category,vendor,size,return_reason,other_text
R201,DUPATTA22,Womenswear,Jaipur Vendor 14,Free,Other,stitch nikal gyi border se damage piece
R202,KURTI991,Womenswear,Tiruppur Vendor 6,L,Other,kapda transparent hai sunlight me
R203,KURTI991,Womenswear,Tiruppur Vendor 6,M,Other,photo me navy tha ye black h
R204,SHIRT440,Womenswear,Jaipur Vendor 3,M,Other,cloth patla h washing me kharab hoga
R205,SHIRT440,Womenswear,Jaipur Vendor 3,L,Other,office shirt nhi lg rha fabric cheap hai
R206,DUPATTA22,Womenswear,Jaipur Vendor 14,Free,Other,zari work defective
R207,KURTI991,Womenswear,Tiruppur Vendor 6,M,Other,dye smell ajeeb hai
R208,SHIRT440,Womenswear,Jaipur Vendor 3,XL,Other,button toot gaya first wear me`,
  },
];

export function UploadView({
  data,
  upload,
  busy,
  onFile,
  onReset,
}: {
  data: Dashboard | null;
  upload: UploadResult | null;
  busy: boolean;
  onFile: (file: File) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [previewRows, setPreviewRows] = useState<string[][] | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  function handleFileSelect(file: File) {
    setStagedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text
        .split('\n')
        .slice(0, 5)
        .map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()));
      setPreviewRows(lines);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleLoadPrepackaged(csvContent: string, name: string) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], name, { type: 'text/csv' });
    await onFile(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner Alert if models are configured */}
      {data && !data.models_configured ? (
        <div className="banner" style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}>
          ⚠️ Model keys are missing. Uploading a file will display unclassified comments and will not guess labels.
        </div>
      ) : (
        <div className="banner" style={{ background: '#e6f4ec', border: '1px solid #10b981', color: '#065f46' }}>
          ✓ Live Classification Engine Active: Evaluating returns via Gemini in batches with the 75% Auto-Approval Rule.
        </div>
      )}

      {/* 1-Click Instant Test Datasets */}
      <section className="card" style={{ padding: '16px 20px', background: '#fcf8f3' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ff7755', fontWeight: 600 }}>
              1-CLICK TEST BENCH
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontFamily: 'Fraunces, serif' }}>
              Select a Pre-Packaged Dhaga Returns Batch
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="/api/sample-csv"
              download="returns_other.csv"
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                textDecoration: 'none',
                color: 'var(--ink)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ⬇ Download Sample CSV
            </a>
            <button
              type="button"
              disabled={busy}
              onClick={onReset}
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--ink)',
                fontWeight: 600,
              }}
            >
              ↺ Reset to Sample Data
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
          {SAMPLE_BATCHES.map((b) => (
            <div
              key={b.id}
              style={{
                background: 'white',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{b.name}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{b.desc}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                className="primary"
                onClick={() => handleLoadPrepackaged(b.csv, `${b.id}_returns.csv`)}
                style={{ fontSize: '12px', padding: '6px 12px', alignSelf: 'flex-start' }}
              >
                {busy ? 'Running Pipeline...' : '⚡ Ingest & Classify This Batch'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Drag & Drop File Ingest Box */}
      <section>
        <div
          className="drop"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            borderColor: dragOver ? 'var(--navy)' : '#d9cbbd',
            background: dragOver ? '#f2ece4' : 'var(--card)',
            transition: 'all 0.2s ease',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Fraunces, serif' }}>
              Upload Your Own Returns CSV
            </h3>
            <p className="lede" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Drag &amp; drop your file here. Required columns: <code>return_id, sku, category, vendor, size, return_reason, other_text</code>.
            </p>
          </div>
          <label className="file" style={{ cursor: 'pointer' }}>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </label>
        </div>

        {/* Live Staged File Pre-Upload Preview */}
        {stagedFile && (
          <article className="card" style={{ marginTop: '12px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Selected: {stagedFile.name}</strong> ({(stagedFile.size / 1024).toFixed(1)} KB)
              </div>
              <button
                type="button"
                disabled={busy}
                className="primary"
                onClick={() => onFile(stagedFile)}
                style={{ padding: '6px 16px', fontSize: '13px' }}
              >
                {busy ? 'Classifying with Model...' : 'Start Classification Pipeline &rarr;'}
              </button>
            </div>

            {previewRows && (
              <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                  Pre-Upload Header &amp; Row Sample:
                </div>
                <table style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {previewRows[0]?.map((col, idx) => (
                        <th key={idx}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(1, 4).map((row, ridx) => (
                      <tr key={ridx}>
                        {row.map((val, cidx) => (
                          <td key={cidx}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        )}

        {/* Busy Pipeline Progress Animator */}
        {busy && (
          <div className="card" style={{ marginTop: '14px', background: 'var(--navy)', color: '#fff' }}>
            <strong style={{ fontSize: '15px', color: '#ffaa88' }}>
              ⚡ Autonomous Pipeline Executing...
            </strong>
            <p style={{ margin: '4px 0 8px', fontSize: '12px', color: '#c9bfb4' }}>
              Intake batching &bull; Querying structured model in parallel &bull; Enforcing 75% auto-approval threshold &bull; Synthesizing Weekly Brief
            </p>
            <div className="progress-track">
              <div className="progress-bar-animated" style={{ width: '85%' }} />
            </div>
          </div>
        )}

        {/* Post-Upload Agent Results Display */}
        {upload?.agents && (
          <section className="agents" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '14px' }}>
            <article className="card agent">
              <p className="kicker">Agent 1 · done</p>
              <h3>Intake</h3>
              <p>
                Loaded {upload.agents.intake.loaded} comments in {upload.agents.intake.batches} batches of{' '}
                {upload.agents.intake.batch_size}.
              </p>
            </article>
            <article className="card agent">
              <p className="kicker">Agent 2 · {upload.agents.review ? 'done' : 'waiting'}</p>
              <h3>Review</h3>
              <p>
                {upload.agents.review
                  ? `Filed ${upload.agents.review.auto_approved} at ${upload.agents.review.threshold}% or above. Sent ${upload.agents.review.sent_to_neha} to Neha.`
                  : 'Did not classify. The dashboard is unchanged.'}
              </p>
            </article>
            <article className="card agent">
              <p className="kicker">Agent 3 · {upload.agents.overview ? 'done' : 'waiting'}</p>
              <h3>Overview</h3>
              <p>
                {upload.agents.overview
                  ? upload.agents.overview.headline
                  : 'Weekly brief runs after Review files labels.'}
              </p>
            </article>
          </section>
        )}

        {/* Ingestion Diagnostics & Unclassified Rows */}
        {upload && (
          <article className="card" style={{ marginTop: '14px' }}>
            <h3>{upload.message}</h3>
            <table>
              <tbody>
                <tr>
                  <th>Rows Kept</th>
                  <td><strong>{upload.kept}</strong></td>
                </tr>
                {upload.dropped.map((item) => (
                  <tr key={item.reason}>
                    <th>{item.reason}</th>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {upload.unclassified && upload.unclassified.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <strong>Unclassified Comments ({upload.unclassified.length}):</strong>
                <ul className="raw">
                  {upload.unclassified.map((row) => (
                    <li key={row.return_id}>
                      <strong>{row.sku}</strong> — {row.text || '(empty)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </section>
    </div>
  );
}
