"""Media generation tools. They write bytes through the project backend, never the host filesystem."""

import base64
import hashlib
import json
import os
import threading
import time

import httpx
from langchain.agents.middleware import AgentMiddleware
from langchain.tools import ToolRuntime
from langchain_core.messages import ToolMessage
from langchain_core.tools import tool
from langgraph.types import Command, interrupt
from openai import OpenAI

from novel_builder import codex_oauth
from novel_builder.settings import get_key

# Mirrors the stage list rendered by web/app/page.tsx.
STAGES = ["writer", "script_review", "director", "graphic_designer", "director_review",
          "art_review", "developer", "qa", "docs"]

MINIMAX_URL = os.environ.get("MINIMAX_API_URL", "https://api.minimax.io/v1/t2a_v2")
_minimax_lock = threading.Lock()
_minimax_last = 0.0
MINIMAX_SPACING_S = 7  # one request at a time, >=7s between starts (sample project's verified limit)


def _save(backend, path: str, data: bytes) -> str:
    res = backend.upload_files([(path, data)])[0]
    if res.error:
        return f"ERROR writing {path}: {res.error}"
    return f"wrote {path} ({len(data)} bytes) sha256={hashlib.sha256(data).hexdigest()}"


IMAGE_MODEL = os.environ.get("NB_IMAGE_MODEL", "gpt-image-2.5-flare")
CODEX_IMAGE_INSTRUCTIONS = "Generate exactly the requested image with the image_generation tool. Do not reply with text."


def make_image_tool(ctx):
    backend, owner = ctx.backend, ctx.owner

    @tool
    def generate_image(
        prompt: str,
        output_path: str,
        reference_paths: list[str] | None = None,
        transparent: bool = False,
        size: str = "1536x1024",
    ) -> str:
        """Generate one image with OpenAI and save it as PNG at output_path (project-relative, e.g. /production/chapter-01/art/bg-cafe.png).

        reference_paths: existing project images (design sheets, earlier sprites) used as visual references.
        transparent: True for character sprites/props that need an alpha background.
        size: 1024x1024, 1536x1024 (landscape backgrounds/CGs) or 1024x1536 (portrait sprites).
        Returns the written path and sha256, or an ERROR string. Never claim an asset exists if this errors.
        """
        refs = backend.download_files(reference_paths) if reference_paths else []
        missing = [r.path for r in refs if r.error]
        if missing:
            return f"ERROR: reference not found: {missing}"
        try:
            if ctx.codex:
                image = _codex_image(ctx, prompt, refs, transparent, size)
            else:
                image = _api_key_image(owner, prompt, refs, transparent, size)
        except Exception as e:  # surface provider errors to the agent instead of crashing the run
            return f"ERROR from image provider: {e}"
        return _save(backend, output_path, image)

    return generate_image


def _api_key_image(owner, prompt, refs, transparent, size) -> bytes:
    key = get_key("OPENAI_API_KEY", owner)
    if not key:
        raise RuntimeError("no ChatGPT connection and OPENAI_API_KEY not configured; mark the asset blocked")
    client = OpenAI(api_key=key)
    extra = {"background": "transparent"} if transparent else {}
    if refs:
        images = [(r.path.rsplit("/", 1)[-1], r.content, "image/png") for r in refs]
        result = client.images.edit(model=IMAGE_MODEL, image=images, prompt=prompt, size=size, **extra)
    else:
        result = client.images.generate(model=IMAGE_MODEL, prompt=prompt, size=size, **extra)
    return base64.b64decode(result.data[0].b64_json)


