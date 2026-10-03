import { Dashboard } from '../api';
import {
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';

export function OverallMetricsTopBar({
  data,
  theme,
  onToggleTheme,
  onNavigateToReview,
  onNavigateToMetrics,
}: {
  data: Dashboard | null;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onNavigateToReview: () => void;
  onNavigateToMetrics: () => void;
}) {
  const autoApproved = data?.agents.review.auto_approved ?? 21;
  const inReview = data?.in_review ?? 2;
  const countedPct = data?.insights.counted_pct ?? 91;

  return (
    <header
      style={{
        background: '#17242c',
        color: '#f6f1ea',
        borderRadius: '16px',
        padding: '10px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        border: '1px solid #2d424e',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Brand & Network Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
          }}
        />
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffaa88', fontWeight: 600 }}>
          Overall Metrics Bar
        </span>
        <span style={{ fontSize: '11px', color: '#a79c90' }}>&bull; Live File</span>
      </div>

      {/* Metric Chips Carousel / Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* Metric 1: Return Rate */}
        <div
          onClick={onNavigateToMetrics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#243542',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          title="Macro return rate: 31% overall (Neha, Category Head) · 14,880 returns/wk"
        >
          <TrendingDown size={14} color="#fca5a5" />
          <span style={{ color: '#c9bfb4' }}>Return Rate:</span>
          <strong style={{ color: '#fff' }}>31%</strong>
        </div>

        {/* Metric 2: Other Share */}
        <div
          onClick={onNavigateToMetrics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#243542',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          title="44% of all returns land in 'Other' free-text dropdown · 6,547 returns/wk"
        >
          <RotateCcw size={14} color="#fcd34d" />
          <span style={{ color: '#c9bfb4' }}>Other Bucket:</span>
          <strong style={{ color: '#fff' }}>44%</strong>
        </div>

        {/* Metric 3: Auto-Approved */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#243542',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          title="Auto-approved at 75% confidence threshold"
        >
          <CheckCircle2 size={14} color="#4ade80" />
          <span style={{ color: '#c9bfb4' }}>Auto-Approved:</span>
          <strong style={{ color: '#4ade80' }}>
            {autoApproved} ({countedPct}%)
          </strong>
        </div>

        {/* Metric 4: In Review (Clickable) */}
        <button
          type="button"
          onClick={onNavigateToReview}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: inReview > 0 ? '#451a1a' : '#243542',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            border: `1px solid ${inReview > 0 ? '#b91c1c' : 'rgba(255,255,255,0.06)'}`,
            color: '#fff',
            cursor: 'pointer',
          }}
          title="Click to view and decide open rows in Review Queue"
        >
          <AlertCircle size={14} color={inReview > 0 ? '#fca5a5' : '#a79c90'} />
          <span style={{ color: inReview > 0 ? '#fca5a5' : '#c9bfb4' }}>In Review:</span>
          <strong style={{ color: inReview > 0 ? '#ff8888' : '#fff' }}>{inReview} Open</strong>
        </button>

        {/* Metric 5: Freight Saved */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#143825',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            border: '1px solid #166534',
          }}
          title="Reverse courier logistics saved at ₹120 per return (Faizan, Head of Supply Chain)"
        >
          <ShieldCheck size={14} color="#86efac" />
          <span style={{ color: '#bbf7d0' }}>Freight Saved:</span>
          <strong style={{ color: '#4ade80' }}>₹42,280</strong>
        </div>

        {/* Metric 6: Agent SLA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#1e293b',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            border: '1px solid #334155',
          }}
          title="WhatsApp agent response speed upon return initiation"
        >
          <Zap size={14} color="#38bdf8" />
          <span style={{ color: '#94a3b8' }}>Agent SLA:</span>
          <strong style={{ color: '#38bdf8' }}>11.2s</strong>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: theme === 'dark' ? '#243640' : '#2b3b47',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#f6f1ea',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#38bdf8" />}
            <span style={{ fontSize: '11px' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
