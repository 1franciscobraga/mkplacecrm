import { useState, useRef, useEffect } from "react";
import { Client, STAGE_BADGE_STYLES } from "@/types/crm";
import { GripVertical, MoreVertical, Pencil, Trash2, AlertCircle } from "lucide-react";
import { computeDealProbability, probabilityBg } from "@/lib/dealProbability";

interface DealCardProps {
  client: Client;
  onClick: () => void;
  onDragStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DealCard = ({ client, onClick, onDragStart, onEdit, onDelete }: DealCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const initials = client.clientName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badge = STAGE_BADGE_STYLES[client.dealStage];
  const prob = computeDealProbability(client);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-card rounded-[10px] p-4 cursor-pointer shadow-card hover:shadow-card-hover transition-shadow duration-150 group relative"
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
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-lg shadow-modal border border-border py-1 z-30">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  Editar
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir cliente
                </button>
              </div>
            )}
          </div>
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        {client.dealValue && (
          <p className="text-[13px] font-semibold text-primary">{client.dealValue}</p>
        )}
        {client.dealStage !== "Go-Live e Implantação" && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${probabilityBg(prob.overall)}`}>
            {prob.overall}% fechar
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
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
