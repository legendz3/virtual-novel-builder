import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";
import { reconcileChapterSixContent } from "./chapterSixContentRevision";
import { restoreArrivalIndex } from "./arrivalProgress";
import { enterChapterBeat } from "./chapterProgress";
import { replayChapterState } from "./storyDecisions";

// Starting over resets the chapter's decisions too; resuming retains unfinished drafts.
export function beginChapterState(
  chapter: ChapterDefinition,
  state: GameState,
  replay = false,
  chapterSix?: ChapterDefinition,
): GameState {
  // The loaded script permits cursor repair before either resume or destination replay.
  const revisedSix = chapter.id === "chapter-six" ? chapter : chapterSix;
  if (revisedSix) state = reconcileChapterSixContent(state, revisedSix);
  const next =
    replay || state.chapterId !== chapter.id ? replayChapterState(chapter, state) : state;
  return enterChapterBeat(chapter, next, restoreArrivalIndex(chapter, next));
}
