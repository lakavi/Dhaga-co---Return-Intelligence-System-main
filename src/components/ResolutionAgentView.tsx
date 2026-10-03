import { useEffect, useState } from 'react';
import { api, ResolutionCase, ResolutionStats } from '../api';

export function ResolutionAgentView() {
  const [stats, setStats] = useState<ResolutionStats | null>(null);
  const [cases, setCases] = useState<ResolutionCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'voice' | 'confirmed' | 'rto'>('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Simulation form
  const [simName, setSimName] = useState('Ananya Sen');
  const [simSku, setSimSku] = useState('KURTI123');
  const [simSize, setSimSize] = useState('M');
  const [simCity, setSimCity] = useState('Bengaluru (Koramangala)');
  const [simComment, setSimComment] = useState('shrit but chota h shoulder tight');

  async function loadData() {
    try {
      const [s, c] = await Promise.all([api.agentStats(), api.agentCases()]);
      setStats(s);
      setCases(c);
      if (!selectedCaseId && c.length > 0) {
        setSelectedCaseId(c[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load agent data:', err);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleAction(
    id: string,
    action: 'doorstep_exchange_confirmed' | 'voice_call_triggered' | 'rto_initiated'
  ) {
    setBusy(true);
    try {
      await api.agentAction(id, action);
      await loadData();
      setMsg(
        action === 'doorstep_exchange_confirmed'
          ? 'Doorstep exchange confirmed! Nearest hub dispatch scheduled. ₹140 reverse freight saved.'
          : action === 'voice_call_triggered'
          ? '4-Hour timeout simulated! AI Voice Calling Agent dialed the buyer.'
          : 'Buyer unconfirmed/rejected. Autonomous RTO pickup initiated.'
      );
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await api.agentSimulate({
        customerName: simName,
        sku: simSku,
        size: simSize,
        city: simCity,
        comment: simComment,
      });
      await loadData();
      setSelectedCaseId(created.id);
      setMsg(`New return initiated by ${simName}! Negotiation agent intercepted in ${created.interceptSeconds}s on WhatsApp.`);
      setTimeout(() => setMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setBusy(false);
    }
  }

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const filteredCases = cases.filter((c) => {
    if (filter === 'whatsapp') return c.stage === 'whatsapp_intercept';
    if (filter === 'voice') return c.stage === 'voice_call_triggered';
    if (filter === 'confirmed') return c.stage === 'doorstep_exchange_confirmed';
    if (filter === 'rto') return c.stage === 'rto_initiated';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Banner Alert */}
      {msg && (
        <div
          style={{
            background: 'var(--ok-soft)',
            border: '1px solid var(--ok)',
            color: 'var(--ok)',
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {msg}
        </div>
      )}

      {/* KPI Rail */}
      <section className="rail" aria-label="Resolution Agent Economics">
        <div>
          <span>Reverse freight saved</span>
          <strong style={{ color: '#4ade80' }}>
            ₹{stats?.totalReverseFreightSaved?.toLocaleString('en-IN') || '42,280'}
          </strong>
          <p>Saved at ₹140 per return before courier reverse dispatch.</p>
        </div>
        <div>
          <span>GMV Retained</span>
          <strong>₹{stats?.totalGMVRetained?.toLocaleString('en-IN') || '2,41,600'}</strong>
          <p>Orders retained via 1-click doorstep size exchange.</p>
        </div>
        <div>
          <span>Intercept speed SLA</span>
          <strong style={{ color: '#60a5fa' }}>{stats?.avgInterceptSeconds || 11.2}s</strong>
          <p>Target: &lt; 15 seconds on WhatsApp upon return request.</p>
        </div>
      </section>

      {/* Autonomous Workflow Architecture Visualizer */}
      <section className="agent-flow">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffaa88' }}>
              AUTONOMOUS RESOLUTION PATH
            </span>
            <h3 style={{ margin: '4px 0 0', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#fff' }}>
              15s WhatsApp Intercept &rarr; 4h AI Voice Calling &rarr; Doorstep Exchange or RTO
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="pill ok" style={{ background: '#173f2c', color: '#6ee7b7' }}>
              Active in Bengaluru Hubs
            </span>
            <span className="pill" style={{ background: '#3b2519', color: '#fca5a5' }}>
              Voice Agent: Maya (Hinglish)
            </span>
          </div>
        </div>

        <div className="flow-steps">
          <div className="flow-step">
            <span className="step-tag">Trigger &bull; T + 0s</span>
            <strong>Buyer Initiates Return</strong>
            <p>Buyer submits return reason on app/website (e.g. Size too small / damaged stitch).</p>
          </div>

          <div className="flow-step" style={{ borderColor: '#25d366' }}>
            <span className="step-tag" style={{ color: '#6ee7b7' }}>Stage 1 &bull; &lt; 15s</span>
            <strong>WhatsApp Negotiation</strong>
            <p>
              Intercepts in 11s. Checks local hub stock (Size +1/-1). Offers 1-click doorstep swap + ₹100 credit.
            </p>
          </div>

          <div className="flow-step" style={{ borderColor: '#f59e0b' }}>
            <span className="step-tag" style={{ color: '#fcd34d' }}>Stage 2 &bull; T + 4 Hours</span>
            <strong>AI Voice Calling Agent</strong>
            <p>
              If buyer does not confirm in 4 hours, autonomous voice agent calls buyer to get voice confirmation.
            </p>
          </div>

          <div className="flow-step" style={{ borderColor: '#60a5fa' }}>
            <span className="step-tag" style={{ color: '#93c5fd' }}>Stage 3 &bull; Final Action</span>
            <strong>Doorstep Swap or RTO</strong>
            <p>
              If confirmed: local hub dispatches replacement unit. If no answer/refused: automated RTO initiated.
            </p>
          </div>
        </div>
      </section>

      {/* Simulator Sandbox */}
      <section className="sim-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>⚡ Test The Autonomous Negotiation Agent</h3>
            <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
              Simulate an incoming return request and watch the agent intercept on WhatsApp within 15 seconds.
            </p>
          </div>
          <span className="pill" style={{ background: '#f5ebd7', color: '#8a5a12' }}>
            Interactive Sandbox
          </span>
        </div>

        <form onSubmit={handleSimulate} style={{ marginTop: '12px' }}>
          <div className="sim-grid">
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Buyer Name</label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                style={{ width: '100%', marginTop: '4px', border: '1px solid var(--line)', padding: '7px 10px', borderRadius: '8px' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>SKU & Size</label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <select
                  value={simSku}
                  onChange={(e) => setSimSku(e.target.value)}
                  style={{ flex: 1, padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--line)' }}
                >
                  <option value="KURTI123">KURTI123 (Anarkali)</option>
                  <option value="KURTI991">KURTI991 (Chanderi)</option>
                  <option value="SHIRT440">SHIRT440 (Casual Shirt)</option>
                  <option value="DUPATTA22">DUPATTA22 (Kota Doria)</option>
                </select>
                <select
                  value={simSize}
                  onChange={(e) => setSimSize(e.target.value)}
                  style={{ width: '70px', padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--line)' }}
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Buyer City / Hub</label>
              <input
                type="text"
                value={simCity}
                onChange={(e) => setSimCity(e.target.value)}
                style={{ width: '100%', marginTop: '4px', border: '1px solid var(--line)', padding: '7px 10px', borderRadius: '8px' }}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={busy}
                className="primary"
                style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <span>Trigger Return & Intercept</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
              Return Comment (Hinglish / Vernacular / English)
            </label>
            <input
              type="text"
              value={simComment}
              onChange={(e) => setSimComment(e.target.value)}
              style={{ width: '100%', marginTop: '4px', border: '1px solid var(--line)', padding: '7px 10px', borderRadius: '8px' }}
              required
            />
            <div className="chip-row">
              <span style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center' }}>Quick Presets:</span>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setSimComment('shrit but chota h shoulder tight');
                  setSimSize('M');
                }}
              >
                &ldquo;shrit but chota h shoulder tight&rdquo; (Size +1 Swap)
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setSimComment('size bahut bada hai fitting loose');
                  setSimSize('XL');
                }}
              >
                &ldquo;size bahut bada hai fitting loose&rdquo; (Size -1 Swap)
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setSimComment('stitch nikal gyi corner se damage');
                  setSimSku('DUPATTA22');
                }}
              >
                &ldquo;stitch nikal gyi corner se damage&rdquo; (Replacement Unit)
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Main Split: Cases Queue & Interactive Inspector */}
      <section className="case-split">
        {/* Left: Cases Queue */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Active Inquiries ({filteredCases.length})</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                style={{
                  border: '1px solid var(--line)',
                  background: filter === 'all' ? 'var(--navy)' : 'white',
                  color: filter === 'all' ? 'white' : 'var(--ink)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('whatsapp')}
                style={{
                  border: '1px solid var(--line)',
                  background: filter === 'whatsapp' ? '#128c7e' : 'white',
                  color: filter === 'whatsapp' ? 'white' : 'var(--ink)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                }}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setFilter('voice')}
                style={{
                  border: '1px solid var(--line)',
                  background: filter === 'voice' ? '#8a5a12' : 'white',
                  color: filter === 'voice' ? 'white' : 'var(--ink)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                }}
              >
                Voice Call
              </button>
              <button
                type="button"
                onClick={() => setFilter('confirmed')}
                style={{
                  border: '1px solid var(--line)',
                  background: filter === 'confirmed' ? '#1d6a48' : 'white',
                  color: filter === 'confirmed' ? 'white' : 'var(--ink)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                }}
              >
                Saved
              </button>
            </div>
          </div>

          <div className="case-list">
            {filteredCases.map((item) => {
              const isSelected = item.id === selectedCase?.id;
              let badgeClass = 'stage-badge badge-whatsapp';
              let badgeText = '⚡ WhatsApp Active';
              if (item.stage === 'voice_call_triggered') {
                badgeClass = 'stage-badge badge-voice';
                badgeText = '📞 4h Voice Call';
              } else if (item.stage === 'doorstep_exchange_confirmed') {
                badgeClass = 'stage-badge badge-confirmed';
                badgeText = '✅ Doorstep Saved';
              } else if (item.stage === 'rto_initiated') {
                badgeClass = 'stage-badge badge-rto';
                badgeText = '🚨 RTO Initiated';
              }

              return (
                <div
                  key={item.id}
                  className={`case-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCaseId(item.id)}
                >
                  <div className="case-item-header">
                    <div>
                      <strong style={{ fontSize: '14px', fontFamily: 'Fraunces, serif' }}>{item.customerName}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>{item.orderId}</span>
                    </div>
                    <span className={badgeClass}>{badgeText}</span>
                  </div>

                  <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--ink)' }}>
                    <strong>{item.sku}</strong> ({item.sizeOrdered}) &rarr;{' '}
                    <span style={{ color: 'var(--ok)', fontWeight: 600 }}>{item.suggestedExchangeSize}</span>
                  </p>

                  <div style={{ fontSize: '11px', color: 'var(--muted)', background: 'white', padding: '6px 8px', borderRadius: '6px', margin: '6px 0', border: '1px solid #ede4da' }}>
                    &ldquo;{item.customerComment}&rdquo;
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '6px' }}>
                    <span style={{ color: '#2563eb' }}>📍 {item.hubName}</span>
                    <span style={{ color: item.reverseFreightSaved ? 'var(--ok)' : 'var(--clay)', fontWeight: 600 }}>
                      {item.reverseFreightSaved ? '+₹140 freight saved' : '₹140 risk'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Case Inspector & Conversation Screen */}
        {selectedCase ? (
          <div className="case-detail-pane">
            {/* Case Header Card */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontFamily: 'Fraunces, serif' }}>
                      {selectedCase.customerName}
                    </h3>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>({selectedCase.phone})</span>
                    <span className="pill">{selectedCase.city}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                    Order <strong>{selectedCase.orderId}</strong> &bull; Item: <strong>{selectedCase.title}</strong> (
                    {selectedCase.sku}) &bull; Ordered Size: <strong>{selectedCase.sizeOrdered}</strong>
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Nearest Hub Inventory</div>
                  <strong style={{ fontSize: '15px', color: '#075e54' }}>
                    {selectedCase.hubName} &bull; {selectedCase.hubStock} units available
                  </strong>
                </div>
              </div>

              {/* Economic Summary Banner */}
              <div
                style={{
                  background: selectedCase.reverseFreightSaved ? 'var(--ok-soft)' : '#fef3c7',
                  border: `1px solid ${selectedCase.reverseFreightSaved ? '#b1e0c6' : '#fde68a'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '13px' }}>
                  <strong>Economic impact: </strong>
                  {selectedCase.reverseFreightSaved
                    ? `Reverse logistics freight cost of ₹${selectedCase.reverseFreightCost} completely avoided. Full GMV of ₹${selectedCase.itemValue} preserved!`
                    : `At risk of ₹${selectedCase.reverseFreightCost} reverse logistics freight + lost sale of ₹${selectedCase.itemValue}. Doorstep swap avoids both.`}
                </div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: selectedCase.reverseFreightSaved ? 'var(--ok)' : 'var(--wait)' }}>
                  {selectedCase.reverseFreightSaved ? 'REVENUE RETAINED' : 'IN PLAY'}
                </div>
              </div>

              {/* Quick Action Overrides */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Simulation Controls:</span>
                <button
                  type="button"
                  disabled={busy || selectedCase.stage === 'doorstep_exchange_confirmed'}
                  onClick={() => handleAction(selectedCase.id, 'doorstep_exchange_confirmed')}
                  className="primary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  ✅ Simulate Buyer Confirms Doorstep Swap
                </button>
                <button
                  type="button"
                  disabled={busy || selectedCase.stage === 'voice_call_triggered'}
                  onClick={() => handleAction(selectedCase.id, 'voice_call_triggered')}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: '#fef3c7',
                    border: '1px solid #d97706',
                    color: '#92400e',
                    borderRadius: '8px',
                    fontWeight: 500,
                  }}
                >
                  ⏱ Simulate 4-Hour Inaction &rarr; Trigger Voice Call
                </button>
                <button
                  type="button"
                  disabled={busy || selectedCase.stage === 'rto_initiated'}
                  onClick={() => handleAction(selectedCase.id, 'rto_initiated')}
                  className="danger"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🚨 Trigger RTO Fallback
                </button>
              </div>
            </div>

            {/* WhatsApp Negotiation Mock UI */}
            <div className="whatsapp-mock">
              <div className="wa-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="wa-avatar">ध</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Dhaga &amp; Co. Return Concierge</div>
                    <div style={{ fontSize: '11px', opacity: 0.85 }}>Intercept SLA: 11 seconds &bull; Online</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Doorstep Exchange Enabled</div>
              </div>

              <div className="wa-body">
                {selectedCase.whatsappChat.map((chat, idx) => {
                  if (chat.sender === 'system') {
                    return (
                      <div key={idx} className="bubble bubble-system">
                        {chat.text}
                      </div>
                    );
                  }
                  if (chat.sender === 'customer') {
                    return (
                      <div key={idx} className="bubble bubble-customer">
                        <div>{chat.text}</div>
                        <div className="bubble-time">{chat.time}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="bubble bubble-bot">
                      <div>{chat.text}</div>
                      {chat.actionButtons && chat.actionButtons.length > 0 && (
                        <div className="wa-buttons">
                          {chat.actionButtons.map((btn, bidx) => (
                            <div
                              key={bidx}
                              className="wa-btn"
                              onClick={() => {
                                if (btn.includes('Accept') || btn.includes('Confirm')) {
                                  handleAction(selectedCase.id, 'doorstep_exchange_confirmed');
                                } else if (btn.includes('Voice') || btn.includes('Wait')) {
                                  handleAction(selectedCase.id, 'voice_call_triggered');
                                } else {
                                  handleAction(selectedCase.id, 'rto_initiated');
                                }
                              }}
                            >
                              {btn}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="bubble-time">{chat.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Voice Calling Agent Box (Triggered when 4h elapsed) */}
            {(selectedCase.stage === 'voice_call_triggered' || selectedCase.callLog) && (
              <div className="voice-card">
                <div className="voice-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="wave-anim">
                      <div className="wave-bar" style={{ animationDelay: '0.1s' }} />
                      <div className="wave-bar" style={{ animationDelay: '0.4s' }} />
                      <div className="wave-bar" style={{ animationDelay: '0.2s' }} />
                      <div className="wave-bar" style={{ animationDelay: '0.5s' }} />
                      <div className="wave-bar" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#ffaa88' }}>
                        Autonomous AI Calling Agent: Maya
                      </strong>
                      <div style={{ fontSize: '11px', color: '#d7cdc2' }}>
                        Triggered at T+4h WhatsApp timeout &bull; Dialed {selectedCase.phone}
                      </div>
                    </div>
                  </div>
                  <span
                    className="pill"
                    style={{
                      background: selectedCase.callLog?.status === 'unanswered' ? '#451a1a' : '#143825',
                      color: selectedCase.callLog?.status === 'unanswered' ? '#fca5a5' : '#86efac',
                    }}
                  >
                    {selectedCase.callLog?.status === 'unanswered'
                      ? 'Call Unanswered &rarr; RTO Initiated'
                      : 'Call Completed &bull; Exchange Confirmed'}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#c9bfb4', marginBottom: '6px' }}>
                    Call Transcript (Hinglish AI Voice Model):
                  </div>
                  <div className="transcript-list">
                    {selectedCase.callLog?.transcript && selectedCase.callLog.transcript.length > 0 ? (
                      selectedCase.callLog.transcript.map((line, lidx) => (
                        <div key={lidx} className="transcript-line">
                          <span className={line.speaker.startsWith('AI') ? 'speaker-ai' : 'speaker-user'}>
                            {line.speaker}:{' '}
                          </span>
                          <span>{line.text}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#aaa', fontStyle: 'italic' }}>
                        Phone call placed to {selectedCase.phone}. Customer did not answer after 2 attempts. Fallback
                        protocol: Autonomous RTO initiated to avoid delivery partner delay.
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Outcome: {selectedCase.callLog?.callOutcome}</span>
                  <span style={{ color: '#ffaa88' }}>Duration: {selectedCase.callLog?.durationSeconds || 0}s</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
            <p className="empty">No inquiries match the current filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}
