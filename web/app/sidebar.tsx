"use client";

import { useCallback, useEffect, useState } from "react";

// Mirrors STAGES in backend/novel_builder/tools.py.
export const STAGES: [string, string][] = [
  ["writer", "Writer — script"],
  ["script_review", "Your script review"],
  ["director", "Director — plan"],
  ["graphic_designer", "Graphic designer — art"],
  ["director_review", "Director — art review"],
  ["art_review", "Your art approval"],
  ["developer", "Developer — build"],
  ["qa", "QA"],
  ["docs", "Documentation"],
];
// Older stories (e.g. Beijing Heartbeat) record finished stages as complete/approved/passed.
const DONE = new Set(["done", "complete", "approved", "passed"]);

type Status = Record<string, unknown>;
export type Chapter = { chapter: number; status: Status; in_game?: boolean };
export type Story = { id: string; title: string; path: string; available: boolean; error?: string; chapters: Chapter[] };
export type Selection = { story?: string; chapter?: number };
type PlayState = { state: "stopped" | "starting" | "running" | "error"; url?: string; message?: string };

// Stage names used by older stories (the Beijing Heartbeat coordinator) for the same pipeline steps.
const ALIASES: Record<string, string[]> = {
  graphic_designer: ["art"],
  director_review: ["directorReview"],
  developer: ["implementation"],
  docs: ["documentation"],
};
const isDone = (status: Status, key: string) =>
  status.complete === true || [key, ...(ALIASES[key] ?? [])].some((k) => DONE.has(String(status[k])));

function chapterSummary({ status, in_game }: Chapter): string {
  if (status.complete === true) return "complete";
  const done = STAGES.filter(([key]) => isDone(status, key)).length;
  if (done) return `${done}/${STAGES.length} stages`;
  return in_game ? "in game · no production record" : "not started";
}

async function api<T>(path: string, method: "GET" | "POST" = "GET"): Promise<T> {
  const res = await fetch(`/api/backend/${path}`, { method, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Stories → chapters, polled every 5 s from the backend (status.json files are the source of truth). */
export function useStories() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setStories((await api<{ stories: Story[] }>("stories")).stories);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), 5000);
    return () => clearInterval(timer);
  }, [reload]);
  return { stories, error, reload };
}

function PipelineStages({ status, live }: { status: Status; live?: Status }) {
  // status.json wins: update_status writes it at the same moment, and a restored thread's state can be stale.
  const merged = { ...(live ?? {}), ...status };
  const active = STAGES.find(([key]) => !isDone(merged, key))?.[0];
  return (
    <ol className="stages">
      {STAGES.map(([key, label]) => (
        <li key={key} className={isDone(merged, key) ? "done" : key === active ? "active" : ""}>
          <span className="dot" />
          {label}
        </li>
      ))}
    </ol>
  );
}

function PlayLink({ story }: { story: string }) {
  const [play, setPlay] = useState<PlayState>({ state: "stopped" });
  const path = `stories/${encodeURIComponent(story)}/play`;
  useEffect(() => {
    void api<PlayState>(path).then(setPlay).catch(() => {});
  }, [path]);
  useEffect(() => {
    if (play.state !== "starting") return;
    const timer = setInterval(() => void api<PlayState>(path).then(setPlay).catch(() => {}), 1500);
    return () => clearInterval(timer);
  }, [play.state, path]);

  if (play.state === "running" && play.url)
    return (
      <a className="button primary play" href={play.url} target="_blank" rel="noopener noreferrer">
        Play ↗
      </a>
    );
  return (
    <div className="play-row">
      <button
        className="primary"
        disabled={play.state === "starting"}
        onClick={() => void api<PlayState>(path, "POST").then(setPlay).catch((e) => setPlay({ state: "error", message: e.message }))}
      >
        {play.state === "starting" ? "Starting game…" : "Play this story"}
      </button>
      {play.message && <p className={play.state === "error" ? "error" : "muted"}>{play.message}</p>}
    </div>
  );
}

function InlineForm({ label, placeholder, submit }: { label: string; placeholder: string; submit: (v: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return <button className="link" onClick={() => setOpen(true)}>{label}</button>;
  return (
    <form
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await submit(value.trim());
          setValue("");
          setOpen(false);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input aria-label={label} autoFocus placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="row">
        <button className="primary" type="submit" disabled={!value.trim() || busy}>{busy ? "Working…" : "Add"}</button>
        <button type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export function StoriesSidebar({
  stories,
  error,
  reload,
  selection,
  select,
  liveStatus,
}: {
  stories: Story[] | null;
  error: string | null;
  reload: () => Promise<void>;
  selection: Selection;
  select: (s: Selection) => void;
  liveStatus?: Status;
}) {
  return (
    <nav className="stories" aria-label="Stories">
      <div className="stories-head">
        <h1>Stories</h1>
        <div className="row">
          <InlineForm
            label="+ New story"
            placeholder="Story title"
            submit={async (title) => {
              const story = await api<Story>(`stories/new?title=${encodeURIComponent(title)}`, "POST");
              await reload();
              select({ story: story.id });
            }}
          />
          <InlineForm
            label="Load folder"
            placeholder="/Users/you/Documents/My Story"
            submit={async (path) => {
              const story = await api<Story>(`stories/load?path=${encodeURIComponent(path)}`, "POST");
              await reload();
              select({ story: story.id });
            }}
          />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {stories === null && !error && <p className="muted">Loading stories…</p>}
      {stories?.length === 0 && <p className="muted">No stories yet. Create one or load a project folder.</p>}
      <ul className="story-list">
        {stories?.map((story) => {
          const open = selection.story === story.id;
          const next = Math.max(0, ...story.chapters.map((c) => c.chapter)) + 1;
          return (
            <li key={story.id} className={open ? "open" : ""}>
              <button
                className={`story-title ${open && !selection.chapter ? "selected" : ""}`}
                onClick={() => select({ story: story.id })}
                title={story.path}
              >
                {story.title}
              </button>
              {open && (
                <div className="story-body">
                  {story.error && <p className="error">{story.error}</p>}
                  <ul className="chapter-list">
                    {story.chapters.map((c) => {
                      const selected = selection.chapter === c.chapter;
                      return (
                        <li key={c.chapter} className={selected ? "selected" : ""}>
                          <button className="chapter" onClick={() => select({ story: story.id, chapter: c.chapter })}>
                            <span>Chapter {c.chapter}</span>
                            <span className={`badge ${c.status.complete === true ? "complete" : ""}`}>{chapterSummary(c)}</span>
                          </button>
                          {selected && (
                            <div className="chapter-body">
                              <PipelineStages status={c.status} live={liveStatus} />
                              {c.status.complete === true && <PlayLink story={story.id} />}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <button className="link" onClick={() => select({ story: story.id, chapter: next })}>
                    + Chapter {next}
                  </button>
                  {selection.chapter === next && (
                    <p className="muted">Tell the producer what chapter {next} should accomplish.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
