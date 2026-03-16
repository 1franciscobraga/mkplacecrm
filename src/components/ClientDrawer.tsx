import { Client, STAGE_BADGE_STYLES, DEAL_STAGES, DealStage } from "@/types/crm";
import { X, Calendar, Target, AlertTriangle, Zap, FileText, RotateCcw } from "lucide-react";

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
  onUpdate: (client: Client) => void;
}

const ClientDrawer = ({ client, onClose, onUpdate }: ClientDrawerProps) => {
  if (!client) return null;

  const badge = STAGE_BADGE_STYLES[client.dealStage];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto shadow-modal animate-in slide-in-from-right duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg text-foreground">{client.clientName}</h2>
              {client.projectName && <p className="text-sm text-muted-foreground">{client.projectName}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoBox label="Etapa">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {client.dealStage}
              </span>
            </InfoBox>
            <InfoBox label="Valor"><span className="text-sm font-semibold text-primary">{client.dealValue || "—"}</span></InfoBox>
            <InfoBox label="Contato"><span className="text-sm text-foreground">{client.contactPerson || "—"}</span></InfoBox>
            <InfoBox label="Última Reunião">
              <span className="text-sm text-foreground">{client.meetingDate ? new Date(client.meetingDate).toLocaleDateString("pt-BR") : "—"}</span>
            </InfoBox>
          </div>

          <Section icon={AlertTriangle} title="Dores" items={client.painPoints} />
          <Section icon={Target} title="Objetivos" items={client.goals} />
          <Section icon={Zap} title="Expectativas" items={client.expectations} />
          <Section icon={Calendar} title="Próximas Ações" items={client.nextActions} />
          <Section icon={FileText} title="Diferenciais" items={client.differentials} />

          {client.technicalNotes && (
            <div className="mb-5">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Notas Técnicas</h4>
              <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{client.technicalNotes}</p>
            </div>
          )}

          {client.otherRelevantInfo && (
            <div className="mb-5">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Informações Adicionais</h4>
              <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{client.otherRelevantInfo}</p>
            </div>
          )}

          <div className="mb-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Timeline de Reuniões</h4>
            <div className="space-y-2">
              {client.meetings.map((m) => (
                <div key={m.id} className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString("pt-BR")}</p>
                  <p className="text-sm text-foreground mt-1">{m.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Notas</h4>
            <textarea
              value={client.notes}
              onChange={(e) => onUpdate({ ...client, notes: e.target.value })}
              placeholder="Adicione suas notas aqui..."
              className="w-full h-24 bg-card border border-border rounded-lg p-3 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:shadow-input-focus transition-all"
            />
          </div>

          <button className="w-full h-9 flex items-center justify-center gap-2 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Re-analisar transcrição
          </button>
        </div>
      </div>
    </>
  );
};

const InfoBox = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="bg-secondary rounded-lg p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    {children}
  </div>
);

const Section = ({ icon: Icon, title, items }: { icon: React.ElementType; title: string; items: string[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground flex gap-2">
            <span className="text-primary mt-1.5 text-[6px]">●</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientDrawer;
