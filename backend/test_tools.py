"""Run: uv run python test_tools.py — no API calls."""

from novel_builder.producer import make_graph
from novel_builder.tools import STAGES, update_stage

done = {s: "done" for s in STAGES}
reset = update_stage(done, "developer", "pending")
assert reset["writer"] == "done" and reset["developer"] == reset["qa"] == reset["docs"] == "pending"
assert reset["complete"] is False
assert update_stage({}, "writer", "done") == {"writer": "done"}
assert update_stage({}, "complete", "true")["complete"] is True
try:
    update_stage({}, "nope", "done")
    raise AssertionError("unknown stage accepted")
except ValueError:
    pass

import asyncio
import json as _json
import tempfile
from pathlib import Path
from novel_builder import settings, stories

with tempfile.TemporaryDirectory() as tmp:
    settings_root = Path(tmp)
    stories.REGISTRY_DIR = settings_root / "registry"
    import novel_builder.workspace as ws
    ws.PROJECTS_DIR = settings_root / "projects"
    # load an existing folder: rejected unless it looks like a project; duplicates return the same entry
    junk = settings_root / "junk"; junk.mkdir()
    try:
        stories.add_folder("selftest", str(junk)); raise AssertionError("non-project folder accepted")
    except stories.StoryError:
        pass
    ext = settings_root / "Beijing Heartbeat"; (ext / "production" / "chapter-02").mkdir(parents=True)
    (ext / "story" / "chapters").mkdir(parents=True); (ext / "story" / "chapters" / "chapter-01.md").write_text("# 1")
    (ext / "production" / "chapter-02" / "status.json").write_text(_json.dumps({"chapter": 2, "writer": "complete", "complete": True}))
    entry = stories.add_folder("selftest", str(ext))
    assert entry["id"] == "beijing-heartbeat" and stories.add_folder("selftest", str(ext)) == entry
    listed = {s["id"]: s for s in stories.list_stories("selftest")}
    assert [c["chapter"] for c in listed["beijing-heartbeat"]["chapters"]] == [1, 2]
    assert listed["beijing-heartbeat"]["chapters"][1]["status"]["complete"] is True
    assert stories.story_root("selftest", "beijing-heartbeat") == ext.resolve()
    # graphs: no story -> no tools; with story -> producer tools + subagents rooted at the folder
    bare = asyncio.run(make_graph({"configurable": {"user_id": "selftest"}}))
    assert "select_chapter" not in set(bare.get_graph().nodes.get("tools").data.tools_by_name if bare.get_graph().nodes.get("tools") else [])
    graph = asyncio.run(make_graph({"configurable": {"user_id": "selftest", "story_id": "beijing-heartbeat", "chapter": 2}}))
    assert {"select_chapter", "update_status", "request_author_approval", "ask_author", "task"} <= set(graph.get_graph().nodes["tools"].data.tools_by_name)
print("ok")

from langchain_core.messages import ToolMessage
from novel_builder.tools import _without_images

img = ToolMessage(content=[{"type": "image", "base64": "x" * 10, "mime_type": "image/png"}], tool_call_id="1")
assert "does not view images" in _without_images(img).content
txt = ToolMessage(content="# Chapter 1", tool_call_id="2")
assert _without_images(txt) is txt
print("ok images")

from novel_builder import codex_oauth
from novel_builder.models import RunContext

codex = RunContext(owner="selftest", backend=None, codex_models=["gpt-6.1-sol", "gpt-6-luna"])
m = codex.chat("openai:gpt-6-luna", "high")
assert m.model_name == "gpt-6-luna" and str(m.openai_api_base) == codex_oauth.CODEX_BASE_URL and m.store is False
assert codex.chat("openai:not-in-plan").model_name == "gpt-6.1-sol"  # falls back to the plan's top model
assert "chatgpt.com" not in str(RunContext(owner="x", backend=None).chat("openai:gpt-6-luna").openai_api_base)
print("ok models")

