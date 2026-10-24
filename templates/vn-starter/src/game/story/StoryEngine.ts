import { loadChapter } from "@content/chapterLoader";
import type { ChapterDefinition, ChapterLoader } from "@content/content.types";
import type { StoryEvent } from "./story.types";
// This cursor does not execute events or own persistent game state. The React-side controller will apply events.
export class StoryEngine {
  private chapter: ChapterDefinition | null = null;
  private index = -1;
  private generation = 0;
  constructor(private readonly loader: ChapterLoader = loadChapter) {}
  async loadChapter(chapterId: string): Promise<void> {
    const generation = ++this.generation;
    const chapter = await this.loader(chapterId);
    if (generation !== this.generation) return;
    if (
      chapter.id !== chapterId ||
      new Set(chapter.events.map((event) => event.id)).size !== chapter.events.length
    )
      throw new Error("Invalid chapter identity or duplicate event IDs");
    this.chapter = chapter;
    this.index = -1;
  }
  start(): StoryEvent | null {
    if (!this.chapter) throw new Error("Load a chapter before starting");
    this.index = 0;
    return this.current();
  }
  current(): StoryEvent | null {
    return this.chapter?.events[this.index] ?? null;
  }
  next(): StoryEvent | null {
    const event = this.current();
    if (
      event?.type === "choice" ||
      event?.type === "comprehension" ||
      event?.type === "phrase_construction"
    )
      return event;
    if (event?.nextEventId === null) return null;
    if (event?.nextEventId) return this.goto(event.nextEventId);
    if (this.chapter) this.index = Math.min(this.index + 1, this.chapter.events.length);
    return this.current();
  }
  goto(eventId: string): StoryEvent {
    const index = this.chapter?.events.findIndex((event) => event.id === eventId) ?? -1;
    if (index < 0) throw new Error(`Unknown event: ${eventId}`);
    this.index = index;
    return this.chapter!.events[index]!;
  }
  reset(): void {
    this.generation++;
    this.chapter = null;
    this.index = -1;
  }
}
