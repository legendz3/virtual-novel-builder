"""Workspace seam: every file and shell access by agents and tools goes through the backend returned here.

Each story is a folder (created from the starter template under PROJECTS_DIR/<owner>/, or an existing folder the author
loaded, e.g. ~/Documents/ChatGPT/Beijing Heartbeat). Agents get a backend rooted at that story folder.
Hosted later: return a per-tenant sandbox/object-store backend from get_backend.
"""

import os
import re
from pathlib import Path

from deepagents.backends import CompositeBackend, FilesystemBackend, LocalShellBackend

from novel_builder.settings import PROJECTS_DIR, ROOT, TEMPLATE_DIR

_SHELL_ENV_KEYS = ("PATH", "HOME", "LANG", "TMPDIR")


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "untitled"


def owner_dir(owner: str) -> Path:
    return PROJECTS_DIR / slugify(owner)  # slugify keeps a crafted owner id inside PROJECTS_DIR


# Agent scratch output (oversized tool results, summarized conversation history, offloaded media) is routed here,
# outside the story folder, so it never lands in the author's repository.
ARTIFACTS_ROOT = "/.novel-builder"
SCRATCH_DIR = ROOT / ".data" / "scratch"


def scratch_dir(owner: str, story_id: str) -> Path:
    return SCRATCH_DIR / slugify(owner) / slugify(story_id)


def get_backend(root: Path, scratch: Path | None = None):
    """File + shell backend rooted at one story folder. No I/O here: the graph factory runs on the event loop.

    With `scratch`, deepagents' artifacts (under ARTIFACTS_ROOT) are stored in that folder instead of the story folder.
    """
    if os.environ.get("NB_WORKSPACE", "local") != "local":
        raise NotImplementedError(os.environ["NB_WORKSPACE"])
    # ponytail: unsandboxed local shell shared by all agents; swap for a container sandbox backend before multi-tenant use
    env = {k: os.environ[k] for k in _SHELL_ENV_KEYS if k in os.environ}
    story = LocalShellBackend(root_dir=root, virtual_mode=True, timeout=900, env=env)
    if scratch is None:
        return story
    return CompositeBackend(default=story, routes={f"{ARTIFACTS_ROOT}/": FilesystemBackend(root_dir=scratch, virtual_mode=True)},
                            artifacts_root=ARTIFACTS_ROOT)


def create_from_template(root: Path) -> int:
    """Copy the starter template into a new story folder. Returns files copied."""
    files = [
        ("/" + p.relative_to(TEMPLATE_DIR).as_posix(), p.read_bytes())
        for p in TEMPLATE_DIR.rglob("*")
        if p.is_file() and "node_modules" not in p.parts
    ]
    root.mkdir(parents=True, exist_ok=True)
    get_backend(root).upload_files(files)
    return len(files)
