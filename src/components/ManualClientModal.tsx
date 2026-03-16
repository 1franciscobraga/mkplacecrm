import { useState, useEffect } from "react";
import { Client, ExtractedData } from "@/types/crm";
import { X, Info } from "lucide-react";
import ClientFormFields from "./ClientFormFields";

interface ManualClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  prefilled?: ExtractedData | null;
  aiBanner?: boolean;
}

const emptyData: ExtractedData = {
  clientName: "",
  projectName: null,
  meetingDate: null,
  businessModel: null,
  contactName: null,
  contactRole: null,
  contactEmail: null,
  contactPhone: null,
  companyGroup: null,
  executiveSummary: null,
  painPointsAndChallenges: [],
  goalsAndExpectations: [],
  clientDifferentials: [],
  dealValue: null,
  revenueModel: null,
  clientTimeline: null,
  budgetMentioned: null,
  techStack: null,
  implementationComplexity: null,
  nextSteps: [],
  responsibleParties: null,
  nextContactDate: null,
  dealStage: "Prospecção",
  confidenceLevel: null,
  urgency: null,
  risk: null,
  expansionPotential: null,
  priceSensitivity: null,
};

const ManualClientModal = ({ open, onClose, onSave, prefilled, aiBanner }: ManualClientModalProps) => {
  const [data, setData] = useState<ExtractedData>(prefilled || emptyData);

  useEffect(() => {
    if (prefilled) setData(prefilled);
    else if (open) setData(emptyData);
  }, [prefilled, open]);

  const resetAndClose = () => {
    setData(emptyData);
    onClose();
  };

  const handleSave = () => {
    if (!data.clientName.trim()) return;
    const newClient: Client = {
      id: `client-${Date.now()}`,
      ...data,
      assignedTo: "Você",
      createdAt: new Date().toISOString(),
      meetings: data.meetingDate
        ? [{ id: `m-${Date.now()}`, date: data.meetingDate, summary: aiBanner ? "Reunião inicial (transcrição importada)" : "Reunião registrada" }]
        : [],
      notes: "",
    };
    onSave(newClient);
    setData(emptyData);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-50" onClick={resetAndClose} />
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[85vh] bg-card rounded-xl shadow-modal z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-base">
            {aiBanner ? "Revisar Dados Extraídos" : "Adicionar Cliente Manualmente"}
          </h2>
          <button onClick={resetAndClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aiBanner && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-5 text-sm text-blue-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Dados extraídos pela IA — revise e edite antes de salvar.</span>
            </div>
          )}

          <ClientFormFields data={data} onChange={setData} showSidebar={!!aiBanner} />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={resetAndClose}
            className="h-9 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!data.clientName.trim()}
            className="h-9 px-5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {aiBanner ? "Confirmar e Salvar" : "Salvar Cliente"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ManualClientModal;
