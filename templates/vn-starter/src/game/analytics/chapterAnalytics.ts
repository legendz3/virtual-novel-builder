import { z } from "zod";
import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";

export type ChapterAnalyticsEvent =
  "chapter_started" | "chapter_resumed" | "chapter_progress" | "chapter_completed";
export type ChapterAnalyticsProperties = Record<string, string | number | boolean>;
export interface ChapterAnalyticsDependencies {
  enabled?: () => boolean;
  capture: (
    event: ChapterAnalyticsEvent,
    properties: ChapterAnalyticsProperties,
    ownerId?: string,
  ) => void;
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  now: () => number;
  uuid: () => string;
}
const runSchema = z.object({
  id: z.string().min(1),
  startObserved: z.boolean(),
  completed: z.boolean(),
  entryMode: z.enum(["start", "replay", "resume"]),
  scenes: z.array(z.string()),
});
type ChapterRun = z.infer<typeof runSchema>;
interface ActiveChapterRun {
  chapter: ChapterDefinition;
  ownerId?: string;
  key: string;
  run: ChapterRun;
  eventIndex: number;
  lastSentEventId?: string;
  lastSentAt: number;
}

// Separate, disposable telemetry storage: analytics never changes the game save or reward state.
export class ChapterAnalytics {
  private active?: ActiveChapterRun;
  constructor(private readonly dependencies: ChapterAnalyticsDependencies) {}

  begin(
    chapter: ChapterDefinition,
    previous: GameState,
    committed: GameState,
    replay: boolean,
  ): void {
    this.finish();
    if (this.dependencies.enabled?.() === false) return;
    const key = `beijing-heartbeat:chapter-analytics:v1:${committed.playerId ?? "guest"}:${chapter.id}`;
    const isResume = !replay && previous.chapterId === chapter.id;
    const event = chapter.events[committed.eventIndex];
    if (!event) return;
    let stored: ChapterRun | undefined;
    try {
      const raw = this.dependencies.read(key);
      const parsed = runSchema.safeParse(raw ? JSON.parse(raw) : null);
      if (parsed.success) stored = parsed.data;
    } catch {
      /* Storage corruption or denial must not prevent play. */
    }
    const run =
      isResume && stored && (!stored.completed || event.type === "chapter_end")
        ? stored
        : {
            id: this.dependencies.uuid(),
            startObserved: !isResume,
            completed: event.type === "chapter_end",
            entryMode: isResume
              ? ("resume" as const)
              : stored
                ? ("replay" as const)
                : ("start" as const),
            scenes: [],
          };
    this.active = {
      chapter,
      ownerId: committed.playerId,
      key,
      run,
      eventIndex: committed.eventIndex,
      lastSentAt: 0,
    };
    this.emit(isResume ? "chapter_resumed" : "chapter_started", { requested_replay: replay });
    // Opening an old terminal save is a resume, never a newly observed completion.
    if (event.type !== "chapter_end") this.progress(committed, true);
    this.persist();
  }

  progress(state: GameState, initial = false): void {
    const active = this.active;
    if (!active || state.chapterId !== active.chapter.id || state.playerId !== active.ownerId)
      return;
    const event = active.chapter.events[state.eventIndex];
    if (!event) return;
    active.eventIndex = state.eventIndex;
    if (event.type === "chapter_end") {
      if (!active.run.completed) {
        active.run.completed = true;
        this.emit("chapter_completed", { $insert_id: `${active.run.id}:completed` });
        active.lastSentEventId = event.id;
      }
      this.persist();
      return;
    }
    if (active.run.completed) return;
    const sceneId = event.sceneId ?? active.chapter.sceneId ?? "unassigned";
    const newScene = !active.run.scenes.includes(sceneId);
    if (newScene) active.run.scenes.push(sceneId);
    if (initial || newScene || this.dependencies.now() - active.lastSentAt >= 30_000) {
      this.flush(newScene ? "scene_entered" : "checkpoint");
    }
    this.persist();
  }

  // Pause, tab hiding and navigation flush the latest committed beat; idle time emits nothing.
  flush(reason = "suspended"): void {
    const active = this.active;
    if (!active || active.run.completed) return;
    const event = active.chapter.events[active.eventIndex]!;
    if (event.id === active.lastSentEventId) return;
    this.emit("chapter_progress", { progress_reason: reason });
    active.lastSentEventId = event.id;
    active.lastSentAt = this.dependencies.now();
  }

  finish(): void {
    this.flush();
    this.active = undefined;
  }

  private persist(): void {
    if (!this.active) return;
    try {
      this.dependencies.write(this.active.key, JSON.stringify(this.active.run));
    } catch {
      /* Telemetry is best effort when localStorage is unavailable. */
    }
  }

  private emit(event: ChapterAnalyticsEvent, extra: ChapterAnalyticsProperties = {}): void {
    const active = this.active!;
    const beat = active.chapter.events[active.eventIndex]!;
    try {
      this.dependencies.capture(
        event,
        {
          analytics_version: 1,
          chapter_id: active.chapter.id,
          chapter_label: active.chapter.label ?? active.chapter.id,
          scene_id: beat.sceneId ?? active.chapter.sceneId ?? "unassigned",
          event_id: beat.id,
          event_type: beat.type,
          run_id: active.run.id,
          entry_mode: active.run.entryMode,
          start_observed: active.run.startObserved,
          completed: active.run.completed,
          scenes_reached: active.run.scenes.length,
          ...extra,
        },
        active.ownerId,
      );
    } catch {
      /* Network/SDK failure must never interrupt progression. */
    }
  }
}
