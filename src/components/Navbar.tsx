import { Bell, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      <button onClick={() => navigate("/")} className="text-base font-semibold text-foreground hover:opacity-80 transition-opacity">
        MKT CRM
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin")}
          className={`p-2 rounded-lg hover:bg-secondary transition-colors ${location.pathname === "/admin" ? "bg-secondary" : ""}`}
          title="Admin"
        >
          <Settings className="w-[18px] h-[18px] text-muted-foreground" />
        </button>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title={`Sign out (${user?.email})`}
        >
          <LogOut className="w-[18px] h-[18px] text-muted-foreground" />
        </button>
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center" title={user?.email || ""}>
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
