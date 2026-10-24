import type { PhraseTile } from "@game/learning/phraseConstruction.types";
import { useRecordedPronunciation } from "./useRecordedPronunciation";

export function usePhraseAudio(muted: boolean) {
  const speech = useRecordedPronunciation(muted);
  return {
    activeTileId: speech.activeId,
    failed: speech.failed,
    playPhrase: (tile: PhraseTile): void => speech.play(tile.id, tile.audioId),
    stopPhrase: speech.stop,
  };
}
