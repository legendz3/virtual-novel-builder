# Dating Sim Project Instructions

## Product

This is a Mandarin-learning romantic visual novel.

The player character is Emma, an American woman studying abroad in Beijing.

The player generally sees the world through Emma's first-person perspective.

Emma is normally not rendered as an on-screen sprite.

## Production philosophy

Story quality comes first.

Mandarin education must be integrated naturally into the story rather than constantly interrupting it.

Romance is slow burn.

Production scope should remain manageable.

Prefer reuse over creating unnecessary backgrounds, sprites, mechanics, and code.

## Romantic tone

The romantic writing should emphasize:

- competition
- restraint
- escalating intimacy
- jealousy
- rivalry
- forced proximity
- unresolved attraction
- teasing
- verbal sparring
- characters finding excuses to be near each other
- characters insisting they do not care when their actions show otherwise
- favors disguised as inconvenience
- remembering small personal details
- interrupted moments
- emotional vulnerability
- misunderstandings
- conflicting loyalties

Characters must not fall in love immediately.

Avoid constant overt flirting.

Apply the [player feedback through Chapter Eight](player-feedback.md): reduce turns of teasing/flirting that do not advance the storyline or romantic dynamic. Writer cuts repeated jokes, denials, retorts, and explanations once the point lands; Director flags padding before staging and QA checks rendered pacing. Preserve meaningful slow-burn moments, choice consequences, and Mandarin support without replacing cuts with repetitive narration or forcing faster romantic commitment.

Actions, hesitation, jealousy, attention, physical distance, and subtext should frequently communicate more than explicit declarations.

Physical intimacy should escalate gradually.

Personal choices with romantic interests must have meaningful relationship-stat consequences for every option. Apply this to newly authored or revised choices within the requested chapter scope. Match the emotional intent, including trust from respected boundaries, and show the actual committed change; language-test correctness remains separate. Existing saves need compatibility when previously unrewarded choices gain effects.

## Mandarin learning

Follow `docs/mandarin-presentation.md` for every Chinese occurrence, including non-game dialogue. Default to Chinese characters with tone-marked pinyin and an English meaning; any reduced support needs a stated purpose and reveal rule. Every standalone Chinese character utterance requires audio in the speaking character's assigned voice, including single words, phrases and sentences, even when pinyin and an English meaning are displayed and even without a comprehension game. Apply this across the whole requested chapter, including optional branches and spoken corrections. Director must plan a matching recording and automatic or on-demand playback for each such beat, using the exact cast/model in `story/voice-cast.md`. Other Chinese content may be deliberately unvoiced or voiced for a stated purpose. Director records defaults and event-specific exceptions, Developer implements them through shared content/UI, and QA checks actual text, accessibility, reveal timing, and audio across chapters. Missing required dialogue audio prevents acceptance.

Chinese difficulty increases progressively across chapters.

Early chapters contain mostly English with simple Mandarin.

Later chapters use increasingly natural Mandarin.

New vocabulary and grammar should be manageable.

Previously learned language should be recycled naturally.

Useful gameplay types include:

- phrase construction
- listening comprehension
- response selection
- vocabulary-in-context
- texting
- tone interpretation
- environmental reading

Do not turn every Mandarin line into a minigame.

Usually 1–3 significant language interactions per chapter is enough.

Wrong answers should often produce entertaining story consequences rather than a generic "incorrect" screen.

Follow `docs/language-detours.md` for optional, short linguistic side quests inside conversations. Writer should look for meaningful alternatives and plausible near misses that teach usage, tone, or conversational roles; Director decides where they fit and reuses shared choices. Include authentic chengyu only when suitable for the scene and learner level. Preserve a familiar path, teach through a brief character reaction and explanation, and return to the story. More complex language is not automatically better; QA verifies contextual accuracy and useful feedback. This is a design opportunity, not a quota or an instruction to revise shipped choices outside the requested scope.

## Visual direction

First-person Emma POV is the default.

Backgrounds and character sprites must remain separate whenever possible.

Background images should not contain major story characters.

Character sprites should normally have transparent backgrounds.

Major romance-interest character design sheets are authoritative references.

Do not redesign established characters.

Reuse backgrounds and poses whenever believable.

The Director should proactively request new backgrounds, sprites, expressions, or CGs when they strengthen the story, atmosphere, or emotional impact, even if existing assets could technically stage the scene. Keep scope manageable and explain each new asset's story purpose; asset count is not the primary measure of a good plan. Graphic Designer creates the images through the normal production and review workflow.

Full CG illustrations are reserved for significant memorable moments.

## Ambience and sound effects

For scene ambience and sound effects, follow `production/README.md#ambience-and-sound-effects`. Players value environmental sound such as the airport background. Director should consider appropriate cues and reuse suitable approved sounds. When a new sound would help and no existing asset fits, Director prepares a concrete request and the parent Coordinator asks the author to find and provide it. Keep missing sources pending and continue independent work; do not generate, acquire, or substitute a new sound unless separately authorized. This sourcing rule is separate from current character/vocabulary speech generation.

