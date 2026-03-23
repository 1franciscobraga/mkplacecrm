import { useMemo } from "react";
import { Client, DEAL_STAGES, DealStage } from "@/types/crm";
import { computeDealProbability } from "@/lib/dealProbability";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { stageLabel, STAGE_SHORT } from "@/lib/i18n";
import CompanyLogo from "@/components/CompanyLogo";

// ─── Geometry ──────────────────────────────────────────────────────────────────
const N       = DEAL_STAGES.length;
const BAND_H  = 68;
const CX      = 230;
const MAX_W   = 420;
const MIN_W   = 70;
const W_STEP  = (MAX_W - MIN_W) / N;
const SVG_W   = CX * 2;
const SVG_H   = N * BAND_H;

function midW(i: number) { return MAX_W - (i + 0.5) * W_STEP; }

function bandPath(i: number): string {
  const topW = MAX_W - i * W_STEP;
  const botW = MAX_W - (i + 1) * W_STEP;
  const yT   = i * BAND_H;
  const yB   = (i + 1) * BAND_H;
  const tL = CX - topW / 2, tR = CX + topW / 2;
  const bL = CX - botW / 2, bR = CX + botW / 2;
  return `M${tL},${yT} L${tR},${yT} L${bR},${yB} L${bL},${yB} Z`;
}

