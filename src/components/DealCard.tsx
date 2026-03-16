import { Client, STAGE_BADGE_STYLES } from "@/types/crm";
import { GripVertical } from "lucide-react";

interface DealCardProps {
  client: Client;
  onClick: () => void;
  onDragStart: () => void;
}

const DealCard = ({ client, onClick, onDragStart }: DealCardProps) => {
  const initials = client.clientName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badge = STAGE_BADGE_STYLES[client.dealStage];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-card rounded-[10px] p-4 cursor-pointer shadow-card hover:shadow-card-hover transition-shadow duration-150 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{client.clientName}</p>
            {client.projectName && (
              <p className="text-xs text-muted-foreground truncate">{client.projectName}</p>
            )}
          </div>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>

      {client.dealValue && (
        <p className="text-[13px] font-semibold text-primary mt-3">{client.dealValue}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {client.dealStage}
        </span>
        {client.meetingDate && (
          <p className="text-xs text-gray-400">
            {new Date(client.meetingDate).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  );
};

export default DealCard;
