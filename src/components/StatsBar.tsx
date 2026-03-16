import { Client } from "@/types/crm";
import { Users, TrendingUp, DollarSign, CheckCircle } from "lucide-react";

interface StatsBarProps {
  clients: Client[];
}

const StatsBar = ({ clients }: StatsBarProps) => {
  const totalClients = clients.length;
  const openDeals = clients.filter(
    (c) => c.dealStage !== "Fechado - Ganho" && c.dealStage !== "Fechado - Perdido"
  ).length;
  const closedWonThisMonth = clients.filter((c) => {
    if (c.dealStage !== "Fechado - Ganho") return false;
    const now = new Date();
    const created = new Date(c.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: "Total Clientes", value: totalClients.toString(), icon: Users },
    { label: "Deals Abertos", value: openDeals.toString(), icon: TrendingUp },
    { label: "Pipeline Total", value: `${totalClients} deals`, icon: DollarSign },
    { label: "Fechados Este Mês", value: closedWonThisMonth.toString(), icon: CheckCircle },
  ];

  return (
    <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-10">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          <stat.icon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
