#!/usr/bin/env bash
# Rebuild templates/vn-starter from the reference project (Beijing Heartbeat).
# Keeps the engine + chapter one as a worked example; drops chapters 2-13, their assets/tests and production history.
# ponytail: chapter-specific code paths for chapters 2-13 stay in src/ as dead code; a real engine refactor removes them.
set -euo pipefail
SRC="${1:-$HOME/Documents/ChatGPT/Beijing Heartbeat}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/templates/vn-starter"

rm -rf "$OUT" && mkdir -p "$OUT"
git -C "$SRC" archive HEAD | tar -x -C "$OUT"
cd "$OUT"

# Production history, Codex setup, hosting and story canon belong to the reference project, not the template.
rm -rf .codex .agents .github .vercelignore vercel.json supabase output docs/reviews story \
  production/chapter-* production/listening-repair production/mandarin-contracts production/relationship-stat-retro \
  production/chapter-history.md production/setup-verification.md \
  docs/storyline.md docs/player-feedback.md docs/chapter-analytics.md
find . -maxdepth 1 -name 'playwright.*.config.ts' ! -name 'playwright.config.ts' -delete
rm -f tests/e2e/*.spec.ts

# Chapters 2-13: content, chapter-specific styles, baselines and every test that mentions them.
LATER='chapter-(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen)|chapter(Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen)'
find src/content/chapters -name '*.json' ! -name 'chapter-one.json' -delete
grep -rlE "$LATER" src --include='*.test.ts' --include='*.test.tsx' | xargs rm -f
rm -f src/test/chapter*Baseline.ts
# These assert reference-project totals (all chapters' vocabulary/tiles/recordings, Supabase migrations).
rm -f src/components/game/MandarinPresentation.test.tsx src/game/audio/usePhraseAudio.test.tsx \
  src/game/audio/useRecordedPronunciation.test.tsx src/game/learning/phraseTileOrder.test.ts src/test/databasePolicies.test.ts

rm -f README.md PRODUCT.md production/README.md production/workflow-contracts.md
python3 "$ROOT/scripts/prune_template.py" "$OUT"
cp -R "$ROOT/scripts/template-overlay/." "$OUT/"
sed -i '' 's/"name": "beijing-heartbeat"/"name": "visual-novel"/' package.json package-lock.json
echo "template written to $OUT"
