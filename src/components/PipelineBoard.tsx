import { useState, DragEvent } from "react";
import { Client, DEAL_STAGES, DealStage, STAGE_DOT_COLORS } from "@/types/crm";
import DealCard from "./DealCard";
import { Inbox } from "lucide-react";

interface PipelineBoardProps {
  clients: Client[];
  onStageChange: (clientId: string, newStage: DealStage) => void;
  onClientClick: (client: Client) => void;
}

const PipelineBoard = ({ clients, onStageChange, onClientClick }: PipelineBoardProps) => {
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const handleDragOver = (e: DragEvent, stage: DealStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDrop = (e: DragEvent, stage: DealStage) => {
    e.preventDefault();
    if (draggedClientId) {
      onStageChange(draggedClientId, stage);
    }
    setDraggedClientId(null);
    setDragOverStage(null);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto p-6 flex-1">
      {DEAL_STAGES.map((stage) => {
        const stageClients = clients.filter((c) => c.dealStage === stage);
        const isOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            className={`min-w-[300px] w-[300px] flex-shrink-0 flex flex-col rounded-md border transition-colors duration-150 ${
              isOver ? "border-primary/50 bg-teal-50" : "border-border bg-background"
            }`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            onDragLeave={handleDragLeave}
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${STAGE_DOT_COLORS[stage]}`} />
              <h3 className="font-sans font-medium text-xs uppercase tracking-wider text-foreground">
                {stage}
              </h3>
              <span className="font-data text-[10px] text-muted-foreground ml-auto">
                {stageClients.length}
              </span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {stageClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Inbox className="w-6 h-6 mb-2 opacity-40" />
                  <p className="text-xs text-center">
                    Nenhum card nesta etapa.
                    <br />
                    Inicie uma extração via IA.
                  </p>
                </div>
              ) : (
                stageClients.map((client) => (
                  <DealCard
                    key={client.id}
                    client={client}
                    onClick={() => onClientClick(client)}
                    onDragStart={() => setDraggedClientId(client.id)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineBoard;
