import { Client, DEAL_STAGES, STAGE_BADGE_STYLES, FINAL_STAGE, STALE_DEAL_DAYS } from "@/types/crm";
import { Clock, DollarSign, Users, TrendingDown, CheckCircle } from "lucide-react";

interface FunnelViewProps {
  clients: Client[];
}

const parseValue = (val: string | null): number => {
  if (!val) return 0;
  const match = val.replace(/\./g, "").match(/([\d,]+)\s*([kKmM]?)/);
  if (!match) return 0;
  const num = parseFloat(match[1].replace(",", "."));
  const mult = match[2]?.toLowerCase() === "k" ? 1000 : match[2]?.toLowerCase() === "m" ? 1_000_000 : 1;
  return isNaN(num) ? 0 : num * mult;
};

const formatCurrency = (val: number): string => {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}k`;
  return `R$ ${val.toFixed(0)}`;
};

// Luminance-based text color for contrast over colored backgrounds
const getTextColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.58 ? "#1e293b" : "#ffffff";
};

// Fixed funnel widths per stage (proportional, narrows from top to bottom)
const FUNNEL_WIDTHS = [1.0, 0.84, 0.70, 0.57, 0.45, 0.34, 0.24];
const SVG_W = 660;
const SECTION_H = 74;
const GAP = 3;
const TOTAL_H = DEAL_STAGES.length * (SECTION_H + GAP) - GAP;

const FunnelView = ({ clients }: FunnelViewProps) => {
  const stageData = DEAL_STAGES.map((stage) => {
    const sc = clients.filter((c) => c.dealStage === stage);
    const value = sc.reduce((s, c) => s + parseValue(c.dealValue), 0);
    const staleCount = sc.filter((c) => {
      const days = (Date.now() - new Date(c.updatedAt).getTime()) / 86400000;
      return days >= STALE_DEAL_DAYS;
    }).length;
    const avgDaysSinceUpdate =
      sc.length > 0
        ? sc.reduce((s, c) => s + (Date.now() - new Date(c.updatedAt).getTime()) / 86400000, 0) / sc.length
        : null;
    const avgAgeDays =
      sc.length > 0
        ? sc.reduce((s, c) => s + (Date.now() - new Date(c.createdAt).getTime()) / 86400000, 0) / sc.length
        : null;
    return { stage, count: sc.length, value, staleCount, avgDaysSinceUpdate, avgAgeDays };
  });

  const firstCount = stageData[0].count;
  const lastCount = stageData[stageData.length - 1].count;
  const conversionRate = firstCount > 0 ? (lastCount / firstCount) * 100 : 0;
  const totalValue = stageData.reduce((s, d) => s + d.value, 0);
  const totalDeals = clients.length;
  const staleTotal = stageData.reduce((s, d) => s + d.staleCount, 0);

  return (
    <div className="flex flex-col gap-5 p-6 flex-1 overflow-auto">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={<Users className="w-4 h-4" />} label="Total no Funil" value={totalDeals.toString()} sub="deals" color="text-blue-600" bg="bg-blue-50" />
        <SummaryCard icon={<DollarSign className="w-4 h-4" />} label="Valor Total" value={totalValue > 0 ? formatCurrency(totalValue) : "—"} sub="estimado" color="text-violet-600" bg="bg-violet-50" />
        <SummaryCard icon={<TrendingDown className="w-4 h-4" />} label="Taxa de Conversão" value={`${conversionRate.toFixed(1)}%`} sub="Lead → Go-Live" color="text-emerald-600" bg="bg-emerald-50" />
        <SummaryCard icon={<Clock className="w-4 h-4" />} label="Deals Parados" value={staleTotal.toString()} sub={`+${STALE_DEAL_DAYS} dias sem mover`} color={staleTotal > 0 ? "text-amber-600" : "text-muted-foreground"} bg={staleTotal > 0 ? "bg-amber-50" : "bg-secondary"} />
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── FUNNEL SVG ── */}
        <div className="flex-1 bg-card rounded-xl border border-border p-5 flex flex-col min-w-0">
          <h2 className="text-sm font-semibold text-foreground mb-4">Funil de Vendas</h2>
          <div className="flex-1 flex items-start justify-center overflow-hidden">
            <svg
              width="100%"
              viewBox={`0 0 ${SVG_W} ${TOTAL_H}`}
              preserveAspectRatio="xMidYMin meet"
              style={{ maxHeight: TOTAL_H }}
            >
              {stageData.map((item, i) => {
                const topFrac = FUNNEL_WIDTHS[i];
                const bottomFrac = FUNNEL_WIDTHS[i + 1] ?? FUNNEL_WIDTHS[i] * 0.78;
                const topW = topFrac * SVG_W;
                const bottomW = bottomFrac * SVG_W;
                const tl = (SVG_W - topW) / 2;
                const tr = tl + topW;
                const bl = (SVG_W - bottomW) / 2;
                const br = bl + bottomW;
                const y = i * (SECTION_H + GAP);
                const cx = SVG_W / 2;
                const cy = y + SECTION_H / 2;

                const badge = STAGE_BADGE_STYLES[item.stage];
                const tc = getTextColor(badge.color);

                const prevCount = i > 0 ? stageData[i - 1].count : null;
                const conv =
                  prevCount !== null && prevCount > 0
                    ? ((item.count / prevCount) * 100).toFixed(0)
                    : null;

                // Three lines inside each section
                const line1Y = cy - 14;
                const line2Y = cy + 4;
                const line3Y = cy + 20;

                const line2Parts: string[] = [];
                line2Parts.push(`${item.count} deal${item.count !== 1 ? "s" : ""}`);
                if (item.value > 0) line2Parts.push(formatCurrency(item.value));
                const line2 = line2Parts.join("  ·  ");

                const line3Parts: string[] = [];
                if (i === 0) line3Parts.push("Topo do funil");
                else if (conv !== null) line3Parts.push(`↓ ${conv}% da etapa anterior`);
                if (item.avgDaysSinceUpdate !== null)
                  line3Parts.push(`⌀ ${Math.round(item.avgDaysSinceUpdate)}d últ. mov.`);
                const line3 = line3Parts.join("   ");

                return (
                  <g key={item.stage}>
                    <polygon
                      points={`${tl},${y} ${tr},${y} ${br},${y + SECTION_H} ${bl},${y + SECTION_H}`}
                      fill={badge.color}
                    />
                    {/* Stage name */}
                    <text
                      x={cx}
                      y={line1Y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={tc}
                      fontSize="12.5"
                      fontWeight="700"
                      fontFamily="system-ui,-apple-system,sans-serif"
                      letterSpacing="0"
                    >
                      {item.stage}
                    </text>
                    {/* Count + value */}
                    <text
                      x={cx}
                      y={line2Y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={tc}
                      fontSize="11.5"
                      fontFamily="system-ui,-apple-system,sans-serif"
                      opacity="0.92"
                    >
                      {line2}
                    </text>
                    {/* Conversion + avg */}
                    {line3 && (
                      <text
                        x={cx}
                        y={line3Y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={tc}
                        fontSize="10"
                        fontFamily="system-ui,-apple-system,sans-serif"
                        opacity="0.72"
                      >
                        {line3}
                      </text>
                    )}
                    {/* Stale warning dot (top-right corner area) */}
                    {item.staleCount > 0 && (
                      <>
                        <circle cx={tr - 18} cy={y + 12} r="9" fill="#f59e0b" />
                        <text x={tr - 18} y={y + 12} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui,sans-serif">
                          {item.staleCount}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ── RIGHT PANEL: per-stage detail cards ── */}
        <div className="w-[270px] flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <h2 className="text-sm font-semibold text-foreground">Detalhe por Etapa</h2>
          {stageData.map((item, i) => {
            const badge = STAGE_BADGE_STYLES[item.stage];
            const prevCount = i > 0 ? stageData[i - 1].count : null;
            const convNum =
              prevCount !== null && prevCount > 0 ? (item.count / prevCount) * 100 : null;
            const overallPct = firstCount > 0 ? (item.count / firstCount) * 100 : 0;
            const isLast = item.stage === FINAL_STAGE;

            return (
              <div
                key={item.stage}
                className={`rounded-lg border p-3 ${
                  item.staleCount > 0 ? "border-amber-200 bg-amber-50/40" : "border-border bg-card"
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: badge.color }} />
                  <span className="text-xs font-semibold text-foreground truncate flex-1" title={item.stage}>
                    {item.stage}
                  </span>
                  <span className={`text-xs font-bold ${badge.text}`}>{item.count}</span>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {item.value > 0 && (
                    <MetricRow label="Valor" value={formatCurrency(item.value)} />
                  )}
                  <MetricRow
                    label="% do funil"
                    value={`${overallPct.toFixed(0)}%`}
                    highlight={false}
                  />
                  {convNum !== null && (
                    <MetricRow
                      label="Conversão"
                      value={`${convNum.toFixed(0)}%`}
                      highlight={convNum < 50 && !isLast}
                    />
                  )}
                  {item.avgDaysSinceUpdate !== null && (
                    <MetricRow
                      label="Últ. atividade"
                      value={`${Math.round(item.avgDaysSinceUpdate)}d`}
                      highlight={item.avgDaysSinceUpdate >= STALE_DEAL_DAYS}
                    />
                  )}
                  {item.avgAgeDays !== null && (
                    <MetricRow label="Idade média" value={`${Math.round(item.avgAgeDays)}d`} />
                  )}
                  {item.staleCount > 0 && (
                    <MetricRow label="Parados" value={item.staleCount.toString()} highlight />
                  )}
                </div>
              </div>
            );
          })}

          {/* Overall conversion summary */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 mt-1">
            <p className="text-xs text-muted-foreground mb-1">Conversão total (Lead → Go-Live)</p>
            <p className="text-xl font-bold text-emerald-600">{conversionRate.toFixed(1)}%</p>
            {totalValue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Valor total no pipeline: <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center ${color} flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  </div>
);

const MetricRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className={`text-xs font-semibold ${highlight ? "text-amber-600" : "text-foreground"}`}>{value}</p>
  </div>
);

export default FunnelView;
