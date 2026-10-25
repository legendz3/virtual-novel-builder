"use client";

import { useEffect, useState } from "react";
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

/** A story text file inline and scrollable; markdown (scripts, plans, reports) is formatted like the chat. */
export function TextPreview({ project, file }: { project: string; file: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    fetch(fileUrl(project, file))
      .then((res) => (res.ok ? res.text() : ""))
      .then(setText)
      .catch(() => setText(""));
  }, [project, file]);
  if (text === null) return <p className="muted">Loading…</p>;
  if (!text) return null;
  return /\.md$/i.test(file) ? (
    <div className="text-preview markdown">
      <CopilotChatAssistantMessage.MarkdownRenderer content={text} />
    </div>
  ) : (
    <div className="text-preview">{text}</div>
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
