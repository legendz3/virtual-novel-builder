import { PronunciationButton } from "./PronunciationButton";
import type { PhraseTile } from "@game/learning/phraseConstruction.types";
import { phraseConstructionCopy as copy } from "@content/phraseConstructionCopy";

interface PhraseSpeakerButtonProps {
  tile: PhraseTile;
  location: "bank" | "slot";
  playing: boolean;
  muted: boolean;
  playPhrase: (tile: PhraseTile) => void;
}

// Bank and occupied-slot controls share one tile identity without editing the sentence.
export function PhraseSpeakerButton({
  tile,
  location,
  playing,
  muted,
  playPhrase,
}: PhraseSpeakerButtonProps) {
  return (
    <PronunciationButton
      text={tile.text}
      itemId={tile.id}
      location={location}
      className="phrase-speaker"
      playing={playing}
      muted={muted}
      play={() => playPhrase(tile)}
      listenLabel={copy.listen(tile.text)}
      stopLabel={copy.stopListening(tile.text)}
      mutedLabel={copy.audioMuted}
    />
  );
}
