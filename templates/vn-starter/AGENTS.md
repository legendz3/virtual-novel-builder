# Project guide

This visual novel is produced by the Virtual Novel Builder studio: a Producer orchestrates Writer, Director,
Graphic Designer, Developer and QA specialists. Specialists never delegate to each other and never edit
`production/chapter-XX/status.json`; the Producer owns status.

## Starting point

The engine was distilled from a reference project (a Mandarin-learning romance set in Beijing). Until this
project's own chapter one is implemented, `src/content/chapters/chapter-one.json`, its assets, home-page copy
(`src/content/homePageCopy.ts`), `index.html` title and `package.json` name are **example content** — the
Developer replaces them when implementing chapter 1. Mandarin/phrase-construction mechanics are optional
features: use them only if this novel has a language-learning goal.

## Canon and policy (read what your task needs)

- [Story bible](story/story-bible.md), [characters](story/characters/README.md), [voice cast](story/voice-cast.md)
- Chapter scripts: `story/chapters/chapter-XX.md`; production artifacts: `production/chapter-XX/`
- [Story production policy](docs/story-production-policy.md) — reference project's rules; adapt to this novel's brief
- Language-learning features (only if used): [Mandarin presentation](docs/mandarin-presentation.md),
  [phrase construction](docs/phrase-construction.md), [language detours](docs/language-detours.md)
- Engine: [architecture](docs/architecture.md), [code map](docs/code-map.md), [gameplay mechanics](docs/gameplay-mechanics.md),
  [phone presentation](docs/phone-presentation.md)

## Engine rules

React controls application state and UI. Phaser is a rendering and interaction layer; business logic never lives in Phaser scenes.

- Use Node from `.nvmrc` and npm; preserve the lockfile. After app/content changes run `npm run lint`, `npm run test:run`,
  `npm run build` and relevant Playwright tests.
- Story content lives in `src/content` (chapter JSON), never JSX. `game/story` and `game/learning` are framework-independent
  engines. `phaser` is rendering only. `PhaserBridge` is the only business-layer renderer API.
- Register new chapters in `src/content/chapterLoader.ts` and set the previous chapter's `nextChapterId`.
- Register assets with exact IDs in `src/content/assetManifest.ts`; speech clips in `src/content/speechRecordings.json`.
- All saves pass through `migrateSave`; add migrations before changing the schema version. Local persistence first.
- Keep browser code free of Node and filesystem APIs. No credentials in the repo.
- Gameplay stays consistent across chapters: reuse shared components, controls, feedback, retry and reward rules.

## Product constraints

Defined by this novel's brief and story bible. The Writer records POV, tone, cast, relationship variables and any
learning goals in `story/story-bible.md` before chapter one.
