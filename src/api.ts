export type LabelCount = { label: string; title: string; count: number };
export type LabelOption = { label: string; title: string };

export type Agents = {
  intake: {
    name: string;
    loaded: number;
    batches: number | null;
    batch_size: number;
    detail: string;
  };
  review: {
    name: string;
    auto_approved: number;
    sent_to_neha: number;
    threshold: number;
    detail: string;
  };
  overview: {
    name: string;
    headline: string;
    bullets: string[];
    watch: string[];
    actions: string[];
    caveat: string;
    source: string;
    detail: string;
  };
  source: string;
};

export type Focus = {
  title: string;
  count: number;
  share_pct: number;
  sku: string;
  vendor: string;
  size: string;
  label: string;
  cluster: number;
  action: string;
};

export type InsightArea = {
  title: string;
  count: number;
  share_pct: number;
  actionable: boolean;
  note: string;
};

export type ProductRank = {
  sku: string;
  vendor: string;
  count: number;
  share_pct: number;
  top_title: string;
};

export type AttentionItem = {
  sku: string;
  size: string;
  vendor: string;
  text: string;
  why: string;
};

export type SkuBoardItem = {
  sku: string;
  vendor: string;
  auto_approved: number;
  open: number;
  counted: number;
};

export type Insights = {
  headline: string;
  counted: number;
  counted_pct: number;
  still_with_neha: number;
  still_pct: number;
  low_confidence: number;
  no_score: number;
  leave_alone: number;
  leave_pct: number;
  areas: InsightArea[];
  products: ProductRank[];
  sku_board: SkuBoardItem[];
  attention: AttentionItem[];
  focus: Focus | null;
  limit: string;
};

export type Dashboard = {
  total: number;
  accepted: number;
  in_review: number;
  dismissed: number;
  labels: LabelCount[];
  skus: string[];
  sample_banner: string;
  models_configured: boolean;
  auto_approve_pct: number;
  label_options: LabelOption[];
  agents: Agents;
  insights: Insights;
};

export type Quote = {
  text: string;
  label: string;
  confidence_pct: number | null;
  auto_approved: boolean;
};

export type SkuDetail = {
  sku: string;
  vendor: string | null;
  top_label: string | null;
  top_title: string | null;
  action: string | null;
  sizes: { size: string; count: number }[];
  quotes: Quote[];
};

export type ReviewRow = {
  id: string;
  sku: string;
  vendor: string;
  size: string;
  other_text: string;
  label: string | null;
  display_label: string | null;
  confidence_pct: number | null;
  short_reason: string;
};

export type OverviewAgent = {
  name: string;
  headline: string;
  bullets: string[];
  watch: string[];
  actions: string[];
  caveat: string;
  source: string;
  detail: string;
};

export type UploadResult = {
  classified: boolean;
  message: string;
  kept: number;
  dropped: { reason: string; count: number }[];
  unclassified: { return_id: string; sku: string; text: string }[];
  accepted?: number;
  in_review?: number;
  agents?: {
    intake: { name: string; loaded: number; batches: number; batch_size: number };
    review: { name: string; auto_approved: number; sent_to_neha: number; threshold: number } | null;
    overview: OverviewAgent | null;
  };
};

export type ChatMessage = {
  sender: 'bot' | 'customer' | 'system';
  text: string;
  time: string;
  actionButtons?: string[];
};

export type CallLog = {
  timestamp: string;
  durationSeconds: number;
  status: 'completed' | 'in_progress' | 'unanswered' | 'scheduled';
  transcript: Array<{ speaker: 'AI Agent (Maya)' | 'Customer'; text: string }>;
  callOutcome: string;
};

export type ResolutionCase = {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  orderId: string;
  sku: string;
  title: string;
  sizeOrdered: string;
  suggestedExchangeSize: string;
  hubName: string;
  hubStock: number;
  problemCategory: 'size_too_small' | 'size_too_large' | 'damage_or_stitch' | 'fabric_or_other';
  customerComment: string;
  itemValue: number;
  reverseFreightCost: number;
  stage: 'whatsapp_intercept' | 'voice_call_triggered' | 'doorstep_exchange_confirmed' | 'rto_initiated';
  interceptSeconds: number;
  timeElapsedMinutes: number;
  whatsappChat: ChatMessage[];
  callLog?: CallLog;
  reverseFreightSaved: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResolutionStats = {
  total: number;
  doorstepExchanges: number;
  whatsappActive: number;
  voiceActive: number;
  rtoInitiated: number;
  totalReverseFreightSaved: number;
  totalGMVRetained: number;
  avgInterceptSeconds: number;
  exchangeRatePct: number;
  config: {
    interceptDelaySeconds: number;
    voiceCallTimeoutHours: number;
    doorstepIncentiveWallet: number;
    voicePersona: string;
    autoRTOOnNoAnswer: boolean;
  };
};

/** Empty in local Vite (proxy /api → :8000). Set VITE_API_BASE on Vercel to the API origin. */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

async function read<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body.detail === "string" ? body.detail : "The request failed.";
    throw new Error(detail);
  }
  return body as T;
}

export const api = {
  dashboard: () => read<Dashboard>("/api/dashboard"),
  sku: (sku: string) => read<SkuDetail>(`/api/sku/${encodeURIComponent(sku)}`),
  review: () => read<{ rows: ReviewRow[] }>("/api/review"),
  approve: (id: string) => read(`/api/review/${id}/approve`, { method: "POST" }),
  dismiss: (id: string) => read(`/api/review/${id}/dismiss`, { method: "POST" }),
  edit: (id: string, label: string) =>
    read(`/api/review/${id}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return read<UploadResult>("/api/upload", { method: "POST", body: form });
  },
  reset: () => read<{ ok: boolean }>("/api/reset", { method: "POST" }),
  agentCases: () => read<ResolutionCase[]>("/api/agent/cases"),
  agentStats: () => read<ResolutionStats>("/api/agent/stats"),
  agentSimulate: (data: { customerName: string; phone?: string; sku: string; size: string; comment: string; city?: string }) =>
    read<ResolutionCase>("/api/agent/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  agentAction: (id: string, stage: 'doorstep_exchange_confirmed' | 'voice_call_triggered' | 'rto_initiated') =>
    read<ResolutionCase>(`/api/agent/action/${id}/${stage}`, { method: "POST" }),
};
