import { useState, DragEvent } from "react";
import { Client, DEAL_STAGES, DealStage, STAGE_BADGE_STYLES } from "@/types/crm";
import DealCard from "./DealCard";
import { Inbox } from "lucide-react";

interface PipelineBoardProps {
  clients: Client[];
  onStageChange: (clientId: string, newStage: DealStage) => void;
  onClientClick: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

const PipelineBoard = ({ clients, onStageChange, onClientClick, onEdit, onDelete }: PipelineBoardProps) => {
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
        const badge = STAGE_BADGE_STYLES[stage];

        return (
          <div
            key={stage}
            className={`min-w-[300px] w-[300px] flex-shrink-0 flex flex-col rounded-xl transition-colors duration-150 ${
              isOver ? "bg-blue-50/60" : "bg-secondary"
            }`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            onDragLeave={handleDragLeave}
          >
            <div className="px-4 py-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              <h3 className="font-medium text-sm text-foreground">{stage}</h3>
              <span className="text-xs text-muted-foreground ml-auto bg-card rounded-full px-2 py-0.5">
                {stageClients.length}
              </span>
            </div>
            <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {stageClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Inbox className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs text-center leading-relaxed">
                    Nenhum card nesta etapa.
                    <br />
                    Adicione um novo cliente.
                  </p>
                </div>
              ) : (
                stageClients.map((client) => (
                  <DealCard
                    key={client.id}
                    client={client}
                    onClick={() => onClientClick(client)}
                    onDragStart={() => setDraggedClientId(client.id)}
                    onEdit={() => onEdit(client)}
                    onDelete={() => onDelete(client)}
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
