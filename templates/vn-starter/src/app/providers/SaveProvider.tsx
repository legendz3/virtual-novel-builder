import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/authContext";
import { supabase } from "@services/supabase";
import { useGameStore, initialGameState } from "@game/state/gameStore";
import { LocalSaveProvider } from "@game/save/LocalSaveProvider";
import { CloudSaveProvider } from "@game/save/CloudSaveProvider";
import { SaveManager } from "@game/save/SaveManager";
import { SaveContextValue, type SaveContext } from "./saveContext";
export function SaveProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const ownerId = user?.id;
  const [context, setContext] = useState<SaveContext>({
    manager: null,
    ready: false,
    error: null,
    status: { local: "idle", cloud: "disabled" },
  });
  useEffect(() => {
    if (loading) return;
    let active = true;
    let stop: (() => void) | undefined;
    const local = new LocalSaveProvider(ownerId);
    const manager = new SaveManager(
      local,
      ownerId && supabase ? new CloudSaveProvider(supabase, ownerId) : null,
      (status) => {
        if (active) setContext((previous) => ({ ...previous, status }));
      },
    );
    useGameStore.setState({
      ...initialGameState(),
      playerId: ownerId,
      chapterId: undefined,
      sceneId: undefined,
    });
    // Hydration precedes autosave; a blank store must never overwrite an existing save.
    void manager
      .loadGame()
      .then((save) => {
        if (!active) return;
        if (save) {
          // Explicitly hydrate progress; timestamps remain owned by SaveManager.
          useGameStore.setState({
            chapterId: save.chapterId,
            sceneId: save.sceneId,
            eventIndex: save.eventIndex,
            storyVariables: save.storyVariables,
            relationships: save.relationships,
            vocabularyProgress: save.vocabularyProgress,
            completedExercises: save.completedExercises,
            choicesMade: save.choicesMade,
            saveVersion: save.version,
            playerId: ownerId,
            isDirty: false,
          });
        }
        stop = manager.startAutosave(useGameStore);
        setContext((previous) => ({ ...previous, manager, ready: true, error: null }));
      })
      .catch(() => {
        if (active)
          setContext((previous) => ({
            ...previous,
            manager,
            ready: false,
            error: "Could not load progress. Existing saves were preserved. Reload to retry.",
          }));
      });
    return () => {
      active = false;
      stop?.();
      void manager.waitForLocal().then(() => local.close());
    };
  }, [ownerId, loading]);
  // Keyed provider in App remounts on account changes to prevent exposing the previous manager.
  return <SaveContextValue.Provider value={context}>{children}</SaveContextValue.Provider>;
}
