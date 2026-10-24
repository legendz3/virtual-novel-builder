import type { StoryEvent } from "@game/story/story.types";
export interface ChapterDefinition {
  id: string;
  label?: string;
  nextChapterId?: string;
  endpointNote?: string;
  sceneId?: string;
  musicId?: string;
  events: readonly StoryEvent[];
}
export type ChapterLoader = (chapterId: string) => Promise<ChapterDefinition>;
export interface AssetManifest {
  backgrounds: Record<string, string>;
  characters: Record<string, string>;
  audio: Record<string, string>;
  props?: Record<string, string>;
  ui?: Record<string, string>;
}
