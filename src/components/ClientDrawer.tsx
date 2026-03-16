import { Client, STAGE_COLORS, DEAL_STAGES } from "@/types/crm";
import { X, Calendar, Target, AlertTriangle, Zap, FileText, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
  onUpdate: (client: Client) => void;
}

const ClientDrawer = ({ client, onClose, onUpdate }: ClientDrawerProps) => {
  if (!client) return null;

  const handleNotesChange = (notes: string) => {
    onUpdate({ ...client, notes });
  };

  return (
    <AnimatePresence>
      {client && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-sans font-semibold text-lg text-foreground tracking-display">
                    {client.clientName}
                  </h2>
                  {client.projectName && (
                    <p className="text-sm text-muted-foreground">{client.projectName}</p>
                  )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-secondary rounded-sm transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary/50 rounded-sm p-3 border border-border">
                  <p className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Etapa</p>
                  <p className={`font-data text-sm font-bold ${STAGE_COLORS[client.dealStage]}`}>{client.dealStage}</p>
                </div>
                <div className="bg-secondary/50 rounded-sm p-3 border border-border">
                  <p className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Valor</p>
                  <p className="font-data text-sm font-bold text-primary">{client.dealValue || "—"}</p>
                </div>
                <div className="bg-secondary/50 rounded-sm p-3 border border-border">
                  <p className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Contato</p>
                  <p className="text-sm text-foreground">{client.contactPerson || "—"}</p>
                </div>
                <div className="bg-secondary/50 rounded-sm p-3 border border-border">
                  <p className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Última Reunião</p>
                  <p className="font-data text-sm text-foreground">
                    {client.meetingDate ? new Date(client.meetingDate).toLocaleDateString("pt-BR") : "—"}
                  </p>
                </div>
              </div>

              <Section icon={AlertTriangle} title="Dores" items={client.painPoints} />
              <Section icon={Target} title="Objetivos" items={client.goals} />
              <Section icon={Zap} title="Expectativas" items={client.expectations} />
              <Section icon={Calendar} title="Próximas Ações" items={client.nextActions} />
              <Section icon={FileText} title="Diferenciais" items={client.differentials} />

              {client.technicalNotes && (
                <div className="mb-5">
                  <h4 className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Notas Técnicas
                  </h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 border border-border rounded-sm p-3">
                    {client.technicalNotes}
                  </p>
                </div>
              )}

              {client.otherRelevantInfo && (
                <div className="mb-5">
                  <h4 className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Informações Adicionais
                  </h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 border border-border rounded-sm p-3">
                    {client.otherRelevantInfo}
                  </p>
                </div>
              )}

              <div className="mb-5">
                <h4 className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Timeline de Reuniões
                </h4>
                <div className="space-y-2">
                  {client.meetings.map((m) => (
                    <div key={m.id} className="bg-secondary/50 border border-border rounded-sm p-3">
                      <p className="font-data text-[10px] text-muted-foreground">
                        {new Date(m.date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-foreground mt-1">{m.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <h4 className="font-data text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Notas
                </h4>
                <textarea
                  value={client.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Adicione suas notas aqui..."
                  className="w-full h-24 bg-secondary/50 border border-border rounded-sm p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button className="w-full h-9 flex items-center justify-center gap-2 bg-secondary border border-border rounded-sm text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors duration-150">
                <RotateCcw className="w-3 h-3" />
                Re-analisar transcrição
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Section = ({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <h4 className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground pl-5 relative before:content-['•'] before:absolute before:left-1 before:text-primary before:text-xs">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientDrawer;
