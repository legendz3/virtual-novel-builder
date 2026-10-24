import { createContext, useContext } from "react";
import type { AuthContext } from "./auth.types";
export const AuthContextValue = createContext<AuthContext | null>(null);
export function useAuth(): AuthContext {
  const context = useContext(AuthContextValue);
  if (!context) throw new Error("AuthProvider is missing");
  return context;
}
