import type { StoryEvent } from "@game/story/story.types";
import type { SceneArtwork } from "@phaser/PhaserBridge";
import { assets } from "./assetManifest";

/** React selects only artwork used by these authored presentations; Phaser receives no chapter logic. */
export function chapterArtwork(events: readonly StoryEvent[]): SceneArtwork[] {
  const selected = new Map<string, string>();
  for (const event of events) {
    const presentation = event.presentation;
    if (presentation?.backgroundId)
      selected.set(presentation.backgroundId, assets.getBackground(presentation.backgroundId));
    if (presentation?.character)
      selected.set(
        presentation.character.assetId,
        assets.getCharacter(presentation.character.assetId),
      );
  }
  return [...selected].map(([id, url]) => ({ id, url }));
}
