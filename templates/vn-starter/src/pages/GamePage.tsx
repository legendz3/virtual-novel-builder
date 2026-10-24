import { useAuth } from "@/auth/authContext";
import { ListeningPinyin } from "@components/game/ListeningPinyin";
import { listeningQuestion } from "@game/learning/listeningQuestion";
import { useListeningPinyin } from "@game/learning/useListeningPinyin";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PhaserCanvas } from "@components/game/PhaserCanvas";
import { StoryPhone } from "@components/game/StoryPhone";
import { ArrivalPhone } from "@components/game/ArrivalPhone";
import { StoryDialogue } from "@components/game/StoryDialogue";
import { StoryForeground } from "@components/game/StoryForeground";
import { StoryDecisionPanel } from "@components/game/StoryDecisionPanel";
import { ChapterEndPanel } from "@components/game/ChapterEndPanel";
import { ChoiceStatFeedback } from "@components/game/ChoiceStatFeedback";
import { PhraseConstructionPanel } from "@components/game/PhraseConstructionPanel";
import { useSaves } from "@app/providers/saveContext";
import { useGameStore } from "@game/state/gameStore";
import { useChapterScene } from "@game/story/useChapterScene";
import { assets } from "@content/assetManifest";
import "@/styles/arrivalScene.css";
import "@/styles/chapterTwo.css";
import "@/styles/campusScene.css";
import "@/styles/chapterThree.css";
import "@/styles/chapterFour.css";
import "@/styles/storyForeground.css";
import "@/styles/chapterFive.css";
import "@/styles/chapterSix.css";
import "@/styles/chapterSeven.css";
import "@/styles/chapterEight.css";
import "@/styles/chapterNine.css";
import "@/styles/chapterTen.css";
import "@/styles/chapterEleven.css";
import "@/styles/phoneScene.css";

