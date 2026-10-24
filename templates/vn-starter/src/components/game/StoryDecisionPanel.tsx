import { LanguageNotes } from "./LanguageNotes";
import { MandarinQuestionContext, MandarinNaturalMeaning } from "./MandarinSupportText";
import type { ResolvedMandarinSupport } from "@game/learning/mandarinSupport";
import { useEffect, useRef } from "react";
import { meaningChoiceOrder } from "@game/learning/meaningChoiceOrder";
import type { ChoiceEvent, ComprehensionEvent } from "@game/story/story.types";

export function StoryDecisionPanel({
  chapterId,
  event,
  chooseOption,
  replayVoice,
  hint,
  support,
  listeningPinyin,
}: {
  chapterId: string;
  event: ChoiceEvent | ComprehensionEvent;
  chooseOption: (optionId: string) => void;
  replayVoice: () => void;
  hint?: string;
  support?: ResolvedMandarinSupport;
  listeningPinyin?: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  const comprehension = event.type === "comprehension";
  useEffect(() => {
    panel.current
      ?.querySelector<HTMLButtonElement>(".decision-options button")
      ?.focus({ preventScroll: true });
  }, [chapterId, event.id]);
  return (
    <section ref={panel} className="story-decision" aria-labelledby="decision-title" key={event.id}>
      <p className="scene-eyebrow">
        {comprehension ? (event.exercise.presentationLabel ?? "COMPREHENSION CHECK") : "CHOICE"}
      </p>
      {comprehension && (
        <div className="decision-question">
          {event.exercise.textDisplay !== "audio-only" && (
            <>
              <p lang="zh-Hans">{event.exercise.question}</p>
              {listeningPinyin !== false && (
                <p className="dialogue-pinyin" lang="zh-Latn">
                  {event.exercise.pinyin}
                </p>
              )}
              {event.exercise.translation && (
                <p className="dialogue-translation">{event.exercise.translation}</p>
              )}
            </>
          )}
          {event.exercise.textDisplay === "audio-only" && listeningPinyin === true && (
            <p className="dialogue-pinyin" lang="zh-Latn">
              {event.exercise.pinyin}
            </p>
          )}
          {event.exercise.audioId && (
            <button className="announcement-replay" onClick={replayVoice}>
              Replay question
            </button>
          )}
          {event.exercise.readingAids && (
            <div className="decision-reading-aids" aria-label="Reading support">
              {event.exercise.readingAids.map((aid) => (
                <p key={aid.hanzi}>
                  <span lang="zh-Hans">{aid.hanzi}</span>
                  {listeningPinyin !== false && (
                    <>
                      {" · "}
                      <span lang="zh-Latn">{aid.pinyin}</span>
                    </>
                  )}
                  {" · "}
                  <span lang="en">{aid.meaning}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {support?.kind === "question-context" && <MandarinQuestionContext support={support} />}
      <h2 id="decision-title">
        {comprehension ? (
          event.exercise.prompt
        ) : support?.kind === "natural-meaning" ? (
          <MandarinNaturalMeaning text={event.prompt ?? ""} support={support} />
        ) : (
          event.prompt
        )}
      </h2>
      {hint && (
        <p className="decision-hint" role="status">
          {hint}
        </p>
      )}
      {event.type === "choice" && event.languageNotes && (
        <LanguageNotes notes={event.languageNotes} />
      )}
      <div className="decision-options">
        {comprehension
          ? meaningChoiceOrder(chapterId, event.id, event.exercise.options).map((option, index) => (
              <button key={option.id} onClick={() => chooseOption(option.id)}>
                <span className="option-letter" aria-hidden="true">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option.text}</span>
              </button>
            ))
          : event.options.map((option) => (
              <button key={option.id} onClick={() => chooseOption(option.id)}>
                <span className="choice-label">{option.text}</span>
                {option.quote && (
                  <span
                    className="choice-quote"
                    lang={/\p{Script=Han}/u.test(option.quote) ? "zh-Hans" : undefined}
                  >
                    {option.quote}
                  </span>
                )}
                {option.pinyin && (
                  <span className="choice-pinyin" lang="zh-Latn">
                    {option.pinyin}
                  </span>
                )}
                {option.translation && (
                  <span className="choice-translation">{option.translation}</span>
                )}
              </button>
            ))}
      </div>
    </section>
  );
}
