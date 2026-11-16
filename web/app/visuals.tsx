"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CopilotChatAssistantMessage, useAgent, useDefaultRenderTool, useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

/** A file inside a story folder, served read-only by the backend (works for loaded folders anywhere on disk). */
export function fileUrl(story: string, file: string) {
  return `/api/backend/stories/${encodeURIComponent(story)}/file?path=${encodeURIComponent(file)}`;
}

const AUDIO = /\.(mp3|wav|ogg|m4a)$/i;

/** Every image and audio file under `dir` in the story (story-relative paths); null while loading. */
function useMedia(project: string, dir: string) {
  const [files, setFiles] = useState<string[] | null>(null);
  useEffect(() => {
    fetch(`/api/backend/stories/${encodeURIComponent(project)}/media?dir=${encodeURIComponent(dir)}`)
      .then((res) => (res.ok ? res.json() : { files: [] }))
      .then((data: { files?: string[] }) => setFiles(data.files ?? []))
      .catch(() => setFiles([]));
  }, [project, dir]);
  return files;
}

/** Image thumbnail (opens full size) or an audio player, by file type. */
function Media({ project, path, label }: { project: string; path: string; label: string }) {
  const url = fileUrl(project, path);
  return AUDIO.test(path) ? (
    <audio controls preload="none" src={url} aria-label={label} />
  ) : (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt={label} loading="lazy" />
    </a>
  );
}

/** Files the author marked "needs changes", with their note. */
export type Flags = Record<string, string>;
type Item = { path: string; label: string; group?: string; note?: string };
type Review = { project: string; flags: Flags; setFlags: (f: Flags) => void };