## Production ownership

Writer owns narrative.

Director owns chapter production design.

Graphic Designer owns creation of requested visual assets.

Developer owns implementation.

QA owns verification.

The Chapter Coordinator owns sequencing and delegation.

Specialist agents must not silently take over another agent's responsibility.

## Source of truth

Production artifacts in the repository are the source of truth.

Agents should read files rather than relying on summaries from previous agents whenever possible.

Do not invent missing continuity.

If previous chapters exist, inspect them before creating later chapters.

## Existing work

Never overwrite approved existing chapters, art, code, or production files without a clear reason.

Preserve established naming conventions when they already exist.

## Production files and existing runtime

- `story/story-bible.md` indexes established canon and gaps. [The completed storyline guide](storyline.md) covers the eleven installed chapters with scene summaries and the complete 2,502-event script (113 Chapter One, 152 Chapter Two, 232 Chapter Three, 233 Chapter Four, 220 Chapter Five, 261 Chapter Six, 256 Chapter Seven, 232 Chapter Eight, 342 Chapter Nine, 250 Chapter Ten and 211 Chapter Eleven events), every branch, rewards, vocabulary, and unresolved story threads. Search its chapter/character headings and read the sections relevant to the assigned scope before extending or reviewing the story, then verify relevant details against the authoritative shipped `src/content/chapters/*.json` files. Future narrative drafts belong in `story/chapters/chapter-XX.md`; do not recreate the documented chapters or treat unresolved threads as completed events.
- [The character index](../story/characters/README.md) documents all eleven characters: Emma, Li Wei, Chen Kai, Zhou Yichen, Han Ziqian, Sofia Alvarez, Emma's mother, Professor Zhu, Miss Ford, Xu Cheng, and Tang Yuning. Xu Cheng is introduced in Chapter Nine; Tang Yuning remains Li Wei's planned ex-girlfriend and campus events organizer without an installed appearance. Individual profiles cover personalities, romance or supporting-role dynamics, story evidence, and future potential. Specialists must read the index and relevant profiles before writing, directing, creating art, or reviewing continuity; preserve the distinction between author-defined direction and events already experienced by the player.
- `story/characters/` also records available visual references; `story/continuity/` holds sourced, branch-aware continuity. Documented profiles do not imply that every character has appeared in the game or has approved artwork. Missing biography or design-sheet details remain unknown, not permission to invent canon or redesign a character.
- [The voice cast](../story/voice-cast.md) records seven principal MiniMax character assignments plus the examiner and station worker assignments, separate learning/announcement roles, and historical ElevenLabs assignments. Use the official MiniMax MCP for planned character recordings, including purposeful spoken Chinese outside comprehension games, under `docs/mandarin-presentation.md`. Director specifies the speech purpose, required clips, playback mode, and cast; the Audio Developer generates them through the assigned provider during implementation, and QA verifies text/display alignment and listening evidence. Preserve approved recordings and deliberately unvoiced content outside the revision scope; do not infer casting for unassigned speakers or substitute voices/providers. See `production/README.md#gameplay-and-audio` for the handoff and generation procedure.
- For new or replacement speech generation, use the exact MiniMax per-role cast and future requested `speech-2.8-turbo` policy in `story/voice-cast.md#generation-model-assignments`. Emma/Sofia require English language boost for the unchanged Chinese text; other assigned characters use Chinese. All 33 phrase tile uses use Emma/English; announcement and all 111 vocabulary recordings use `Chinese_wenrounvxing`/Chinese. Existing HD proof/files remain unchanged; the future Turbo default does not authorize replacing them. The old phrase-narrator and ElevenLabs assignments are historical, with original files/proof preserved. Record requested/submitted settings separately from returned voice/file evidence: official MCP supplies no model echo. No fallback, unplanned voiceover or transfer of historical listening approval is authorized.
- `production/chapter-XX/` holds the coordinator status, plans, visual manifest, gameplay specification, staged art, approvals, implementation report, and QA evidence. `production/templates/` contains unfilled templates, not completed chapter records.
- Keep the actual runtime layout: `src/game/`, `src/phaser/`, `src/content/`, and `public/assets/{backgrounds,characters,props,cg,audio}/`. Do not create parallel root `game/` or `assets/` trees. New or revised art is staged under `production/chapter-XX/art/` until Director approval; Developer integrates it into the runtime.
- These production files are workflow artifacts, not runtime schema changes. Use canonical asset IDs, including `camera-guy` for Chen Kai. The production category `cg` does not require a new runtime registry group.
- Acceptance is based on the current files and evidence. A changed script, specification, or approved image invalidates affected downstream approvals. No specialist passes control directly to another; the parent alone sequences work and updates `status.json`.
