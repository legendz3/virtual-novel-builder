"""Per-run model wiring: ChatGPT plan via the Codex backend when the owner is connected, otherwise the API key."""

from dataclasses import dataclass, field

from langchain.chat_models import init_chat_model
from langchain_openai import ChatOpenAI

from novel_builder import codex_oauth


class CodexChatOpenAI(ChatOpenAI):
    """ChatOpenAI for the Codex backend, which rejects system messages and takes them as `instructions` (as Aubrey sends)."""

    def _get_request_payload(self, input_, *, stop=None, **kwargs) -> dict:
        payload = super()._get_request_payload(input_, stop=stop, **kwargs)
        items = payload.get("input")
        if isinstance(items, list):
            system = [i for i in items if isinstance(i, dict) and i.get("role") in ("system", "developer")]
            payload["input"] = [i for i in items if i not in system]
            texts = [_text(i.get("content")) for i in system]
            payload["instructions"] = "\n\n".join([t for t in texts if t] or ["You are a helpful assistant."])
        return payload


def _text(content) -> str:
    if isinstance(content, str):
        return content
    return "\n".join(p.get("text", "") for p in content or [] if isinstance(p, dict))


@dataclass
class RunContext:
    owner: str
    backend: object
    codex_models: list[str] = field(default_factory=list)  # empty = not connected to ChatGPT

    @property
    def codex(self) -> bool:
        return bool(self.codex_models)

    def codex_model(self, model: str) -> str:
        """Requested slug if the ChatGPT plan offers it, else the catalog's top model (Aubrey's fallback rule)."""
        slug = model.split(":", 1)[-1]
        return slug if slug in self.codex_models else self.codex_models[0]

    def chat(self, model: str, reasoning_effort: str | None = None):
        """`provider:model` -> chat model. Agents set their model in novel_builder/agents/<name>.py."""
        effort = {"reasoning_effort": reasoning_effort} if reasoning_effort else {}
        if self.codex and model.startswith("openai:"):
            owner = self.owner
            return CodexChatOpenAI(
                model=self.codex_model(model),
                base_url=codex_oauth.CODEX_BASE_URL,
                api_key=lambda: codex_oauth.access_token(owner),  # refreshed on demand; run in a worker thread when async
                use_responses_api=True,
                store=False,  # the Codex backend is stateless: streamed, nothing stored server-side
                streaming=True,
                max_retries=6,
                **effort,
            )
        # Long pipeline runs: retry transient provider/network errors instead of failing the whole run.
        return init_chat_model(model, max_retries=6, **effort)
