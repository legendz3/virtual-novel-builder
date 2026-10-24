import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PhaserCanvas } from "./PhaserCanvas";
const mount = vi.hoisted(() =>
  vi.fn<typeof import("@phaser/PhaserGame").mountPhaserGame>(() => vi.fn()),
);
vi.mock("@phaser/PhaserGame", () => ({ mountPhaserGame: mount }));
afterEach(() => {
  cleanup();
  mount.mockClear();
});
it("passes only selected art and rejects late ready callbacks after replacing the canvas", async () => {
  const first = vi.fn();
  const second = vi.fn();
  const firstArt = [{ id: "first", url: "/first.png" }];
  const secondArt = [{ id: "second", url: "/second.png" }];
  const view = render(<PhaserCanvas artwork={firstArt} onReady={first} />);
  await waitFor(() => expect(mount).toHaveBeenCalledTimes(1));
  const firstArgs = mount.mock.calls[0] as unknown as unknown[];
  expect(firstArgs[5]).toBe(firstArt);
  const oldReady = firstArgs[2] as () => void;
  const destroy = mount.mock.results[0]!.value;
  view.rerender(<PhaserCanvas artwork={secondArt} onReady={second} />);
  await waitFor(() => expect(mount).toHaveBeenCalledTimes(2));
  expect(destroy).toHaveBeenCalledOnce();
  oldReady();
  expect(first).not.toHaveBeenCalled();
  const secondArgs = mount.mock.calls[1] as unknown as unknown[];
  expect(secondArgs[5]).toBe(secondArt);
  (secondArgs[2] as () => void)();
  expect(second).toHaveBeenCalledOnce();
  view.unmount();
  (secondArgs[2] as () => void)();
  expect(second).toHaveBeenCalledOnce();
});
