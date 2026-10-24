"""Second half of build_template.sh: make the copied engine load only chapter one and keep only the assets it uses."""

import hashlib
import json
import re
import sys
from pathlib import Path

out = Path(sys.argv[1])
content = out / "src/content"

# Chapter one is the last installed chapter.
ch1_path = content / "chapters/chapter-one.json"
ch1 = json.loads(ch1_path.read_text())
ch1.pop("nextChapterId", None)
ch1_path.write_text(json.dumps(ch1, ensure_ascii=False, indent=2) + "\n")

loader = content / "chapterLoader.ts"
src = loader.read_text()
src = re.sub(r"export const installedChapterIds = \[.*?\] as const;",
             "export const installedChapterIds = [FIRST_CHAPTER_ID] as const;", src, flags=re.S)
src = re.sub(r"  const source =\n.*?: null;\n",
             '  const source = chapterId === FIRST_CHAPTER_ID ? await import("./chapters/chapter-one.json") : null;\n',
             src, flags=re.S)
loader.write_text(src)

# Build-time validator: validate whatever chapters are installed instead of a hardcoded list.
validator = out / "scripts/validateMandarinAssets.ts"
v = validator.read_text()
v = re.sub(r'  for \(const chapter of \[.*?\]\) \{\n    const source = JSON.parse\(\n      readFileSync\(resolve\(root, `src/content/chapters/chapter-\$\{chapter\}.json`\), "utf8"\),\n    \);',
           '  const dir = resolve(root, "src/content/chapters");\n'
           '  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {\n'
           '    const source = JSON.parse(readFileSync(resolve(dir, file), "utf8"));', v, flags=re.S)
v = v.replace("import { readFileSync", "import { readdirSync, readFileSync", 1)
assert "readdirSync(dir)" in v and "readdirSync, readFileSync" in v, "validator rewrite failed"
validator.write_text(v)

# Tests use node APIs; the reference project got node types implicitly from a test we drop.
tsconfig = out / "tsconfig.app.json"
tsconfig.write_text(tsconfig.read_text().replace('"types": ["vite/client",', '"types": ["node", "vite/client",'))

# Test code that reads the reference project's production history goes, then anything importing a deleted test helper.
src_dir = out / "src"
is_test = lambda f: ".test." in f.name or "/src/test/" in f.as_posix()
dead = {f for f in src_dir.rglob("*.ts*") if is_test(f) and "production/" in f.read_text()}
while dead:
    for f in dead:
        f.unlink()
    names = {f.stem for f in dead}
    dead = {f for f in src_dir.rglob("*.ts*") if is_test(f)
            and any(re.search(rf"from ['\"][^'\"]*/{re.escape(n)}['\"]", f.read_text()) for n in names)}

# Keep public files referenced (by ID or path) from chapter one, plus UI/fonts/favicons.
ch1_text = ch1_path.read_text()
manifest = (content / "assetManifest.ts").read_text()
keep = {p for id_, p in re.findall(r'"([^"]+)":\s*"(/assets/[^"]+)"', manifest) if f'"{id_}"' in ch1_text}
# Speech registry: keep only chapter one's recordings (the build validator requires every registered file to exist).
speech_path = content / "speechRecordings.json"
recordings = [r for r in json.loads(speech_path.read_text())
              if f'"{r["id"]}"' in ch1_text or any(u.get("chapterId") == "chapter-one" for u in r.get("allowedUsages") or [])]
# Their generation proofs live in the dropped production history, so pin them as retained bytes instead.
for r in recordings:
    data = (out / "public" / r["path"].lstrip("/")).read_bytes()
    r["provenance"] = {"kind": "retained", "sha256": hashlib.sha256(data).hexdigest(), "sources": [r["path"]]}
speech_path.write_text(json.dumps(recordings, ensure_ascii=False, indent=2) + "\n")
keep |= {r["path"] for r in recordings}
keep |= {p for p in re.findall(r'"(/assets/[^"]+)"', ch1_text)}

public = out / "public"
removed = 0
for f in public.rglob("*"):
    rel = "/" + f.relative_to(public).as_posix()
    if f.is_file() and rel.startswith("/assets/") and not rel.startswith(("/assets/ui/", "/assets/fonts/", "/assets/README")):
        if rel not in keep:
            f.unlink()
            removed += 1
print(f"kept {len(keep)} referenced assets, removed {removed}")
