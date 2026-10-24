"use client";

import { useEffect, useState } from "react";
import { useAgent, useDefaultRenderTool, useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

/** A file inside a story folder, served read-only by the backend (works for loaded folders anywhere on disk). */
export function fileUrl(story: string, file: string) {
  return `/api/backend/stories/${encodeURIComponent(story)}/file?path=${encodeURIComponent(file)}`;
}

/** Thumbnail grid of every image under `dir` in the project (scene previews first). Click to open full size. */
export function ArtGallery({ project, dir }: { project: string; dir: string }) {
  const [images, setImages] = useState<string[] | null>(null);
  useEffect(() => {
    fetch(`/api/backend/stories/${encodeURIComponent(project)}/images?dir=${encodeURIComponent(dir)}`)
      .then((res) => (res.ok ? res.json() : { images: [] }))
      .then((data: { images?: string[] }) =>
        setImages([...(data.images ?? [])].sort((a, b) => Number(!a.includes("/review/")) - Number(!b.includes("/review/")))),
      )
      .catch(() => setImages([]));
  }, [project, dir]);

  if (images === null) return <p className="muted">Loading art…</p>;
  if (images.length === 0) return <p className="muted">No images found in {dir}.</p>;
  return (
    <ul className="gallery">
      {images.map((image) => {
        const label = image.slice(dir.length).replace(/^\//, "");
        return (
          <li key={image}>
            <a href={fileUrl(project, image)} target="_blank" rel="noreferrer">
              <img src={fileUrl(project, image)} alt={label} loading="lazy" />
              <span>{label}</span>
            </a>
          </li>
        );
      })}
    </ul>
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
};
// Tools that are plumbing, not novel building: shown only with "Show agent steps".
type Status = "inProgress" | "executing" | "complete";

/** One specialist hand-off (`task`): who is working, on what, and what they reported back. */
function SpecialistCard({ role, brief, status, result }: { role: string; brief: string; status: Status; result?: string }) {
  const done = status === "complete";
  const summary = (result ?? "").replace(/\s+/g, " ").trim();
  return (
    <article className={`specialist ${done ? "done" : "working"}`}>
      <header>
        <strong>{SPECIALISTS[role] ?? role}</strong>
        <span className={`pill ${done ? "done" : "running"}`}>{done ? "Reported back" : "Working…"}</span>
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
