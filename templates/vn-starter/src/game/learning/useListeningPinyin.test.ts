import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useListeningPinyin } from "./useListeningPinyin";
const key = (owner: string) =>
  `beijing-heartbeat:preferences:listening-pinyin:${encodeURIComponent(owner)}`;
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
it.each([null, "false", "invalid", "TRUE", "true"])(
  "reads exact stored value %s without hydration writes",
  (value) => {
    if (value !== null) localStorage.setItem(key("stored-owner"), value);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useListeningPinyin("stored-owner"));
    expect(result.current.shown).toBe(value === "true");
    expect(write).not.toHaveBeenCalled();
  },
);
it("isolates guest and accounts, defers loading, rejects stale writes, and restores prior owner values", () => {
  localStorage.setItem(key("guest"), "true");
  localStorage.setItem(key("account-A"), "false");
  const read = vi.spyOn(Storage.prototype, "getItem");
  const write = vi.spyOn(Storage.prototype, "setItem");
  const { result, rerender } = renderHook(
    ({ owner }: { owner?: string }) => useListeningPinyin(owner),
    { initialProps: { owner: undefined as string | undefined } },
  );
  expect(result.current).toMatchObject({ shown: false, ready: false });
  act(() => result.current.setShown(true));
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  rerender({ owner: "guest" });
  expect(result.current.shown).toBe(true);
  const staleGuest = result.current.setShown;
  rerender({ owner: undefined });
  act(() => staleGuest(false));
  expect(result.current.shown).toBe(false);
  rerender({ owner: "account-A" });
  expect(result.current.shown).toBe(false);
  act(() => staleGuest(false));
  expect(write).not.toHaveBeenCalled();
  rerender({ owner: "account-B" });
  expect(result.current.shown).toBe(false);
  act(() => result.current.setShown(true));
  expect(write).toHaveBeenCalledExactlyOnceWith(key("account-B"), "true");
  rerender({ owner: "account-A" });
  expect(result.current.shown).toBe(false);
  rerender({ owner: "guest" });
  expect(result.current.shown).toBe(true);
});
it("writes both boolean values and retains across same-owner remounts", () => {
  const first = renderHook(() => useListeningPinyin("persisted-owner"));
  act(() => first.result.current.setShown(true));
  expect(localStorage.getItem(key("persisted-owner"))).toBe("true");
  first.unmount();
  const second = renderHook(() => useListeningPinyin("persisted-owner"));
  expect(second.result.current.shown).toBe(true);
  act(() => second.result.current.setShown(false));
  expect(localStorage.getItem(key("persisted-owner"))).toBe("false");
});
it("read failures default hidden without disabling the live control or writing defaults", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const write = vi.spyOn(Storage.prototype, "setItem");
  const { result } = renderHook(() => useListeningPinyin("unreadable-owner"));
  expect(result.current).toMatchObject({ shown: false, ready: true, saveFailed: false });
  expect(write).not.toHaveBeenCalled();
  act(() => result.current.setShown(true));
  expect(result.current.shown).toBe(true);
});
it("failed writes retain only that owner's visit preference through remount until a successful write", () => {
  localStorage.setItem(key("failed-owner"), "false");
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  const first = renderHook(() => useListeningPinyin("failed-owner"));
  act(() => first.result.current.setShown(true));
  expect(first.result.current).toMatchObject({ shown: true, saveFailed: true });
  first.unmount();
  const second = renderHook(({ owner }) => useListeningPinyin(owner), {
    initialProps: { owner: "failed-owner" },
  });
  expect(second.result.current).toMatchObject({ shown: true, saveFailed: true });
  second.rerender({ owner: "other-failure-owner" });
  expect(second.result.current).toMatchObject({ shown: false, saveFailed: false });
  second.rerender({ owner: "failed-owner" });
  expect(second.result.current.shown).toBe(true);
  write.mockRestore();
  act(() => second.result.current.setShown(false));
  expect(second.result.current).toMatchObject({ shown: false, saveFailed: false });
  expect(localStorage.getItem(key("failed-owner"))).toBe("false");
});