def _codex_image(ctx, prompt, refs, transparent, size) -> bytes:
    """ChatGPT-plan image generation through the Codex Responses endpoint's hosted image_generation tool (as Aubrey)."""
    content = [{"type": "input_text", "text": prompt}] + [
        {"type": "input_image", "image_url": f"data:image/png;base64,{base64.b64encode(r.content).decode()}"} for r in refs]
    image_tool = {"type": "image_generation", "model": IMAGE_MODEL, "size": size, "output_format": "png"}
    if transparent:
        image_tool["background"] = "transparent"
    payload = {"model": ctx.codex_models[0], "instructions": CODEX_IMAGE_INSTRUCTIONS,
               "input": [{"role": "user", "content": content}], "tools": [image_tool],
               "tool_choice": {"type": "image_generation"}, "stream": True, "store": False}
    headers = {"Authorization": f"Bearer {codex_oauth.access_token(ctx.owner)}", "Accept": "text/event-stream"}
    with httpx.stream("POST", f"{codex_oauth.CODEX_BASE_URL}/responses", json=payload, headers=headers, timeout=300) as r:
        if r.status_code >= 400:
            raise RuntimeError(f"Codex image generation failed ({r.status_code}): {r.read().decode()[:300]}")
        for line in r.iter_lines():
            if not line.startswith("data:"):
                continue
            try:
                event = json.loads(line[5:].strip())
            except ValueError:
                continue
            items = [event.get("item")] if isinstance(event.get("item"), dict) else (event.get("response") or {}).get("output") or []
            for item in items:
                if item.get("type") == "image_generation_call" and isinstance(item.get("result"), str):
                    return base64.b64decode(item["result"])
    raise RuntimeError("Codex returned no image (image generation may be unavailable on this plan)")


def make_speech_tool(ctx):
    backend, owner = ctx.backend, ctx.owner

    @tool
    def generate_speech(
        text: str,
        voice_id: str,
        output_path: str,
        model: str = "speech-2.8-turbo",
        language_boost: str | None = None,
        emotion: str = "calm",
    ) -> str:
        """Generate one spoken clip with MiniMax and save it as MP3 at output_path (project-relative).

        voice_id: the exact case-sensitive voice ID assigned in story/voice-cast.md. Never substitute another voice.
        language_boost: per-speaker setting from story/voice-cast.md (e.g. "Chinese", "English"), or None.
        Requests are serialized with >=7s spacing. Returns path + sha256 + returned voice, or an ERROR string.
        """
        global _minimax_last
        key = get_key("MINIMAX_API_KEY", owner)
        if not key:
            return "ERROR: MINIMAX_API_KEY not configured; report the clip as blocked."
        body = {
            "model": model,
            "text": text,
            "stream": False,
            "voice_setting": {"voice_id": voice_id, "speed": 1, "vol": 1, "pitch": 0, "emotion": emotion},
            "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": "mp3", "channel": 1},
        }
        if language_boost:
            body["language_boost"] = language_boost
        with _minimax_lock:
            time.sleep(max(0.0, _minimax_last + MINIMAX_SPACING_S - time.monotonic()))
            _minimax_last = time.monotonic()
            try:
                r = httpx.post(MINIMAX_URL, json=body, headers={"Authorization": f"Bearer {key}"}, timeout=120)
                data = r.json()
            except Exception as e:
                return f"ERROR from speech provider: {e}"
        status = data.get("base_resp", {})
        if status.get("status_code") not in (0, None) or not data.get("data", {}).get("audio"):
            return f"ERROR from speech provider: {status or data}"
        saved = _save(backend, output_path, bytes.fromhex(data["data"]["audio"]))
        return f"{saved} requested_model={model} voice_id={voice_id} language_boost={language_boost} extra_info={data.get('extra_info')}"

    return generate_speech


# ---------- producer tools ----------
# The backend is rooted at the selected story folder, so paths are story-relative ("/production/...").


def _status_path(chapter: int) -> str:
    return f"/production/chapter-{chapter:02d}/status.json"


def read_status(backend, chapter: int) -> dict:
    res = backend.download_files([_status_path(chapter)])[0]
    return json.loads(res.content) if not res.error else {"chapter": chapter, "complete": False}


def _chapter(runtime: ToolRuntime) -> int | None:
    """Chapter chosen in this conversation, else the one selected in the author's sidebar."""
    return runtime.state.get("chapter") or (runtime.config.get("configurable") or {}).get("chapter")


