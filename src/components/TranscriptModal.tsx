import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Client, DealStage, DEAL_STAGES, ExtractedData } from "@/types/crm";
import { supabase } from "@/integrations/supabase/client";

interface TranscriptModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
}

const TERMINAL_LINES = [
  "[INIT] Conectando ao motor de IA...",
  "[PARSE] Analisando transcrição...",
  "[FOUND] clientName...",
  "[FOUND] dealValue...",
  "[FOUND] painPoints...",
  "[FOUND] goals...",
  "[FOUND] nextActions...",
  "[ANALYZE] Inferindo etapa do deal...",
  "[DONE] Extração completa.",
];

const TranscriptModal = ({ open, onClose, onSave }: TranscriptModalProps) => {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editData, setEditData] = useState<ExtractedData | null>(null);

  const simulateTerminal = async () => {
    setTerminalLines([]);
    for (let i = 0; i < TERMINAL_LINES.length; i++) {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
      setTerminalLines((prev) => [...prev, TERMINAL_LINES[i]]);
    }
  };

  const handleExtract = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setExtracted(null);
    setEditData(null);

    const terminalPromise = simulateTerminal();

    try {
      const { data, error } = await supabase.functions.invoke("extract-client", {
        body: { transcript },
      });

      await terminalPromise;

      if (error) throw error;

      const parsed: ExtractedData = data;
      setExtracted(parsed);
      setEditData(parsed);
    } catch (e) {
      console.error("Extraction error:", e);
      setTerminalLines((prev) => [...prev, `[ERROR] Falha na extração: ${e}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!editData) return;
    const newClient: Client = {
      id: `client-${Date.now()}`,
      ...editData,
      assignedTo: "Você",
      createdAt: new Date().toISOString(),
      meetings: editData.meetingDate
        ? [{ id: `m-${Date.now()}`, date: editData.meetingDate, summary: "Reunião inicial (transcrição importada)" }]
        : [],
      notes: "",
    };
    onSave(newClient);
    resetState();
    onClose();
  };

  const resetState = () => {
    setTranscript("");
    setLoading(false);
    setTerminalLines([]);
    setExtracted(null);
    setEditData(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const updateField = (field: keyof ExtractedData, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-card border border-border rounded-md z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-sans font-semibold text-sm tracking-display">
                  Novo Cliente via Transcrição
                </h2>
              </div>
              <button onClick={handleClose} className="p-1 hover:bg-secondary rounded-sm transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!extracted ? (
                <div className="space-y-4">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Cole sua transcrição de reunião aqui..."
                    className="w-full h-48 bg-background border border-border rounded-sm p-4 font-sans text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary transition-colors"
                    disabled={loading}
                  />

                  {terminalLines.length > 0 && (
                    <div className="bg-background border border-border rounded-sm p-4 font-data text-xs space-y-1 max-h-48 overflow-y-auto">
                      {terminalLines.map((line, i) => (
                        <p
                          key={i}
                          className={
                            line.includes("[ERROR]")
                              ? "text-destructive"
                              : line.includes("[FOUND]")
                              ? "text-primary"
                              : line.includes("[DONE]")
                              ? "text-emerald-400"
                              : "text-muted-foreground"
                          }
                        >
                          {line}
                        </p>
                      ))}
                      {loading && (
                        <span className="inline-block w-2 h-4 bg-primary animate-pulse-glow" />
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleExtract}
                    disabled={loading || !transcript.trim()}
                    className="w-full h-10 bg-primary text-primary-foreground font-sans font-medium text-sm rounded-sm hover:opacity-90 disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loading ? "Extraindo..." : "Extrair com IA"}
                  </button>
                </div>
              ) : (
                editData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Nome do Cliente" value={editData.clientName} onChange={(v) => updateField("clientName", v)} />
                      <FormField label="Projeto" value={editData.projectName || ""} onChange={(v) => updateField("projectName", v || null)} />
                      <FormField label="Contato" value={editData.contactPerson || ""} onChange={(v) => updateField("contactPerson", v || null)} />
                      <FormField label="Data da Reunião" value={editData.meetingDate || ""} onChange={(v) => updateField("meetingDate", v || null)} type="date" />
                      <FormField label="Valor do Deal" value={editData.dealValue || ""} onChange={(v) => updateField("dealValue", v || null)} />
                      <div>
                        <label className="font-data text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Etapa</label>
                        <select
                          value={editData.dealStage}
                          onChange={(e) => updateField("dealStage", e.target.value as DealStage)}
                          className="w-full h-9 px-3 bg-background border border-border rounded-sm font-sans text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        >
                          {DEAL_STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <ArrayField label="Dores" items={editData.painPoints} onChange={(v) => updateField("painPoints", v)} />
                    <ArrayField label="Objetivos" items={editData.goals} onChange={(v) => updateField("goals", v)} />
                    <ArrayField label="Expectativas" items={editData.expectations} onChange={(v) => updateField("expectations", v)} />
                    <ArrayField label="Próximas Ações" items={editData.nextActions} onChange={(v) => updateField("nextActions", v)} />
                    <ArrayField label="Diferenciais" items={editData.differentials} onChange={(v) => updateField("differentials", v)} />

                    <FormField label="Notas Técnicas" value={editData.technicalNotes || ""} onChange={(v) => updateField("technicalNotes", v || null)} multiline />
                    <FormField label="Outras Informações" value={editData.otherRelevantInfo || ""} onChange={(v) => updateField("otherRelevantInfo", v || null)} multiline />

                    <button
                      onClick={handleConfirm}
                      className="w-full h-10 bg-primary text-primary-foreground font-sans font-medium text-sm rounded-sm hover:opacity-90 transition-all duration-150"
                    >
                      Confirmar e Salvar Cliente
                    </button>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) => (
  <div>
    <label className="font-data text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-20 bg-background border border-border rounded-sm p-3 font-sans text-sm text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 bg-background border border-border rounded-sm font-sans text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
      />
    )}
  </div>
);

const ArrayField = ({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) => (
  <div>
    <label className="font-data text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">{label}</label>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 h-8 px-3 bg-background border border-border rounded-sm font-sans text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="px-2 h-8 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="text-xs text-primary hover:text-primary/80 transition-colors font-data"
      >
        + Adicionar
      </button>
    </div>
  </div>
);

export default TranscriptModal;
