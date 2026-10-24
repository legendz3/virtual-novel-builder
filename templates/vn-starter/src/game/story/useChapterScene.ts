import {
  resolveMandarinSupport,
  recordAdvancedMandarinSupport,
  type MandarinSupportSession,
} from "../learning/mandarinSupport";
import { chapterArtwork } from "@content/chapterArtwork";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSaves } from "@app/providers/saveContext";
import { FIRST_CHAPTER_ID, installedChapterIds, loadChapter } from "@content/chapterLoader";
import type { ChapterDefinition } from "@content/content.types";
import { AudioManager } from "@game/audio/AudioManager";
import { ArrivalAudio } from "@game/audio/ArrivalAudio";
import { useGameStore } from "@game/state/gameStore";
import { phaserBridge } from "@phaser/PhaserBridge";
import { StoryEngine } from "./StoryEngine";
import { arrivalPhoneMessages } from "./arrivalProgress";
import { choiceStatChanges, chooseStoryOption } from "./storyDecisions";
import { beginChapterState } from "./chapterEntry";
import { enterChapterBeat } from "./chapterProgress";
import { storyStatChanges } from "./storyEffects";
import { readPhraseDraft } from "@game/learning/phraseConstruction";
import type { PhraseEdit } from "@game/learning/phraseConstruction.types";
import {
  editPhraseConstruction,
  phraseDraftKey,
  submitPhraseConstruction,
} from "./phraseConstructionProgress";
import type { StoryEffect } from "./story.types";
import { createChapterAnalytics } from "@game/analytics/posthogClient";

