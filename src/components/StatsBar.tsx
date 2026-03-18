import { Client, FINAL_STAGE, STALE_DEAL_DAYS } from "@/types/crm";
import { Users, TrendingUp, DollarSign, CheckCircle } from "lucide-react";

interface StatsBarProps {
  clients: Client[];
}

const StatsBar = ({ clients }: StatsBarProps) => {
  const totalClients = clients.length;
  const openDeals = clients.filter((c) => c.dealStage !== FINAL_STAGE).length;
  const closedWonThisMonth = clients.filter((c) => {
    if (c.dealStage !== FINAL_STAGE) return false;
    const now = new Date();
    const updated = new Date(c.updatedAt);
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
  }).length;
  const staleDeals = clients.filter((c) => {
    if (c.dealStage === FINAL_STAGE) return false;
    const daysSince = (Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= STALE_DEAL_DAYS;
  }).length;

  const stats = [
    { label: "Total Clientes", value: totalClients.toString(), icon: Users },
    { label: "Deals Abertos", value: openDeals.toString(), icon: TrendingUp },
    { label: "Go-Live Este Mês", value: closedWonThisMonth.toString(), icon: CheckCircle },
    { label: "Deals Parados", value: staleDeals.toString(), icon: DollarSign, warn: staleDeals > 0 },
  ];

  return (
    <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-10">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          <stat.icon className={`w-4 h-4 ${stat.warn ? "text-amber-500" : "text-muted-foreground"}`} />
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.warn ? "text-amber-500" : "text-foreground"}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
