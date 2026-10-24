import { CopilotRuntime, createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { LangGraphHistoryRunner } from "./history-runner";

// Subagents read images (design sheets, sprites) as base64 tool results, and the adapter forwards nested tool results,
// args and message snapshots to the browser; a single event can exceed the client's 10 MB SSE buffer. Agents still
// see full content — only what is streamed to the UI is capped: any string over MAX_UI_STRING anywhere in an event.
const MAX_UI_STRING = 100_000;
const MAX_UI_EVENT = 1_000_000;

function capStrings(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length <= MAX_UI_STRING) return value;
    const kind = /base64|data:image\//.test(value.slice(0, 2_000)) ? "binary/image content" : "content";
    return `[${kind} omitted from the UI stream: ${Math.round(value.length / 1024)} KB]`;
  }
  if (Array.isArray(value)) return value.map(capStrings);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // An inline base64 block (e.g. {type: "image", base64: "..."}) is dropped even when individually small.
    if (typeof obj.base64 === "string" && obj.base64.length > 10_000) return { ...obj, base64: "[omitted]" };
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, capStrings(v)]));
  }
  return value;
}

type Event = Parameters<LangGraphAgent["dispatchEvent"]>[0];
type Json = Record<string, unknown>;

// The UI reads only these agent-state keys (the board). Full LangGraph state also carries the whole message history,
// which the adapter re-sends as a snapshot on every step (~1 MB on long chapters) and freezes the page; messages already
// reach the chat through their own events.
const UI_STATE_KEYS = ["project", "chapter", "status"];
const pickUiState = (snapshot: unknown): Json =>
  Object.fromEntries(Object.entries((snapshot ?? {}) as Json).filter(([k]) => UI_STATE_KEYS.includes(k)));

/** Shape an AG-UI event for the browser: board-only state, capped strings. Returns null to drop the event. */
function uiSafe(event: Json): Json | null {
  let e = event;
  if (e.type === "STATE_SNAPSHOT") e = { ...e, snapshot: pickUiState(e.snapshot) };
  if (e.type === "STATE_DELTA") {
    const ops = ((e.delta as { path?: string }[]) ?? []).filter((op) =>
      UI_STATE_KEYS.some((k) => op.path === `/${k}` || op.path?.startsWith(`/${k}/`)),
    );
    if (!ops.length) return null;
    e = { ...e, delta: ops };
  }
  // Cheap size probe first; only oversized events pay for the deep walk.
  const size = JSON.stringify(e).length;
  if (size <= MAX_UI_EVENT) return e;
  const capped = capStrings(e) as Json;
  console.warn(`[ui-cap] ${String(e.type)} ${Math.round(size / 1024)} KB -> ${Math.round(JSON.stringify(capped).length / 1024)} KB`);
  return capped;
}

class UiSafeLangGraphAgent extends LangGraphAgent {
  dispatchEvent(event: Event): boolean {
    const safe = uiSafe(event as unknown as Json);
    return safe ? super.dispatchEvent(safe as unknown as Event) : true;
  }
}

// No CopilotKit Intelligence yet: SSE mode with an in-memory runner. Add `intelligence` + `identifyUser`
// here when going multi-user (identifyUser is also where a real user id would reach the graph as owner).
const BACKEND = process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024";

const runtime = new CopilotRuntime({
  // Restores each chapter's conversation (and pending approval cards) from LangGraph after a reload.
  runner: new LangGraphHistoryRunner(BACKEND, uiSafe),
  agents: {
    producer: new UiSafeLangGraphAgent({
      deploymentUrl: BACKEND,
      graphId: "producer",
      langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
    }),
  },
});

export const POST = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});
