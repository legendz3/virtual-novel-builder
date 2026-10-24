import { validateChapterMandarin } from "./chapterMandarinValidation";
import type { ChapterDefinition } from "./content.types";
import { chapterSchema } from "./chapterSchema";
import { assets } from "./assetManifest";
export const FIRST_CHAPTER_ID = "chapter-one";
export const installedChapterIds = [FIRST_CHAPTER_ID] as const;
async function readChapter(chapterId: string): Promise<ChapterDefinition> {
  const source = chapterId === FIRST_CHAPTER_ID ? await import("./chapters/chapter-one.json") : null;
  if (!source) throw new Error(`Chapter content is not installed: ${chapterId}`);
  const chapter = chapterSchema.parse(source.default);
  validateChapterMandarin(chapter);
  if (chapter.id !== chapterId) throw new Error(`Chapter identity mismatch: ${chapterId}`);
  if (chapter.nextChapterId && !installedChapterIds.some((id) => id === chapter.nextChapterId))
    throw new Error(`Next chapter is not installed: ${chapter.nextChapterId}`);
  if (chapter.musicId) assets.getAudio(chapter.musicId);
  for (const event of chapter.events) {
    if (event.presentation?.backgroundId) assets.getBackground(event.presentation.backgroundId);
    if (event.presentation?.phone) assets.getProp(event.presentation.phone.shellAssetId);
    const foreground = event.presentation?.foreground;
    if (foreground?.kind === "collection") {
      for (const item of foreground.items) if (item.assetId) assets.getProp(item.assetId);
    } else if (foreground && foreground.kind !== "document") assets.getProp(foreground.assetId);
    if (event.presentation?.character) assets.getCharacter(event.presentation.character.assetId);
    if (event.presentation?.ambienceId) assets.getAudio(event.presentation.ambienceId);
    if (event.presentation?.musicId) assets.getAudio(event.presentation.musicId);
    if (event.presentation?.sfx) assets.getAudio(event.presentation.sfx.id);
    if (event.type === "dialogue" && event.audioId) assets.getAudio(event.audioId);
    if (event.type === "comprehension" && event.exercise.audioId)
      assets.getAudio(event.exercise.audioId);
    if (event.type === "phrase_construction")
      for (const tile of event.exercise.tiles) {
        if (tile.audioId) assets.getAudio(tile.audioId);
      }
    if (event.type === "pause" && event.sfxId) assets.getAudio(event.sfxId);
    if (event.type === "title" && event.assetId) assets.getUi(event.assetId);
  }
  return chapter;
}

// External histories are validated against installed source content without recursively loading routes.
export function validateChoiceRouteSources(
  chapter: ChapterDefinition,
  sources: readonly ChapterDefinition[],
): void {
  for (const route of chapter.events) {
    if (route.type !== "choice_route" || !route.sourceChapterId) continue;
    const source = sources.find((item) => item.id === route.sourceChapterId);
    if (!source)
      throw new Error(`Choice route source chapter is not installed: ${route.sourceChapterId}`);
    const choice = source.events.find((item) => item.id === route.choiceEventId);
    const sourceOptions =
      choice?.type === "choice"
        ? choice.options
        : choice?.type === "comprehension"
          ? choice.exercise.options
          : undefined;
    if (
      !sourceOptions ||
      Object.keys(route.cases).some((key) => !sourceOptions.some((option) => option.id === key))
    )
      throw new Error(`Choice route references unknown source choice or option: ${route.id}`);
    // choicesMade uses globally unique event IDs; an external history must never alias a local choice.
    if (source.id !== chapter.id && chapter.events.some((item) => item.id === route.choiceEventId))
      throw new Error(`External choice ID collides with local content: ${route.choiceEventId}`);
  }
}
export async function loadChapter(chapterId: string): Promise<ChapterDefinition> {
  const chapter = await readChapter(chapterId);
  const sourceIds = [
    ...new Set(
      chapter.events.flatMap((event) =>
        event.type === "choice_route" && event.sourceChapterId ? [event.sourceChapterId] : [],
      ),
    ),
  ];
  const sources = await Promise.all(sourceIds.map(readChapter));
  validateChoiceRouteSources(chapter, sources);
  return chapter;
}
