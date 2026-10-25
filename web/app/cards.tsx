"use client";

import { useState } from "react";
import { ArtReview, fileUrl, MediaReview, type Flags, ReviewGallery, TextPreview } from "./visuals";

export type Approval = { type: "approval"; gate: string; project: string; chapter: number; file: string; description: string };
export type Question = { type: "question"; question: string; options: string[] };
// deepagents/LangChain human-in-the-loop request: tool calls waiting for the author's decision (e.g. paid speech clips).
type ActionRequest = { name: string; args: Record<string, unknown>; description?: string };
export type ToolReview = {
  type: "tool_review";
  action_requests: ActionRequest[];
  review_configs: { action_name: string; allowed_decisions: string[] }[];
};

const GATE_TITLES: Record<string, string> = {
  approve_script: "Script review",
  approve_character_design: "Character design",
  approve_art: "Art approval",
  approve_audio: "Voice clips",
};

// The chapter the artifact belongs to: its path says (production/chapter-14/…, chapter-14.md), else the selected chapter.
const chapterOf = (value: Approval) => Number(/chapter-(\d+)/.exec(value.file)?.[1] ?? value.chapter);

/** The artifact under review, shown the way that gate needs it: script text, design sheet, art by type, audio clips. */
function GateContent({ value, flags, setFlags }: { value: Approval; flags: Flags; setFlags: (f: Flags) => void }) {
  const chapterDir = `production/chapter-${String(chapterOf(value)).padStart(2, "0")}`;
  const review = { project: value.project, flags, setFlags };
  if (value.gate === "approve_art") return <ArtReview {...review} chapterDir={chapterDir} />;
  if (value.gate === "approve_audio") return <MediaReview {...review} dir={value.file || `${chapterDir}/audio`} />;
  if (/\.(png|jpe?g|webp|mp3|wav|ogg|m4a)$/i.test(value.file))
    return <ReviewGallery {...review} items={[{ path: value.file, label: value.file.split("/").pop() ?? value.file }]} />;
  if (/\.(md|json)$/i.test(value.file)) return <TextPreview project={value.project} file={value.file} />;
  return null;
}

export function ApprovalCard({ value, resolve }: { value: Approval; resolve: (v: unknown) => void }) {
  const [notes, setNotes] = useState("");
  const [flags, setFlags] = useState<Flags>({});
  const flagged = Object.entries(flags);
  // Per-item "needs changes" notes become a list the producer passes to the specialist.
  const allNotes = [notes.trim(), ...flagged.map(([path, note]) => `- ${path}: ${note.trim() || "redo"}`)].filter(Boolean).join("\n");
  return (
    <div className="gate">
      <h3>{GATE_TITLES[value.gate] ?? "Approval"} · chapter {chapterOf(value)}</h3>
      <p>{value.description}</p>
      <GateContent value={value} flags={flags} setFlags={setFlags} />
      <a href={fileUrl(value.project, value.file)} target="_blank" rel="noreferrer">
        <code>{value.file}</code>
      </a>
      <textarea
        placeholder={flagged.length ? "Anything else for the revision (optional)" : "Notes for the revision (required to reject)"}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="row">
        <button className="primary" disabled={flagged.length > 0} onClick={() => resolve({ approved: true, notes })}>
          Approve
        </button>
        <button disabled={!allNotes} onClick={() => resolve({ approved: false, notes: allNotes })}>
          Request changes{flagged.length ? ` (${flagged.length})` : ""}
        </button>
      </div>
    </div>
  );
}

export function QuestionCard({ value, resolve }: { value: Question; resolve: (v: unknown) => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <div className="gate">
      <h3>The producer needs your input</h3>
      <p>{value.question}</p>
      <div className="row wrap">
        {value.options.map((option) => (
          <button key={option} onClick={() => resolve({ answer: option })}>{option}</button>
        ))}
      </div>
      <textarea placeholder="Or type your own answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <div className="row">
        <button className="primary" disabled={!answer.trim()} onClick={() => resolve({ answer })}>Send answer</button>
      </div>
    </div>
  );
}

const TOOL_TITLES: Record<string, string> = { generate_speech: "Record voice clip", generate_image: "Generate image" };
type Choice = { reject: boolean; reason: string; text?: string };

