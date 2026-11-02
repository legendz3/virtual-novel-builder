#!/usr/bin/env bash
# Start the LangGraph backend (:2024) and the web UI (:3000) together. Ctrl-C stops both cleanly.
cd "$(dirname "$0")/.."
uv run --directory backend langgraph dev --no-browser --port 2024 &
backend=$!
trap 'kill -INT $backend 2>/dev/null; wait $backend' EXIT
npm --prefix web run dev
