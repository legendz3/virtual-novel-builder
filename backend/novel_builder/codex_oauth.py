"""ChatGPT (Codex) OAuth via the device-code flow, mirroring Aubrey (SaaS Agent packages/hermes_saas/providers/codex_oauth.py).

Sign-in: device code -> user enters it at auth.openai.com/codex/device -> poll -> authorization code + PKCE verifier
-> token exchange. Tokens are Fernet-encrypted at rest per owner under .data/credentials/. Model and image calls then use
the Codex backend Responses endpoint (CODEX_BASE_URL) with the access token, billed to the user's ChatGPT plan.

Note: this reuses the Codex CLI's public client id and an undocumented ChatGPT backend; OpenAI can change it without notice.
"""

import base64
import json
import os
import threading
import time
from pathlib import Path

import httpx
from cryptography.fernet import Fernet, InvalidToken

from novel_builder.settings import ROOT
from novel_builder.workspace import slugify

CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
ISSUER = "https://auth.openai.com"
TOKEN_URL = f"{ISSUER}/oauth/token"
DEVICE_URL = f"{ISSUER}/codex/device"
CODEX_BASE_URL = os.environ.get("NB_CODEX_BASE_URL", "https://chatgpt.com/backend-api/codex")
CLIENT_VERSION = "1.0.0"
DATA_DIR = ROOT / ".data"

_flows: dict[str, dict] = {}  # owner -> pending device flow (ponytail: in-memory; a DB table like Aubrey's when hosted)
_locks: dict[str, threading.Lock] = {}


class CodexAuthError(RuntimeError):
    pass


# ---------- encrypted credential store ----------


def _cipher() -> Fernet:
    key = os.environ.get("NB_CREDENTIAL_KEY")
    if not key:
        # ponytail: local dev keeps a generated key beside the data; set NB_CREDENTIAL_KEY (from a secret manager) when hosted
        path = DATA_DIR / "credential.key"
        if not path.exists():
            _write_private(path, Fernet.generate_key())
        key = path.read_text().strip()
    return Fernet(key.encode())


