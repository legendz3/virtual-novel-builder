"use client";

import { useState } from "react";
import { ArtGallery, fileUrl } from "./visuals";

export type Approval = { type: "approval"; gate: string; project: string; chapter: number; file: string; description: string };
export type Question = { type: "question"; question: string; options: string[] };

const GATE_TITLES: Record<string, string> = {
  approve_script: "Script review",
  approve_character_design: "Character design",
  approve_art: "Art approval",
};

export function ApprovalCard({ value, resolve }: { value: Approval; resolve: (v: unknown) => void }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="gate">
      <h3>{GATE_TITLES[value.gate] ?? "Approval"} · chapter {value.chapter}</h3>
      <p>{value.description}</p>
      {value.gate === "approve_art" && (
        <ArtGallery project={value.project} dir={`production/chapter-${String(value.chapter).padStart(2, "0")}/art`} />
      )}
      {/\.(png|jpe?g|webp)$/i.test(value.file) && (
        <img className="preview" src={fileUrl(value.project, value.file)} alt={`Artifact for review: ${value.file}`} />
      )}
      <a href={fileUrl(value.project, value.file)} target="_blank" rel="noreferrer">
        <code>{value.file}</code>
      </a>
      <textarea placeholder="Notes for the revision (required to reject)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="row">
        <button className="primary" onClick={() => resolve({ approved: true, notes })}>Approve</button>
        <button disabled={!notes.trim()} onClick={() => resolve({ approved: false, notes })}>Request changes</button>
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

// The LangGraph interrupt() payload reaches useInterrupt as a JSON string (or, on the standard path, under metadata.langgraph.raw).
export function payloadOf(value: unknown): Approval | Question | null {
  let raw = (value as { metadata?: { langgraph?: { raw?: unknown } } })?.metadata?.langgraph?.raw ?? value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const type = (raw as { type?: string })?.type;
  return type === "approval" || type === "question" ? (raw as Approval | Question) : null;
}
