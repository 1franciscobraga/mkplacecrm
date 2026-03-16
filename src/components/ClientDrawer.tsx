import { Client, STAGE_BADGE_STYLES, DEAL_STAGES, DealStage } from "@/types/crm";
import { X, Calendar, Target, AlertTriangle, Zap, FileText, RotateCcw, Building2, User, Mail, Phone, DollarSign, Clock, Cpu } from "lucide-react";

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
              {client.businessModel && <p className="text-xs text-muted-foreground mt-0.5">{client.businessModel}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <InfoBox label="Etapa">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {client.dealStage}
              </span>
            </InfoBox>
            <InfoBox label="Valor"><span className="text-sm font-semibold text-primary">{client.dealValue || "—"}</span></InfoBox>
            <InfoBox label="Contato"><span className="text-sm text-foreground">{client.contactName || "—"}</span></InfoBox>
            <InfoBox label="Última Reunião">
              <span className="text-sm text-foreground">{client.meetingDate ? new Date(client.meetingDate).toLocaleDateString("pt-BR") : "—"}</span>
            </InfoBox>
          </div>

          {/* Contact Details */}
          {(client.contactRole || client.contactEmail || client.contactPhone || client.companyGroup) && (
            <div className="mb-5 space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Contato</h4>
              {client.contactRole && <DetailRow icon={User} text={client.contactRole} />}
              {client.contactEmail && <DetailRow icon={Mail} text={client.contactEmail} />}
              {client.contactPhone && <DetailRow icon={Phone} text={client.contactPhone} />}
              {client.companyGroup && <DetailRow icon={Building2} text={client.companyGroup} />}
            </div>
          )}

          {/* Executive Summary */}
          {client.executiveSummary && (
            <div className="mb-5">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Resumo Executivo</h4>
              <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{client.executiveSummary}</p>
            </div>
          )}

          <Section icon={AlertTriangle} title="Dores & Desafios" items={client.painPointsAndChallenges} />
          <Section icon={Target} title="Objetivos & Expectativas" items={client.goalsAndExpectations} />
          <Section icon={Zap} title="Diferenciais do Cliente" items={client.clientDifferentials} />

          {/* Financial */}
          {(client.revenueModel || client.clientTimeline || client.budgetMentioned) && (
            <div className="mb-5 space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Financeiro & Negócio</h4>
              {client.revenueModel && <DetailRow icon={DollarSign} text={`Modelo: ${client.revenueModel}`} />}
              {client.clientTimeline && <DetailRow icon={Clock} text={`Prazo: ${client.clientTimeline}`} />}
              {client.budgetMentioned && <DetailRow icon={DollarSign} text={`Orçamento: ${client.budgetMentioned}`} />}
            </div>
          )}

          {/* Tech */}
          {client.techStack && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                <h4 className="text-xs font-medium text-muted-foreground">Stack Técnica</h4>
              </div>
              <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{client.techStack}</p>
            </div>
          )}

          <Section icon={Calendar} title="Próximos Passos" items={client.nextSteps} />

          {client.responsibleParties && (
            <div className="mb-5">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Responsáveis</h4>
              <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{client.responsibleParties}</p>
            </div>
          )}

          {/* Sidebar Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {client.confidenceLevel != null && <MetricPill label="Confiança" value={`${client.confidenceLevel}%`} />}
            {client.urgency && <MetricPill label="Urgência" value={client.urgency} />}
            {client.risk && <MetricPill label="Risco" value={client.risk} />}
            {client.expansionPotential && <MetricPill label="Expansão" value={client.expansionPotential} />}
            {client.priceSensitivity && <MetricPill label="Sens. Preço" value={client.priceSensitivity} />}
            {client.implementationComplexity && <MetricPill label="Complexidade" value={client.implementationComplexity} />}
          </div>

          {/* Meetings Timeline */}
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

          {/* Notes */}
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

const DetailRow = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-center gap-2 text-sm text-foreground">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    {text}
  </div>
);

const MetricPill = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-secondary rounded-lg p-2 text-center">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-xs font-semibold text-foreground">{value}</p>
  </div>
);

export default ClientDrawer;
