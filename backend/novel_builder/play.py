"""Play links: run a story's own Vite dev server so the author can play it (and see later adjustments live).

ponytail: local processes tracked in memory, one per story; a hosted version would build and serve static previews instead.
"""

import os
import socket
import subprocess
import threading
import time
from pathlib import Path

_servers: dict[str, dict] = {}  # story root -> {"state", "url", "proc", "message"}
_lock = threading.Lock()
_ENV_KEYS = ("PATH", "HOME", "LANG", "TMPDIR")


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _listening(port: int) -> bool:
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def status(root: Path) -> dict:
    entry = _servers.get(str(root))
    if not entry:
        return {"state": "stopped"}
    if entry.get("proc") and entry["proc"].poll() is not None and entry["state"] != "error":
        entry.update(state="error", message="The game server exited. Try Play again.")
    return {k: v for k, v in entry.items() if k != "proc"}


def start(root: Path) -> dict:
    with _lock:
        current = status(root)
        if current["state"] in ("starting", "running"):
            return current
        _servers[str(root)] = {"state": "starting", "message": "Starting the game…"}
    threading.Thread(target=_run, args=(root,), daemon=True).start()
    return status(root)


def _run(root: Path) -> None:
    entry = _servers[str(root)]
    env = {k: os.environ[k] for k in _ENV_KEYS if k in os.environ}
    try:
        if not (root / "node_modules").exists():
            entry["message"] = "Installing game dependencies (first run only)…"
            cmd = ["npm", "ci"] if (root / "package-lock.json").exists() else ["npm", "install"]
            done = subprocess.run(cmd, cwd=root, env=env, capture_output=True, text=True, timeout=900)
            if done.returncode != 0:
                raise RuntimeError(f"{' '.join(cmd)} failed: {done.stderr[-400:]}")
        port = _free_port()
        entry["message"] = "Starting the game server…"
        proc = subprocess.Popen(["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", str(port), "--strictPort"],
                                cwd=root, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        entry["proc"] = proc
        for _ in range(120):
            if proc.poll() is not None:
                raise RuntimeError("The game server exited during startup (check `npm run dev` in the story folder).")
            if _listening(port):
                entry.update(state="running", url=f"http://127.0.0.1:{port}/", message=None)
                return
            time.sleep(0.5)
        raise RuntimeError("The game server did not start within 60 seconds.")
    except Exception as e:
        entry.update(state="error", message=str(e))


def stop(root: Path) -> dict:
    entry = _servers.pop(str(root), None)
    if entry and entry.get("proc"):
        entry["proc"].terminate()
    return {"state": "stopped"}
