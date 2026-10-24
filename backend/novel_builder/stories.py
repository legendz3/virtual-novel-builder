"""Story registry: the author's stories (template-created or loaded from existing folders) and their chapters.

Registry file: .data/stories/<owner>.json -> [{"id", "title", "path"}]. Folders under PROJECTS_DIR/<owner>/ are listed
automatically. Chapter status comes from each story's production/chapter-XX/status.json (the source of truth).
"""

import json
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from pathlib import Path

from novel_builder.settings import ROOT
from novel_builder.workspace import create_from_template, owner_dir, slugify

REGISTRY_DIR = ROOT / ".data" / "stories"
_CHAPTER = re.compile(r"chapter-(\d+)")
# Stage values that count as finished: this builder writes "done"; the Beijing Heartbeat sample uses these too.
DONE_VALUES = {"done", "complete", "approved", "passed"}


class StoryError(ValueError):
    pass


# macOS blocks file access to protected folders (Documents, Desktop, Downloads) until the user answers a privacy prompt;
# a blocked open() never returns. Folder reads for loaded stories go through here so the app reports it instead of hanging.
_fs = ThreadPoolExecutor(max_workers=4, thread_name_prefix="story-fs")
FS_TIMEOUT_S = 5
PERMISSION_HINT = ("macOS hasn't allowed the backend to read this folder yet. Allow the 'access files in your Documents "
                   "folder' prompt (or System Settings > Privacy & Security > Files and Folders), then try again.")


def _guarded(fn, *args):
    try:
        return _fs.submit(fn, *args).result(timeout=FS_TIMEOUT_S)
    except FutureTimeout:
        raise StoryError(PERMISSION_HINT) from None


def _registry_path(owner: str) -> Path:
    return REGISTRY_DIR / f"{slugify(owner)}.json"


def _registered(owner: str) -> list[dict]:
    path = _registry_path(owner)
    return json.loads(path.read_text()) if path.exists() else []


def _save_registry(owner: str, entries: list[dict]) -> None:
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    _registry_path(owner).write_text(json.dumps(entries, indent=2) + "\n")


def _title(root: Path, fallback: str) -> str:
    try:
        name = json.loads((root / "package.json").read_text()).get("name", "")
    except (OSError, ValueError):
        name = ""
    generic = {"", "visual-novel", "novel-builder-web"}
    return fallback if name in generic else name.replace("-", " ").title()


def _entries(owner: str) -> list[dict]:
    """Registered folders plus every story created under PROJECTS_DIR/<owner>/, de-duplicated by id."""
    entries = {e["id"]: e for e in _registered(owner)}
    base = owner_dir(owner)
    if base.exists():
        for folder in sorted(p for p in base.iterdir() if p.is_dir()):
            entries.setdefault(folder.name, {"id": folder.name, "title": folder.name.replace("-", " ").title(),
                                             "path": str(folder)})
    return list(entries.values())


def story_root(owner: str, story_id: str) -> Path:
    entry = next((e for e in _entries(owner) if e["id"] == story_id), None)
    if not entry:
        raise StoryError(f"Unknown story: {story_id}")
    return Path(entry["path"])


def read_status(root: Path, chapter: int) -> dict:
    path = root / "production" / f"chapter-{chapter:02d}" / "status.json"
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError):
        return {"chapter": chapter, "complete": False}


_WORDS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen "
                                       "fourteen fifteen sixteen seventeen eighteen nineteen twenty".split())}
_RUNTIME_CHAPTER = re.compile(r"chapter-([a-z]+|\d+)")