def _write_private(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    tmp = path.with_suffix(path.suffix + ".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def _path(owner: str) -> Path:
    return DATA_DIR / "credentials" / f"{slugify(owner)}.enc"


def load(owner: str) -> dict | None:
    path = _path(owner)
    if not path.exists():
        return None
    try:
        return json.loads(_cipher().decrypt(path.read_bytes()))
    except InvalidToken as e:
        raise CodexAuthError("Stored ChatGPT credentials could not be decrypted; reconnect.") from e


def _save(owner: str, creds: dict) -> dict:
    _write_private(_path(owner), _cipher().encrypt(json.dumps(creds).encode()))
    return creds


def connected(owner: str) -> bool:
    return _path(owner).exists()


# ---------- tokens ----------


def _claims(access_token: str) -> dict:
    """Unverified JWT payload, used only for expiry and display (plan/email). Never for authorization decisions."""
    try:
        part = access_token.split(".")[1]
        return json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
    except Exception:
        return {}


def _token_record(payload: dict, previous: dict | None = None) -> dict:
    access = payload.get("access_token")
    refresh = payload.get("refresh_token") or (previous or {}).get("refresh_token")
    if not access or not refresh:
        raise CodexAuthError("OpenAI token response was incomplete")
    claims = _claims(access)
    auth = claims.get("https://api.openai.com/auth", {})
    profile = claims.get("https://api.openai.com/profile", {})
    return {
        **(previous or {}),
        "access_token": access,
        "refresh_token": refresh,
        "expires_at": claims.get("exp") or time.time() + int(payload.get("expires_in", 3600)),
        "email": profile.get("email") or (previous or {}).get("email"),
        "plan": auth.get("chatgpt_plan_type") or (previous or {}).get("plan"),
    }


def access_token(owner: str) -> str:
    """Valid access token for `owner`, refreshed when within 5 minutes of expiry."""
    with _locks.setdefault(slugify(owner), threading.Lock()):
        creds = load(owner)
        if not creds:
            raise CodexAuthError("ChatGPT is not connected. Use 'Connect ChatGPT' in the web app.")
        if creds["expires_at"] - time.time() > 300:
            return creds["access_token"]
        resp = httpx.post(TOKEN_URL, data={"grant_type": "refresh_token", "refresh_token": creds["refresh_token"],
                                           "client_id": CLIENT_ID}, timeout=20)
        if resp.status_code != 200:
            raise CodexAuthError(f"ChatGPT token refresh failed ({resp.status_code}); reconnect in the web app.")
        return _save(owner, _token_record(resp.json(), creds))["access_token"]


def list_models(token: str) -> list[str]:
    """Codex catalog slugs usable over the API, in the catalog's priority order (as Aubrey parses them)."""
    resp = httpx.get(f"{CODEX_BASE_URL}/models", params={"client_version": CLIENT_VERSION},
                     headers={"Authorization": f"Bearer {token}"}, timeout=20)
    if resp.status_code != 200:
        raise CodexAuthError(f"Codex models request failed ({resp.status_code})")
    entries = [m for m in resp.json().get("models", []) if isinstance(m, dict) and m.get("slug")
               and m.get("supported_in_api") is not False
               and str(m.get("visibility", "")).lower() not in ("hide", "hidden")]
    entries.sort(key=lambda m: (m.get("priority") if isinstance(m.get("priority"), (int, float)) else 10_000, m["slug"]))
    return list(dict.fromkeys(m["slug"] for m in entries))


# ---------- device-code sign-in ----------


def start(owner: str) -> dict:
    """Begin a device-code sign-in. Returns the code the user enters at the verification page."""
    owner = slugify(owner)
    flow = _flows.get(owner)
    if flow and flow["state"] == "pending" and flow["expires_at"] > time.time():
        return public_flow(flow)
    resp = httpx.post(f"{ISSUER}/api/accounts/deviceauth/usercode", json={"client_id": CLIENT_ID}, timeout=20)
    if resp.status_code != 200:
        raise CodexAuthError(f"OpenAI device-code request failed ({resp.status_code})")
    data = resp.json()
    if not data.get("user_code") or not data.get("device_auth_id"):
        raise CodexAuthError("OpenAI device-code response was incomplete")
    flow = {"state": "pending", "user_code": data["user_code"], "device_auth_id": data["device_auth_id"],
            "verification_uri": DEVICE_URL, "interval": max(3, int(data.get("interval") or 5)),
            "expires_at": time.time() + max(60, int(data.get("expires_in") or 900))}
    _flows[owner] = flow
    threading.Thread(target=_poll, args=(owner, flow), daemon=True).start()
    return public_flow(flow)


def _poll(owner: str, flow: dict) -> None:
    while flow["state"] == "pending" and time.time() < flow["expires_at"]:
        time.sleep(flow["interval"])
        try:
            resp = httpx.post(f"{ISSUER}/api/accounts/deviceauth/token",
                              json={"device_auth_id": flow["device_auth_id"], "user_code": flow["user_code"]}, timeout=20)
            if resp.status_code in (403, 404):
                continue  # user has not finished yet
            if resp.status_code != 200:
                raise CodexAuthError(f"OpenAI device-auth polling failed ({resp.status_code})")
            code = resp.json()
            tokens = httpx.post(TOKEN_URL, data={
                "grant_type": "authorization_code", "code": code["authorization_code"],
                "redirect_uri": f"{ISSUER}/deviceauth/callback", "client_id": CLIENT_ID,
                "code_verifier": code["code_verifier"]}, timeout=20)
            if tokens.status_code != 200:
                raise CodexAuthError(f"OpenAI token exchange failed ({tokens.status_code})")
            creds = _token_record(tokens.json())
            creds["models"] = list_models(creds["access_token"])
            _save(owner, creds)
            flow["state"] = "complete"
            return
        except Exception as e:
            if flow["state"] == "pending":
                flow.update(state="failed", error=str(e))
            return
    if flow["state"] == "pending":
        flow["state"] = "expired"


def public_flow(flow: dict) -> dict:
    return {k: flow[k] for k in ("user_code", "verification_uri", "expires_at") if k in flow}


def status(owner: str, refresh: bool = False) -> dict:
    owner = slugify(owner)
    flow = _flows.get(owner)
    if flow and flow["state"] == "pending":
        return {"state": "connecting", **public_flow(flow)}
    creds = load(owner)
    if not creds:
        failed = flow and flow["state"] in ("failed", "expired")
        return {"state": "error", "message": flow.get("error") or "The sign-in code expired."} if failed else {"state": "disconnected"}
    if refresh:
        try:
            creds = _save(owner, {**load(owner), "models": list_models(access_token(owner))})
        except Exception as e:
            return {"state": "error", "message": str(e), "email": creds.get("email")}
    return {"state": "connected", "email": creds.get("email"), "plan": creds.get("plan"), "models": creds.get("models", [])}


def cancel(owner: str) -> dict:
    flow = _flows.pop(slugify(owner), None)
    if flow:
        flow["state"] = "cancelled"
    return status(owner)


def disconnect(owner: str) -> dict:
    """Delete this app's stored tokens. Does not revoke the grant at OpenAI."""
    cancel(owner)
    _path(owner).unlink(missing_ok=True)
    return {"state": "disconnected"}
