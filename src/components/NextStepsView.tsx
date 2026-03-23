import { Client } from "@/types/crm";
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Building2, ChevronRight } from "lucide-react";
import { stageLabel } from "@/lib/i18n";

interface NextStepsViewProps {
  clients: Client[];
  onClientClick: (client: Client) => void;
}

type StepStatus = "on_track" | "approaching" | "overdue" | "no_deadline";

const getStatus = (deadline: string | null): StepStatus => {
  if (!deadline) return "no_deadline";
  const now = new Date();
  const due = new Date(deadline);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "approaching";
  return "on_track";
};

const statusConfig: Record<StepStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  on_track: { label: "On Track", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  approaching: { label: "Due Soon", bg: "bg-amber-50", text: "text-amber-700", icon: AlertTriangle },
  overdue: { label: "Overdue", bg: "bg-red-50", text: "text-red-700", icon: AlertCircle },
  no_deadline: { label: "No Deadline", bg: "bg-gray-50", text: "text-gray-500", icon: Clock },
};

const STAGE_DOT_COLORS: Record<string, string> = {
  "Lead demonstrou interesse": "bg-gray-400",
  "Reunião Introdução": "bg-blue-400",
  "Escopo do projeto": "bg-cyan-500",
  "Proposta comercial": "bg-violet-400",
  "Contrato": "bg-amber-400",
  "Assinatura": "bg-orange-400",
  "Go-Live e Implantação": "bg-emerald-400",
};

const NextStepsView = ({ clients, onClientClick }: NextStepsViewProps) => {
  const clientsWithSteps = clients
    .filter((c) => c.nextSteps && c.nextSteps.length > 0 && c.nextSteps.some((s) => s.trim() !== ""))
    .sort((a, b) => {
      const statusA = getStatus(a.nextContactDate);
      const statusB = getStatus(b.nextContactDate);
      const priority: Record<StepStatus, number> = { overdue: 0, approaching: 1, on_track: 2, no_deadline: 3 };
      return priority[statusA] - priority[statusB];
    });

  if (clientsWithSteps.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No next steps registered</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add next steps in each client's details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        {clientsWithSteps.map((client) => {
          const status = getStatus(client.nextContactDate);
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const dotColor = STAGE_DOT_COLORS[client.dealStage] || "bg-gray-400";

          return (
            <button
              key={client.id}
              onClick={() => onClientClick(client)}
              className="w-full bg-card rounded-[10px] shadow-sm border border-border p-4 hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{client.clientName}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span className="text-xs text-muted-foreground">{stageLabel(client.dealStage)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-11 space-y-1">
                    {client.nextSteps.filter((s) => s.trim()).map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-foreground/80 leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>

                  {client.nextContactDate && (
                    <p className="ml-11 mt-2 text-xs text-muted-foreground">
                      Deadline: {new Date(client.nextContactDate).toLocaleDateString("en-US")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.text}`} />
                    <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NextStepsView;