export function GamePage() {
  const { manager, ready: savesReady } = useSaves();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const scene = useChapterScene(searchParams.get("chapter") ?? undefined);
  // Explicit chapter replay is deferred until Begin; merely visiting never changes the save.
  const replayRequested = searchParams.has("chapter") && searchParams.get("replay") === "1";
  const [saveMessage, setSaveMessage] = useState("");
  const continueButton = useRef<HTMLButtonElement>(null);
  const { advance } = scene;
  const begin = (replay = false): void => {
    if (!scene.ready) return;
    scene.begin(replay || replayRequested);
    if (searchParams.has("chapter")) setSearchParams({}, { replace: true });
    setSaveMessage("");
  };
  const event = scene.event;
  const question =
    scene.started && scene.ready && scene.chapter && event
      ? listeningQuestion(scene.chapter, event)
      : undefined;
  const pinyin = useListeningPinyin(authLoading ? undefined : (user?.id ?? "guest"));
  const listeningPinyin = question && event?.type !== "narration" ? pinyin.shown : undefined;
  // Questions share the footer preference; spoken corrections keep authored support.
  const readingPinyin = event?.type === "comprehension" ? pinyin.shown : undefined;
  const phone = event?.presentation?.phone;
  const view = event?.presentation?.view ?? "dark";
  const canAdvance =
    scene.started &&
    scene.ready &&
    !scene.paused &&
    !scene.motionPlaying &&
    event &&
    event.nextEventId !== null &&
    event.type !== "pause" &&
    event.type !== "choice" &&
    event.type !== "comprehension" &&
    event.type !== "phrase_construction" &&
    (event.type !== "title" || scene.titleReady);
  useEffect(() => {
    if (canAdvance) continueButton.current?.focus({ preventScroll: true });
  }, [canAdvance]);
  useEffect(() => {
    const key = (event: KeyboardEvent): void => {
      if (event.repeat || !canAdvance || event.altKey || event.ctrlKey || event.metaKey) return;
      if (
        event.target instanceof Element &&
        event.target.closest("button, a, input, textarea, select, .story-phone")
      )
        return;
      if (event.code === "Space" || event.code === "Enter" || event.code === "ArrowRight") {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [canAdvance, advance]);
  const save = async (): Promise<void> => {
    if (!manager || !savesReady) return;
    const state = useGameStore.getState();
    try {
      await manager.saveGame(state);
      if (useGameStore.getState() === state) useGameStore.setState({ isDirty: false });
      setSaveMessage("Saved locally.");
    } catch {
      setSaveMessage("Local save failed. Please retry.");
    }
  };
  return (
    <main className="arrival-page">
      <h1 className="sr-only">
        {scene.chapter?.label ? `${scene.chapter.label} · Beijing Heartbeat` : "Beijing Heartbeat"}
      </h1>
      <div
        className="game-viewport"
        data-view={view}
        data-phone={scene.paused ? undefined : phone?.mode}
        data-chapter={scene.chapter?.id}
        data-foreground={event?.presentation?.foreground?.kind}
        data-framing={event?.presentation?.character?.framing}
        data-dialogue-placement={event?.presentation?.dialoguePlacement}
        data-decision-placement={event?.presentation?.decisionPlacement}
        data-scene={event?.sceneId}
        data-background={event?.presentation?.backgroundId}
        data-event={event?.id ?? "ready"}
        data-paused={scene.paused}
        data-motion={event?.presentation?.crossingMotion?.shot ?? "none"}
        data-motion-playing={scene.motionPlaying}
      >
        {scene.chapter && (
          <PhaserCanvas
            key={scene.chapter.id}
            artwork={scene.artwork}
            onReady={scene.onRendererReady}
          />
        )}
        <div className="scene-atmosphere" aria-hidden="true" />
        {!scene.started && (
          <section className="scene-start">
            <p className="scene-eyebrow">{scene.chapter?.label?.toUpperCase()}</p>
            <button className="begin-button" disabled={!scene.ready} onClick={() => begin()}>
              {scene.hasProgress && !replayRequested ? "Resume scene" : "Begin"}
              <span aria-hidden="true"> →</span>
            </button>
            <p className="start-note">Best experienced with sound.</p>
            {!scene.ready && !scene.failure && <p role="status">Preparing your scene…</p>}
            {scene.failure && <p role="alert">{scene.failure}</p>}
          </section>
        )}
        {scene.started && !scene.ready && (
          <section className="scene-start">
            <p role="status">Preparing your scene…</p>
          </section>
        )}
        {scene.started && scene.ready && phone && (
          <StoryPhone
            phone={phone}
            shellSrc={assets.getProp(phone.shellAssetId)}
            paused={scene.paused}
            showPinyin={pinyin.shown}
          />
        )}
        {scene.started && scene.ready && !scene.paused && (
          <>
            {event?.presentation?.foreground && (
              <StoryForeground
                foreground={event.presentation.foreground}
                showPinyin={pinyin.shown}
              />
            )}
            {event?.type === "phrase_construction" && scene.phraseDraft && (
              <PhraseConstructionPanel
                key={event.exercise.id}
                exercise={event.exercise}
                draft={scene.phraseDraft}
                muted={scene.muted}
                edit={scene.editPhrase}
                submit={scene.submitPhrase}
              />
            )}
            {view === "phone" && !phone && <ArrivalPhone messages={scene.messages} />}
            {(event?.type === "dialogue" ||
              (event?.type === "narration" && (view !== "phone" || phone))) && (
              <StoryDialogue
                event={event}
                replayVoice={scene.replayVoice}
                support={scene.mandarinSupport}
                listeningPinyin={listeningPinyin}
              />
            )}
            {(event?.type === "choice" || event?.type === "comprehension") && (
              <StoryDecisionPanel
                chapterId={scene.chapter!.id}
                event={event}
                chooseOption={scene.chooseOption}
                replayVoice={scene.replayVoice}
                hint={scene.comprehensionHint}
                support={scene.mandarinSupport}
                listeningPinyin={readingPinyin}
              />
            )}
            {event?.type === "pause" && event.text && (
              <p className="sound-caption" role="status">
                {event.text}
              </p>
            )}
            {event?.type === "title" &&
              (event.assetId ? (
                <section className="scene-title">
                  <h2>
                    <img
                      src={assets.getUi(event.assetId)}
                      alt={`${event.title} — ${event.subtitle}`}
                    />
                  </h2>
                </section>
              ) : (
                <section
                  className="chapter-title-card"
                  key={event.id}
                  aria-labelledby="chapter-title"
                >
                  <p className="scene-eyebrow">{event.eyebrow}</p>
                  <h2 id="chapter-title" lang="zh-Hans">
                    {event.title}
                  </h2>
                  {event.pinyin && (
                    <p className="chapter-title-pinyin" lang="zh-Latn">
                      {event.pinyin}
                    </p>
                  )}
                  <p className="chapter-title-translation">{event.subtitle}</p>
                </section>
              ))}
            {canAdvance && (
              <button
                className="scene-continue"
                ref={continueButton}
                onClick={scene.advance}
                aria-label="Continue story"
              >
                {view === "phone" ? "Continue" : "Next"}
                <span aria-hidden="true"> →</span>
              </button>
            )}
            {event?.type === "chapter_end" && <ChapterEndPanel event={event} muted={scene.muted} />}
            {event?.type === "chapter_end" && scene.nextChapter && (
              <button className="scene-continue chapter-next" onClick={scene.continueChapter}>
                Continue to {scene.nextChapter.label} <span aria-hidden="true">→</span>
              </button>
            )}
            {event?.nextEventId === null &&
              event.type !== "chapter_end" &&
              scene.chapter?.endpointNote && (
                <p className="chapter-endpoint-note">{scene.chapter.endpointNote}</p>
              )}
          </>
        )}
        {scene.paused && (
          <section className="scene-paused">
            <p>Take your time.</p>
            <button className="begin-button" onClick={scene.togglePause}>
              Resume
            </button>
          </section>
        )}
        <ChoiceStatFeedback
          feedback={scene.statFeedback}
          paused={scene.paused}
          onComplete={scene.clearStatFeedback}
        />
      </div>
      <footer className="scene-toolbar" aria-label="Scene controls">
        <Link to="/">← Home</Link>
        <div className="scene-toolbar-actions">
          {((event?.type === "title" && scene.eventIndex > 0) || event?.nextEventId === null) && (
            <button onClick={() => begin(true)}>
              {event?.type === "chapter_end" ? "Replay chapter" : "Replay scene"}
            </button>
          )}
          <button onClick={scene.toggleMute} aria-pressed={scene.muted}>
            {scene.muted ? "Sound off" : "Sound on"}
          </button>
          <ListeningPinyin control={pinyin} />
          {scene.started && (
            <button onClick={scene.togglePause}>{scene.paused ? "Resume" : "Pause"}</button>
          )}
          <button
            disabled={!scene.started || !savesReady}
            onClick={() => {
              void save();
            }}
          >
            Save locally
          </button>
        </div>
        {pinyin.saveFailed && (
          <p className="listening-pinyin-status" role="status">
            Pinyin setting changed for this visit; your browser could not save it.
          </p>
        )}
        <p className="save-feedback" role="status">
          {saveMessage}
        </p>
      </footer>
      {scene.audioFailure && (
        <div className="scene-audio-error" role="status">
          Sound couldn’t start. <button onClick={scene.retryAudio}>Retry audio</button>
        </div>
      )}
    </main>
  );
}
