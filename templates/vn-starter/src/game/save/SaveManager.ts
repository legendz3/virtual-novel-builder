import type { GameState } from "@game/state/gameState.types";
import type { GameStore } from "@game/state/gameStore";
import { logger } from "@services/logger";
import { migrateSave, type GameSave, type SaveProvider, type SaveDiagnostics } from "./save.types";
export function serializeGameSave(state: GameState, previous?: GameSave): GameSave {
  const now = new Date(
    Math.max(Date.now(), previous ? Date.parse(previous.updatedAt) + 1 : 0),
  ).toISOString();
  return migrateSave({
    version: state.saveVersion,
    chapterId: state.chapterId,
    sceneId: state.sceneId,
    eventIndex: state.eventIndex,
    storyVariables: state.storyVariables,
    relationships: state.relationships,
    vocabularyProgress: state.vocabularyProgress,
    completedExercises: state.completedExercises,
    choicesMade: state.choicesMade,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  });
}
export class SaveManager {
  private previous?: GameSave;
  private localQueue: Promise<unknown> = Promise.resolve();
  private cloudQueue: Promise<unknown> = Promise.resolve();
  private status: SaveDiagnostics;
  constructor(
    private readonly local: SaveProvider,
    private readonly cloud: SaveProvider | null = null,
    private readonly report: (status: SaveDiagnostics) => void = () => {},
  ) {
    this.status = { local: "idle", cloud: cloud ? "idle" : "disabled" };
  }
  private update(status: Partial<SaveDiagnostics>): void {
    this.status = { ...this.status, ...status };
    this.report(this.status);
  }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.localQueue.then(operation);
    this.localQueue = result.catch(() => {});
    return result;
  }
  // Cloud operations have their own ordered queue so a network stall cannot block local persistence.
  private syncCloud(operation: (provider: SaveProvider) => Promise<void>): void {
    const cloud = this.cloud;
    if (!cloud) return;
    this.cloudQueue = this.cloudQueue.then(async () => {
      this.update({ cloud: "saving" });
      try {
        await operation(cloud);
        this.update({ cloud: "saved" });
      } catch (error) {
        this.update({ cloud: "error" });
        logger.warn("Cloud save unavailable; local progress retained", error);
      }
    });
  }
  async waitForLocal(): Promise<void> {
    await this.localQueue;
  }
  async waitForCloud(): Promise<void> {
    await this.cloudQueue;
  }
  async saveGame(state: GameState): Promise<GameSave> {
    // Snapshot before awaiting I/O so later mutations cannot alter an in-flight save.
    const snapshot = serializeGameSave(state, this.previous);
    return this.enqueue(async () => {
      const save = {
        ...snapshot,
        createdAt: this.previous?.createdAt ?? snapshot.createdAt,
        updatedAt: new Date(
          Math.max(
            Date.parse(snapshot.updatedAt),
            this.previous ? Date.parse(this.previous.updatedAt) + 1 : 0,
          ),
        ).toISOString(),
      };
      this.update({ local: "saving" });
      try {
        await this.local.save(save);
        this.previous = save;
        this.update({ local: "saved" });
      } catch (error) {
        this.update({ local: "error" });
        throw error;
      }
      this.syncCloud((provider) => provider.save(save));
      return save;
    });
  }
  loadGame(): Promise<GameSave | null> {
    return this.enqueue(async () => {
      this.update({ local: "loading", ...(this.cloud ? { cloud: "loading" as const } : {}) });
      const results = await Promise.allSettled([
        this.local.load(),
        this.cloud?.load() ?? Promise.resolve(null),
      ]);
      const localResult = results[0];
      const cloudResult = results[1];
      this.update({
        local: localResult.status === "fulfilled" ? "idle" : "error",
        cloud: this.cloud ? (cloudResult.status === "fulfilled" ? "idle" : "error") : "disabled",
      });
      const local = localResult.status === "fulfilled" ? localResult.value : null;
      const cloud = cloudResult.status === "fulfilled" ? cloudResult.value : null;
      const newest =
        cloud && (!local || Date.parse(cloud.updatedAt) > Date.parse(local.updatedAt))
          ? cloud
          : local;
      if (!newest && localResult.status === "rejected") throw localResult.reason;
      // A failed cloud read with no local copy must not seed an empty save over unknown progress.
      if (!newest && this.cloud && cloudResult.status === "rejected") throw cloudResult.reason;
      if (newest) {
        this.previous = newest;
        if (newest === cloud) {
          try {
            await this.local.save(newest);
            this.update({ local: "saved" });
          } catch (error) {
            this.update({ local: "error" });
            logger.warn("Local cache unavailable", error);
          }
        }
      }
      return newest;
    });
  }
  async hasSave(): Promise<boolean> {
    return (await this.loadGame()) !== null;
  }
  deleteSave(): Promise<void> {
    return this.enqueue(async () => {
      await this.local.delete();
      this.previous = undefined;
      this.update({ local: "idle" });
      this.syncCloud((provider) => provider.delete());
    });
  }
  startAutosave(store: GameStore): () => void {
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const flush = async (): Promise<void> => {
      const snapshot = store.getState();
      if (!snapshot.isDirty) return;
      try {
        await this.saveGame(snapshot);
        if (!stopped && store.getState() === snapshot) store.setState({ isDirty: false });
      } catch (error) {
        logger.error("Local autosave failed", error);
      }
    };
    const unsubscribe = store.subscribe((state) => {
      if (!state.isDirty) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        void flush();
      }, 1500);
    });
    const periodic = setInterval(() => {
      void flush();
    }, 30000);
    const visibility = (): void => {
      if (document.visibilityState === "hidden") void flush();
    };
    const pagehide = (): void => {
      void flush();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    if (store.getState().isDirty)
      debounce = setTimeout(() => {
        void flush();
      }, 1500);
    return () => {
      stopped = true;
      unsubscribe();
      clearTimeout(debounce);
      clearInterval(periodic);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      void flush();
    };
  }
}
