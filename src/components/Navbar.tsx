import { Bell, User } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="h-14 border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="font-data text-lg font-bold tracking-display text-primary">
          MKT CRM
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-sm hover:bg-secondary transition-colors duration-150">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-sm bg-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
