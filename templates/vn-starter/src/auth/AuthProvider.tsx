import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@services/supabase";
import { logger } from "@services/logger";
import { authService } from "./auth.service";
import { AuthContextValue } from "./authContext";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: Boolean(supabase),
  });
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authEventReceived = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      if (active) setSession({ user: next?.user ?? null, loading: false });
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) logger.warn("Session unavailable", error);
        if (active && !authEventReceived)
          setSession({ user: data.session?.user ?? null, loading: false });
      })
      .catch((error) => {
        logger.warn("Session unavailable", error);
        if (active && !authEventReceived) setSession({ user: null, loading: false });
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  return (
    <AuthContextValue.Provider value={{ ...session, ...authService }}>
      {children}
    </AuthContextValue.Provider>
  );
}
