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
const AUTHORIZED_STATUSES = ["active", "invited"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedRef = useRef(false);
  const isMountedRef = useRef(true);
  const checkedTokenRef = useRef<string | null>(null);
  const checkingTokenRef = useRef<string | null>(null);

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

  const validateAuthorizedAccess = useCallback((nextSession: Session | null) => {
    if (!isMountedRef.current) return;

    const email = nextSession?.user?.email?.toLowerCase();
    const token = nextSession?.access_token;

    if (!email || !token) {
      checkedTokenRef.current = null;
      checkingTokenRef.current = null;
      loggedRef.current = false;
      setLoading(false);
      return;
    }

    if (checkedTokenRef.current === token) {
      setLoading(false);
      return;
    }

    if (checkingTokenRef.current === token) {
      return;
    }

    checkingTokenRef.current = token;
    setLoading(true);

    supabase
      .from("authorized_emails")
      .select("id")
      .eq("email", email)
      .in("status", AUTHORIZED_STATUSES)
      .limit(1)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error || !data) {
          console.warn("Unauthorized session blocked", error);
          await supabase.auth.signOut();

          if (!isMountedRef.current) return;
          setSession(null);
          sessionStorage.removeItem(ACCESS_LOG_KEY);
          loggedRef.current = false;
          checkedTokenRef.current = null;
          return;
        }

        checkedTokenRef.current = token;
        logAccess(email);
      })
      .catch((error) => {
        console.error("Authorization check failed:", error);
      })
      .finally(() => {
        if (checkingTokenRef.current === token) {
          checkingTokenRef.current = null;
        }
        if (isMountedRef.current) {
          setLoading(false);
        }
      });
  }, [logAccess]);

  useEffect(() => {
    isMountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMountedRef.current) return;
        setSession(nextSession);
        validateAuthorizedAccess(nextSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMountedRef.current) return;
      setSession(currentSession);
      validateAuthorizedAccess(currentSession);
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [validateAuthorizedAccess]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setLoading(false);
    sessionStorage.removeItem(ACCESS_LOG_KEY);
    loggedRef.current = false;
    checkedTokenRef.current = null;
    checkingTokenRef.current = null;
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
