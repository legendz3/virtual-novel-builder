import type { ChapterDefinition } from "@content/content.types";
import type { ComprehensionEvent, StoryEvent } from "@game/story/story.types";

// Loaded chapters validate a unique recorded stimulus with only narration before its question.
// Follow that exact occurrence, never a later reuse of the same recording.
export function listeningQuestion(
  chapter: ChapterDefinition,
  event: StoryEvent,
): ComprehensionEvent | undefined {
  if (event.type === "comprehension") return event.exercise.audioId ? event : undefined;
  if (event.type !== "dialogue" && event.type !== "narration") return;
  const source = event;
  const seen = new Set<string>();
  let current: StoryEvent | undefined = event;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const index = chapter.events.indexOf(current);
    current =
      current.nextEventId === undefined
        ? chapter.events[index + 1]
        : chapter.events.find((item) => item.id === current!.nextEventId);
    if (current?.type === "comprehension" && current.exercise.audioId) {
      if (
        source.type === "narration" ||
        (source.mandarin?.speech.mode === "recorded" &&
          source.mandarin.speech.audioId === current.exercise.audioId &&
          source.text === current.exercise.question)
      )
        return current;
      return;
    }
    if (current?.type !== "narration") return;
  }
}
