import { LanguageNotes } from "./LanguageNotes";
import { MandarinDialogueText } from "./MandarinDialogueText";
import { MandarinQuestionContext, MandarinNaturalMeaning } from "./MandarinSupportText";
import type { ResolvedMandarinSupport } from "@game/learning/mandarinSupport";
import type { DialogueEvent, NarrationEvent } from "@game/story/story.types";

export function StoryDialogue({
  event,
  replayVoice,
  support,
  listeningPinyin,
}: {
  event: DialogueEvent | NarrationEvent;
  replayVoice: () => void;
  support?: ResolvedMandarinSupport;
  listeningPinyin?: boolean;
}) {
  const showText = event.type !== "dialogue" || event.textDisplay !== "audio-only";
  const mandarin = event.type === "dialogue" ? event.mandarin : undefined;
  const recorded =
    event.type === "dialogue" &&
    (mandarin ? mandarin.speech.mode === "recorded" : Boolean(event.audioId));
  return (
    <section
      className={`scene-dialogue ${event.type === "narration" ? "scene-narration" : ""}`}
      aria-live="polite"
      aria-atomic="true"
      key={event.id}
    >
      {support?.kind === "question-context" && <MandarinQuestionContext support={support} />}
      {event.type === "dialogue" && <p className="dialogue-speaker">{event.characterId}</p>}
      {mandarin && event.type === "dialogue" && (
        <MandarinDialogueText event={event} content={mandarin} listeningPinyin={listeningPinyin} />
      )}
      {!mandarin && showText && (
        <p
          className="dialogue-text"
          lang={/\p{Script=Han}/u.test(event.text) ? "zh-Hans" : undefined}
        >
          {support?.kind === "natural-meaning" ? (
            <MandarinNaturalMeaning text={event.text} support={support} />
          ) : (
            event.text
          )}
        </p>
      )}
      {!mandarin && showText && event.pinyin && (
        <p className="dialogue-pinyin" lang="zh-Latn">
          {event.pinyin}
        </p>
      )}
      {!mandarin && showText && event.translation && (
        <p className="dialogue-translation">{event.translation}</p>
      )}
      {event.type === "dialogue" && recorded && (
        <button className="announcement-replay" onClick={replayVoice}>
          {event.characterId === "ANNOUNCEMENT" ? "Replay announcement" : "Replay line"}
        </button>
      )}
      {event.languageNotes && <LanguageNotes notes={event.languageNotes} />}
    </section>
  );
}
