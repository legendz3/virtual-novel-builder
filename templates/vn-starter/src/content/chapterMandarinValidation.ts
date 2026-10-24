import { containsHan } from "./mandarinSchema";
import { mandarinSpeechIssue, mandarinSpokenText } from "./mandarinSpeech";
import { validateMandarinSupport } from "./mandarinSupportValidation";
import type { ChapterDefinition } from "./content.types";
import type { DialogueEvent, StoryEvent } from "../game/story/story.types";
import type { MandarinSegment } from "../game/learning/mandarin.types";
import { dialogueSpeakerId, validateSpeechBinding } from "./speechRegistry";

const normalized = (value: string) => value.toLocaleLowerCase().replace(/[\s\p{P}]/gu, "");
const sameSegments = (left: readonly MandarinSegment[], right: readonly MandarinSegment[]) =>
  left.length === right.length &&
  left.every((segment, index) => {
    const other = right[index]!;
    return (
      segment.hanzi === other.hanzi &&
      segment.pinyin === other.pinyin &&
      segment.meaning === other.meaning
    );
  });
function supports(
  event: StoryEvent,
  segments: readonly MandarinSegment[],
  sourceId: string,
): boolean {
  if (event.mandarinSupport?.sourceEventId === sourceId) return true;
  if (
    event.type === "dialogue" &&
    event.mandarin?.mode === "supported" &&
    sameSegments(event.mandarin.segments, segments)
  )
    return true;
  if (segments.length !== 1) return false;
  const segment = segments[0]!;
  if (event.type === "title")
    return (
      event.title === segment.hanzi &&
      event.pinyin === segment.pinyin &&
      normalized(event.subtitle) === normalized(segment.meaning)
    );
  return (
    event.type === "narration" &&
    event.text === segment.hanzi &&
    event.pinyin === segment.pinyin &&
    event.translation === segment.meaning
  );
}