// ─── Color palette ─────────────────────────────────────────────────────────────
const PALETTE: { fill: string; dark: string }[] = [
  { fill: "#64748b", dark: "#475569" },
  { fill: "#3b82f6", dark: "#2563eb" },
  { fill: "#06b6d4", dark: "#0891b2" },
  { fill: "#8b5cf6", dark: "#7c3aed" },
  { fill: "#f59e0b", dark: "#d97706" },
  { fill: "#f97316", dark: "#ea580c" },
  { fill: "#10b981", dark: "#059669" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseDealValue(val: string | null): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^\d.,]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmtCurrency(v: number): string {
  if (v === 0) return "—";
  if (v >= 1_000_000) return `R$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1_000)     return `R$${(v / 1e3).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FunnelView({ clients, onClientClick }: { clients: Client[]; onClientClick: (client: Client) => void }) {
  const stageData = useMemo(() => {
    return DEAL_STAGES.map((stage, idx) => {
      const sc    = clients.filter(c => c.dealStage === stage);
      const count = sc.length;

      const fromHere = clients.filter(c => DEAL_STAGES.indexOf(c.dealStage) >= idx).length;
      const fromNext  = idx < N - 1
        ? clients.filter(c => DEAL_STAGES.indexOf(c.dealStage) > idx).length
        : null;

      const convRate = fromNext !== null && fromHere > 0
        ? Math.round((fromNext / fromHere) * 100)
        : null;

      const revenue = sc.reduce((s, c) =>
        s + parseDealValue(c.dealValue) * computeDealProbability(c).overall / 100, 0);

      const top5 = [...sc]
        .sort((a, b) => computeDealProbability(b).overall - computeDealProbability(a).overall)
        .slice(0, 5);

      return { stage, count, convRate, revenue, top5 };
    });
  }, [clients]);

  const totalRevenue = stageData.reduce((s, m) => s + m.revenue, 0);
  const totalLeads   = clients.length;
  const firstCount   = stageData[0].count;
  const lastCount    = stageData[N - 1].count;
  const overallConv  = firstCount > 0 ? Math.round((lastCount / firstCount) * 100) : 0;
  const withVal      = clients.filter(c => parseDealValue(c.dealValue) > 0);
  const avgTicket    = withVal.length > 0
    ? withVal.reduce((s, c) => s + parseDealValue(c.dealValue), 0) / withVal.length
    : 0;

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: "#f8fafc" }}>

      {/* LEFT AREA — funnel visual + aligned labels */}
      <div className="flex-1 flex flex-col items-center py-8 px-6 overflow-y-auto min-w-0">

        <div className="mb-8 text-center">
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em" }}>
            Sales Funnel
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {totalLeads} active leads in pipeline
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>

          {/* SVG FUNNEL */}
          <div style={{ flexShrink: 0, width: SVG_W, height: SVG_H, position: "relative" }}>
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              width={SVG_W}
              height={SVG_H}
              style={{
                display: "block",
                filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.12))",
                borderRadius: 4,
                overflow: "visible",
              }}
            >
              <defs>
                {PALETTE.map((p, i) => (
                  <linearGradient key={i} id={`fgr${i}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%"   stopColor={p.fill} />
                    <stop offset="100%" stopColor={p.dark} />
                  </linearGradient>
                ))}
              </defs>

              {DEAL_STAGES.map((_, i) => {
                const topW  = MAX_W - i * W_STEP;

                return (
                  <g key={i}>
                    <path d={bandPath(i)} fill={`url(#fgr${i})`} />
                    <line
                      x1={CX - topW / 2 + 3} y1={i * BAND_H + 1.5}
                      x2={CX + topW / 2 - 3} y2={i * BAND_H + 1.5}
                      stroke="white" strokeWidth={1.5} opacity={0.20}
                    />
                    <text
                      x={CX}
                      y={i * BAND_H + 15}
                      textAnchor="middle"
                      fill="white"
                      fontSize={14}
                      fontWeight="800"
                      fontFamily="system-ui,-apple-system,BlinkMacSystemFont,sans-serif"
                      opacity={0.96}
                    >
                      {stageData[i].count}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Company names overlay */}
            <TooltipProvider delayDuration={150}>
              <div style={{ position: "absolute", top: 0, left: 0, width: SVG_W, height: SVG_H, pointerEvents: "none" }}>
                {stageData.map((m, i) => {
                  const w = midW(i);
                  const maxShow = w > 250 ? 5 : w > 180 ? 4 : w > 120 ? 3 : 2;
                  const sorted = [...m.top5]
                    .sort((a, b) => parseDealValue(b.dealValue) - parseDealValue(a.dealValue));
                  const companies = sorted.slice(0, maxShow);
                  const fontSize = w > 250 ? 9.5 : w > 180 ? 8.5 : 7.5;

                  return (
                    <div
                      key={m.stage}
                      style={{
                        position: "absolute",
                        top: i * BAND_H + 20,
                        left: CX - w * 0.42,
                        width: w * 0.84,
                        height: BAND_H - 22,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        overflow: "hidden",
                        pointerEvents: "auto",
                      }}
                    >
                      {companies.map(c => {
                        const prob = computeDealProbability(c).overall;
                        const lastMeeting = c.meetings.length > 0
                          ? c.meetings[c.meetings.length - 1]
                          : null;
                        const lastDate = lastMeeting?.date || c.meetingDate;

                        return (
                          <Tooltip key={c.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => onClientClick(c)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "white",
                                  fontSize,
                                  cursor: "pointer",
                                  padding: "0 2px",
                                  lineHeight: 1.3,
                                  opacity: 0.85,
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
                                  fontWeight: 500,
                                  display: "block",
                                  textAlign: "center",
                                  width: "100%",
                                  transition: "opacity 0.15s, font-weight 0.15s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.fontWeight = "700"; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.fontWeight = "500"; }}
                              >
                                {c.clientName}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3 z-[100]">
                              <div className="space-y-1.5">
                                <p className="font-bold text-sm text-foreground">{c.clientName}</p>
                                {c.projectName && (
                                  <p className="text-xs text-muted-foreground">{c.projectName}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Deal:</span>
                                  <span className="font-semibold text-foreground">{c.dealValue || "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Probability:</span>
                                  <span className="font-semibold text-foreground">{prob}%</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Stage:</span>
                                  <span className="font-semibold text-foreground">{stageLabel(c.dealStage)}</span>
                                </div>
                                {lastDate && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">Last interaction:</span>
                                    <span className="font-semibold text-foreground">{lastDate}</span>
                                  </div>
                                )}
                                {c.executiveSummary && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{c.executiveSummary}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>

          {/* ALIGNED LABELS (right of funnel) */}
          <div style={{ display: "flex", flexDirection: "column", height: SVG_H }}>
            {stageData.map((m, i) => (
              <div
                key={m.stage}
                style={{
                  height: BAND_H,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingLeft: 14,
                  borderLeft: `3px solid ${PALETTE[i].fill}`,
                  minWidth: 200,
                }}
              >
                <p style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#1e293b",
                  lineHeight: 1.3,
                  marginBottom: 2,
                }}>
                  {stageLabel(m.stage)}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: PALETTE[i].fill }}>
                    {m.count} lead{m.count !== 1 ? "s" : ""}
                  </span>
                  {m.convRate !== null && (
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>
                      <span style={{ fontWeight: 700, color: "#475569" }}>{m.convRate}%</span> conv.
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                  Est. rev.:&nbsp;
                  <span style={{ fontWeight: 700, color: "#475569" }}>TBD</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — KPIs + top companies per stage */}
      <div style={{
        width: 272,
        flexShrink: 0,
        background: "#ffffff",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>

        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <p style={{
            fontSize: 9,
            fontWeight: 800,
            color: "#94a3b8",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}>
            Pipeline Overview
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <KpiCard icon={<Users    size={14} />} label="Total Leads"       value={String(totalLeads)}  accent="#2563eb" />
            <KpiCard icon={<TrendingUp size={14} />} label="Overall Conv."   value={`${overallConv}%`}   accent="#059669" />
            <KpiCard icon={<DollarSign size={14} />} label="Est. Revenue"    value="TBD"                 accent="#7c3aed" />
            <KpiCard icon={<Target   size={14} />} label="Avg. Ticket"       value="TBD"                 accent="#d97706" />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{
            padding: "9px 18px",
            background: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <p style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}>
              Top Companies by Stage
            </p>
          </div>

          {stageData.map((m, i) =>
            m.top5.length === 0 ? null : (
              <div key={m.stage} style={{
                padding: "11px 18px",
                borderBottom: "1px solid #f8fafc",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{
                    width: 7, height: 7,
                    borderRadius: 2,
                    background: PALETTE[i].fill,
                    flexShrink: 0,
                  }} />
                  <p style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#334155",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {stageLabel(m.stage)}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {m.top5.slice(0, 3).map(c => {
                    const prob = computeDealProbability(c).overall;
                    const probColor = prob >= 65 ? "#059669" : prob >= 40 ? "#d97706" : "#dc2626";
                    return (
                      <button
                        key={c.id}
                        onClick={() => onClientClick(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          padding: "4px 8px",
                          borderRadius: 5,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{
                          fontSize: 10.5,
                          color: "#475569",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {c.clientName}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: probColor, flexShrink: 0 }}>
                          {prob}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 11px",
      borderRadius: 9,
      background: "#f8fafc",
    }}>
      <div style={{
        width: 30, height: 30,
        borderRadius: 7,
        background: `${accent}1a`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          fontSize: 9,
          color: "#94a3b8",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          lineHeight: 1,
          marginBottom: 3,
        }}>
          {label}
        </p>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </div>
  );
}
