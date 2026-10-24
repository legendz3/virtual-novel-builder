import type { ResolvedMandarinSupport } from "@game/learning/mandarinSupport";

/** Source attribution is deliberately separate from the current reply's speaker and audio control. */
export function MandarinQuestionContext({ support }: { support: ResolvedMandarinSupport }) {
  return (
    <blockquote className="mandarin-question-context">
      <p className="mandarin-source-speaker">{support.sourceCharacterId}</p>
      {support.segments.map((segment, index) => (
        <div className="mandarin-context-segment" key={index}>
          <p lang="zh-Hans">{segment.hanzi}</p>
          <p lang="zh-Latn">{segment.pinyin}</p>
          <p>{segment.meaning}</p>
        </div>
      ))}
    </blockquote>
  );
}
/** Preserve surrounding English in its authored order, with one exact meaning span and no second translation. */
export function MandarinNaturalMeaning({
  text,
  support,
}: {
  text: string;
  support: ResolvedMandarinSupport;
}) {
  if (support.kind !== "natural-meaning")
    throw new Error("Natural meaning requires its explicit contract");
  const parts = text.split(support.english.exactSpan);
  if (parts.length !== 2) throw new Error("Natural meaning span must occur exactly once");
  return (
    <>
      <span className="mandarin-natural-support">
        <span className="mandarin-natural-source">
          <span className="mandarin-source-speaker">{support.sourceCharacterId}</span>
          {support.segments.map((segment, index) => (
            <span className="mandarin-context-segment" key={index}>
              <span lang="zh-Hans">{segment.hanzi}</span>
              <span lang="zh-Latn">{segment.pinyin}</span>
            </span>
          ))}
        </span>
      </span>
      <span className="mandarin-natural-text">
        {parts[0]}
        <span className="mandarin-natural-meaning">{support.english.exactSpan}</span>
        {parts[1]}
      </span>
    </>
  );
}
