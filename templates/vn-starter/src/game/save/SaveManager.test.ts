import { afterEach, describe, expect, it, vi } from "vitest";
import { SaveManager, serializeGameSave } from "./SaveManager";
import { createGameStore, initialGameState } from "@game/state/gameStore";
import type { GameSave, SaveProvider } from "./save.types";
function provider(value: GameSave | null = null): SaveProvider {
  return {
    load: vi.fn(async () => value),
    save: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  };
}
afterEach(() => vi.useRealTimers());
describe("SaveManager", () => {
  it("writes locally before cloud and keeps local saves usable after network failure", async () => {
    const local = provider();
    const cloud = provider();
    const order: string[] = [];
    vi.mocked(local.save).mockImplementation(async () => {
      order.push("local");
    });
    vi.mocked(cloud.save).mockImplementation(async () => {
      order.push("cloud");
      throw new Error("offline");
    });
    const report = vi.fn();
    const manager = new SaveManager(local, cloud, report);
    await manager.saveGame(initialGameState());
    await manager.waitForCloud();
    expect(order).toEqual(["local", "cloud"]);
    expect(report).toHaveBeenLastCalledWith({ local: "saved", cloud: "error" });
  });
  it("never uploads after a local write failure", async () => {
    const local = provider();
    const cloud = provider();
    vi.mocked(local.save).mockRejectedValue(new Error("quota"));
    await expect(new SaveManager(local, cloud).saveGame(initialGameState())).rejects.toThrow(
      "quota",
    );
    expect(cloud.save).not.toHaveBeenCalled();
  });
  it("selects the newest valid timestamp and caches the cloud copy", async () => {
    const old = serializeGameSave(initialGameState());
    const newer = serializeGameSave({ ...initialGameState(), eventIndex: 2 }, old);
    const local = provider(old);
    const manager = new SaveManager(local, provider(newer));
    expect(await manager.loadGame()).toEqual(newer);
    expect(local.save).toHaveBeenCalledWith(newer);
  });
  it("uses local progress when cloud is corrupt or unavailable", async () => {
    const save = serializeGameSave(initialGameState());
    const cloud = provider();
    vi.mocked(cloud.load).mockRejectedValue(new Error("corrupt"));
    expect(await new SaveManager(provider(save), cloud).loadGame()).toEqual(save);
  });
  it("does not authorize empty initialization when the only existing save may be unreadable", async () => {
    const local = provider();
    vi.mocked(local.load).mockRejectedValue(new Error("corrupt"));
    await expect(new SaveManager(local).loadGame()).rejects.toThrow("corrupt");
    expect(local.save).not.toHaveBeenCalled();
  });
  it("debounces dirty state and preserves newer mutations during an in-flight write", async () => {
    vi.useFakeTimers();
    const local = provider();
    const store = createGameStore();
    let finish: (() => void) | undefined;
    vi.mocked(local.save).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const stop = new SaveManager(local).startAutosave(store);
    store.getState().setEventIndex(1);
    await vi.advanceTimersByTimeAsync(1499);
    expect(local.save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(local.save).toHaveBeenCalledTimes(1);
    store.getState().setEventIndex(2);
    finish?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().isDirty).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(store.getState().isDirty).toBe(false);
    stop();
  });
  it("periodically saves during continuous mutations and flushes pagehide", async () => {
    vi.useFakeTimers();
    const local = provider();
    const store = createGameStore();
    const stop = new SaveManager(local).startAutosave(store);
    for (let i = 0; i < 30; i++) {
      store.getState().setEventIndex(i);
      await vi.advanceTimersByTimeAsync(1000);
    }
    expect(local.save).toHaveBeenCalled();
    store.getState().markDirty();
    window.dispatchEvent(new Event("pagehide"));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().isDirty).toBe(false);
    stop();
  });
  it("keeps local writes moving while a cloud write is pending", async () => {
    const local = provider();
    const cloud = provider();
    let finish: (() => void) | undefined;
    vi.mocked(cloud.save).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const manager = new SaveManager(local, cloud);
    await manager.saveGame(initialGameState());
    await manager.saveGame({ ...initialGameState(), eventIndex: 1 });
    expect(local.save).toHaveBeenCalledTimes(2);
    finish?.();
    await manager.waitForCloud();
  });
});
