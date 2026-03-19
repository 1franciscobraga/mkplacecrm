import { Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <span className="text-base font-semibold text-foreground">MKT CRM</span>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center cursor-default">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{user?.email}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Sair</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
};

export default Navbar;
