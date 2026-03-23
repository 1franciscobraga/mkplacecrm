import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_LOG_KEY = "last-access-logged";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedRef = useRef(false);

  const logAccess = useCallback(async (email: string) => {
    // Prevent duplicate logs in same session/page load
    if (loggedRef.current) return;

    const lastLogged = sessionStorage.getItem(ACCESS_LOG_KEY);
    const now = Date.now();
    // Don't log more than once per 5 minutes per session
    if (lastLogged && now - parseInt(lastLogged, 10) < 5 * 60 * 1000) {
      loggedRef.current = true;
      return;
    }

    loggedRef.current = true;
    sessionStorage.setItem(ACCESS_LOG_KEY, now.toString());

    // Fire and forget — don't block UI
    supabase.from("access_logs").insert({
      user_email: email.toLowerCase(),
      user_agent: navigator.userAgent,
    } as any).then(({ error }) => {
      if (error) console.error("Access log error:", error);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setLoading(false);
        if (nextSession?.user?.email) {
          logAccess(nextSession.user.email);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setLoading(false);
      if (currentSession?.user?.email) {
        logAccess(currentSession.user.email);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [logAccess]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    sessionStorage.removeItem(ACCESS_LOG_KEY);
    loggedRef.current = false;
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
