import type { User } from "@supabase/supabase-js";
export interface AuthContext {
  user: User | null;
  loading: boolean;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}
