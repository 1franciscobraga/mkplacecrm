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
    { label: "TOTAL CLIENTES", value: totalClients.toString(), icon: Users },
    { label: "DEALS ABERTOS", value: openDeals.toString(), icon: TrendingUp },
    { label: "PIPELINE TOTAL", value: `${totalClients} deals`, icon: DollarSign },
    { label: "FECHADOS ESTE MÊS", value: closedWonThisMonth.toString(), icon: CheckCircle },
  ];

  return (
    <div className="border-b border-border px-6 py-3 flex items-center gap-8">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          <stat.icon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p className="font-data text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
