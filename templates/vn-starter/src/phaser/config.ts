import Phaser from "phaser";
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export function phaserConfig(
  parent: HTMLElement,
  scene: Phaser.Scene,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#000000",
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene,
  };
}