export function useChapterScene(requestedChapterId?: string) {
  const { ready: savesReady, manager: saveManager } = useSaves();
  const [chapters, setChapters] = useState<ReadonlyMap<string, ChapterDefinition> | null>(null);
  // A home-page chapter selection takes effect only when Begin is pressed, after save hydration.
  const [selection, setSelection] = useState(requestedChapterId);
  const [rendererChapterId, setRendererChapterId] = useState<string>();
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [audioFailure, setAudioFailure] = useState(false);
  const [audio] = useState(() => new AudioManager());
  const [arrivalAudio] = useState(() => new ArrivalAudio(audio));
  const [chapterAnalytics] = useState(createChapterAnalytics);
  const [titleReady, setTitleReady] = useState(false);
  const [animateMotion, setAnimateMotion] = useState(false);
  const [motionPlaying, setMotionPlaying] = useState(false);
  // Transient feedback never enters saves or replays on resume.
  const [statFeedback, setStatFeedback] = useState<{
    eventId: string;
    changes: StoryEffect[];
  } | null>(null);
  const clearStatFeedback = useCallback(() => setStatFeedback(null), []);
  const [supportState, setSupportState] = useState({
    manager: saveManager,
    ready: savesReady,
    evidence: undefined as MandarinSupportSession | undefined,
  });
  // Reset derived session state during a provider-boundary render, before exposing context from another save.
  if (supportState.manager !== saveManager || supportState.ready !== savesReady)
    setSupportState({ manager: saveManager, ready: savesReady, evidence: undefined });
  const activeSession = useRef(false);
  const sessionPaused = useRef(false);
  // SaveProvider hydrates before ready and remounts on account changes. Its manager boundary resets text evidence.
  useEffect(() => {
    activeSession.current = false;
    chapterAnalytics.finish();
  }, [chapterAnalytics, saveManager, savesReady]);
  const audioSession = useRef(0);
  const engines = useRef(new Map<string, StoryEngine>());
  const eventIndex = useGameStore((state) => state.eventIndex);
  const savedChapterId = useGameStore((state) => state.chapterId);
  const storyVariables = useGameStore((state) => state.storyVariables);
  const choicesMade = useGameStore((state) => state.choicesMade);
  const chapter = chapters?.get(selection ?? savedChapterId ?? FIRST_CHAPTER_ID);
  const hasProgress = Boolean(chapter && savedChapterId === chapter.id);
  const rendererReady = chapter !== undefined && rendererChapterId === chapter.id;
  const artwork = useMemo(() => (chapter ? chapterArtwork(chapter.events) : []), [chapter]);
  const ready = savesReady && rendererReady;
  const event = started ? chapter?.events[eventIndex] : null;
  const phraseDraft =
    chapter && event?.type === "phrase_construction"
      ? readPhraseDraft(event.exercise, storyVariables[phraseDraftKey(chapter.id, event.id)])
      : null;
  // A late callback records only its original chapter; it cannot unlock a newer selection.
  const onRendererReady = useCallback(() => setRendererChapterId(chapter?.id), [chapter?.id]);

  useEffect(() => {
    let active = true;
    // Preload installed scripts so chapter transitions stay synchronous inside the user gesture.
    void Promise.all(
      installedChapterIds.map(async (id) => {
        const definition = await loadChapter(id);
        const cursor = new StoryEngine(async () => definition);
        await cursor.loadChapter(id);
        return { definition, cursor };
      }),
    )
      .then((loaded) => {
        if (active) {
          engines.current = new Map(
            loaded.map(({ definition, cursor }) => [definition.id, cursor]),
          );
          setChapters(new Map(loaded.map(({ definition }) => [definition.id, definition])));
        }
      })
      .catch(() => {
        if (active) setFailure("The chapter could not load. Reload to retry.");
      });
    return () => {
      active = false;
      activeSession.current = false;
      engines.current.clear();
      audioSession.current = -1;
      audio.stopAll();
      chapterAnalytics.finish();
    };
  }, [audio, chapterAnalytics]);

  const reportAudio = useCallback((playback: Promise<void>): void => {
    const session = audioSession.current;
    void playback.catch((error: unknown) => {
      if (
        session !== audioSession.current ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
      setAudioFailure(true);
    });
  }, []);
  const begin = (replay = false): void => {
    const engine = chapter ? engines.current.get(chapter.id) : undefined;
    if (!ready || !engine || !chapter) return;
    // Ignore a retained pre-Begin callback fired twice before React replaces the entry screen.
    if (activeSession.current && !started) return;
    const previous = useGameStore.getState();
    const committed = beginChapterState(chapter, previous, replay, chapters?.get("chapter-six"));
    const first = chapter.events[committed.eventIndex]!;
    engine.goto(first.id);
    useGameStore.setState(committed);
    chapterAnalytics.begin(chapter, previous, committed, replay);
    setSupportState({ manager: saveManager, ready: savesReady, evidence: undefined });
    activeSession.current = true;
    sessionPaused.current = false;
    setSelection(undefined);
    setStarted(true);
    setPaused(false);
    clearStatFeedback();
    // Saved beats restore their final framing without replaying the stumble.
    setAnimateMotion(false);
    setMotionPlaying(false);
    setAudioFailure(false);
    audioSession.current++;
    reportAudio(arrivalAudio.enter(chapter, first, true));
  };
  const advance = useCallback(() => {
    const engine = chapter ? engines.current.get(chapter.id) : undefined;
    if (
      !ready ||
      !activeSession.current ||
      !started ||
      sessionPaused.current ||
      paused ||
      motionPlaying ||
      !chapter ||
      !engine
    )
      return;
    const current = engine.current();
    const previous = useGameStore.getState();
    // A stale callback must neither skip a rendered beat nor manufacture exposure for the engine's newer beat.
    if (
      !event ||
      current !== event ||
      previous.chapterId !== chapter.id ||
      chapter.events[previous.eventIndex] !== event
    )
      return;
    if (
      current?.type === "choice" ||
      current?.type === "comprehension" ||
      current?.type === "phrase_construction"
    )
      return;
    if (current?.type === "title" && !titleReady) return;
    const candidate = engine.next();
    if (!candidate || candidate.id === current.id) return;
    const index = chapter.events.findIndex((item) => item.id === candidate.id);
    const committed = enterChapterBeat(chapter, previous, index);
    const next = chapter.events[committed.eventIndex]!;
    if (next.id === current.id) {
      engine.goto(current.id);
      return;
    }
    engine.goto(next.id);
    const motion = next.presentation?.crossingMotion;
    const animate = Boolean(
      motion &&
      motion.shot !== "close" &&
      motion.durationMs > 0 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setAnimateMotion(animate);
    setMotionPlaying(animate);
    useGameStore.setState(committed);
    chapterAnalytics.progress(committed);
    setSupportState((state) => ({
      ...state,
      evidence: recordAdvancedMandarinSupport(state.evidence, chapter.id, current),
    }));
    const changes = storyStatChanges(next.effects ?? [], previous, committed);
    if (changes.length) setStatFeedback({ eventId: next.id, changes });
    // Reward notices belong to the conversation, not the fade or vocabulary ending.
    if (next.presentation?.view === "fade-out" || next.type === "chapter_end") clearStatFeedback();
    reportAudio(arrivalAudio.enter(chapter, next));
  }, [
    arrivalAudio,
    chapter,
    chapterAnalytics,
    event,
    clearStatFeedback,
    motionPlaying,
    paused,
    reportAudio,
    started,
    ready,
    titleReady,
  ]);

  const nextChapter = chapter?.nextChapterId ? chapters?.get(chapter.nextChapterId) : undefined;
  const continueChapter = (): void => {
    if (!ready || !started || paused || !chapter || !nextChapter) return;
    // Check the committed cursor as well as the rendered beat to ignore a stale double click.
    const state = useGameStore.getState();
    if (state.chapterId !== chapter.id || chapter.events[state.eventIndex]?.type !== "chapter_end")
      return;
    const cursor = engines.current.get(nextChapter.id);
    if (!cursor) return;
    const committed = beginChapterState(nextChapter, state, false, chapters?.get("chapter-six"));
    const first = nextChapter.events[committed.eventIndex]!;
    cursor.goto(first.id);
    useGameStore.setState(committed);
    chapterAnalytics.begin(nextChapter, state, committed, false);
    setSupportState({ manager: saveManager, ready: savesReady, evidence: undefined });
    clearStatFeedback();
    setTitleReady(false);
    setAnimateMotion(false);
    setMotionPlaying(false);
    setAudioFailure(false);
    audioSession.current++;
    reportAudio(arrivalAudio.enter(nextChapter, first, true));
  };

  const chooseOption = (optionId: string): void => {
    const engine = chapter ? engines.current.get(chapter.id) : undefined;
    if (!ready || !started || paused || !chapter || !event || !engine) return;
    const previous = useGameStore.getState();
    const next = chooseStoryOption(chapter, previous, event.id, optionId);
    if (next === previous) return;
    useGameStore.setState(next);
    chapterAnalytics.progress(next);
    const changes = choiceStatChanges(event, previous, next);
    setStatFeedback(changes.length ? { eventId: event.id, changes } : null);
    const destination = chapter.events[next.eventIndex]!;
    engine.goto(destination.id);
    setAnimateMotion(false);
    setMotionPlaying(false);
    reportAudio(arrivalAudio.enter(chapter, destination));
  };

  const editPhrase = (action: PhraseEdit): void => {
    if (!ready || !started || paused || !chapter || event?.type !== "phrase_construction") return;
    useGameStore.setState((state) => editPhraseConstruction(chapter, state, event.id, action));
  };
  const submitPhrase = (): void => {
    const engine = chapter ? engines.current.get(chapter.id) : undefined;
    if (
      !ready ||
      !started ||
      paused ||
      !chapter ||
      !engine ||
      event?.type !== "phrase_construction"
    )
      return;
    const previous = useGameStore.getState();
    const next = submitPhraseConstruction(chapter, previous, event.id);
    if (previous === next) return;
    useGameStore.setState(next);
    if (next.eventIndex === previous.eventIndex) return;
    chapterAnalytics.progress(next);
    const outcome = event.exercise.outcomes.find((item) => item.id === next.choicesMade[event.id]);
    const changes = storyStatChanges(outcome?.effects ?? [], previous, next);
    setStatFeedback(changes.length ? { eventId: event.id, changes } : null);
    const destination = chapter.events[next.eventIndex]!;
    engine.goto(destination.id);
    reportAudio(arrivalAudio.enter(chapter, destination));
  };

  useEffect(() => {
    if (!rendererReady) return;
    phaserBridge.clearScene();
    const backgroundId = event?.presentation?.backgroundId;
    if (backgroundId) phaserBridge.setBackground(backgroundId);
    const character = event?.presentation?.character;
    if (character) phaserBridge.showCharacter(character.id, character.assetId, character.framing);
    let active = true;
    const motion = event?.presentation?.crossingMotion;
    if (motion)
      phaserBridge.playCrossingMotion(motion, animateMotion, () => {
        if (active) setMotionPlaying(false);
      });
    return () => {
      active = false;
    };
  }, [animateMotion, event, rendererReady]);
  useEffect(() => {
    if (rendererReady) phaserBridge.setMotionPaused(paused);
  }, [paused, rendererReady]);
  useEffect(() => {
    if (!ready || event?.type !== "pause" || paused) return;
    const timer = window.setTimeout(advance, event.durationMs);
    return () => window.clearTimeout(timer);
  }, [advance, event, paused, ready]);
  useEffect(() => {
    if (!ready || event?.type !== "title" || paused) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 5200;
    const timer = window.setTimeout(() => setTitleReady(true), delay);
    return () => {
      window.clearTimeout(timer);
      setTitleReady(false);
    };
  }, [event, paused, ready]);
  useEffect(() => {
    const hide = (): void => {
      if (document.hidden && started) {
        chapterAnalytics.flush();
        audio.pauseAll();
        sessionPaused.current = true;
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", hide);
    const leave = () => chapterAnalytics.flush();
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };
  }, [audio, chapterAnalytics, started]);
  const togglePause = (): void => {
    if (paused) reportAudio(audio.resumeAll());
    else {
      audio.pauseAll();
      chapterAnalytics.flush();
    }
    sessionPaused.current = !paused;
    setPaused(!paused);
  };
  const toggleMute = (): void => {
    audio.setMuted(!muted);
    setMuted(!muted);
  };
  const retryAudio = (): void => {
    setAudioFailure(false);
    reportAudio(audio.resumeAll());
    sessionPaused.current = false;
    setPaused(false);
  };
  const replayVoice = (): void => {
    if (!chapter || !event || paused) return;
    setAudioFailure(false);
    reportAudio(arrivalAudio.replayVoice(event));
  };
  return {
    chapter,
    nextChapter,
    continueChapter,
    ready,
    started,
    paused,
    muted,
    failure:
      failure ??
      (chapters && !chapter
        ? "This chapter is not installed. Your saved progress is preserved."
        : null),
    audioFailure,
    event,
    eventIndex,
    titleReady,
    motionPlaying,
    statFeedback,
    clearStatFeedback,
    hasProgress,
    messages: chapter ? arrivalPhoneMessages(chapter, eventIndex) : [],
    onRendererReady,
    artwork,
    begin,
    advance,
    chooseOption,
    phraseDraft,
    mandarinSupport: chapter
      ? resolveMandarinSupport(chapter.events, event ?? undefined, choicesMade, {
          chapterId: chapter.id,
          session: supportState.evidence,
        })
      : undefined,
    comprehensionHint:
      event?.type === "comprehension" &&
      choicesMade[event.id] &&
      choicesMade[event.id] !== event.exercise.correctOptionId
        ? event.exercise.retryHint
        : undefined,
    editPhrase,
    submitPhrase,
    togglePause,
    toggleMute,
    retryAudio,
    replayVoice,
  };
}
