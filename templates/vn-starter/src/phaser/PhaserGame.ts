import Phaser from "phaser";
import { phaserConfig } from "./config";
import { BaseScene } from "./scenes/BaseScene";
import type { PhaserBridge, RenderCommand, SceneArtwork } from "./PhaserBridge";
export function mountPhaserGame(
  parent: HTMLElement,
  bridge: PhaserBridge,
  ready: () => void,
  applied: (command: RenderCommand) => void,
  failed: (error: Error) => void,
  artwork: readonly SceneArtwork[],
): () => void {
  const game = new Phaser.Game(
    phaserConfig(parent, new BaseScene(bridge, ready, applied, failed, artwork)),
  );
  // Scene layouts resize the host without a window resize; refresh alone uses stale parent bounds.
  const observer = new ResizeObserver(() => {
    if (game.scale.getParentBounds()) game.scale.refresh();
  });
  observer.observe(parent);
  return () => {
    observer.disconnect();
    game.destroy(true);
  };
}