def chapters(root: Path) -> list[dict]:
    """Chapters found in production/, story/chapters/ and the game's src/content/chapters (e.g. chapter-two.json)."""
    numbers = set()
    for folder in ("production", "story/chapters"):
        d = root / folder
        if d.is_dir():
            numbers |= {int(m.group(1)) for p in d.iterdir() if (m := _CHAPTER.fullmatch(p.stem))}
    in_game = set()
    runtime = root / "src" / "content" / "chapters"
    if runtime.is_dir():
        for p in runtime.glob("chapter-*.json"):
            if m := _RUNTIME_CHAPTER.fullmatch(p.stem):
                n = int(m.group(1)) if m.group(1).isdigit() else _WORDS.get(m.group(1))
                if n:
                    in_game.add(n)
    return [{"chapter": n, "status": read_status(root, n), "in_game": n in in_game} for n in sorted(numbers | in_game)]


def list_stories(owner: str) -> list[dict]:
    out = []
    for e in _entries(owner):
        root = Path(e["path"])
        try:
            found = _guarded(lambda r: chapters(r) if r.is_dir() else None, root)
            out.append({**e, "available": found is not None, "chapters": found or []})
        except StoryError as err:
            out.append({**e, "available": False, "chapters": [], "error": str(err)})
    return out


def add_folder(owner: str, path: str) -> dict:
    """Register an existing story folder (local-only: the backend reads and runs code from that folder)."""
    root = Path(path).expanduser()
    if not root.is_absolute():
        raise StoryError("Use the folder's full path, e.g. /Users/you/Documents/My Story.")
    root, is_dir, is_project, title = _guarded(_inspect, root)
    if not is_dir:
        raise StoryError(f"Not a folder: {root}")
    if not is_project:
        raise StoryError("That folder doesn't look like a visual-novel project (no package.json, story/ or production/).")
    entries = _registered(owner)
    existing = next((e for e in entries if Path(e["path"]) == root), None)
    if existing:
        return existing
    ids = {e["id"] for e in _entries(owner)}
    story_id, n = slugify(root.name), 2
    while story_id in ids:
        story_id, n = f"{slugify(root.name)}-{n}", n + 1
    entry = {"id": story_id, "title": title, "path": str(root)}
    _save_registry(owner, entries + [entry])
    return entry


def _inspect(root: Path) -> tuple[Path, bool, bool, str]:
    root = root.resolve()
    is_dir = root.is_dir()
    is_project = is_dir and any((root / m).exists() for m in ("package.json", "story", "production"))
    return root, is_dir, is_project, _title(root, root.name) if is_project else root.name


def new_story(owner: str, title: str) -> dict:
    story_id = slugify(title)
    root = owner_dir(owner) / story_id
    if root.exists():
        raise StoryError(f"A story folder named {story_id} already exists.")
    create_from_template(root)
    entry = {"id": story_id, "title": title.strip(), "path": str(root)}
    _save_registry(owner, _registered(owner) + [entry])
    return entry


# ---------- read-only file access for the app's cards (gallery, previews, status) ----------

MEDIA_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
               ".md": "text/plain; charset=utf-8", ".json": "application/json"}
_IMAGE = re.compile(r"\.(png|jpe?g|webp)$", re.I)


def _inside(root: Path, rel: str) -> Path:
    full = (root / rel.lstrip("/")).resolve()
    if full != root.resolve() and root.resolve() not in full.parents:
        raise StoryError("Path is outside the story folder")
    return full


def read_file(owner: str, story_id: str, rel: str) -> tuple[bytes, str]:
    full = _inside(story_root(owner, story_id), rel)
    media = MEDIA_TYPES.get(full.suffix.lower())
    if not media:
        raise StoryError("Unsupported file type")
    data = _guarded(lambda p: p.read_bytes() if p.is_file() else None, full)
    if data is None:
        raise FileNotFoundError(rel)
    return data, media


def list_images(owner: str, story_id: str, rel_dir: str) -> list[str]:
    root = story_root(owner, story_id).resolve()
    base = _inside(root, rel_dir)
    return _guarded(lambda b: sorted(p.relative_to(root).as_posix() for p in b.rglob("*")
                                     if p.is_file() and _IMAGE.search(p.name)) if b.is_dir() else [], base)
