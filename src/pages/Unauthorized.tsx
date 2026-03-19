import { useAuth } from "@/contexts/AuthContext";
import { ShieldX, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Acesso não autorizado</h1>
        <p className="text-sm text-muted-foreground mb-1">
          O email <strong className="text-foreground">{user?.email}</strong> não possui permissão para acessar este sistema.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Entre em contato com o administrador para solicitar acesso.
        </p>
        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
