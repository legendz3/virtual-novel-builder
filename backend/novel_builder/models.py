"""Per-run model wiring: ChatGPT plan via the Codex backend when the owner is connected, otherwise the API key."""

from dataclasses import dataclass, field

from langchain.chat_models import init_chat_model
from langchain_openai import ChatOpenAI
from openai.types.responses import ResponseFunctionCallArgumentsDeltaEvent
from pydantic import model_validator

from novel_builder import codex_oauth


class _ArgsDeltas:
    """The Codex backend can stream a function call's arguments only in its `.done` event; langchain-openai assembles tool
    calls from `.delta` events, so parallel tool calls arrived with empty args. Emits the full arguments as one delta
    for any call that streamed none."""

    def __init__(self):
        self.streamed = set()

    def __call__(self, event) -> list:
        if event.type == "response.function_call_arguments.delta":
            self.streamed.add(event.item_id)
        elif event.type == "response.function_call_arguments.done" and event.item_id not in self.streamed:
            return [ResponseFunctionCallArgumentsDeltaEvent(
                type="response.function_call_arguments.delta", delta=event.arguments, item_id=event.item_id,
                output_index=event.output_index, sequence_number=event.sequence_number), event]
        return [event]


class _CodexStream:
    def __init__(self, stream):
        self._stream = stream

    def __enter__(self):
        self._stream.__enter__()
        return self

    def __exit__(self, *exc):
        return self._stream.__exit__(*exc)

    def __iter__(self):
        fix = _ArgsDeltas()
        for event in self._stream:
            yield from fix(event)

    async def __aenter__(self):
        await self._stream.__aenter__()
        return self

    async def __aexit__(self, *exc):
        return await self._stream.__aexit__(*exc)

    async def __aiter__(self):
        fix = _ArgsDeltas()
        async for event in self._stream:
            for fixed in fix(event):
                yield fixed


class _CodexResponses:
    def __init__(self, responses):
        self._responses = responses

    def __getattr__(self, name):
        return getattr(self._responses, name)

    def create(self, **kwargs):
        result = self._responses.create(**kwargs)
        if hasattr(result, "__await__"):
            async def wrapped():
                return _CodexStream(await result)
            return wrapped()
        return _CodexStream(result)


class _CodexClient:
    def __init__(self, client):
        self._client = client
        self.responses = _CodexResponses(client.responses)

    def __getattr__(self, name):
        return getattr(self._client, name)


class CodexChatOpenAI(ChatOpenAI):
    """ChatOpenAI for the Codex backend, which rejects system messages and takes them as `instructions` (as Aubrey sends)."""

    @model_validator(mode="after")
    def _codex_streams(self):
        for attr in ("root_client", "root_async_client"):
            client = getattr(self, attr)
            if client is not None and not isinstance(client, _CodexClient):
                setattr(self, attr, _CodexClient(client))
        return self

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