/** One requested tool call: speech shows the line (editable before recording) and its voice; others show their arguments. */
function RequestItem({ request, choice, set, canEdit }: { request: ActionRequest; choice: Choice; set: (c: Choice) => void; canEdit: boolean }) {
  const args = request.args;
  const speech = request.name === "generate_speech" && typeof args.text === "string";
  return (
    <li className={`request ${choice.reject ? "rejected" : ""}`}>
      {speech ? (
        <>
          <p className="muted">
            Voice <code>{String(args.voice_id)}</code>
            {args.emotion ? ` · ${String(args.emotion)}` : ""}
            {args.language_boost ? ` · ${String(args.language_boost)}` : ""} · <code>{String(args.output_path)}</code>
          </p>
          <textarea
            className="line"
            aria-label="Spoken text"
            readOnly={!canEdit || choice.reject}
            value={choice.text ?? String(args.text ?? "")}
            onChange={(e) => set({ ...choice, text: e.target.value })}
          />
        </>
      ) : (
        <pre className="args">{JSON.stringify(args, null, 2)}</pre>
      )}
      <label className="toggle">
        <input type="checkbox" checked={choice.reject} onChange={(e) => set({ ...choice, reject: e.target.checked })} />
        Don&apos;t {speech ? "record" : "run"} this
      </label>
      {choice.reject && (
        <input className="reason" placeholder="Why? (sent to the agent)" value={choice.reason} onChange={(e) => set({ ...choice, reason: e.target.value })} />
      )}
    </li>
  );
}

/** Approve, edit or reject each tool call an agent wants to make (answers a human-in-the-loop interrupt). */
export function ToolReviewCard({ value, resolve }: { value: ToolReview; resolve: (v: unknown) => void }) {
  const requests = value.action_requests;
  const allowed = (name: string) => value.review_configs.find((c) => c.action_name === name)?.allowed_decisions ?? ["approve", "reject"];
  const [choices, setChoices] = useState<Choice[]>(() => requests.map(() => ({ reject: false, reason: "" })));
  const decide = (all?: boolean) =>
    resolve({
      decisions: requests.map((r, i) => {
        const c = choices[i];
        if (!all && c.reject) return { type: "reject", message: c.reason.trim() || "The author rejected this." };
        if (!all && c.text !== undefined && c.text !== r.args.text)
          return { type: "edit", edited_action: { name: r.name, args: { ...r.args, text: c.text } } };
        return { type: "approve" };
      }),
    });
  const names = [...new Set(requests.map((r) => TOOL_TITLES[r.name] ?? r.name))].join(", ");
  const changed = choices.some((c, i) => c.reject || (c.text !== undefined && c.text !== requests[i].args.text));
  return (
    <div className="gate">
      <h3>
        {names}
        {requests.length > 1 ? ` · ${requests.length} requests` : ""}
      </h3>
      <p className="muted">An agent wants to run this. Nothing happens until you decide.</p>
      <ol className="requests">
        {requests.map((r, i) => (
          <RequestItem
            key={i}
            request={r}
            choice={choices[i]}
            canEdit={allowed(r.name).includes("edit")}
            set={(c) => setChoices((prev) => prev.map((p, j) => (j === i ? c : p)))}
          />
        ))}
      </ol>
      <div className="row">
        <button className="primary" onClick={() => decide(!changed)}>
          {changed ? "Send decisions" : requests.length > 1 ? "Approve all" : "Approve"}
        </button>
        {!changed && (
          <button onClick={() => setChoices((prev) => prev.map((p) => ({ ...p, reject: true })))}>Reject…</button>
        )}
      </div>
    </div>
  );
}

// The LangGraph interrupt() payload reaches useInterrupt as a JSON string (or, on the standard path, under metadata.langgraph.raw).
export function payloadOf(value: unknown): Approval | Question | ToolReview | null {
  let raw = (value as { metadata?: { langgraph?: { raw?: unknown } } })?.metadata?.langgraph?.raw ?? value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (Array.isArray((raw as ToolReview)?.action_requests)) return { ...(raw as ToolReview), type: "tool_review" };
  const type = (raw as { type?: string })?.type;
  return type === "approval" || type === "question" ? (raw as Approval | Question) : null;
}
