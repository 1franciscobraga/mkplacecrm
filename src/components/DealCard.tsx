import { motion } from "framer-motion";
import { Client, STAGE_DOT_COLORS } from "@/types/crm";
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

  return (
    <motion.div
      layout
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      whileHover={{
        scale: 1.01,
        borderColor: "rgba(0, 212, 170, 0.5)",
        boxShadow: "0 0 15px rgba(0, 212, 170, 0.1)",
      }}
      transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      className="bg-card border border-border rounded-md p-4 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-secondary flex items-center justify-center flex-shrink-0">
            <span className="font-data text-xs font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="font-sans font-medium text-sm text-foreground truncate">
              {client.clientName}
            </p>
            {client.projectName && (
              <p className="font-sans text-xs text-muted-foreground truncate">
                ({client.projectName})
              </p>
            )}
          </div>
        </div>
        <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>

      {client.dealValue && (
        <p className="font-data text-xs text-primary mt-3">{client.dealValue}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        {client.meetingDate && (
          <p className="font-data text-[10px] text-muted-foreground">
            {new Date(client.meetingDate).toLocaleDateString("pt-BR")}
          </p>
        )}
        <span
          className={`inline-block w-2 h-2 rounded-full ${STAGE_DOT_COLORS[client.dealStage]}`}
        />
      </div>

      {client.painPoints.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 truncate">
          {client.painPoints[0]}
        </p>
      )}
    </motion.div>
  );
};

export default DealCard;
