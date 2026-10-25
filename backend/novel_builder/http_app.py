"""Custom routes mounted on the LangGraph server (langgraph.json "http.app"): stories, play links, ChatGPT sign-in."""

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

from novel_builder import codex_oauth, play, stories


def _owner(request: Request) -> str:
    # ponytail: single local owner; take it from the authenticated user once LangGraph auth is added
    return request.query_params.get("owner") or "local"


def _json(fn):
    def handler(request: Request):
        try:
            return JSONResponse(fn(request))
        except codex_oauth.CodexAuthError as e:
            return JSONResponse({"state": "error", "message": str(e)}, status_code=502)
        except stories.StoryError as e:
            return JSONResponse({"error": str(e)}, status_code=400)
    return handler


def _body(request: Request) -> dict:
    # Sync handlers run in a worker thread; read the JSON body from the query string instead of awaiting request.json().
    return dict(request.query_params)


def _file(request: Request):
    try:
        data, media = stories.read_file(_owner(request), request.path_params["story_id"], request.query_params.get("path", ""))
    except stories.StoryError as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    except FileNotFoundError:
        return JSONResponse({"error": "not found"}, status_code=404)
    return Response(data, media_type=media, headers={"Cache-Control": "no-store"})


def _root(request: Request):
    return stories.story_root(_owner(request), request.path_params["story_id"])


# Sync handlers on purpose: Starlette runs them in a thread pool, so file, process and HTTP I/O never block the event loop.
app = Starlette(routes=[
    Route("/stories", _json(lambda r: {"stories": stories.list_stories(_owner(r))})),
    Route("/stories/new", _json(lambda r: stories.new_story(_owner(r), _body(r).get("title", ""))), methods=["POST"]),
    Route("/stories/load", _json(lambda r: stories.add_folder(_owner(r), _body(r).get("path", ""))), methods=["POST"]),
    Route("/stories/{story_id}/file", _file),
    Route("/stories/{story_id}/media", _json(lambda r: {"files": stories.list_media(
        _owner(r), r.path_params["story_id"], r.query_params.get("dir", ""))})),
    Route("/stories/{story_id}/play", _json(lambda r: play.status(_root(r)))),
    Route("/stories/{story_id}/play", _json(lambda r: play.start(_root(r))), methods=["POST"]),
    Route("/stories/{story_id}/play/stop", _json(lambda r: play.stop(_root(r))), methods=["POST"]),
    Route("/account/chatgpt", _json(lambda r: codex_oauth.status(_owner(r), refresh=bool(r.query_params.get("refresh"))))),
    Route("/account/chatgpt/connect", _json(lambda r: {"state": "connecting", **codex_oauth.start(_owner(r))}), methods=["POST"]),
    Route("/account/chatgpt/cancel", _json(lambda r: codex_oauth.cancel(_owner(r))), methods=["POST"]),
    Route("/account/chatgpt/disconnect", _json(lambda r: codex_oauth.disconnect(_owner(r))), methods=["POST"]),
])
