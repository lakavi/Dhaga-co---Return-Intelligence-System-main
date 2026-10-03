import { useEffect, useState } from "react";
import {
  Gauge,
  BarChart3,
  LayoutDashboard,
  ClipboardCheck,
  Bot,
  UploadCloud,
  Sun,
  Moon,
} from "lucide-react";
import { api, type Dashboard, type ReviewRow, type SkuDetail, type UploadResult } from "./api";
import { OverallMetricsTopBar } from "./components/OverallMetricsTopBar";
import { OverallMetricsView } from "./components/OverallMetricsView";
import { ReturnMetricsView } from "./components/ReturnMetricsView";
import { CommandCenterView } from "./components/CommandCenterView";
import { ReviewQueueView } from "./components/ReviewQueueView";
import { ResolutionAgentView } from "./components/ResolutionAgentView";
import { UploadView } from "./components/UploadView";

type Page = "overview" | "metrics" | "dashboard" | "review" | "agent" | "upload";

export function App() {
  const [page, setPage] = useState<Page>("overview");
  const [data, setData] = useState<Dashboard | null>(null);
  const [sku, setSku] = useState("KURTI123");
  const [detail, setDetail] = useState<SkuDetail | null>(null);
  const [queue, setQueue] = useState<ReviewRow[]>([]);
  const [error, setError] = useState("");
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewSku, setReviewSku] = useState<string>("all");

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("dhaga-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dhaga-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  async function refresh() {
    try {
      const next = await api.dashboard();
      setData(next);
      const review = await api.review();
      setQueue(review.rows);
      const chosen = next.skus.includes(sku) ? sku : next.skus[0];
      if (chosen) {
        setSku(chosen);
        setDetail(await api.sku(chosen));
      } else {
        setDetail(null);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function chooseSku(value: string) {
    setSku(value);
    try {
      setDetail(await api.sku(value));
    } catch (err: any) {
      console.error(err);
    }
  }

  async function act(id: string, kind: "approve" | "dismiss" | "edit", label?: string) {
    setError("");
    try {
      if (kind === "edit") await api.edit(id, label || "");
      if (kind === "approve") await api.approve(id);
      if (kind === "dismiss") await api.dismiss(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action failed.");
    }
  }

  async function onFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const result = await api.upload(file);
      setUpload(result);
      if (result.classified) await refresh();
      setPage(result.classified ? "metrics" : "upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setBusy(true);
    setError("");
    try {
      await api.reset();
      setUpload(null);
      await refresh();
      setPage("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Page, [string, string]> = {
    overview: [
      "Overall Brand Metrics & Control Room",
      "Executive overview: 31% macro return baseline, 74% doorstep exchange conversion, and reverse freight preservation across Bangalore micro-hubs.",
    ],
    metrics: [
      'Return Metrics & The "Other" Category Breakdown',
      "Grounded in Dhaga & Co. brief: 31% return rate (Neha), 44% in 'Other' (6,547/wk), ₹120 reverse logistics cost (Faizan), and 95.4% manual unread gap.",
    ],
    dashboard: [
      "Command Center & Sizing Diagnostics",
      "Per-SKU pattern variance, size distribution heatmaps, customer quote translation, and vendor notice memos.",
    ],
    review: [
      "Human-in-the-Loop Review Queue",
      "Audit model classifications under 75% or with validation errors. Search, keyboard shortcuts, and batch approvals.",
    ],
    agent: [
      "Autonomous Resolution Agent",
      "WhatsApp negotiation within 15s with 1-click doorstep exchange from nearby micro-hubs before reverse freight is incurred. Escalates to AI voice calling at 4h.",
    ],
    upload: [
      "Returns Ingestion & Pipeline Bench",
      "1-Click test batches, live CSV dropzone preview, parallel batch classification, and 75% auto-approval thresholding.",
    ],
  };

  const nav: { id: Page; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "overview", label: "Overall metrics", icon: <Gauge size={17} /> },
    { id: "metrics", label: "Return metrics", icon: <BarChart3 size={17} /> },
    { id: "dashboard", label: "Command center", icon: <LayoutDashboard size={17} /> },
    { id: "review", label: "Review", icon: <ClipboardCheck size={17} /> },
    { id: "agent", label: "Autonomous Agent", icon: <Bot size={17} />, badge: "⚡ 15s" },
    { id: "upload", label: "Upload", icon: <UploadCloud size={17} /> },
  ];

  const visibleQueue = reviewSku === "all" ? queue : queue.filter((row) => row.sku === reviewSku);

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="mark" style={{ position: "relative" }}>
            <span>ध</span>
            <span
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                background: "#22c55e",
                width: 9,
                height: 9,
                borderRadius: "50%",
                border: "2px solid var(--navy)",
              }}
              title="Autonomous Agents Active"
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h1>Dhaga</h1>
              <span
                style={{
                  fontSize: "10px",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#ffaa88",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                &amp; CO.
              </span>
            </div>
            <p>Return Intelligence</p>
          </div>
        </div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              type="button"
              onClick={() => setPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    color: page === item.id ? "#ffaa88" : "#c9bfb4",
                    transition: "color 0.15s ease",
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ fontWeight: page === item.id ? 600 : 400 }}>{item.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {item.id === "review" && queue.length > 0 ? (
                  <span className="badge">{queue.length}</span>
                ) : null}
                {item.badge ? (
                  <span
                    className="badge"
                    style={{ background: "#128c7e", fontSize: "10px", padding: "2px 6px" }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </nav>

        {/* Dark / Light Mode Switcher */}
        <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "12px",
              background: theme === "dark" ? "#243640" : "#1f2d37",
              color: "#f6f1ea",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {theme === "dark" ? <Moon size={16} color="#38bdf8" /> : <Sun size={16} color="#fbbf24" />}
              <span style={{ fontWeight: 500 }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <span
              style={{
                fontSize: "11px",
                background: "rgba(255,255,255,0.1)",
                padding: "2px 8px",
                borderRadius: "99px",
                color: "#ffaa88",
              }}
            >
              Switch
            </span>
          </button>
        </div>
      </aside>

      <main className="main">
        {/* Persistent Overall Metrics Navigation Bar */}
        <OverallMetricsTopBar
          data={data}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigateToReview={() => setPage("review")}
          onNavigateToMetrics={() => setPage("metrics")}
        />

        <p className="kicker">Dhaga &amp; Co. &bull; D2C Fashion Intelligence</p>
        <h2>{titles[page][0]}</h2>
        <p className="lede">{titles[page][1]}</p>

        {data && page !== "metrics" && page !== "agent" && page !== "overview" ? (
          <div className="banner">
            {data.sample_banner} Auto-approve threshold: {data.auto_approve_pct}%.
          </div>
        ) : null}

        {error ? <div className="error">{error}</div> : null}

        {page === "overview" && data ? (
          <OverallMetricsView data={data} onNavigate={(target) => setPage(target)} />
        ) : null}

        {page === "metrics" && data ? <ReturnMetricsView data={data} /> : null}

        {page === "dashboard" && data ? (
          <CommandCenterView
            data={data}
            sku={sku}
            detail={detail}
            onSku={chooseSku}
            onReview={() => setPage("review")}
          />
        ) : null}

        {page === "review" && data ? (
          <ReviewQueueView
            data={data}
            queue={visibleQueue}
            reviewSku={reviewSku}
            onSku={setReviewSku}
            onAct={act}
          />
        ) : null}

        {page === "agent" ? <ResolutionAgentView /> : null}

        {page === "upload" ? (
          <UploadView
            data={data}
            upload={upload}
            busy={busy}
            onFile={onFile}
            onReset={onReset}
          />
        ) : null}
      </main>
    </div>
  );
}
