import { createContext, useContext } from "react";
import type { SaveManager } from "@game/save/SaveManager";
import type { SaveDiagnostics } from "@game/save/save.types";
export interface SaveContext {
  manager: SaveManager | null;
  ready: boolean;
  error: string | null;
  status: SaveDiagnostics;
}
export const SaveContextValue = createContext<SaveContext | null>(null);
export function useSaves(): SaveContext {
  const context = useContext(SaveContextValue);
  if (!context) throw new Error("SaveProvider is missing");
  return context;
}
