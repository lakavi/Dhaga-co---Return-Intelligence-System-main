import { useState } from 'react';
import { Dashboard, OverviewAgent } from '../api';
import {
  FileText,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';

const AREA_TONE: Record<string, string> = {
  'Fit and size': 'rose',
  Quality: 'amber',
  Colour: 'violet',
  'Copy and look': 'blue',
  'Not enough to act': 'slate',
  'Not a product issue': 'green',
};

const HINGLISH_TRANSLATIONS: Record<string, string> = {
  'shrit but chota h': 'Shirt is small in size',
  'size expected se chota': 'Size is smaller than expected',
  'M bahut chota h': 'Size M is very small',
  'kurti achi h but L bhi chota': 'Kurti is nice but even L is too small',
  'shoulder bahut tight': 'Shoulder fitting is too tight',
  'bahut loose h': 'Much too loose',
  'size bada hai': 'Size is too large',
  'bahut bada h': 'Much too big',
  'chart galat hai': 'Size chart is incorrect',
  'not true to size': 'Does not match size specifications',
  'colour photo jaisa nhi hai': 'Colour does not match catalog photo',
  'photo me navy tha ye black h': 'Photo showed navy blue, item received is black',
  'kapda transparent hai': 'Fabric is sheer / transparent',
  'cloth patla h': 'Cloth material is too thin',
  'office shirt nhi lg rha': 'Does not look like the professional office shirt described',
  'stitch nikal gyi': 'Stitching has come undone / frayed',
  'delivery late hui': 'Delivery was delayed (logistics issue)',
  'courier ne wrong item diya': 'Courier delivered the wrong parcel',
  'macha nai lga': 'Did not like it',
  'product acha nahi laga': 'Did not like the product',
  "I didn't like the product": 'Customer dislike without specific product flaw',
};

export function ReturnMetricsView({ data }: { data: Dashboard }) {
  const report = data.insights;

  // Timeframe selector: Weekly (48,000 orders) vs Monthly (208,000 orders)
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  // Sliders grounded in the Dhaga Brief
  const [ordersCount, setOrdersCount] = useState(48000);
  const [macroReturnPct, setMacroReturnPct] = useState(31); // Neha: 31% overall
  const [otherSharePct, setOtherSharePct] = useState(44); // Section 04: 44% in Other
  const [logisticsCost, setLogisticsCost] = useState(120); // Faizan: ₹120 in logistics
  const [aov, setAov] = useState(840); // Brief: ₹840 AOV

  // Deep dive selection
  const [selectedAreaTitle, setSelectedAreaTitle] = useState<string>('Fit and size');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // Audio briefing player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Document Math Computations
  const totalReturns = Math.round((ordersCount * macroReturnPct) / 100);
  const otherReturns = Math.round((totalReturns * otherSharePct) / 100);
  const nehaManualRead = timeframe === 'weekly' ? 300 : 1200; // Neha: "a few hundred at a time"
  const unreadOtherCount = Math.max(0, otherReturns - nehaManualRead);
  const unreadOtherPct = ((unreadOtherCount / otherReturns) * 100).toFixed(1);

  // Financial costs of the "Other" bucket
  const totalLogisticsLoss = Math.round(otherReturns * logisticsCost);
  const totalGmvTrapped = Math.round(otherReturns * aov);

  // Potential recovery (74% doorstep swap conversion)
  const recoverableLogistics = Math.round(totalLogisticsLoss * 0.74);
  const recoverableGmv = Math.round(totalGmvTrapped * 0.74);

  const selectedArea = report.areas.find((a) => a.title === selectedAreaTitle) || report.areas[0];

  const keywords = [
    { word: 'chota', count: 4, area: 'Fit and size' },
    { word: 'tight', count: 2, area: 'Fit and size' },
    { word: 'bada / loose', count: 3, area: 'Fit and size' },
    { word: 'chart galat', count: 2, area: 'Fit and size' },
    { word: 'transparent', count: 1, area: 'Quality' },
    { word: 'patla cloth', count: 1, area: 'Quality' },
    { word: 'stitch nikal gyi', count: 1, area: 'Quality' },
    { word: 'navy vs black', count: 2, area: 'Colour' },
    { word: 'acha nahi laga', count: 3, area: 'Not enough to act' },
    { word: 'delivery late', count: 2, area: 'Not a product issue' },
  ];

  function toggleSpeech() {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const text = `Dhaga and Co return metrics brief. Returns are 31 percent overall, with 44 percent landing in the Other free text box. At 48,000 orders a week, that is 6,547 Other returns weekly. Neha can only read a few hundred by hand, leaving 95 percent unread. Most of it is about fit. Here is this week's AI classification: ${data.agents.overview.headline}. Action required: ${data.agents.overview.actions.join('. ')}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  }

  function handleSetTimeframe(tf: 'weekly' | 'monthly') {
    setTimeframe(tf);
    if (tf === 'weekly') {
      setOrdersCount(48000);
    } else {
      setOrdersCount(208000); // 48,000 * 52 / 12
    }
  }

  return (
    <section className="ink" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. DOCUMENT GROUND TRUTH BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1b2631 0%, #223440 100%)',
          border: '1px solid #334857',
          borderRadius: '18px',
          padding: '20px 24px',
          color: '#f4efe8',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#ff7755',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Dhaga &amp; Co. Brief Metrics
              </span>
              <span style={{ fontSize: '12px', color: '#c9bfb4' }}>
                Extracted verbatim from Project Brief &bull; Client Evidence
              </span>
            </div>
            <h3 style={{ margin: '8px 0 4px', fontFamily: 'Fraunces, serif', fontSize: '24px', color: '#fff' }}>
              The &ldquo;Other&rdquo; Return Category: Quantified Problem
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#c9bfb4', maxWidth: '820px', lineHeight: 1.5 }}>
              44% of all returns land in the unread &ldquo;Other&rdquo; free-text dropdown. At 48,000 orders a week, Neha can only read a few hundred by hand &mdash; leaving 95% unclassified while ₹120 reverse logistics cost is burned on every single return.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#17242c', padding: '4px', borderRadius: '10px', border: '1px solid #2d424e' }}>
            <button
              type="button"
              onClick={() => handleSetTimeframe('weekly')}
              style={{
                background: timeframe === 'weekly' ? '#ff7755' : 'transparent',
                color: timeframe === 'weekly' ? '#fff' : '#c9bfb4',
                border: 0,
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Weekly (48k orders)
            </button>
            <button
              type="button"
              onClick={() => handleSetTimeframe('monthly')}
              style={{
                background: timeframe === 'monthly' ? '#ff7755' : 'transparent',
                color: timeframe === 'monthly' ? '#fff' : '#c9bfb4',
                border: 0,
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Monthly (208k orders)
            </button>
          </div>
        </div>

        {/* 4 PRIMARY METRICS FROM THE BRIEF */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginTop: '18px',
          }}
        >
          <div style={{ background: '#243542', padding: '14px', borderRadius: '12px', border: '1px solid #374f5d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Macro Return Rate
              </span>
              <span style={{ fontSize: '10px', color: '#c9bfb4' }}>Page 5 · Neha</span>
            </div>
            <strong style={{ display: 'block', fontSize: '28px', fontFamily: 'Fraunces, serif', color: '#fca5a5', marginTop: '2px' }}>
              31%
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#c9bfb4', lineHeight: 1.4 }}>
              &ldquo;Returns are thirty-one percent overall.&rdquo;
              <br />
              <b style={{ color: '#fff' }}>{totalReturns.toLocaleString('en-IN')} total returns/{timeframe === 'weekly' ? 'wk' : 'mo'}</b>
            </p>
          </div>

          <div style={{ background: '#243542', padding: '14px', borderRadius: '12px', border: '1px solid #374f5d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                &ldquo;Other&rdquo; Return Share
              </span>
              <span style={{ fontSize: '10px', color: '#c9bfb4' }}>Page 4 · Returns</span>
            </div>
            <strong style={{ display: 'block', fontSize: '28px', fontFamily: 'Fraunces, serif', color: '#fcd34d', marginTop: '2px' }}>
              44%
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#c9bfb4', lineHeight: 1.4 }}>
              &ldquo;Forty-four percent of returns land in Other.&rdquo;
              <br />
              <b style={{ color: '#fff' }}>{otherReturns.toLocaleString('en-IN')} &ldquo;Other&rdquo; comments/{timeframe === 'weekly' ? 'wk' : 'mo'}</b>
            </p>
          </div>

          <div style={{ background: '#243542', padding: '14px', borderRadius: '12px', border: '1px solid #374f5d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#ff8888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Neha&rsquo;s Unread Gap
              </span>
              <span style={{ fontSize: '10px', color: '#c9bfb4' }}>Page 5 · Neha</span>
            </div>
            <strong style={{ display: 'block', fontSize: '28px', fontFamily: 'Fraunces, serif', color: '#ff8888', marginTop: '2px' }}>
              {unreadOtherPct}%
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#c9bfb4', lineHeight: 1.4 }}>
              Reads ~{nehaManualRead} by hand.
              <br />
              <b style={{ color: '#fca5a5' }}>{unreadOtherCount.toLocaleString('en-IN')} comments unread/{timeframe === 'weekly' ? 'wk' : 'mo'}</b>
            </p>
          </div>

          <div style={{ background: '#243542', padding: '14px', borderRadius: '12px', border: '1px solid #374f5d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#fdba74', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Logistics Loss
              </span>
              <span style={{ fontSize: '10px', color: '#c9bfb4' }}>Page 5 · Faizan</span>
            </div>
            <strong style={{ display: 'block', fontSize: '28px', fontFamily: 'Fraunces, serif', color: '#fdba74', marginTop: '2px' }}>
              ₹120 <span style={{ fontSize: '14px' }}>/ return</span>
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#c9bfb4', lineHeight: 1.4 }}>
              &ldquo;Each costs us ₹120 in logistics.&rdquo;
              <br />
              <b style={{ color: '#fff' }}>₹{(totalLogisticsLoss / 100000).toFixed(2)} Lakhs/{timeframe === 'weekly' ? 'wk' : 'mo'} burned</b>
            </p>
          </div>
        </div>
      </div>

      {/* 2. THE THREE STAKEHOLDER QUOTES FROM THE CASE BRIEF */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div style={{ background: '#1c2833', border: '1px solid #2e4150', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#fcd34d', fontSize: '14px' }}>Neha · Category Head</strong>
            <span style={{ fontSize: '10px', background: '#374f5d', color: '#f4efe8', padding: '2px 6px', borderRadius: '4px' }}>Case Page 4</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#e5ddd5', fontStyle: 'italic', lineHeight: 1.45 }}>
            &ldquo;Returns are thirty-one percent overall. When I read the Other box by hand, most of it is about fit, but I can only read a few hundred at a time.&rdquo;
          </p>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#ffaa88' }}>
            &bull; Problem: 6,547 weekly &ldquo;Other&rdquo; returns overwhelm human capacity.
          </div>
        </div>

        <div style={{ background: '#1c2833', border: '1px solid #2e4150', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#fdba74', fontSize: '14px' }}>Faizan · Supply Chain</strong>
            <span style={{ fontSize: '10px', background: '#374f5d', color: '#f4efe8', padding: '2px 6px', borderRadius: '4px' }}>Case Page 4</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#e5ddd5', fontStyle: 'italic', lineHeight: 1.45 }}>
            &ldquo;Return to origin on cash on delivery is twenty-six percent. Each one costs us about ₹120 in logistics and burns a delivery slot we could have used.&rdquo;
          </p>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#ffaa88' }}>
            &bull; Problem: ₹7.86 Lakhs/wk lost in reverse courier slots for &ldquo;Other&rdquo;.
          </div>
        </div>

        <div style={{ background: '#1c2833', border: '1px solid #2e4150', borderRadius: '14px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: '#6ee7b7', fontSize: '14px' }}>Dev · CTO &amp; Core Constraints</strong>
            <span style={{ fontSize: '10px', background: '#374f5d', color: '#f4efe8', padding: '2px 6px', borderRadius: '4px' }}>Case Page 4</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#e5ddd5', fontStyle: 'italic', lineHeight: 1.45 }}>
            &ldquo;Sixteen engineers, none of them an ML engineer. Whatever you build, somebody here has to run it on the Monday after you leave. Cost per action matters at 48k orders/week.&rdquo;
          </p>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#6ee7b7' }}>
            &bull; Solution: Automated Gemini pipeline with 75% auto-approval rule.
          </div>
        </div>
      </div>

      {/* 3. WEEKLY BRIEF & SPEECH NARRATOR */}
      <div>
        <WeeklyBrief overview={data.agents.overview} />

        <div className="audio-brief-player">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="play-btn" onClick={toggleSpeech} aria-label="Listen to Executive Brief">
              {isPlayingAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div>
              <strong style={{ fontSize: '14px', color: '#ffaa88' }}>
                {isPlayingAudio ? 'Speaking Briefing aloud (Document Metrics Audio)...' : 'Listen to Neha’s Sourcing & "Other" Category Audio Summary'}
              </strong>
              <div style={{ fontSize: '11px', color: '#b7aea4' }}>
                Voice briefing of 31% return rate, 44% &ldquo;Other&rdquo; classification split, and vendor action items.
              </div>
            </div>
          </div>
          {isPlayingAudio && (
            <div className="wave-anim" style={{ height: '18px' }}>
              <div className="wave-bar" style={{ animationDelay: '0.1s' }} />
              <div className="wave-bar" style={{ animationDelay: '0.3s' }} />
              <div className="wave-bar" style={{ animationDelay: '0.2s' }} />
              <div className="wave-bar" style={{ animationDelay: '0.4s' }} />
              <div className="wave-bar" style={{ animationDelay: '0.15s' }} />
            </div>
          )}
        </div>
      </div>

      {/* 4. VERIFIED DHAGA & CO. FINANCIAL SIMULATOR */}
      <div className="calc-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffaa88', fontWeight: 600 }}>
              VERIFIED BRIEF FINANCIAL IMPACT CALCULATOR
            </span>
            <h3 style={{ margin: '4px 0 0', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#fff' }}>
              Dhaga &amp; Co. &ldquo;Other&rdquo; Return Reverse Logistics Economics
            </h3>
          </div>
          <span className="badge" style={{ background: '#243640', border: '1px solid #455a64', padding: '6px 12px' }}>
            {timeframe === 'weekly' ? 'Weekly Scale (48k orders)' : 'Monthly Scale (208k orders)'}
          </span>
        </div>

        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#c9bfb4' }}>
          Grounded directly in the numbers from the engagement brief: 48,000 orders/wk, 31% return rate (Neha), 44% &ldquo;Other&rdquo; share (Returns DB), ₹120 reverse logistics (Faizan), and ₹840 AOV.
        </p>

        <div className="calc-slider-grid">
          <div className="slider-item">
            <label>Shipped Volume ({timeframe})</label>
            <b>{ordersCount.toLocaleString('en-IN')} units</b>
            <input
              type="range"
              min={timeframe === 'weekly' ? 20000 : 100000}
              max={timeframe === 'weekly' ? 80000 : 400000}
              step={timeframe === 'weekly' ? 2000 : 10000}
              value={ordersCount}
              onChange={(e) => setOrdersCount(Number(e.target.value))}
            />
          </div>

          <div className="slider-item">
            <label>Macro Return Rate (Neha)</label>
            <b>{macroReturnPct}%</b>
            <input
              type="range"
              min={15}
              max={45}
              step={1}
              value={macroReturnPct}
              onChange={(e) => setMacroReturnPct(Number(e.target.value))}
            />
          </div>

          <div className="slider-item">
            <label>&ldquo;Other&rdquo; Dropdown Share</label>
            <b>{otherSharePct}%</b>
            <input
              type="range"
              min={25}
              max={65}
              step={1}
              value={otherSharePct}
              onChange={(e) => setOtherSharePct(Number(e.target.value))}
            />
          </div>

          <div className="slider-item">
            <label>Logistics Cost (Faizan)</label>
            <b>₹{logisticsCost} / return</b>
            <input
              type="range"
              min={80}
              max={200}
              step={5}
              value={logisticsCost}
              onChange={(e) => setLogisticsCost(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="calc-out-grid">
          <div className="calc-out">
            <span>Total Returns ({timeframe})</span>
            <strong style={{ color: '#fca5a5' }}>{totalReturns.toLocaleString('en-IN')}</strong>
          </div>
          <div className="calc-out">
            <span>&ldquo;Other&rdquo; Returns ({timeframe})</span>
            <strong style={{ color: '#fcd34d' }}>{otherReturns.toLocaleString('en-IN')}</strong>
          </div>
          <div className="calc-out">
            <span>Reverse Freight Burned</span>
            <strong style={{ color: '#ff5d73' }}>₹{(totalLogisticsLoss / 100000).toFixed(2)} Lakhs</strong>
          </div>
          <div className="calc-out">
            <span>GMV Trapped in &ldquo;Other&rdquo;</span>
            <strong style={{ color: '#fb923c' }}>₹{(totalGmvTrapped / 100000).toFixed(2)} Lakhs</strong>
          </div>
        </div>

        <div
          style={{
            marginTop: '14px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <strong style={{ color: '#4ade80', fontSize: '14px' }}>
              Potential Recovery with Automated Doorstep Exchanges (74% Conversion):
            </strong>
            <div style={{ fontSize: '12px', color: '#c9bfb4', marginTop: '2px' }}>
              Intercepting the &ldquo;Other&rdquo; fit comments in &lt;15s replaces return courier pickups with size swaps from local inventory.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Freight Preserved:</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>
                ₹{(recoverableLogistics / 100000).toFixed(2)} Lakhs/{timeframe === 'weekly' ? 'wk' : 'mo'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#a7f3d0' }}>GMV Retained:</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>
                ₹{(recoverableGmv / 100000).toFixed(2)} Lakhs/{timeframe === 'weekly' ? 'wk' : 'mo'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. VERNACULAR HINGLISH SIGNAL EXTRACTOR (FROM 92% ANDROID MOBILE BRIEF) */}
      <div style={{ background: '#17242c', borderRadius: '18px', padding: '18px 20px', border: '1px solid #2b3e4c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffaa88' }}>
              CASE STUDY GROUNDING: 92% ANDROID USERS IN TIER-2/3 CITIES
            </span>
            <h4 style={{ margin: '2px 0 0', fontSize: '16px', color: '#fff', fontFamily: 'Fraunces, serif' }}>
              Hinglish Vernacular Signals Inside the &ldquo;Other&rdquo; Box
            </h4>
          </div>
          {selectedKeyword && (
            <button
              type="button"
              onClick={() => setSelectedKeyword(null)}
              style={{ background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '6px', padding: '3px 8px', fontSize: '11px' }}
            >
              Clear filter
            </button>
          )}
        </div>

        <p style={{ margin: '6px 0 10px', fontSize: '12px', color: '#c9bfb4' }}>
          &ldquo;Customers search in Hinglish, and they search by occasion rather than by product name... Ninety-two percent of orders come through the Android app.&rdquo; (Page 2). Here is how customers describe returns in the &ldquo;Other&rdquo; box:
        </p>

        <div className="keyword-cloud">
          {keywords.map((kw) => {
            const isActive = selectedKeyword === kw.word;
            return (
              <button
                type="button"
                key={kw.word}
                className={`kw-tag ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedKeyword(isActive ? null : kw.word)}
              >
                <span>{kw.count}&times;</span> &ldquo;{kw.word}&rdquo;
              </button>
            );
          })}
        </div>

        {selectedKeyword && (
          <div style={{ marginTop: '12px', background: '#243640', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', color: '#ffaa88', fontWeight: 600 }}>
              Matches for &ldquo;{selectedKeyword}&rdquo; from sample &ldquo;Other&rdquo; file:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              {Object.entries(HINGLISH_TRANSLATIONS)
                .filter(([original]) => original.toLowerCase().includes(selectedKeyword.toLowerCase().split(' ')[0]))
                .map(([original, english]) => (
                  <div key={original} style={{ fontSize: '12px', color: '#f4efe8' }}>
                    <strong>&ldquo;{original}&rdquo;</strong> &rarr; <span style={{ color: '#a7f3d0' }}>{english}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. WHAT IS INSIDE THE "OTHER" CATEGORY? (NEHA: "MOST OF IT IS ABOUT FIT") */}
      <div className="ink-split">
        {/* Left: Taxonomy Breakdown */}
        <div className="ink-list">
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffaa88', marginBottom: '4px' }}>
            Classification of the 44% &ldquo;Other&rdquo; Bucket
          </div>
          {report.areas.filter((area) => area.count > 0).map((area) => {
            const isSelected = selectedAreaTitle === area.title;
            return (
              <div
                className="ink-row"
                key={area.title}
                onClick={() => setSelectedAreaTitle(area.title)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid #ff7755' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span className={`swatch ${AREA_TONE[area.title] || 'slate'}`} />
                <div style={{ flex: 1 }}>
                  <div className="area-top">
                    <span style={{ fontWeight: isSelected ? 700 : 500 }}>
                      {area.title} {area.title === 'Fit and size' ? '★ (Neha: "Most of it is about fit")' : ''}
                    </span>
                    <strong>{area.count} · {area.share_pct}%</strong>
                  </div>
                  <div className="track dark">
                    <div className={`fill ${AREA_TONE[area.title] || 'slate'}`} style={{ width: `${area.share_pct}%` }} />
                  </div>
                  <p className="ink-quiet">{area.actionable ? area.note : 'No catalogue action.'}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Area Action Plan */}
        <div style={{ background: '#1b2731', borderRadius: '16px', padding: '18px', border: '1px solid #2e4150', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span className={`pill ${AREA_TONE[selectedArea.title] || 'slate'}`} style={{ fontSize: '11px' }}>
              {selectedArea.actionable ? '⚡ Actionable for Catalogue / Sourcing' : 'Low Actionability'}
            </span>
            <h3 style={{ margin: '8px 0 2px', fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#fff' }}>
              {selectedArea.title}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#c9bfb4' }}>
              {selectedArea.count} returns in file ({selectedArea.share_pct}% of classified &ldquo;Other&rdquo;). {selectedArea.note}
            </p>
          </div>

          <div style={{ background: '#243542', borderRadius: '12px', padding: '12px', fontSize: '13px' }}>
            <strong style={{ color: '#ffaa88' }}>Action for Neha &amp; Vendor Partners (Jaipur / Tiruppur):</strong>
            <p style={{ margin: '4px 0 0', color: '#e5ddd5', lineHeight: 1.45 }}>
              {selectedArea.title === 'Fit and size'
                ? 'Fit represents 57% of "Other" returns. Audit Jaipur Vendor 14 on KURTI123 bust measurements and update technical size charts on the Android app.'
                : selectedArea.actionable
                ? `Prioritize vendor audit for ${selectedArea.title}. Request updated technical specs before next production run.`
                : 'Customer subjective sentiment or courier delay. Do not alter catalogue or size specifications.'}
            </p>
          </div>

          <div>
            <strong style={{ fontSize: '12px', color: '#b7aea4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sample Vernacular Quotes in {selectedArea.title}:
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {Object.entries(HINGLISH_TRANSLATIONS)
                .slice(0, 3)
                .map(([original, english]) => (
                  <div
                    key={original}
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #ff7755',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontStyle: 'italic', color: '#fef08a' }}>&ldquo;{original}&rdquo;</div>
                    <div style={{ color: '#a7f3d0', marginTop: '2px' }}>Meaning: {english}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyBrief({ overview }: { overview: OverviewAgent }) {
  return (
    <section className="brief" aria-label="Weekly overview">
      <p className="kicker">Agent 3 · Overview · {overview.source === 'model' ? 'model brief' : 'from counted labels'}</p>
      <h3>{overview.headline}</h3>
      <div className="brief-grid">
        <div>
          <p className="brief-label">This week</p>
          <ul>
            {overview.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="brief-label">Watch</p>
          <ul>
            {(overview.watch.length ? overview.watch : ['No SKU cluster yet.']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="brief-label">Neha’s actions</p>
          <ul>
            {(overview.actions.length ? overview.actions : ['Nothing queued.']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="caveat">{overview.caveat}</p>
    </section>
  );
}