/** Media grouped by kind; each item can be marked "needs changes" with a note for the specialist. */
export function ReviewGallery({ project, items, flags, setFlags }: Review & { items: Item[] }) {
  const groups = [...new Set(items.map((i) => i.group ?? ""))];
  const toggle = (path: string, on: boolean) => {
    const next = { ...flags };
    if (on) next[path] = "";
    else delete next[path];
    setFlags(next);
  };
  return (
    <>
      {groups.map((group) => (
        <section key={group} className="review-group">
          {group && <h4>{group}</h4>}
          <ul className={`gallery ${items.some((i) => (i.group ?? "") === group && AUDIO.test(i.path)) ? "audio" : ""}`}>
            {items
              .filter((i) => (i.group ?? "") === group)
              .map((item) => {
                const flagged = item.path in flags;
                return (
                  <li key={item.path} className={flagged ? "flagged" : ""}>
                    <Media project={project} path={item.path} label={item.label} />
                    <span title={item.note}>{item.label}</span>
                    <label className="toggle">
                      <input type="checkbox" checked={flagged} onChange={(e) => toggle(item.path, e.target.checked)} />
                      Needs changes
                    </label>
                    {flagged && (
                      <input
                        className="reason"
                        aria-label={`What to change in ${item.label}`}
                        placeholder="What to change"
                        value={flags[item.path]}
                        onChange={(e) => setFlags({ ...flags, [item.path]: e.target.value })}
                      />
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}

/** Every image/audio file under `dir`, e.g. the chapter's voice clips. */
export function MediaReview({ dir, ...review }: Review & { dir: string }) {
  const files = useMedia(review.project, dir);
  if (files === null) return <p className="muted">Loading…</p>;
  if (files.length === 0) return <p className="muted">No media found in {dir}.</p>;
  return <ReviewGallery {...review} items={files.map((path) => ({ path, label: path.slice(dir.length).replace(/^\//, "") }))} />;
}

type ManifestAsset = { id: string; type?: string; description?: string; expectedOutputPath?: string; runtimePath?: string; status?: string };
const ASSET_GROUPS: Record<string, string> = {
  design_sheet: "Design sheets",
  background: "Backgrounds",
  character: "Character sprites",
  prop: "Props",
  cg: "Special CGs",
};

/** The chapter's art grouped by the Director's asset types (manifest), plus any other images in the art folder. */
export function ArtReview({ chapterDir, ...review }: Review & { chapterDir: string }) {
  const files = useMedia(review.project, `${chapterDir}/art`);
  const [assets, setAssets] = useState<ManifestAsset[] | null>(null);
  useEffect(() => {
    fetch(fileUrl(review.project, `${chapterDir}/asset-manifest.json`))
      .then((res) => (res.ok ? res.json() : {}))
      .then((m: { assets?: ManifestAsset[] } | ManifestAsset[]) => setAssets((Array.isArray(m) ? m : m.assets) ?? []))
      .catch(() => setAssets([]));
  }, [review.project, chapterDir]);
  if (files === null || assets === null) return <p className="muted">Loading art…</p>;
  const known = new Set(files);
  const planned: Item[] = assets
    .map((a) => ({ a, path: [a.expectedOutputPath, a.runtimePath].find((p) => p && known.has(p.replace(/^\//, ""))) }))
    .filter((x): x is { a: ManifestAsset; path: string } => !!x.path)
    .sort((x, y) => Object.keys(ASSET_GROUPS).indexOf(x.a.type ?? "") - Object.keys(ASSET_GROUPS).indexOf(y.a.type ?? ""))
    .map(({ a, path }) => ({ path: path.replace(/^\//, ""), label: a.id, group: ASSET_GROUPS[a.type ?? ""] ?? "Other assets", note: a.description }));
  const shown = new Set(planned.map((i) => i.path));
  const other = files.filter((f) => !shown.has(f)).map((path) => ({ path, label: path.split("/").pop() ?? path, group: "Other images" }));
  if (!planned.length && !other.length) return <p className="muted">No images found in {chapterDir}/art.</p>;
  return <ReviewGallery {...review} items={[...planned, ...other]} />;
}

/** A passage the author selected in a text under review, with their comment for the revision. */
// `raw` and `start` (offset in the text) re-anchor the comment after a reload; `range` is the live passage, when found.
export type Mark = { id: string; quote: string; raw: string; start: number; where?: string; note: string; range?: Range };

/** The range covering characters [start, end) of root's text. */
function rangeAt(root: Node, start: number, end: number) {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0;
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const len = n.textContent?.length ?? 0;
    if (pos <= start && start <= pos + len) range.setStart(n, start - pos);
    if (pos <= end && end <= pos + len) {
      range.setEnd(n, end - pos);
      return range;
    }
    pos += len;
  }
}

/** A saved comment's passage in the rendered text: at its offset, else wherever its text now appears. */
function locate(root: Node, m: Mark) {
  const text = root.textContent ?? "";
  const start = text.slice(m.start, m.start + m.raw.length) === m.raw ? m.start : text.indexOf(m.raw);
  return start < 0 || !m.raw ? undefined : rangeAt(root, start, start + m.raw.length);
}
const HIGHLIGHT = "review-mark";

/**
 * A story text file inline and scrollable; markdown (scripts, plans, reports) is formatted like the chat.
 * With `setMarks`, the author can select any passage and comment on it; all comments go out with the review.
 */
export function TextPreview({ project, file, marks = [], setMarks }: { project: string; file: string; marks?: Mark[]; setMarks?: (m: Mark[]) => void }) {
  const [text, setText] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{ range: Range; top: number; left: number } | null>(null);
  const canMark = !!setMarks;
  useEffect(() => {
    fetch(fileUrl(project, file))
      .then((res) => (res.ok ? res.text() : ""))
      .then(setText)
      .catch(() => setText(""));
  }, [project, file]);

  // Offer "Comment" next to a selection made inside the text.
  useEffect(() => {
    if (!canMark) return;
    const check = () => {
      const sel = getSelection();
      const el = box.current;
      if (!el || !sel || sel.isCollapsed || !el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) return setPending(null);
      const range = sel.getRangeAt(0);
      const rect = [...range.getClientRects()].pop() ?? range.getBoundingClientRect();
      setPending({ range, top: rect.bottom + 6, left: Math.min(rect.right, innerWidth - 120) });
    };
    const clear = () => setPending(null); // the button is fixed to the viewport, so it would drift on scroll
    const events = ["mouseup", "keyup", "touchend"] as const;
    events.forEach((e) => document.addEventListener(e, check));
    addEventListener("scroll", clear, true);
    return () => {
      events.forEach((e) => document.removeEventListener(e, check));
      removeEventListener("scroll", clear, true);
    };
  }, [canMark]);

  // Paint the commented passages without touching the rendered markdown (CSS Custom Highlight API).
  // ponytail: one global highlight name, fine while only one review card is open; key it per card if several can be.
  useEffect(() => {
    if (!canMark || typeof Highlight === "undefined") return;
    CSS.highlights.set(HIGHLIGHT, new Highlight(...marks.flatMap((m) => (m.range ? [m.range] : []))));
    return () => void CSS.highlights.delete(HIGHLIGHT);
  }, [canMark, marks]);

  // Memoized so typing a comment never re-renders the text (the marks hold live ranges into it).
  const body = useMemo(
    () => (text && /\.md$/i.test(file) ? <CopilotChatAssistantMessage.MarkdownRenderer content={text} /> : text),
    [text, file],
  );
  // Comments restored after a reload carry no live range yet: find their passages once the text is on screen
  // (the markdown renderer fills the box after mount, so retry as it changes).
  useEffect(() => {
    const el = box.current;
    if (!el || !setMarks || marks.every((m) => m.range)) return;
    const attach = () => {
      const next = marks.map((m) => (m.range ? m : { ...m, range: locate(el, m) }));
      if (next.some((m, i) => m.range && !marks[i].range)) setMarks(next);
    };
    attach();
    const watch = new MutationObserver(attach);
    watch.observe(el, { childList: true, subtree: true, characterData: true });
    return () => watch.disconnect();
  }, [body, marks, setMarks]);
  if (text === null) return <p className="muted">Loading…</p>;
  if (!text) return null;

  const add = () => {
    if (!pending || !box.current) return;
    const { range } = pending;
    const start = range.startContainer;
    const heading = [...box.current.querySelectorAll("h1,h2,h3")].filter((h) => h.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
    const quote = range.toString().replace(/\s+/g, " ").trim();
    const head = document.createRange();
    head.setStart(box.current, 0);
    head.setEnd(range.startContainer, range.startOffset);
    const mark = { id: crypto.randomUUID(), quote, raw: range.toString(), start: head.toString().length, where: heading?.textContent?.trim(), note: "", range: range.cloneRange() };
    if (quote) setMarks?.([...marks, mark]);
    getSelection()?.removeAllRanges();
    setPending(null);
  };
  const show = (m: Mark) => (m.range?.startContainer.parentElement ?? box.current)?.scrollIntoView({ block: "center", behavior: "smooth" });

  return (
    <>
      <div ref={box} className={`text-preview ${/\.md$/i.test(file) ? "markdown" : ""}`}>{body}</div>
      {pending && (
        <button className="mark-add" style={{ top: pending.top, left: pending.left }} onMouseDown={(e) => e.preventDefault()} onClick={add}>
          + Comment
        </button>
      )}
      {canMark && marks.length === 0 && <p className="muted">Select any passage to comment on it.</p>}
      {marks.length > 0 && (
        <ol className="marks">
          {marks.map((m) => (
            <li key={m.id}>
              <button className="quote" title="Show in the text" onClick={() => show(m)}>
                {m.where && <small>{m.where}</small>}“{m.quote.length > 140 ? `${m.quote.slice(0, 140)}…` : m.quote}”
              </button>
              <div className="row">
                <input
                  className="reason"
                  autoFocus
                  aria-label="Comment on this passage"
                  placeholder="What should change here?"
                  value={m.note}
                  onChange={(e) => setMarks?.(marks.map((x) => (x === m ? { ...m, note: e.target.value } : x)))}
                />
                <button aria-label="Remove comment" onClick={() => setMarks?.(marks.filter((x) => x !== m))}>×</button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

const SPECIALISTS: Record<string, string> = {
  writer: "Writer",
  director: "Director",
  graphic_designer: "Graphic designer",
  developer: "Developer",
  qa: "QA",
};
const STAGE_LABELS: Record<string, string> = {
  writer: "Writer — script",
  script_review: "Script review",
  director: "Director — plan",
  graphic_designer: "Graphic designer — art",
  director_review: "Director — art review",
  art_review: "Art approval",
  developer: "Developer — build",
  qa: "QA",
  docs: "Documentation",
  complete: "Chapter complete",
};
const GATES: Record<string, string> = {
  approve_script: "Script review",
  approve_character_design: "Character design",
  approve_art: "Art approval",
  approve_audio: "Voice clips",
};
// Tools that are plumbing, not novel building: shown only with "Show agent steps".
type Status = "inProgress" | "executing" | "complete";

/** One specialist hand-off (`task`): who is working, on what, and what they reported back. */
// First-line verdicts the Director and QA write (director-review.md, qa-report.md), when a report quotes them.
const VERDICT = /\b(QA PASSED|QA FAILED|DOCUMENTATION PASSED|DOCUMENTATION FAILED|REVISION REQUIRED|APPROVED)\b/;

function SpecialistCard({ role, brief, status, result }: { role: string; brief: string; status: Status; result?: string }) {
  const done = status === "complete";
  const summary = (result ?? "").replace(/\s+/g, " ").trim();
  const verdict = done && (role === "director" || role === "qa") ? VERDICT.exec(summary)?.[1] : undefined;
  return (
    <article className={`specialist ${done ? "done" : "working"}`}>
      <header>
        <strong>{SPECIALISTS[role] ?? role}</strong>
        <span className={`pill ${done ? (verdict ? (/FAILED|REVISION/.test(verdict) ? "error" : "done") : "done") : "running"}`}>
          {done ? (verdict ? verdict.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "Reported back") : "Working…"}
        </span>
      </header>
      {!done && <p className="muted">{brief.replace(/\s+/g, " ").slice(0, 220)}{brief.length > 220 ? "…" : ""}</p>}
      {done && (
        <details>
          <summary>{summary.slice(0, 240)}{summary.length > 240 ? "…" : ""}</summary>
          <div className="report">{result}</div>
          <p className="muted">Brief: {brief}</p>
        </details>
      )}
    </article>
  );
}

const LogLine = ({ children, tone }: { children: React.ReactNode; tone?: "done" | "warn" }) => (
  <p className={`log-line ${tone ?? ""}`}>{children}</p>
);

/**
 * Chat rendering for the producer's tools: specialist cards, one-line stage/chapter/approval entries and generated
 * images. Everything else (file reads, searches, shell, todos) is hidden unless `showSteps` is on.
 */
export function ToolRenderers({ story, showSteps }: { story?: string; showSteps: boolean }) {
  const { agent } = useAgent({ agentId: "producer" });
  const project = (agent.state as { project?: string } | undefined)?.project ?? story;

  useRenderTool(
    {
      name: "generate_image",
      parameters: z.object({ prompt: z.string(), output_path: z.string() }),
      render: ({ parameters, status, result }) => {
        const path = parameters?.output_path ?? "";
        const proj = project;
        const failed = status === "complete" && !String(result ?? "").startsWith("wrote");
        return (
          <article className="image-card">
            <header>
              <strong>Generated image</strong>
              <span className={`pill ${status === "complete" ? (failed ? "error" : "done") : "running"}`}>
                {status === "complete" ? (failed ? "Failed" : "Done") : "Generating…"}
              </span>
            </header>
            {status === "complete" && !failed && proj ? (
              <a href={fileUrl(proj, path)} target="_blank" rel="noreferrer">
                <img src={fileUrl(proj, path)} alt={parameters?.prompt ?? path} />
              </a>
            ) : (
              <div className="placeholder" aria-hidden />
            )}
            <code>{path}</code>
            {failed && <p className="error">{String(result).slice(0, 300)}</p>}
          </article>
        );
      },
    },
    [project],
  );

  // Voice clips (the developer's generate_speech): the line, its voice and, once recorded, a player.
  useRenderTool(
    {
      name: "generate_speech",
      parameters: z.object({ text: z.string(), voice_id: z.string(), output_path: z.string() }),
      render: ({ parameters, status, result }) => {
        const recorded = status === "complete" && String(result ?? "").startsWith("wrote");
        const state = status !== "complete" ? "Waiting…" : recorded ? "Recorded" : /reject/i.test(String(result)) ? "Rejected" : "Not recorded";
        return (
          <article className="image-card speech-card">
            <header>
              <strong>Voice clip</strong>
              <span className={`pill ${status !== "complete" ? "running" : recorded ? "done" : "error"}`}>{state}</span>
            </header>
            <p className="line">{parameters?.text}</p>
            {recorded && project && <audio controls preload="none" src={fileUrl(project, parameters?.output_path ?? "")} />}
            <code>
              {parameters?.voice_id} · {parameters?.output_path}
            </code>
            {status === "complete" && !recorded && <p className="error">{String(result).slice(0, 300)}</p>}
          </article>
        );
      },
    },
    [project],
  );

  useRenderTool(
    {
      name: "task",
      parameters: z.object({ description: z.string(), subagent_type: z.string() }),
      render: ({ parameters, status, result }) => (
        <SpecialistCard role={parameters?.subagent_type ?? ""} brief={parameters?.description ?? ""} status={status} result={result} />
      ),
    },
    [],
  );

  useRenderTool(
    {
      name: "update_status",
      parameters: z.object({ stage: z.string(), value: z.string() }),
      render: ({ parameters, status, result }) => {
        if (status !== "complete") return null;
        const chapter = /"chapter":\s*(\d+)/.exec(result ?? "")?.[1];
        const stage = STAGE_LABELS[parameters?.stage ?? ""] ?? parameters?.stage;
        const value = parameters?.stage === "complete" ? (parameters?.value === "true" ? "yes" : "reopened") : parameters?.value;
        return (
          <LogLine tone={value === "done" || value === "yes" ? "done" : undefined}>
            {chapter ? `Chapter ${chapter} · ` : ""}
            {stage} → {value}
          </LogLine>
        );
      },
    },
    [],
  );

  useRenderTool(
    {
      name: "select_chapter",
      parameters: z.object({ chapter: z.number() }),
      render: ({ parameters, status }) =>
        status === "complete" ? <LogLine>Working on chapter {parameters?.chapter}</LogLine> : null,
    },
    [],
  );

  // The approval/question itself is an interactive card (useInterrupt); afterwards keep a one-line record of the answer.
  useRenderTool(
    {
      name: "request_author_approval",
      parameters: z.object({ gate: z.string(), file: z.string() }),
      render: ({ parameters, status, result }) =>
        status === "complete" ? (
          <LogLine tone={String(result).startsWith("APPROVED") ? "done" : "warn"}>
            {GATES[parameters?.gate ?? ""] ?? "Approval"}: {String(result).startsWith("APPROVED") ? "you approved" : "you requested changes"}
          </LogLine>
        ) : null,
    },
    [],
  );

  useRenderTool(
    {
      name: "ask_author",
      parameters: z.object({ question: z.string() }),
      render: ({ status, result }) =>
        status === "complete" ? <LogLine>You answered: {String(result).replace(/^Author answered:\s*/, "")}</LogLine> : null,
    },
    [],
  );

  // Everything else is plumbing (ls, read_file, grep, execute, write_todos, …).
  useDefaultRenderTool(
    {
      render: ({ name, status }: { name: string; status: Status }) =>
        showSteps ? (
          <p className="log-line step">
            {name} · {status === "complete" ? "done" : "running"}
          </p>
        ) : null,
    },
    [showSteps],
  );

  return null;
}
