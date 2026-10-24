import type { DialogueEvent } from "@game/story/story.types";
import type { MandarinDialogue } from "@game/learning/mandarin.types";

export function MandarinDialogueText({
  event,
  content,
  listeningPinyin,
}: {
  event: DialogueEvent;
  content: MandarinDialogue;
  listeningPinyin?: boolean;
}) {
  if (listeningPinyin !== undefined)
    return (
      <>
        {content.mode !== "audio-only" && (
          <p className="dialogue-text" lang="zh-Hans">
            {event.text}
          </p>
        )}
        {listeningPinyin && (
          <p className="dialogue-pinyin" lang="zh-Latn">
            {content.segments.map((segment) => segment.pinyin).join(" ")}
          </p>
        )}
      </>
    );
  if (content.mode === "audio-only") return null;
  if (content.layout === "block") {
    const segment = content.segments[0]!;
    return (
      <>
        <p className="dialogue-text" lang="zh-Hans">
          {event.text}
        </p>
        <p className="dialogue-pinyin" lang="zh-Latn">
          {segment.pinyin}
        </p>
        {content.mode === "supported" && (
          <p className="dialogue-translation">
            {content.meaningLabel && <strong>{content.meaningLabel}: </strong>}
            {segment.meaning}
          </p>
        )}
      </>
    );
  }
  return (
    <>
      <p className="dialogue-text">{event.text}</p>
      {event.pinyin && (
        <p className="dialogue-pinyin" lang="zh-Latn">
          {event.pinyin}
        </p>
      )}
      {content.mode === "supported" && event.translation && (
        <p className="dialogue-translation">{event.translation}</p>
      )}
      <div className="mandarin-segments">
        {content.segments.map((segment, index) => {
          const pinyinShown =
            event.pinyin === segment.pinyin || event.text.includes(segment.pinyin);
          const meaningShown =
            event.translation === segment.meaning || event.text.includes(segment.meaning);
          if (pinyinShown && (content.mode !== "supported" || meaningShown)) return null;
          return (
            <div className="mandarin-segment" key={index}>
              <span lang="zh-Hans">{segment.hanzi}</span>
              <span lang="zh-Latn">{segment.pinyin}</span>
              {content.mode === "supported" && <span>{segment.meaning}</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