export function validateChapterMandarin(chapter: ChapterDefinition): void {
  const events = new Map(chapter.events.map((event, index) => [event.id, { event, index }]));
  const nextIds = (event: StoryEvent): string[] => {
    if (event.type === "choice") return event.options.map((option) => option.targetEventId);
    if (event.type === "comprehension")
      return [event.correctEventId, ...(event.exercise.retryHint ? [] : [event.incorrectEventId])];
    if (event.type === "choice_route") return [event.defaultEventId, ...Object.values(event.cases)];
    if (event.type === "phrase_construction")
      return event.exercise.outcomes.flatMap((outcome) => [
        outcome.targetEventId,
        ...(outcome.assistedTargetEventId ? [outcome.assistedTargetEventId] : []),
      ]);
    if (event.type === "conditional") {
      const next =
        event.nextEventId === undefined
          ? chapter.events[events.get(event.id)!.index + 1]?.id
          : event.nextEventId;
      return [event.targetEventId, ...(next ? [next] : [])];
    }
    if (event.nextEventId !== undefined)
      return event.nextEventId === null ? [] : [event.nextEventId];
    const next = chapter.events[events.get(event.id)!.index + 1];
    return next ? [next.id] : [];
  };
  // A conditional can retain a true target while its false branch ends explicitly or past the array.
  const hasTerminalBranch = (event: StoryEvent): boolean =>
    event.type === "conditional" &&
    (event.nextEventId === null ||
      (event.nextEventId === undefined && !chapter.events[events.get(event.id)!.index + 1]));
  const reachable = (start: string, target: string, forbidden?: string): boolean => {
    const pending = [start];
    const visited = new Set<string>();
    while (pending.length) {
      const id = pending.pop()!;
      if (id === forbidden || visited.has(id)) continue;
      if (id === target) return true;
      visited.add(id);
      const entry = events.get(id);
      if (entry) pending.push(...nextIds(entry.event));
    }
    return false;
  };
  const requireRevealCoverage = (sourceId: string, revealIds: readonly string[]): void => {
    const hosts = new Set(revealIds);
    const pending = [sourceId];
    const visited = new Set<string>();
    while (pending.length) {
      const id = pending.pop()!;
      if (hosts.has(id) || visited.has(id)) continue;
      visited.add(id);
      const event = events.get(id)?.event;
      const outgoing = event ? nextIds(event) : [];
      // Retry cycles may continue, but every reachable branch needs an eventual supported exit.
      // A terminal branch or a closed cycle without any declared reveal is invalid.
      if (
        !outgoing.length ||
        (event !== undefined && hasTerminalBranch(event)) ||
        !revealIds.some((host) => reachable(id, host))
      )
        throw new Error(
          `Mandarin outcome path lacks a declared supported reveal: ${sourceId} → ${id}`,
        );
      pending.push(...outgoing);
    }
  };
  const predecessors = new Map<string, StoryEvent[]>();
  for (const event of chapter.events)
    for (const id of nextIds(event)) predecessors.set(id, [...(predecessors.get(id) ?? []), event]);
  const stimuli = new Map<string, DialogueEvent>();
  // Listening inherits one immediate recorded dialogue on every incoming route. Only narration may separate it.
  // This prevents an unrelated earlier reuse of the same utterance from supplying the visibility contract.
  for (const assessment of chapter.events) {
    if (assessment.type !== "comprehension" || !assessment.exercise.audioId) continue;
    const pending = [...(predecessors.get(assessment.id) ?? [])];
    const visited = new Set<string>();
    const candidates = new Map<string, DialogueEvent>();
    let interrupted = pending.length === 0;
    while (pending.length) {
      const previous = pending.pop()!;
      if (visited.has(previous.id)) continue;
      visited.add(previous.id);
      if (previous.type === "narration") {
        const incoming = predecessors.get(previous.id) ?? [];
        if (!incoming.length) interrupted = true;
        pending.push(...incoming);
      } else if (
        previous.type === "dialogue" &&
        previous.mandarin?.speech.mode === "recorded" &&
        previous.mandarin.speech.audioId === assessment.exercise.audioId &&
        mandarinSpokenText(previous.text, previous.mandarin.speech) === assessment.exercise.question
      )
        candidates.set(previous.id, previous);
      else interrupted = true;
    }
    if (interrupted || candidates.size !== 1)
      throw new Error(
        `Listening assessment requires one immediate matching Mandarin stimulus; only narration may intervene: ${assessment.id}`,
      );
    stimuli.set(assessment.id, [...candidates.values()][0]!);
  }
  validateMandarinSupport(chapter, {
    event: (id) => events.get(id)?.event,
    targets: nextIds,
    hasTerminalBranch,
    reachable,
    stimuli,
  });
  for (const event of chapter.events) {
    const usage = { chapterId: chapter.id, eventId: event.id };
    if (event.type === "dialogue" && containsHan(event.text) && !event.mandarin)
      throw new Error(
        `Chinese dialogue requires a Mandarin speech contract: ${chapter.id}/${event.id}`,
      );
    if (event.type === "dialogue" && event.mandarin) {
      const content = event.mandarin;
      const speechIssue = mandarinSpeechIssue(event.text, content);
      if (speechIssue) throw new Error(`${speechIssue}: ${chapter.id}/${event.id}`);
      if (dialogueSpeakerId(chapter.id, event.characterId) !== content.speakerId)
        throw new Error(`Mandarin speaker does not match dialogue: ${event.id}`);
      if (content.speech.mode === "recorded")
        validateSpeechBinding(
          content.speech.audioId,
          mandarinSpokenText(event.text, content.speech),
          content.speakerId,
          {
            ...usage,
            kind: "dialogue",
          },
        );
      if (content.mode !== "supported") {
        const assessment = chapter.events.find(
          (candidate) => stimuli.get(candidate.id)?.id === event.id,
        );
        for (const id of content.reveal.eventIds) {
          const target = events.get(id);
          if (!target || target.index <= events.get(event.id)!.index || !reachable(event.id, id))
            throw new Error(`Missing or early Mandarin reveal: ${event.id} → ${id}`);
          if (assessment && (id === assessment.id || reachable(event.id, id, assessment.id)))
            throw new Error(`Mandarin reveal precedes assessment resolution: ${event.id}`);
          if (!supports(target.event, content.segments, event.id))
            throw new Error(`Mandarin reveal lacks complete support: ${id}`);
        }
        requireRevealCoverage(event.id, content.reveal.eventIds);
      }
    }
    if (event.type === "comprehension" && event.exercise.audioId) {
      const stimulus = stimuli.get(event.id);
      if (stimulus?.type !== "dialogue" || !stimulus.mandarin)
        throw new Error(`Listening assessment has no matching Mandarin stimulus: ${event.id}`);
      const content = stimulus.mandarin;
      validateSpeechBinding(event.exercise.audioId, event.exercise.question, content.speakerId, {
        ...usage,
        kind: "assessment",
      });
      if (
        (event.exercise.textDisplay === "audio-only") !== (content.mode === "audio-only") ||
        (content.mode !== "supported" && event.exercise.translation !== undefined) ||
        !content.segments.some((segment) => segment.pinyin === event.exercise.pinyin)
      )
        throw new Error(`Assessment conflicts with Mandarin stimulus: ${event.id}`);
    }
    if (event.type === "chapter_end")
      for (const word of event.vocabulary)
        validateSpeechBinding(word.audioId, word.hanzi, word.speakerId, {
          ...usage,
          kind: "vocabulary",
          vocabularyId: word.id,
        });
    if (event.type === "phrase_construction")
      for (const tile of event.exercise.tiles)
        validateSpeechBinding(tile.audioId, tile.text, tile.speakerId, {
          ...usage,
          kind: "phrase-tile",
          tileId: tile.id,
        });
  }
}
