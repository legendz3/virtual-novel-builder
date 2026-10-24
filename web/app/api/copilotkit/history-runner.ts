import { InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { langGraphInterruptsToAGUI } from "@ag-ui/langgraph";
import { Observable } from "rxjs";

type ConnectRequest = Parameters<InMemoryAgentRunner["connect"]>[0];
type AguiEvent = Record<string, unknown>;
type AguiMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; toolCalls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { id: string; role: "tool"; toolCallId: string; content: string };

// LangChain message as returned by the LangGraph server's thread state API.
type LcMessage = {
  id?: string;
  type: "human" | "ai" | "tool" | "system" | string;
  content: unknown;
  name?: string;
  tool_calls?: { id: string; name: string; args: unknown }[];
  tool_call_id?: string;
};

function text(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .map((part) => (part && typeof part === "object" && (part as { type?: string }).type === "text" ? (part as { text?: string }).text ?? "" : ""))
      .join("");
  return "";
}

/** LangChain messages -> AG-UI messages, the shape the chat renders (text, tool calls, tool results). */
export function toAguiMessages(messages: LcMessage[]): AguiMessage[] {
  return messages.flatMap((m, i): AguiMessage[] => {
    const id = m.id ?? `restored-${i}`;
    if (m.type === "human") return [{ id, role: "user" as const, content: text(m.content) }];
    if (m.type === "ai")
      return [
        {
          id,
          role: "assistant" as const,
          content: text(m.content),
          ...(m.tool_calls?.length
            ? {
                toolCalls: m.tool_calls.map((c) => ({
                  id: c.id,
                  type: "function" as const,
                  function: { name: c.name, arguments: JSON.stringify(c.args ?? {}) },
                })),
              }
            : {}),
        },
      ];
    if (m.type === "tool")
      return [{ id, role: "tool" as const, toolCallId: m.tool_call_id ?? "", content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }];
    return [];
  });
}

/**
 * The default in-memory runner only replays events it saw during this web server's lifetime, so a reloaded page (or a
 * restarted server) shows an empty chat. LangGraph already persists every thread: when nothing is running here, rebuild
 * the conversation, the agent state and any pending approval/question from the LangGraph thread state instead.
 */
export class LangGraphHistoryRunner extends InMemoryAgentRunner {
  constructor(
    private readonly deploymentUrl: string,
    private readonly sanitize: (event: AguiEvent) => AguiEvent = (e) => e,
  ) {
    super();
  }

  connect(request: ConnectRequest) {
    return new Observable<AguiEvent>((subscriber) => {
      let live: { unsubscribe(): void } | undefined;
      (async () => {
        if (await this.isRunning({ threadId: request.threadId })) {
          // A run is streaming through this server right now: the in-memory replay includes its live events.
          live = super.connect(request).subscribe(subscriber as never);
          return;
        }
        const res = await fetch(`${this.deploymentUrl}/threads/${encodeURIComponent(request.threadId)}/state`, { cache: "no-store" });
        if (!res.ok) return subscriber.complete(); // brand-new thread: nothing to restore
        const state = (await res.json()) as {
          values?: { messages?: LcMessage[] } & Record<string, unknown>;
          tasks?: { interrupts?: { id: string; value: unknown }[] }[];
        };
        const { messages = [], ...values } = state.values ?? {};
        const interrupts = (state.tasks ?? []).flatMap((t) => t.interrupts ?? []);
        const runId = `restored-${request.threadId}`;
        const emit = (e: AguiEvent) => subscriber.next(this.sanitize(e));
        emit({ type: "RUN_STARTED", threadId: request.threadId, runId });
        emit({ type: "MESSAGES_SNAPSHOT", messages: toAguiMessages(messages) });
        emit({ type: "STATE_SNAPSHOT", snapshot: values });
        emit({
          type: "RUN_FINISHED",
          threadId: request.threadId,
          runId,
          ...(interrupts.length ? { outcome: { type: "interrupt", interrupts: langGraphInterruptsToAGUI(interrupts as never) } } : {}),
        });
        subscriber.complete();
      })().catch((err) => subscriber.error(err));
      return () => live?.unsubscribe();
    }) as unknown as ReturnType<InMemoryAgentRunner["connect"]>;
  }
}