from langchain_core.messages import HumanMessage, SystemMessage
payload = codex.chat("openai:gpt-6-luna")._get_request_payload([SystemMessage("Be terse."), HumanMessage("hi")])
assert payload["instructions"] == "Be terse." and all(i.get("role") != "system" for i in payload["input"])
print("ok codex payload")

# Codex can send a tool call's arguments only in the `.done` event: they become one delta; normal deltas pass unchanged.
from types import SimpleNamespace as _E
from novel_builder.models import _ArgsDeltas
fix = _ArgsDeltas()
only_done = fix(_E(type="response.function_call_arguments.done", item_id="a", arguments='{"x": 1}', output_index=0, sequence_number=3))
assert [e.type for e in only_done] == ["response.function_call_arguments.delta", "response.function_call_arguments.done"]
assert only_done[0].delta == '{"x": 1}'
fix(_E(type="response.function_call_arguments.delta", item_id="b", delta='{"y"'))
assert len(fix(_E(type="response.function_call_arguments.done", item_id="b", arguments='{"y": 2}', output_index=1, sequence_number=5))) == 1
print("ok codex tool args")

# Agent artifacts go to the scratch folder, story files and shell stay in the story folder.
from deepagents.middleware.filesystem import FilesystemMiddleware
from novel_builder.workspace import ARTIFACTS_ROOT, get_backend as _gb
with tempfile.TemporaryDirectory() as tmp:
    story_dir, scratch = Path(tmp) / "story", Path(tmp) / "scratch"
    story_dir.mkdir()
    b = _gb(story_dir, scratch)
    b.upload_files([(f"{ARTIFACTS_ROOT}/large_tool_results/call_1", b"big"), ("/story/chapters/chapter-01.md", b"# 1")])
    assert (scratch / "large_tool_results" / "call_1").read_bytes() == b"big"
    assert not (story_dir / ".novel-builder").exists() and not (story_dir / "large_tool_results").exists()
    assert (story_dir / "story" / "chapters" / "chapter-01.md").exists()
    assert b.execute("pwd").output.strip() == str(story_dir.resolve())
    fs = FilesystemMiddleware(backend=b)
    assert fs._large_tool_results_prefix == f"{ARTIFACTS_ROOT}/large_tool_results"
print("ok scratch routing")

# The developer's speech clips pause for the author: the subagent's approval request reaches the producer's thread,
# and the author's decision (here: edit the line, then approve) resumes it.
from langchain_core.language_models.fake_chat_models import FakeMessagesListChatModel
from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command
from deepagents import create_deep_agent
from novel_builder.agents import developer as _dev


class _Scripted(FakeMessagesListChatModel):
    def bind_tools(self, tools, **kwargs):
        return self


def _call(name, args, i):
    return AIMessage("", tool_calls=[{"name": name, "args": args, "id": f"c{i}"}])


with tempfile.TemporaryDirectory() as tmp:
    b = _gb(Path(tmp))
    dev = _dev.subagent(RunContext(owner="selftest", backend=b, codex_models=[]))
    clip = {"text": "你好", "voice_id": "v1", "output_path": "/production/chapter-01/audio/a.mp3"}
    dev["model"] = _Scripted(responses=[_call("generate_speech", clip, 1), AIMessage("dev done")])
    g = create_deep_agent(model=_Scripted(responses=[_call("task", {"description": "clip", "subagent_type": "developer"}, 0),
                                                     AIMessage("done")]), subagents=[dev], backend=b, checkpointer=InMemorySaver())
    cfg = {"configurable": {"thread_id": "t"}}
    request = g.invoke({"messages": [{"role": "user", "content": "go"}]}, cfg)["__interrupt__"][0].value
    assert request["action_requests"][0]["args"] == clip and request["review_configs"][0]["allowed_decisions"] == ["approve", "edit", "reject"]
    edited = {"type": "edit", "edited_action": {"name": "generate_speech", "args": {**clip, "text": "您好"}}}
    assert g.invoke(Command(resume={"decisions": [edited]}), cfg)["messages"][-1].content == "done"
print("ok speech approval")
