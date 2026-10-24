import { PhraseTileContent } from "./PhraseTileContent";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import type {
  PhraseConstructionExercise,
  PhraseDraft,
  PhraseEdit,
} from "@game/learning/phraseConstruction.types";
import { phraseConstructionCopy as copy } from "@content/phraseConstructionCopy";
import { PhraseSpeakerButton } from "./PhraseSpeakerButton";
import { usePhraseAudio } from "@game/audio/usePhraseAudio";
import { phraseTileOrder } from "@game/learning/phraseTileOrder";
import "@/styles/phraseConstruction.css";

interface PhraseConstructionPanelProps {
  exercise: PhraseConstructionExercise;
  draft: PhraseDraft;
  muted: boolean;
  edit: (action: PhraseEdit) => void;
  submit: () => void;
}

/** Exercise identity owns local lookup/audio lifetime, including callers without an external key. */
export function PhraseConstructionPanel(props: PhraseConstructionPanelProps) {
  return <PhraseExercisePanel key={props.exercise.id} {...props} />;
}

function PhraseExercisePanel({
  exercise,
  draft,
  muted,
  edit,
  submit,
}: PhraseConstructionPanelProps) {
  const panel = useRef<HTMLElement>(null);
  const coaching = useRef<HTMLDivElement>(null);
  const pronunciation = usePhraseAudio(muted);
  const bankTiles = useMemo(() => phraseTileOrder(exercise), [exercise]);
  const hasAudio = true;
  // Every phrase builder starts with hidden translations and offers free local lookup.
  const [meaningsRevealed, setMeaningsRevealed] = useState(false);
  const remaining = draft.tiles.filter((id) => !id).length;
  const coachingPreface = draft.coaching ? exercise.coaching[draft.coaching].preface : undefined;
  const showMeanings = meaningsRevealed;
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, [exercise.id]);
  useEffect(() => {
    if (draft.coaching) coaching.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [draft.coaching]);
  const dragTile = (event: DragEvent, id: string) => {
    event.dataTransfer.setData("application/x-phrase-tile", id);
    event.dataTransfer.effectAllowed = "move";
  };
  const dropTile = (event: DragEvent, slotIndex: number) => {
    event.preventDefault();
    const tileId = event.dataTransfer.getData("application/x-phrase-tile");
    if (exercise.tiles.some((tile) => tile.id === tileId))
      edit({ type: "place", tileId, slotIndex });
  };
  return (
    <section
      className="phrase-builder"
      ref={panel}
      tabIndex={-1}
      aria-labelledby="phrase-title"
      data-audio={hasAudio}
    >
      {exercise.showQuestion !== false && (
        <header className="phrase-header">
          <p className="dialogue-speaker">{exercise.characterId}</p>
          <p className="phrase-question" lang="zh-Hans">
            {exercise.question}
          </p>
          <p className="phrase-question-support">
            <span lang="zh-Latn">{exercise.pinyin}</span> · {exercise.translation}
          </p>
        </header>
      )}
      <h2 id="phrase-title">{exercise.title}</h2>
      <p className="phrase-goal">{exercise.goal}</p>
      <div className="phrase-section-label">
        <h3>{copy.sentence}</h3>
        <button
          className="phrase-clear"
          onClick={() => edit({ type: "clear" })}
          disabled={remaining === draft.tiles.length}
        >
          {copy.clear}
        </button>
      </div>
      <div
        className="phrase-slots"
        style={{ "--phrase-slots": exercise.slots.length } as CSSProperties}
      >
        {exercise.slots.map((slot, index) => {
          const tile = exercise.tiles.find((item) => item.id === draft.tiles[index]);
          return (
            <div
              className="phrase-slot"
              key={slot.role}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropTile(event, index)}
              data-filled={Boolean(tile)}
            >
              {exercise.showSlotLabels !== false && (
                <span className="phrase-slot-label">{slot.label}</span>
              )}
              <button
                data-slot={index}
                draggable={Boolean(tile)}
                onDragStart={(event) => {
                  if (tile) dragTile(event, tile.id);
                }}
                onClick={() => {
                  if (tile) edit({ type: "remove", slotIndex: index });
                }}
                aria-label={
                  tile
                    ? copy.remove(tile.pinyin ? `${tile.text}, ${tile.pinyin}` : tile.text)
                    : `${slot.label}: ${copy.empty}`
                }
                title={showMeanings ? tile?.meaning : undefined}
              >
                {tile ? (
                  <span className="phrase-placed" key={tile.id}>
                    <PhraseTileContent tile={tile} showMeanings={showMeanings} />
                  </span>
                ) : (
                  <span className="phrase-empty" aria-hidden="true">
                    ＋
                  </span>
                )}
              </button>
              {tile && (
                <PhraseSpeakerButton
                  tile={tile}
                  location="slot"
                  playing={pronunciation.activeTileId === tile.id}
                  muted={muted}
                  playPhrase={pronunciation.playPhrase}
                />
              )}
            </div>
          );
        })}
      </div>
      {draft.coaching && (
        <div className="phrase-coaching" ref={coaching} role="status" aria-live="polite">
          {coachingPreface && (
            <p>
              <strong>{coachingPreface.characterId}</strong> {coachingPreface.text}
            </p>
          )}
          <p>
            <strong>{exercise.characterId}</strong> {exercise.coaching[draft.coaching].line}
          </p>
          <p>{exercise.coaching[draft.coaching].explanation}</p>
          {exercise.helpWording && <p>{exercise.helpWording}</p>}
          <button onClick={() => edit({ type: "help" })}>
            {exercise.actionLabels?.help ?? copy.help}
          </button>
        </div>
      )}
      <div className="phrase-section-label">
        <h3>{copy.phrases}</h3>
        <button
          className="phrase-meanings-toggle"
          aria-pressed={meaningsRevealed}
          onClick={() => setMeaningsRevealed((revealed) => !revealed)}
        >
          {meaningsRevealed ? copy.hideMeanings : copy.showMeanings}
        </button>
      </div>
      <p className="phrase-instruction" id="phrase-instruction">
        {copy.instruction}
      </p>
      <div className="phrase-bank" aria-describedby="phrase-instruction">
        {bankTiles.map((tile) => {
          const placed = draft.tiles.includes(tile.id);
          const playing = pronunciation.activeTileId === tile.id;
          return (
            <div className="phrase-tile" key={tile.id}>
              <button
                className="phrase-select"
                data-tile={tile.id}
                data-placed={placed}
                disabled={placed}
                draggable={!placed}
                title={showMeanings ? tile.meaning : undefined}
                aria-label={copy.add(
                  tile.pinyin ? `${tile.text}, ${tile.pinyin}` : tile.text,
                  showMeanings ? tile.meaning : undefined,
                )}
                onDragStart={(event) => dragTile(event, tile.id)}
                onClick={() => edit({ type: "place", tileId: tile.id })}
              >
                <PhraseTileContent tile={tile} showMeanings={showMeanings} />
              </button>
              {
                <PhraseSpeakerButton
                  tile={tile}
                  location="bank"
                  playing={playing}
                  muted={muted}
                  playPhrase={pronunciation.playPhrase}
                />
              }
            </div>
          );
        })}
      </div>
      {hasAudio && (
        <p className="phrase-audio-status" role="status">
          {muted
            ? copy.audioMuted
            : pronunciation.failed
              ? copy.audioFailed
              : copy.audioInstruction}
        </p>
      )}
      <footer className="phrase-actions">
        <span aria-live="polite">{remaining ? copy.remaining(remaining) : copy.full}</span>
        <button
          className="phrase-submit"
          disabled={remaining > 0}
          onClick={() => {
            // Release pronunciation synchronously before the accepted dialogue starts its voice.
            pronunciation.stopPhrase();
            submit();
          }}
        >
          {exercise.actionLabels?.submit ?? copy.submit} <span aria-hidden="true">→</span>
        </button>
      </footer>
    </section>
  );
}
