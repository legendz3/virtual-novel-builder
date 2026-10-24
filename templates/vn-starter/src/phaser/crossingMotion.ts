import type Phaser from "phaser";
import type { CrossingMotion } from "@game/story/story.types";
import { GAME_HEIGHT, GAME_WIDTH } from "./config";

// The same end framing is applied on saved-game restores and on subsequent close-up beats.
export function renderCrossingMotion(
  scene: Phaser.Scene,
  background: Phaser.GameObjects.Image,
  character: Phaser.GameObjects.Image,
  motion: CrossingMotion,
  animate: boolean,
  onComplete: () => void,
): void {
  const backgroundScaleX = GAME_WIDTH / background.width;
  const backgroundScaleY = GAME_HEIGHT / background.height;
  const wideCharacter = {
    x: 850,
    y: 18,
    angle: 0,
    scaleX: 1040 / character.height,
    scaleY: 1040 / character.height,
  };
  const closeCharacter = {
    x: 800,
    y: 0,
    angle: 0,
    scaleX: 1500 / character.height,
    scaleY: 1500 / character.height,
  };
  const wideBackground = {
    y: GAME_HEIGHT / 2,
    angle: 0,
    scaleX: backgroundScaleX,
    scaleY: backgroundScaleY,
  };
  const closeBackground = {
    ...wideBackground,
    scaleX: backgroundScaleX * 1.04,
    scaleY: backgroundScaleY * 1.04,
  };
  const applyFraming = (close: boolean): void => {
    const framing = close ? closeCharacter : wideCharacter;
    character
      .setPosition(framing.x, framing.y)
      .setAngle(framing.angle)
      .setScale(framing.scaleX, framing.scaleY);
    const backdrop = close ? closeBackground : wideBackground;
    background.setY(backdrop.y).setAngle(backdrop.angle).setScale(backdrop.scaleX, backdrop.scaleY);
  };

  if (!animate || motion.durationMs === 0 || motion.shot === "close") {
    applyFraming(motion.shot !== "release");
    return;
  }
  if (motion.shot === "release") {
    applyFraming(true);
    scene.tweens.add({
      targets: background,
      ...wideBackground,
      duration: motion.durationMs,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: character,
      ...wideCharacter,
      duration: motion.durationMs,
      ease: "Sine.InOut",
      onComplete,
    });
    return;
  }

  applyFraming(false);
  const fallDuration = motion.durationMs * 0.23;
  const catchDuration = motion.durationMs * 0.6;
  const holdDuration = motion.durationMs - fallDuration - catchDuration;
  scene.tweens.chain({
    targets: background,
    tweens: [
      // Overscan covers the corners while Emma's point of view rolls toward the road.
      {
        angle: -6,
        y: GAME_HEIGHT / 2 + 14,
        scaleX: backgroundScaleX * 1.24,
        scaleY: backgroundScaleY * 1.24,
        duration: fallDuration,
        ease: "Cubic.In",
      },
      { ...closeBackground, duration: catchDuration, hold: holdDuration, ease: "Sine.Out" },
    ],
  });
  scene.tweens.chain({
    targets: character,
    tweens: [
      { x: 865, y: 50, angle: -5, duration: fallDuration, ease: "Cubic.In" },
      { ...closeCharacter, duration: catchDuration, hold: holdDuration, ease: "Cubic.Out" },
    ],
    onComplete,
  });
}
