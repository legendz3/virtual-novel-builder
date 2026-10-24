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

class UiSafeLangGraphAgent extends LangGraphAgent {
  dispatchEvent(event: Event): boolean {
    // Cheap size probe first; only oversized events pay for the deep walk.
    const size = JSON.stringify(event).length;
    if (size <= MAX_UI_EVENT) return super.dispatchEvent(event);
    const capped = capStrings(event) as Event;
    console.warn(`[ui-cap] ${event.type} ${Math.round(size / 1024)} KB -> ${Math.round(JSON.stringify(capped).length / 1024)} KB`);
    return super.dispatchEvent(capped);
  }
}

// No CopilotKit Intelligence yet: SSE mode with an in-memory runner. Add `intelligence` + `identifyUser`
// here when going multi-user (identifyUser is also where a real user id would reach the graph as owner).
const BACKEND = process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024";

const runtime = new CopilotRuntime({
  // Restores each chapter's conversation (and pending approval cards) from LangGraph after a reload.
  runner: new LangGraphHistoryRunner(BACKEND, (e) => capStrings(e) as Record<string, unknown>),
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