def make_producer_tools(backend, story_id: str):
    @tool
    def select_chapter(chapter: int, runtime: ToolRuntime) -> Command:
        """Work on this chapter number of the current story (the sidebar's selection is the default).
        Returns the chapter's current status. Use it to start a new chapter (next number) or switch chapters."""
        status = read_status(backend, chapter)
        return Command(update={"project": story_id, "chapter": chapter, "status": status, "messages": [
            ToolMessage(f"Selected chapter {chapter}. Status: {json.dumps(status)}", tool_call_id=runtime.tool_call_id)]})

    @tool
    def update_status(stage: str, value: str, runtime: ToolRuntime) -> Command:
        """Record a pipeline transition in the chapter's status.json, e.g. update_status("writer", "done").
        stage: one of writer, script_review, director, graphic_designer, director_review, art_review, developer, qa, docs,
        or "complete". value: done | pending | in_progress | blocked (for "complete": true | false).
        Setting a stage to pending also resets every later stage to pending (use it to reopen a finished chapter)."""
        chapter = _chapter(runtime)
        if not chapter:
            return Command(update={"messages": [ToolMessage("ERROR: call select_chapter first", tool_call_id=runtime.tool_call_id)]})
        try:
            status = update_stage(read_status(backend, chapter), stage, value)
        except ValueError as e:
            return Command(update={"messages": [ToolMessage(f"ERROR: {e}", tool_call_id=runtime.tool_call_id)]})
        backend.upload_files([(_status_path(chapter), (json.dumps(status, indent=2) + "\n").encode())])
        return Command(update={"project": story_id, "chapter": chapter, "status": status, "messages": [
            ToolMessage(f"status: {json.dumps(status)}", tool_call_id=runtime.tool_call_id)]})

    @tool
    def request_author_approval(gate: str, file: str, summary: str, runtime: ToolRuntime) -> str:
        """Pause and ask the author to approve an artifact. gate: "approve_script" (after the Writer),
        "approve_character_design" (a generated design sheet) or "approve_art" (after the Director approves the art).
        file: story-relative path of the artifact. summary: 1-3 sentences on what to review.
        Returns the author's decision and notes."""
        decision = interrupt({"type": "approval", "gate": gate, "project": story_id, "chapter": _chapter(runtime),
                              "file": file, "description": summary}) or {}
        verdict = "APPROVED" if decision.get("approved") else "CHANGES REQUESTED"
        return f"{verdict}. Author notes: {decision.get('notes') or '(none)'}"

    @tool
    def ask_author(question: str, options: list[str], runtime: ToolRuntime) -> str:
        """Pause and ask the author a question shown as a card. options: 2-4 short suggested answers
        (the author can also type their own). Returns the author's answer."""
        answer = interrupt({"type": "question", "question": question, "options": options,
                            "project": story_id, "chapter": _chapter(runtime)}) or {}
        return f"Author answered: {answer.get('answer') or '(no answer)'}"

    return [select_chapter, update_status, request_author_approval, ask_author]


def update_stage(status: dict, stage: str, value: str) -> dict:
    if stage == "complete":
        return {**status, "complete": value in ("true", "True", "done")}
    if stage not in STAGES:
        raise ValueError(f"unknown stage {stage!r}")
    if value == "pending":  # reopening a stage invalidates everything downstream
        return {**status, **{s: "pending" for s in STAGES[STAGES.index(stage):]}, "complete": False}
    return {**status, stage: value}


def _without_images(result):
    """Swap binary (image/audio/file) payloads in a tool result for a short note (keeps megabytes of base64 out of the Producer's history)."""
    if not isinstance(result, ToolMessage):
        return result
    content = result.content
    has_image = (isinstance(content, list) and any(isinstance(b, dict) and "base64" in b for b in content)) or (
        isinstance(content, str) and len(content) > 100_000 and '"base64"' in content[:200])
    if not has_image:
        return result
    return result.model_copy(update={"content": "[binary file exists; the Producer does not view images or media. "
                                                "Ask the director or graphic_designer to inspect it.]"})


class OmitImageResults(AgentMiddleware):
    """Producer-only middleware: subagents keep full image access for asset review."""

    def wrap_tool_call(self, request, handler):
        return _without_images(handler(request))

    async def awrap_tool_call(self, request, handler):
        return _without_images(await handler(request))
