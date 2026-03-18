import { Client, DEAL_STAGES, STAGE_BADGE_STYLES, FINAL_STAGE, STALE_DEAL_DAYS } from "@/types/crm";
import { TrendingDown, Clock, DollarSign, Users, ArrowRight } from "lucide-react";

interface FunnelViewProps {
  clients: Client[];
}

// Try to parse a monetary value string into a number for aggregation
const parseValue = (val: string | null): number => {
  if (!val) return 0;
  // Extract first number-like pattern (e.g. "R$ 300k" → 300000)
  const match = val.replace(/\./g, "").match(/([\d,]+)\s*([kKmM]?)/);
  if (!match) return 0;
  const num = parseFloat(match[1].replace(",", "."));
  const mult = match[2]?.toLowerCase() === "k" ? 1000 : match[2]?.toLowerCase() === "m" ? 1000000 : 1;
  return isNaN(num) ? 0 : num * mult;
};

const formatCurrency = (val: number): string => {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}k`;
  return `R$ ${val.toFixed(0)}`;
};

const FunnelView = ({ clients }: FunnelViewProps) => {
  // Active stages only (exclude final stage from funnel drop-off calc)
  const stageData = DEAL_STAGES.map((stage) => {
    const stageClients = clients.filter((c) => c.dealStage === stage);
    const totalValue = stageClients.reduce((sum, c) => sum + parseValue(c.dealValue), 0);
    const staleCount = stageClients.filter((c) => {
      const days = (Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return days >= STALE_DEAL_DAYS;
    }).length;
    return { stage, count: stageClients.length, value: totalValue, stale: staleCount };
  });

  const maxCount = Math.max(...stageData.map((s) => s.count), 1);
  const totalDeals = clients.length;
  const finalStageData = stageData.find((s) => s.stage === FINAL_STAGE);
  const conversionRate = totalDeals > 0 ? ((finalStageData?.count ?? 0) / totalDeals) * 100 : 0;
  const totalValue = stageData.reduce((sum, s) => sum + s.value, 0);
  const staleTotal = stageData.reduce((sum, s) => sum + s.stale, 0);

  return (
    <div className="flex flex-col gap-6 p-6 flex-1 overflow-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          label="Total no Funil"
          value={totalDeals.toString()}
          icon={<Users className="w-4 h-4" />}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <SummaryCard
          label="Valor Estimado"
          value={totalValue > 0 ? formatCurrency(totalValue) : "—"}
          icon={<DollarSign className="w-4 h-4" />}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <SummaryCard
          label="Taxa de Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          icon={<TrendingDown className="w-4 h-4" />}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <SummaryCard
          label="Deals Parados"
          value={staleTotal.toString()}
          icon={<Clock className="w-4 h-4" />}
          color={staleTotal > 0 ? "text-amber-600" : "text-muted-foreground"}
          bg={staleTotal > 0 ? "bg-amber-50" : "bg-secondary"}
        />
      </div>

      {/* Funnel */}
      <div className="bg-card rounded-xl border border-border p-6 flex-1">
        <h2 className="text-base font-semibold text-foreground mb-6">Funil de Vendas</h2>

        {/* Column headers */}
        <div className="grid grid-cols-[180px_1fr_80px_80px_90px] gap-3 mb-2 px-2">
          <span className="text-xs text-muted-foreground font-medium">Etapa</span>
          <span className="text-xs text-muted-foreground font-medium">Volume</span>
          <span className="text-xs text-muted-foreground font-medium text-right">Deals</span>
          <span className="text-xs text-muted-foreground font-medium text-right">Valor</span>
          <span className="text-xs text-muted-foreground font-medium text-right">Conversão</span>
        </div>

        <div className="space-y-2">
          {stageData.map((item, index) => {
            const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            // Conversion from previous stage
            const prevCount = index > 0 ? stageData[index - 1].count : item.count;
            const convFromPrev = prevCount > 0 ? (item.count / prevCount) * 100 : 0;
            const badge = STAGE_BADGE_STYLES[item.stage];

            return (
              <div key={item.stage} className="flex flex-col gap-1">
                <div className="grid grid-cols-[180px_1fr_80px_80px_90px] gap-3 items-center">
                  {/* Stage name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${badge.dot}`} />
                    <span className="text-sm text-foreground font-medium truncate" title={item.stage}>
                      {item.stage}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative h-8 bg-secondary rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                      style={{
                        width: `${Math.max(barWidth, item.count > 0 ? 4 : 0)}%`,
                        backgroundColor: badge.color,
                        opacity: 0.85,
                      }}
                    />
                    {item.stale > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-amber-600 text-[11px] font-medium">
                        <Clock className="w-3 h-3" />
                        {item.stale} parado{item.stale > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Count */}
                  <span className="text-sm font-semibold text-foreground text-right">
                    {item.count}
                  </span>

                  {/* Value */}
                  <span className="text-sm text-muted-foreground text-right">
                    {item.value > 0 ? formatCurrency(item.value) : "—"}
                  </span>

                  {/* Conversion from previous */}
                  <span className={`text-sm font-medium text-right ${index === 0 ? "text-muted-foreground" : convFromPrev < 50 ? "text-red-500" : "text-emerald-600"}`}>
                    {index === 0 ? "—" : `${convFromPrev.toFixed(0)}%`}
                  </span>
                </div>

                {/* Arrow connector */}
                {index < stageData.length - 1 && (
                  <div className="flex items-center pl-[188px] text-muted-foreground/40">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="mt-6 pt-4 border-t border-border flex items-center gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Taxa de conversão total</p>
            <p className="text-lg font-bold text-emerald-600">{conversionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deals em Go-Live</p>
            <p className="text-lg font-bold text-foreground">{finalStageData?.count ?? 0}</p>
          </div>
          {totalValue > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Valor total no funil</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</p>
            </div>
          )}
          {staleTotal > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Deals parados (+{STALE_DEAL_DAYS}d)</p>
              <p className="text-lg font-bold text-amber-500">{staleTotal}</p>
            </div>
          )}
        </div>
      </div>

      {/* Per-stage breakdown */}
      <div className="grid grid-cols-4 gap-4">
        {stageData.filter((s) => s.count > 0).map((item) => {
          const badge = STAGE_BADGE_STYLES[item.stage];
          return (
            <div key={item.stage} className={`rounded-xl border p-4 ${item.stale > 0 ? "border-amber-200 bg-amber-50/30" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                <span className="text-xs font-medium text-muted-foreground truncate">{item.stage}</span>
              </div>
              <p className={`text-2xl font-bold ${badge.text}`}>{item.count}</p>
              {item.value > 0 && <p className="text-xs text-muted-foreground mt-1">{formatCurrency(item.value)}</p>}
              {item.stale > 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.stale} parado{item.stale > 1 ? "s" : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

export default FunnelView;
