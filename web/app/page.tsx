"use client";

import { useEffect, useMemo, useState } from "react";
import { CopilotChat, CopilotKit, useAgent, useInterrupt, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { AccountPanel } from "./account";
import { ApprovalCard, payloadOf, QuestionCard } from "./cards";
import { type Selection, StoriesSidebar, useStories } from "./sidebar";
import { ToolRenderers } from "./visuals";

const SELECTION_KEY = "novel-builder:selection";
const THREADS_KEY = "novel-builder:threads";
const STEPS_KEY = "novel-builder:show-steps";

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode): selection and threads just don't survive a reload
  }
}

const threadKey = (s: Selection) => `${s.story}:${s.chapter ?? "story"}`;

/** One conversation thread per story/chapter, kept across reloads so the producer remembers that chapter's discussion. */
function useThread(selection: Selection) {
  const [threads, setThreads] = useState<Record<string, string> | null>(null); // null until read from storage
  useEffect(() => setThreads(load(THREADS_KEY, {})), []);
  const key = threadKey(selection);
  const threadId = threads?.[key];
  const assign = (replace: boolean) =>
    setThreads((prev) => {
      if (!prev || (!replace && prev[key])) return prev; // never overwrite a chapter's existing thread by accident
      const next = { ...prev, [key]: crypto.randomUUID() };
      save(THREADS_KEY, next);
      return next;
    });
  useEffect(() => {
    if (threads && selection.story && !threadId) assign(false);
  });
  return { threadId, reset: () => assign(true) };
}

export default function Page() {
  const [selection, setSelection] = useState<Selection>({});
  useEffect(() => setSelection(load(SELECTION_KEY, {})), []);
  const select = (next: Selection) => {
    setSelection(next);
    save(SELECTION_KEY, next);
  };
  // Forwarded to the LangGraph run config, so each run is rooted at the selected story and chapter.
  const properties = useMemo(
    () => ({ config: { configurable: { story_id: selection.story, chapter: selection.chapter } } }),
    [selection.story, selection.chapter],
  );

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="producer" useSingleEndpoint properties={properties} enableInspector={false}>
      <Studio selection={selection} select={select} />
    </CopilotKit>
  );
}

function Studio({ selection, select }: { selection: Selection; select: (s: Selection) => void }) {
  const { stories, error, reload } = useStories();
  const { threadId, reset } = useThread(selection);
  const { agent } = useAgent({ agentId: "producer", updates: [UseAgentUpdate.OnStateChanged] });
  const live = (agent.state ?? {}) as { project?: string; chapter?: number; status?: Record<string, unknown> };
  const liveStatus = live.project === selection.story && live.chapter === selection.chapter ? live.status : undefined;

  const [showSteps, setShowSteps] = useState(false);
  useEffect(() => setShowSteps(load(STEPS_KEY, false)), []);
  useInterrupt({
    agentId: "producer",
    enabled: ({ value }) => payloadOf(value) !== null,
    render: ({ event, resolve }) => {
      const payload = payloadOf(event.value)!;
      return payload.type === "question" ? (
        <QuestionCard value={payload} resolve={resolve} />
      ) : (
        <ApprovalCard value={payload} resolve={resolve} />
      );
    },
  });

  const story = stories?.find((s) => s.id === selection.story);
  const heading = story ? `${story.title}${selection.chapter ? ` · Chapter ${selection.chapter}` : " · storyline"}` : "";

  return (
    <main className="shell">
      <aside className="board">
        <StoriesSidebar stories={stories} error={error} reload={reload} selection={selection} select={select} liveStatus={liveStatus} />
        <AccountPanel />
      </aside>
      <ToolRenderers story={selection.story} showSteps={showSteps} />
      <section className="chat">
        {story && threadId ? (
          <>
            <header className="chat-head">
              <span>{heading}</span>
              <div className="chat-actions">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={showSteps}
                    onChange={(e) => {
                      setShowSteps(e.target.checked);
                      save(STEPS_KEY, e.target.checked);
                    }}
                  />
                  Show agent steps
                </label>
                <button className="link" onClick={reset}>New conversation</button>
              </div>
            </header>
            <CopilotChat
              key={threadId}
              agentId="producer"
              threadId={threadId}
              labels={{
                chatInputPlaceholder: selection.chapter
                  ? `Ask the producer about chapter ${selection.chapter}, or request changes…`
                  : "Talk about the storyline, or ask for a new chapter…",
              }}
            />
          </>
        ) : (
          <div className="empty">
            <h2>Pick a story</h2>
            <p>Choose a story and chapter on the left, create a new story, or load an existing project folder.</p>
          </div>
        )}
      </section>
    </main>
  );
}
