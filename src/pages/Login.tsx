import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle, LogIn, UserPlus, ShieldX } from "lucide-react";

type Mode = "choose" | "login" | "request";

const Login = () => {
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Check whitelist first
      const { data: whitelisted } = await supabase
        .from("authorized_emails")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (!whitelisted) {
        setError(
          mode === "request"
            ? "Este email ainda não foi liberado. Solicite acesso ao administrador."
            : "Email não autorizado. Verifique com o administrador."
        );
        setLoading(false);
        return;
      }

      // Email is authorized — send magic link via edge function
      const { data, error: fnError } = await supabase.functions.invoke("invite-user", {
        body: { email: normalizedEmail },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar link de acesso.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Link enviado!</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Verifique sua caixa de entrada em
            </p>
            <p className="text-sm font-medium text-foreground mb-4">{email}</p>
            <p className="text-xs text-muted-foreground mb-6">
              Clique no link do email para acessar o CRM.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); setMode("choose"); }}
              className="text-sm text-primary hover:underline"
            >
              Usar outro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">MKT CRM</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Acesso restrito a investidores autorizados
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => setMode("login")}
              className="w-full h-12 text-base gap-3"
            >
              <LogIn className="w-5 h-5" />
              Login
            </Button>
            <Button
              onClick={() => setMode("request")}
              variant="outline"
              className="w-full h-12 text-base gap-3"
            >
              <UserPlus className="w-5 h-5" />
              Solicitar acesso
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">MKT CRM</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "login"
              ? "Entre com seu email autorizado"
              : "Informe seu email para verificar acesso"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="pl-10"
                required
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <ShieldX className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "login" ? (
              "Enviar link de acesso"
            ) : (
              "Verificar e solicitar acesso"
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => { setMode("choose"); setError(""); setEmail(""); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
