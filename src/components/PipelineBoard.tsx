import { useState, useMemo, useCallback, DragEvent } from "react";
import { Client, DEAL_STAGES, DealStage, STAGE_BADGE_STYLES } from "@/types/crm";
import DealCard from "./DealCard";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { computeDealProbability, probabilityBg, probabilityColor } from "@/lib/dealProbability";
import { Inbox, Building2, User, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import React from "react";

interface PipelineBoardProps {
  clients: Client[];
  onStageChange: (clientId: string, newStage: DealStage) => void;
  onClientClick: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function CompanyHoverCard({ client, onClientClick }: { client: Client; onClientClick: (c: Client) => void }) {
  const prob = computeDealProbability(client);

  const MiniBar = ({ value, color }: { value: number; color: string }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">{value}%</span>
    </div>
  );

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          onClick={() => onClientClick(client)}
          className="w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md hover:bg-card transition-colors text-left"
        >
          <span className="text-xs text-foreground truncate font-medium">{client.clientName}</span>
          <span className={`text-[10px] font-bold tabular-nums flex-shrink-0 ${probabilityColor(prob.overall)}`}>
            {prob.overall}%
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-4" side="right" align="start">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-foreground">{client.clientName}</p>
              {client.projectName && (
                <p className="text-xs text-muted-foreground">{client.projectName}</p>
              )}
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${probabilityBg(prob.overall)}`}>
              {prob.overall}% fechamento
            </span>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          {client.contactName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {client.contactName}{client.contactRole ? ` · ${client.contactRole}` : ""}
              </span>
            </div>
          )}
          {client.businessModel && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{client.businessModel}</span>
            </div>
          )}
          {client.dealValue && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              <span>{client.dealValue}</span>
            </div>
          )}
        </div>

        {(client.urgency || client.risk) && (
          <div className="flex items-center gap-2 mb-3">
            {client.urgency && (
              <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                client.urgency === "Alta" ? "bg-amber-50 text-amber-700" :
                client.urgency === "Média" ? "bg-blue-50 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                <Zap className="w-2.5 h-2.5" />
                {client.urgency}
              </span>
            )}
            {client.risk && (
              <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                client.risk === "Alta" ? "bg-red-50 text-red-700" :
                client.risk === "Média" ? "bg-amber-50 text-amber-700" :
                "bg-emerald-50 text-emerald-700"
              }`}>
                <AlertTriangle className="w-2.5 h-2.5" />
                Risco {client.risk}
              </span>
            )}
          </div>
        )}

        <div className="border-t border-border pt-3 space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Probabilidade de fechamento</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-20 flex-shrink-0">Mkplace fit</span>
              <MiniBar value={prob.mkplace} color="bg-violet-400" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-20 flex-shrink-0">Cliente</span>
              <MiniBar value={prob.client} color="bg-blue-400" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-20 flex-shrink-0">Transcrição</span>
              <MiniBar value={prob.transcript} color="bg-amber-400" />
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

const MemoizedDealCard = React.memo(DealCard);

const PipelineBoard = ({ clients, onStageChange, onClientClick, onEdit, onDelete }: PipelineBoardProps) => {
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  const stageGroups = useMemo(() => {
    return DEAL_STAGES.map((stage) => {
      const stageClients = clients.filter((c) => c.dealStage === stage);
      const top5 = [...stageClients]
        .sort((a, b) => computeDealProbability(b).overall - computeDealProbability(a).overall)
        .slice(0, 5);
      return { stage, stageClients, top5 };
    });
  }, [clients]);

  const handleDragOver = useCallback((e: DragEvent, stage: DealStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  }, []);

  const handleDrop = useCallback((e: DragEvent, stage: DealStage) => {
    e.preventDefault();
    if (draggedClientId) {
      onStageChange(draggedClientId, stage);
    }
    setDraggedClientId(null);
    setDragOverStage(null);
  }, [draggedClientId, onStageChange]);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto p-6 flex-1 min-w-0">
      {stageGroups.map(({ stage, stageClients, top5 }) => {
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

            {top5.length > 0 && (
              <div className="px-3 pb-2">
                <div className="bg-card/70 rounded-lg px-2 pt-2 pb-1">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold px-1 mb-1">
                    Top {top5.length}
                  </p>
                  {top5.map((client) => (
                    <CompanyHoverCard
                      key={client.id}
                      client={client}
                      onClientClick={onClientClick}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto max-h-[calc(100vh-380px)]">
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
                  <MemoizedDealCard
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
