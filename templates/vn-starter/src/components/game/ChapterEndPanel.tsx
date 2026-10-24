import { useEffect, useRef } from "react";
import type { ChapterEndEvent } from "@game/story/story.types";
import { useRecordedPronunciation } from "@game/audio/useRecordedPronunciation";
import { VocabularyEntry } from "./VocabularyEntry";
import { vocabularySpeechCopy } from "@content/vocabularySpeechCopy";
import "@/styles/chapterEnd.css";

export function ChapterEndPanel({ event, muted }: { event: ChapterEndEvent; muted: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const speech = useRecordedPronunciation(muted);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [event.id]);
  return (
    <section className="chapter-end-panel" aria-labelledby="chapter-end-title">
      <h2 ref={heading} id="chapter-end-title" tabIndex={-1}>
        {event.title}
      </h2>
      <h3>{event.vocabularyTitle}</h3>
      <dl className="chapter-vocabulary">
        {event.vocabulary.map((word) => (
          <VocabularyEntry
            key={word.id}
            word={word}
            playing={speech.activeId === word.id}
            muted={muted}
            play={() => speech.play(word.id, word.audioId)}
          />
        ))}
      </dl>
      <p className="vocabulary-speech-status" role="status">
        {muted ? vocabularySpeechCopy.muted : speech.failed ? vocabularySpeechCopy.failed : ""}
      </p>
    </section>
  );
}
