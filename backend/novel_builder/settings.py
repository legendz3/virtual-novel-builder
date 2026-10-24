"""Secrets and paths. The single seam to swap for a per-tenant secret store when hosted."""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_DIR = ROOT / "templates" / "vn-starter"
PROJECTS_DIR = Path(os.environ.get("NB_PROJECTS_DIR", ROOT / "projects"))
AGENTS_DIR = ROOT / "backend" / "agents"


def get_key(name: str, owner: str = "local") -> str | None:
    # ponytail: env-only, one tenant; look up per-owner secrets here when hosted
    return os.environ.get(name)
