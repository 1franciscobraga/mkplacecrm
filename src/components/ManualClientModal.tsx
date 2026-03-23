import { useState, useEffect } from "react";
import { Client, ExtractedData } from "@/types/crm";
import { X, Info } from "lucide-react";
import ClientFormFields from "./ClientFormFields";
import {
  EMPTY_EXTRACTED_DATA,
  buildClientFromFormData,
  normalizeExtractedData,
} from "@/lib/clientData";

interface ManualClientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  prefilled?: ExtractedData | null;
  aiBanner?: boolean;
}

const ManualClientModal = ({ open, onClose, onSave, prefilled, aiBanner }: ManualClientModalProps) => {
  const [data, setData] = useState<ExtractedData>(() =>
    normalizeExtractedData(prefilled ?? EMPTY_EXTRACTED_DATA),
  );
  const [clientNameError, setClientNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setData(normalizeExtractedData(prefilled ?? EMPTY_EXTRACTED_DATA));
    setClientNameError(null);
  }, [prefilled, open]);

  const resetAndClose = () => {
    setData(EMPTY_EXTRACTED_DATA);
    setClientNameError(null);
    onClose();
  };

  const handleSave = () => {
    const formState = normalizeExtractedData(data);

    if (!formState.clientName.trim()) {
      setClientNameError("Client Name is required to save.");
      return;
    }

    const newClient: Client = buildClientFromFormData(formState, {
      meetingSummary: aiBanner ? "Initial meeting (transcript imported)" : "Meeting registered",
      notes: "",
      assignedTo: "You",
    });

    console.log("Saving client object:", JSON.stringify(newClient, null, 2));

    onSave(newClient);
    setData(EMPTY_EXTRACTED_DATA);
    setClientNameError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-50" onClick={resetAndClose} />
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[85vh] bg-card rounded-xl shadow-modal z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-base">
            {aiBanner ? "Review Extracted Data" : "Add Client Manually"}
          </h2>
          <button onClick={resetAndClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aiBanner && (
            <div className="flex items-start gap-2 p-3 bg-secondary border border-border rounded-lg mb-5 text-sm text-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Data extracted by AI — review and edit before saving.</span>
            </div>
          )}

          <ClientFormFields
            data={data}
            onChange={(nextData) => {
              const normalized = normalizeExtractedData(nextData);
              setData(normalized);
              if (clientNameError && normalized.clientName.trim()) setClientNameError(null);
            }}
            showSidebar={!!aiBanner}
            clientNameError={clientNameError}
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={resetAndClose}
            className="h-9 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-9 px-5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all"
          >
            {aiBanner ? "Confirm & Save" : "Save Client"}
          </button>
        </div>
      </div>
    </>
  );
};

export default ManualClientModal;
