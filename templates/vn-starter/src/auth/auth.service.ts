import { supabase } from "@services/supabase";
export const authService = {
  async signInWithGoogle(): Promise<void> {
    if (!supabase) throw new Error("Cloud sign-in is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/" },
    });
    if (error) throw error;
  },
  async signOut(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },
};
