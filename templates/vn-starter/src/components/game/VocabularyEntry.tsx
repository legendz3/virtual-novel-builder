import type { VocabularyDefinition } from "@game/learning/learning.types";
import { vocabularySpeechCopy as copy } from "@content/vocabularySpeechCopy";
import { PronunciationButton } from "./PronunciationButton";

export function VocabularyEntry({
  word,
  playing,
  muted,
  play,
}: {
  word: VocabularyDefinition;
  playing: boolean;
  muted: boolean;
  play: () => void;
}) {
  return (
    <div>
      <dt lang="zh-Hans">
        {word.hanzi}
        <span className="vocabulary-pinyin" lang="zh-Latn">
          {word.pinyin}
        </span>
      </dt>
      <dd>
        <span>{word.meaning}</span>
        <PronunciationButton
          text={word.hanzi}
          itemId={word.id}
          location="vocabulary"
          className="vocabulary-speaker"
          playing={playing}
          muted={muted}
          play={play}
          listenLabel={copy.hear(word.hanzi)}
          stopLabel={copy.stop(word.hanzi)}
          mutedLabel={copy.muted}
        />
      </dd>
    </div>
  );
}
