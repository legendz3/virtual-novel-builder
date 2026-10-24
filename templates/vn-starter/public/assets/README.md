# Asset and recording provenance

Professor Zhu’s current assigned voice, replacement files and approval are documented in [Professor Zhu replacement recordings](#professor-zhu-replacement-recordings). The original integration inventory below retains its historical voice assignments.

## Current Chapter Thirteen integration

Thirteen installed chapters contain 2,912 events, 131 ending vocabulary definitions and 384 speech records (253 dialogue/phrase/announcement, 131 vocabulary). Thirteen integrates 25 exact approved visuals: 24 active plus one unchanged reference-only sprite; 20 new and five reused. The [base manifest](../../production/chapter-13/asset-manifest.json), [packed-table supplement](../../production/chapter-13/director-packed-table-amendment.json), [Director approval](../../production/chapter-13/director-review.md), [scoped packed review](../../production/chapter-13/director-packed-table-review.md) and [integration hashes](../../production/chapter-13/implementation-evidence/asset-integration.json) bind exact files. Paths below are relative to `public/assets`.

| Asset ID                       | Runtime path                                             | Use            |
| ------------------------------ | -------------------------------------------------------- | -------------- |
| `dorm-bed-tuesday-evening`     | `backgrounds/dorm-bed-tuesday-evening.png`               | Active         |
| `dorm-entrance-night`          | `backgrounds/dorm-entrance-night.png`                    | Active         |
| `camera-guy-cafe-working`      | `characters/camera-guy/cafe-working.png`                 | Active         |
| `camera-guy-cafe-serving`      | `characters/camera-guy/cafe-serving.png`                 | Reference only |
| `sofia-seated-phone`           | `characters/sofia/sofia-seated-phone.png`                | Active         |
| `ch13-cafe-counter-night`      | `backgrounds/ch13-cafe-counter-night.png`                | Active         |
| `ch13-cafe-table-clear`        | `backgrounds/ch13-cafe-table-clear.png`                  | Active         |
| `ch13-cafe-table-work`         | `backgrounds/ch13-cafe-table-work.png`                   | Active         |
| `ch13-cafe-table-delivery`     | `backgrounds/ch13-cafe-table-delivery.png`               | Active         |
| `ch13-cafe-table-meal`         | `backgrounds/ch13-cafe-table-meal.png`                   | Active         |
| `ch13-cafe-table-meal-receipt` | `backgrounds/ch13-cafe-table-meal-receipt.png`           | Active         |
| `ch13-cafe-table-phone-down`   | `backgrounds/ch13-cafe-table-phone-down.png`             | Active         |
| `ch13-cafe-table-finished`     | `backgrounds/ch13-cafe-table-finished.png`               | Active         |
| `ch13-cafe-door-night`         | `backgrounds/ch13-cafe-door-night.png`                   | Active         |
| `ch13-dorm-bed-night`          | `backgrounds/ch13-dorm-bed-night.png`                    | Active         |
| `camera-guy-closing-bag`       | `characters/camera-guy/camera-guy-closing-bag.png`       | Active         |
| `camera-guy-closing-standing`  | `characters/camera-guy/camera-guy-closing-standing.png`  | Active         |
| `camera-guy-dinner-tired`      | `characters/camera-guy/camera-guy-dinner-tired.png`      | Active         |
| `camera-guy-dinner-eating`     | `characters/camera-guy/camera-guy-dinner-eating.png`     | Active         |
| `camera-guy-dinner-receipt`    | `characters/camera-guy/camera-guy-dinner-receipt.png`    | Active         |
| `camera-guy-dinner-amused`     | `characters/camera-guy/camera-guy-dinner-amused.png`     | Active         |
| `camera-guy-off-duty-backpack` | `characters/camera-guy/camera-guy-off-duty-backpack.png` | Active         |
| `sofia-dorm-cushion`           | `characters/sofia/sofia-dorm-cushion.png`                | Active         |
| `ch13-kai-phone-down`          | `cg/ch13-kai-phone-down.png`                             | Active         |
| `ch13-cafe-table-packed`       | `backgrounds/ch13-cafe-table-packed.png`                 | Active         |

Eight new character cutouts retain real RGBA; backgrounds and CG remain separate approved images. The CG uses the existing background registry. `ch13-laptop-packed`, `ch13-s17` and `ch13-closing-help-200` use the new packed background (SHA-256 `44bfbc325153be295a01396497b679e680290bf7134dd1cff1efaff4a4986584`) with closed delivery/tea retained; opening food starts only at `ch13-meal-opened`. Six framing presets and the unchanged Sofia dorm rail are documented in the [code map](../../docs/code-map.md#chapter-thirteen-locations). No Developer raster alteration occurred.

The 54 speech clips comprise 41 dialogue identities, three Emma tiles and ten vocabulary clips; 52 are new and two reused. New files live under `audio/dialogue/minimax/{emma,camera-guy,sofia}/chapter-thirteen/` (including Emma’s three tile files) and `audio/vocabulary/minimax/chapter-thirteen/`. Exact reused IDs are `ch10-emma-no-thanks` and `ch9-kai-leave-together`; their original paths and bytes remain unchanged. [Runtime provenance](audio/dialogue/chapter-thirteen-provenance.json) lists all IDs, paths, hashes, event uses and the [producer’s 54-file listening approval](../../production/chapter-13/user-audio-approval.json). The frozen listening inventory retains its historical pending label; current approval is separate.

[Generation proof](../../production/chapter-13/audio/generated-audio-provenance.json) preserves 52 submitted MiniMax `speech-2.8-turbo` requests, exact cast, calm/speed 1/vol 1/pitch 0, MP3 mono 32000 Hz/128000 bps, English boost for Emma/Sofia and Chinese for Kai/learning voice. Requests ran sequentially with at least 7100 ms enforced between starts; no measured start-timestamp log is claimed. The returned-model field is null because the provider supplies no echo. Technical decoding and browser playback do not imply agent hearing; perceptual approval belongs to the producer.

No new music, ambience or SFX was acquired/generated. Existing `hope` plays continuously at 0.10 ordinary and 0.06 during voiced Mandarin/builder/CG/ending. Existing `university-cafe` ambience uses 0.08 base/0.03 under speech during arrival/work, then releases at wake. Shared mute/pause/resume and restore apply. [Developer evidence](../../production/chapter-13/implementation-report.md) and [independent QA](../../production/chapter-13/qa-report.md) record actual playback, exact HTTP hashes and five-viewport rendering separately from listening approval.

## Current Chapter Twelve integration

At the Twelve checkpoint, twelve installed chapters contained 2,733 events, 121 ending vocabulary definitions and 332 speech registry records (211 dialogue/phrase/announcement and 121 vocabulary). Twelve integrates 32 current approved visual bindings: 28 authored image copies and four reuses. The [current Director approval](../../production/chapter-12/revisions/playtest-03/director-review.md), [visual staging](../../production/chapter-12/director-visual-staging.md) and [exact manifest](../../production/chapter-12/asset-manifest.json) bind every ID and approved hash. Paths below are relative to `public/assets`.

| Exact asset ID                      | Runtime path                                               | Integration                |
| ----------------------------------- | ---------------------------------------------------------- | -------------------------- |
| `university-volunteer-meeting-room` | `backgrounds/university-volunteer-meeting-room.png`        | Exact reuse                |
| `language-classroom-corridor`       | `backgrounds/language-classroom-corridor.png`              | Exact playtest-02 reuse    |
| `first-weeks-workroom-rain`         | `backgrounds/first-weeks-workroom-rain.png`                | New approved copy          |
| `first-weeks-workroom-dry-boards`   | `backgrounds/first-weeks-workroom-dry-boards.png`          | New approved copy          |
| `first-weeks-rain-window`           | `backgrounds/first-weeks-rain-window.png`                  | New approved copy          |
| `campus-print-shop-pickup`          | `backgrounds/campus-print-shop-pickup.png`                 | New approved copy          |
| `campus-workroom-rain-path`         | `backgrounds/campus-workroom-rain-path.png`                | New approved copy          |
| `advising-office-side`              | `backgrounds/advising-office-side.png`                     | New approved copy          |
| `first-weeks-sound-room-packed`     | `backgrounds/first-weeks-sound-room-packed.png`            | New approved copy          |
| `library-path-after-rain`           | `backgrounds/library-path-after-rain.png`                  | New approved copy          |
| `yuning-workroom-engaged`           | `characters/tang-yuning/yuning-workroom-engaged.png`       | New approved copy          |
| `yuning-workroom-controlled`        | `characters/tang-yuning/yuning-workroom-controlled.png`    | New approved copy          |
| `li-wei-workroom-neutral`           | `characters/li-wei/li-wei-workroom-neutral.png`            | New approved copy          |
| `li-wei-workroom-guarded`           | `characters/li-wei/li-wei-workroom-guarded.png`            | New approved copy          |
| `li-wei-rain-shirt`                 | `characters/li-wei/li-wei-rain-shirt.png`                  | New approved copy          |
| `li-wei-change-glimpse`             | `characters/li-wei/li-wei-change-glimpse.png`              | New approved copy          |
| `li-wei-dry-shirt-thoughtful`       | `characters/li-wei/li-wei-dry-shirt-thoughtful.png`        | New approved copy          |
| `li-wei-library-bag`                | `characters/li-wei/li-wei-library-bag.png`                 | New approved copy          |
| `li-wei-library-small-smile`        | `characters/li-wei/li-wei-library-small-smile.png`         | New approved copy          |
| `ford-necklace-standing`            | `characters/miss-ford/ford-necklace-standing.png`          | New approved copy          |
| `professor-zhu-appraising`          | `characters/professor-zhu/professor-zhu-appraising.png`    | Exact reuse                |
| `sofia-sound-test-standing`         | `characters/sofia/sofia-sound-test-standing.png`           | Exact reuse                |
| `sofia-sound-room-linger`           | `characters/sofia/sofia-sound-room-linger-playtest-01.png` | New approved copy          |
| `sofia-folded-umbrella-warm`        | `characters/sofia/sofia-folded-umbrella-warm.png`          | New approved copy          |
| `sofia-folded-umbrella-listening`   | `characters/sofia/sofia-folded-umbrella-listening.png`     | New approved copy          |
| `xu-cheng-phone-shop`               | `characters/xu-cheng/xu-cheng-phone-shop.png`              | New approved copy          |
| `xu-cheng-standing-warm`            | `characters/xu-cheng/xu-cheng-standing-warm.png`           | New approved copy          |
| `ford-zhu-necklace-clasp`           | `cg/ford-zhu-necklace-clasp.png`                           | New approved copy          |
| `first-weeks-sound-room-collected`  | `backgrounds/first-weeks-sound-room-collected.png`         | New approved playtest copy |
| `li-wei-dry-carry`                  | `characters/li-wei/li-wei-dry-carry.png`                   | Exact playtest-03 copy     |
| `li-wei-rain-carry`                 | `characters/li-wei/li-wei-rain-carry.png`                  | Exact playtest-03 copy     |
| `li-wei-wet-spare-shirt`            | `characters/li-wei/li-wei-wet-spare-shirt.png`             | Exact playtest-03 copy     |

Nine new backgrounds, one CG and eighteen transparent sprites retain current approved bytes. The replaced original Sofia sprite remains unchanged at its historical path. The CG uses the existing background registry; characters remain separately layered. Eight additive presets in `src/phaser/seatedFraming.ts` implement workroom, office, sound-room and distant library-path staging. The new floor-standing preset places all 31 visible indoor Li Wei states at x1030/y100/height740 with the existing 718/941 table mask; earlier presets and the shared renderer remain unchanged. No carry contour or foreground exception remains. The glimpse waits for ordinary Next before the window cut; the old saved pause ID becomes a manual compatibility narration alias without moving event positions. Sofia’s supporting palm uses corrected 765/76/880 placement on eight focal beats. The full Mandarin answer uses the existing Xu listener sprite at `ch12-sofia-coffee-yes`, preserving Sofia’s exact voice and support; the surrounding pleased reaction and return retain Sofia. Departure stays on the collected room with no focal sprite. The [code map](../../docs/code-map.md#chapter-twelve-locations) links renderer and four-viewport evidence.

The 36 speech identities comprise 22 dialogue clips for 24 utterance occurrences, four Emma tiles and ten vocabulary clips. The initial thirty-four files were installed under `audio/dialogue/minimax/{emma,li-wei,sofia,zhu-ke,xu-cheng,tang-yuning}/chapter-twelve/`, `audio/phrases/minimax/emma/chapter-twelve/` and `audio/vocabulary/vocabulary-narrator/minimax/chapter-twelve/`. The current Zhu file instead uses `audio/dialogue/minimax/zhu-ke/professor-zhu-voice-03/ch12-zhu-almost-done.mp3`, with the separately captured recast proof below. Li Wei’s existing `好` and Emma’s `ch10-emma-phrase-question` reuse exact earlier paths/bytes. The [runtime provenance index](audio/dialogue/chapter-twelve-provenance.json) lists exact IDs, paths, hashes and event uses. [Original generation proof](../../production/chapter-12/audio/generated-audio-provenance.json) records MiniMax `speech-2.8-turbo`, speed 1/volume 1/pitch 0/calm, MP3 32000 Hz/128000 bps/mono, English boost for Emma/Sofia and Chinese for the other assigned roles. Requests ran singly with starts at least 7.2 seconds apart; returned model is null because MCP provides no echo.

The two author-supplied exact MP3s are `audio/ambience/chapter-twelve-campus-rain.mp3`, SHA-256 `d1665f4a129df13b2d401b4225f77b16b72bed8d143c0606234ac845d5d6e606`, and `audio/ambience/chapter-twelve-window-rain.mp3`, SHA-256 `51179956ab829923f9ef7823e327363c0fc57380be42fb5fa714d91de82690c9`. The same provenance index retains their original source paths, hashes and decode evidence. Campus rain uses base 0.12 and window rain 0.10 at authored cues; shared proportional speech ducking multiplies by 0.375. Pause, mute, resume, loop wrapping and authored transitions use the existing audio system. No ambience generation or substitution occurred. Existing `hope` now plays continuously: 0.07 by default and 0.06 during rain-return, recorded Mandarin, phrase construction and vocabulary. Gain changes retain the same running loop.

The [user approved all exact gallery files](../../production/chapter-12/user-audio-approval.json), with the earlier Emma-tile approval retained. The frozen [listening manifest](../../production/chapter-12/audio/review/listening-manifest.json) SHA-256 is `d61461cf6b2bb84e6eb7628190339d5d16cc21234cb226ab66b9498677ffbfe6`; original pending labels remain historical. Perceptual approval belongs to the user. [Independent runtime QA](../../production/chapter-12/qa-report.md) records the accepted runtime scope separately; the initial 27-binding evidence is historical, while [playtest implementation](../../production/chapter-12/revisions/playtest-01/implementation-report.md) covers the revised 28-binding integration. Documentation updates preserve the manifest and all approved media.

## Chapter Eleven integration checkpoint

At the Eleven checkpoint, eleven installed chapters contained 2,502 events,111 ending vocabulary definitions and 298 speech registry records (187 dialogue/phrase/announcement and 111 vocabulary). Eleven integrates25 approved visual bindings:22 new exact copies and three reuses. The [Director approval](../../production/chapter-11/director-review.md), [staging addendum](../../production/chapter-11/director-staging-addendum.md) and [exact manifest](../../production/chapter-11/asset-manifest.json) bind each ID/staging/runtime hash. Paths below are relative to `public/assets`.

| Exact asset ID                      | Runtime path                                          | Integration       |
| ----------------------------------- | ----------------------------------------------------- | ----------------- |
| `campus-shuttle-bay`                | `backgrounds/campus-shuttle-bay.png`                  | New approved copy |
| `campus-scooter-bay`                | `backgrounds/campus-scooter-bay.png`                  | New approved copy |
| `campus-local-road`                 | `backgrounds/campus-local-road.png`                   | New approved copy |
| `service-station-coach`             | `backgrounds/service-station-coach.png`               | New approved copy |
| `excursion-coach-interior`          | `backgrounds/excursion-coach-interior.png`            | New approved copy |
| `great-wall-first-view`             | `backgrounds/great-wall-first-view.png`               | New approved copy |
| `great-wall-rest-bench`             | `backgrounds/great-wall-rest-bench.png`               | New approved copy |
| `great-wall-tower-arch`             | `backgrounds/great-wall-tower-arch.png`               | New approved copy |
| `great-wall-descent-junction`       | `backgrounds/great-wall-descent-junction.png`         | New approved copy |
| `great-wall-descent-landing`        | `backgrounds/great-wall-descent-landing.png`          | New approved copy |
| `great-wall-entrance-return`        | `backgrounds/great-wall-entrance-return.png`          | New approved copy |
| `university-volunteer-meeting-room` | `backgrounds/university-volunteer-meeting-room.png`   | Exact reuse       |
| `first-weeks-recorder`              | `backgrounds/first-weeks-recorder.png`                | Exact reuse       |
| `han-trip-prepared`                 | `characters/han-ziqian/han-trip-prepared.png`         | New approved copy |
| `han-helmet-offer`                  | `characters/han-ziqian/han-helmet-offer.png`          | New approved copy |
| `han-wall-relaxed`                  | `characters/han-ziqian/han-wall-relaxed.png`          | New approved copy |
| `han-application-seated`            | `characters/han-ziqian/han-application-seated.png`    | New approved copy |
| `han-glasses-off-grin`              | `characters/han-ziqian/han-glasses-off-grin.png`      | New approved copy |
| `han-offered-hand`                  | `characters/han-ziqian/han-offered-hand.png`          | New approved copy |
| `han-unhidden-smile`                | `characters/han-ziqian/han-unhidden-smile.png`        | New approved copy |
| `miss-ford-trip-standing`           | `characters/miss-ford/miss-ford-trip-standing.png`    | New approved copy |
| `miss-ford-trip-phone-smile`        | `characters/miss-ford/miss-ford-trip-phone-smile.png` | New approved copy |
| `sofia-city-exploring`              | `characters/sofia/sofia-city-exploring.png`           | Exact reuse       |
| `han-scooter-shoulder`              | `cg/han-scooter-shoulder.png`                         | New approved copy |
| `han-landing-held-moment`           | `cg/han-landing-held-moment.png`                      | New approved copy |

`great-wall-bench-seated` in `src/phaser/seatedFraming.ts` places the Han application and Ford phone sprites at x770/y270/height440 with no foreground table mask or added procedural shadow. Earlier presets and approved bytes remain unchanged. Scooter/helmet/recorder close-ups and optional contact CGs use the existing backgrounds registry. Only the chosen take-hand branch uses the contact image, after both feet are level; release clears it. Mobile retains full16:9 artwork with scrolling support/dialogue below.

Eleven’s 22 speech identities comprise ten dialogue clips for 11 utterance occurrences, four Emma tiles and eight vocabulary clips. Twenty-one are newly generated; `ch10-emma-phrase-question` is exact reuse at its Chapter Ten path. New dialogue files live under `audio/dialogue/minimax/{emma,sofia,han-ziqian}/chapter-eleven/`, phrase files under `audio/phrases/minimax/emma/chapter-eleven/`, and words under `audio/vocabulary/vocabulary-narrator/minimax/chapter-eleven/`. The [documentary provenance index](audio/dialogue/chapter-eleven-provenance.json) lists every exact ID/path/hash, actual runtime use and generation/reuse evidence; [original generation proof](../../production/chapter-11/audio/generated-audio-provenance.json) remains unchanged. New requests used MiniMax `speech-2.8-turbo`, speed1/vol1/pitch0/calm, MP3 32000 Hz/128000 bps/mono, English boost for Emma/Sofia and Chinese for Han/vocabulary. Requests were serialized≥7.2 seconds; returned model remains null.

The producer supplied two exact MP3s: `audio/ambience/chapter-eleven-coach.mp3` (30.144s, SHA256 `6a9eea21c75a6cd593ee3521153f0b8db52e58cdc0406ee823dbb3f63bae4ce8`) and `audio/ambience/chapter-eleven-wall.mp3` (120.360s, SHA256 `cfdfb9c7f6438cd47b6d55b3ee95194739b061743ec448e477fa82253439ca16`). [Source receipts](../../production/chapter-11/revisions/ambience-01/supplied-audio-provenance.json) remain historical technical evidence. Under the [current cue amendment](../../production/chapter-11/revisions/playtest-01/director-addendum.md), coach base 0.08 plays only on the three aboard beats through `ch11-city-to-hills`, then releases at `ch11-wall-from-coach`. All arrival/listening branches remain quiet until `ch11-first-view` starts Wall air0.14; later same-loop gains are 0.08 interviews,0.10 lunch/tower,0.08 descent and 0.10 entrance, then off at the ending. No scooter ambience or new audio engine was added.

The [producer approved all 24 exact files](../../production/chapter-11/audio/user-listening-approval.json) against [review manifest](../../production/chapter-11/audio-review-manifest.json) SHA256 `58f3a0c62f36e7b66d5140e2292fbc6fd9caea6d2d342a809063dbb8ec40979f`. Its original pending label and the frozen plan’s earlier cue wording remain history; the later receipt/addendum establish current acceptance and timing. No bytes were changed by Playtest-01 or documentation, so no new listening gate is introduced. [Runtime QA](../../production/chapter-11/qa-report.md) passed separately from producer hearing and final production acceptance.

## Chapter Ten integration checkpoint

At the Ten checkpoint, ten installed chapters contained 2,291 events, 103 ending vocabulary definitions and 277 speech registry records (174 dialogue/phrase/announcement and 103 vocabulary). Ten integrates21 approved visual bindings:14 new exact copies and seven reuses. The [Director review](../../production/chapter-10/director-review.md), [binding staging addendum](../../production/chapter-10/director-staging-addendum.md), [current manifest](../../production/chapter-10/asset-manifest.json) and [user artwork approval](../../production/chapter-10/user-art-approval.json) identify the approved bytes. Runtime paths below are relative to `public/assets`.

| Exact asset ID                      | Runtime path                                            | Integration       |
| ----------------------------------- | ------------------------------------------------------- | ----------------- |
| `university-volunteer-meeting-room` | `backgrounds/university-volunteer-meeting-room.png`     | Exact reuse       |
| `university-library-study-table`    | `backgrounds/university-library-study-table.png`        | Exact reuse       |
| `campus-east-gate-evening`          | `backgrounds/campus-east-gate-evening.png`              | Exact reuse       |
| `xu-cheng-listening`                | `characters/xu-cheng/xu-cheng-listening.png`            | Exact reuse       |
| `xu-cheng-laughing`                 | `characters/xu-cheng/xu-cheng-laughing.png`             | Exact reuse       |
| `zhou-yichen-attentive-bag`         | `characters/zhou-yichen/zhou-yichen-attentive-bag.png`  | Exact reuse       |
| `story-phone-shell`                 | `props/story-phone-shell.png`                           | Exact reuse       |
| `campus-tryout-noticeboard`         | `backgrounds/campus-tryout-noticeboard.png`             | New approved copy |
| `campus-basketball-court`           | `backgrounds/campus-basketball-court.png`               | New approved copy |
| `campus-wonton-table`               | `backgrounds/campus-wonton-table.png`                   | New approved copy |
| `sofia-sound-test-standing`         | `characters/sofia/sofia-sound-test-standing.png`        | New approved copy |
| `yichen-court-ball`                 | `characters/zhou-yichen/yichen-court-ball.png`          | New approved copy |
| `yichen-court-demonstrating`        | `characters/zhou-yichen/yichen-court-demonstrating.png` | New approved copy |
| `yichen-court-adjustment`           | `characters/zhou-yichen/yichen-court-adjustment.png`    | New approved copy |
| `yichen-evening-ball`               | `characters/zhou-yichen/yichen-evening-ball.png`        | New approved copy |
| `yichen-wonton-seated`              | `characters/zhou-yichen/yichen-wonton-seated.png`       | New approved copy |
| `yichen-tryout-jump-shot`           | `cg/yichen-tryout-jump-shot.png`                        | New approved copy |
| `yichen-first-basket-held-look`     | `cg/yichen-first-basket-held-look.png`                  | New approved copy |
| `first-weeks-sound-kit`             | `backgrounds/first-weeks-sound-kit.png`                 | New approved copy |
| `first-weeks-recorder`              | `backgrounds/first-weeks-recorder.png`                  | New approved copy |
| `wonton-bowls-for-two`              | `props/wonton-bowls-for-two.png`                        | New approved copy |

`first-weeks-sound-kit` and `first-weeks-recorder` are approved opaque full-scene backgrounds confined to Wednesday’s narration beats. The rejected floating cutouts/cards remain excluded. Court CG files use the existing background registry. `small-table-seated` supplies the reviewed table mask without changing the source sprite; bowls appear only when served. Portrait screens retain the full16:9 artwork. [Integration and runtime verification](../../production/chapter-10/implementation-report.md) cover all21 hashes. The [playtest staging amendment](../../production/chapter-10/revisions/playtest-01/director-addendum.md) clears the standing sprite from ten pre-sitting table beats; seated framing begins only at the authored700/710/720 sitting beats. Meal/clearing and actual gate standing remain intact; no asset or mask bytes changed.

Ten’s30 speech files comprise16 distinct dialogue clips (22 performed occurrences), four Emma tiles and ten vocabulary clips:28 new plus exact `emma-did-not-understand` and `emma-phrase-i` reuse. New files live under `audio/dialogue/minimax/{emma,xu-cheng,zhou-yichen}/chapter-ten/`, `audio/phrases/minimax/emma/chapter-ten/` and `audio/vocabulary/vocabulary-narrator/minimax/chapter-ten/`. [Runtime provenance](audio/dialogue/chapter-ten-provenance.json) binds each ID/event/voice/path/hash to the [generation proof](../../production/chapter-10/audio/generated-audio-provenance.json). MiniMax requests use the assigned cast, `speech-2.8-turbo`, English boost only for Emma, Chinese for Xu/Yichen/vocabulary, and sequential requests at least7.2 seconds apart. Raw returned model remains null. Earlier249 registry rows and media remain unchanged.

Two author-supplied files are copied unchanged: `audio/ambience/chapter-ten-court.mp3` is a60.048-second court loop at0.18 (0.0675 under speech), stopped when teammates leave; `audio/sfx/chapter-ten-fence-impact.mp3` is a4.32-second live-entry one-shot at0.3 when the ball reaches the fence. Direct restore does not replay it, and no ball-roll component was fabricated. Source receipts remain under `production/chapter-10/audio/supplied/`; those original metadata receipts do not themselves claim listening.

The [user approved all32 exact files](../../production/chapter-10/audio/user-listening-approval.json) against the [frozen manifest](../../production/chapter-10/audio/listening-manifest.json), SHA256 `957ef2220bb97d450b7bd6669abf6708978e3e6920a158b9a368b00c5c610cb3`. Its initial pending label is historical and is superseded by the hash-bound approval. Agents do not claim perceptual hearing. [Runtime QA passed](../../production/chapter-10/qa-report.md), including approved asset/audio hashes and browser behavior; documentation/postmortem review is separate.

## Chapter Nine integration checkpoint

At the Nine checkpoint, nine installed chapters contained 2,041 events and 93 ending definitions. Nine integrates 20 approved visuals: 18 new exact copies and two existing reuses. The [integration ledger](../../production/chapter-09/implementation-evidence/integrated-art.json), [Director approval](../../production/chapter-09/director-review.md) and [user artwork approval](../../production/chapter-09/user-art-approval.json) bind exact IDs and source/runtime hashes. All paths below are relative to `public/assets`.

| Exact asset ID                      | Runtime path                                                | Integration       |
| ----------------------------------- | ----------------------------------------------------------- | ----------------- |
| `university-volunteer-meeting-room` | `backgrounds/university-volunteer-meeting-room.png`         | New approved copy |
| `temple-heaven-afternoon-hall`      | `backgrounds/temple-heaven-afternoon-hall.png`              | New approved copy |
| `temple-park-path-bench`            | `backgrounds/temple-park-path-bench.png`                    | New approved copy |
| `temple-park-sunset-hall-view`      | `backgrounds/temple-park-sunset-hall-view.png`              | New approved copy |
| `temple-park-sunset-bench-reverse`  | `backgrounds/temple-park-sunset-bench-reverse.png`          | New approved copy |
| `camera-guy-outing-attentive`       | `characters/camera-guy/camera-guy-outing-attentive.png`     | New approved copy |
| `camera-guy-bench-attentive`        | `characters/camera-guy/camera-guy-bench-attentive.png`      | New approved copy |
| `camera-guy-bench-engaged`          | `characters/camera-guy/camera-guy-bench-engaged.png`        | New approved copy |
| `camera-guy-taking-photograph`      | `characters/camera-guy/camera-guy-taking-photograph.png`    | New approved copy |
| `camera-guy-outing-camera-stowed`   | `characters/camera-guy/camera-guy-outing-camera-stowed.png` | New approved copy |
| `xu-cheng-listening`                | `characters/xu-cheng/xu-cheng-listening.png`                | New approved copy |
| `xu-cheng-laughing`                 | `characters/xu-cheng/xu-cheng-laughing.png`                 | New approved copy |
| `kai-path-example-bright`           | `props/kai-path-example-bright.png`                         | New approved copy |
| `kai-path-example-warm`             | `props/kai-path-example-warm.png`                           | New approved copy |
| `kai-unfinished-path-notebook`      | `props/kai-unfinished-path-notebook.png`                    | New approved copy |
| `kai-emma-sunset-memento-1`         | `cg/kai-emma-sunset-memento-1-close.png`                    | New approved copy |
| `kai-emma-sunset-memento-2`         | `cg/kai-emma-sunset-memento-2-close-profile.png`            | New approved copy |
| `language-classroom-corridor`       | `backgrounds/language-classroom-corridor.png`               | Exact reuse       |
| `miss-ford-welcoming`               | `characters/miss-ford/miss-ford-welcoming.png`              | Exact reuse       |
| `sofia-meeting-amused`              | `characters/sofia/sofia-meeting-amused.png`                 | New approved copy |

The two meeting presets use approved table masks; the park reuses the existing bench preset. Backgrounds and character art remain separate. The mementos retain exact full-image bytes and contained rendering, with a simple white 8px desktop/5px phone CSS border and no mat/shadow. The first rear silhouette occurs on every route; only `one-more-photo` selects the side-profile second image. The [current visual gallery](../../production/chapter-09/implementation-evidence/visual-review/index.html) and its hash-bound map cover five final moments at each viewport. CSS is specified in [architecture](../../docs/architecture.md#chapter-nine-photography), not baked into media.

At the Nine checkpoint, the registry contained 249 recordings: 93 dedicated vocabulary and 156 dialogue/phrase/announcement entries. Nine adds 36 new exact files and reuses `emma-repeat-request` at `audio/dialogue/minimax/emma/emma-repeat-request.mp3`; all earlier 213 records remain unchanged. Its 24 spoken occurrences use 22 distinct dialogue clips, plus three Emma tiles and twelve vocabulary files. [Runtime provenance](audio/dialogue/chapter-nine-provenance.json) joins [generation proof](../../production/chapter-09/audio/generated-audio-provenance.json), [the frozen 37-file manifest](../../production/chapter-09/audio/listening-manifest.json) and [user approval after listening](../../production/chapter-09/audio/user-listening-approval.json). New paths are `audio/dialogue/minimax/{emma,camera-guy}/chapter-nine/` and `audio/vocabulary/minimax/chapter-nine/`; exact IDs/text/settings/hash mappings are in that proof.

New files submit MiniMax `speech-2.8-turbo`: Emma `English_witty_female_1`/English boost, Kai `Chinese (Mandarin)_Sincere_Adult`/Chinese, vocabulary `Chinese_wenrounvxing`/Chinese; speed1/vol1/pitch0/calm and MP3 32000Hz/128kbps/mono. Requests were serialized at least seven seconds apart. `returnedModel` is null because the provider supplies no echo; absent voice links remain null. User listening is attributed to the user, separate from decoding and browser playback. `hope` is reused with scene gains 0.10/0.07/0.06; no new music, ambience or SFX was added. [Runtime QA passed](../../production/chapter-09/qa-report.md), including all 20 art and 37 audio hash checks; no new exact-file approval is inferred from documentation edits.

## Chapter Eight integration checkpoint

At Eight’s integration checkpoint, eight installed chapters contained 1,699 events. Chapter Eight uses 13 Director-approved artworks: eight new exact copies and five existing files. The new files are listed below; [integration bindings](../../production/chapter-08/implementation/integration-bindings.json) preserve source/runtime hashes for all thirteen. The library seated preset uses center640/top0/height720 and a full-width foreground band at y550, keeping lower trousers hidden and supported hands visible. Sofia retains the existing bed/rail mask; Ford retains her desk preset. Renderer artwork is requested for the selected chapter. The independent First Weeks outline reflows accessibly and clears before the silent two-row notice.

| Asset ID                         | Runtime path                                                   |
| -------------------------------- | -------------------------------------------------------------- |
| `university-library-study-table` | `public/assets/backgrounds/university-library-study-table.png` |
| `dorm-bed-tuesday-evening`       | `public/assets/backgrounds/dorm-bed-tuesday-evening.png`       |
| `li-wei-study-attentive`         | `public/assets/characters/li-wei/li-wei-study-attentive.png`   |
| `li-wei-study-amused`            | `public/assets/characters/li-wei/li-wei-study-amused.png`      |
| `li-wei-study-unsettled`         | `public/assets/characters/li-wei/li-wei-study-unsettled.png`   |
| `sofia-bed-tired`                | `public/assets/characters/sofia/sofia-bed-tired.png`           |
| `sofia-bed-heard`                | `public/assets/characters/sofia/sofia-bed-heard.png`           |
| `first-weeks-project-outline`    | `public/assets/props/first-weeks-project-outline.png`          |

The combined eight-chapter registry checkpoint has 213 entries: 81 dedicated vocabulary recordings and 132 dialogue/phrase/announcement recordings. The [One–Seven spoken-audio repair](../../production/mandarin-contracts/revisions/spoken-audio-one-seven/implementation-report.md) adds 61 exact user-approved recordings and preserves all prior media/provenance bytes. Eight adds 25 exact MiniMax `speech-2.8-turbo` files: fourteen dialogue clips cover all sixteen occurrences, plus three Emma tiles and eight vocabulary words. Emma uses English boost and `English_witty_female_1`; Li Wei uses Chinese boost and `Chinese (Mandarin)_Unrestrained_Young_Man`; vocabulary uses Chinese boost and `Chinese_wenrounvxing`. The separate approved Professor Zhu revision updates only his three active files to the custom voice; all original media/proof remains historical.

[Chapter Eight audio provenance](audio/dialogue/chapter-eight-provenance.json) binds each active path/hash/voice/model to frozen generation proof and the [user's exact 25-file approval](../../production/chapter-08/audio/user-listening-approval.json). Original 22-clip and supplementary three-clip review manifests remain byte-identical; their pending labels are historical. The provider does not echo the model, so returned model remains null. Runtime and speech QA passed; technical decoding is not perceptual evidence. Earlier records below describe their dated scopes.

## Historical Chapter Seven integration — September 13, 2026

Chapter Seven adds fourteen exact approved images and reuses two existing images: all sixteen approved visual bindings are integrated. The speech registry contains 127 records (73 vocabulary and 54 dialogue/phrase/announcement); 21 new Turbo records are appended to the unchanged prior 106. Seven uses 24 audio bindings, including three exact Emma tile reuses. All nineteen installed phrase-tile uses retain Emma’s assigned identity. Music, ambience, SFX and historical image/audio bytes remain unchanged.

The [user approved all 24 frozen Chapter Seven audio files](../../production/chapter-07/audio/user-listening-approval.json), SHA-256 `3c048264433428656659ce925ea0cd54a0243f5384325e4c77e1bc4ee5ffcd09`, against review manifest SHA-256 `432110aca0f6fc03fcdcf4932d9c311124a717082b9b8544f76845e4d9797525`. This approval is attributed to the User and limited to those exact bindings. Model audio input was unsupported; no model listening pass is claimed. Prior generation/decode/request checks and initial pending-listening entries remain historical evidence. Current approval references live in [runtime provenance](audio/dialogue/chapter-seven-provenance.json) and [generation provenance](../../production/chapter-07/audio/generated-audio-provenance.json).

The initial [runtime QA pass](../../production/chapter-07/qa-report.md) preceded user playtest feedback about Ford’s first name reference and hands. The [playtest-01 implementation](../../production/chapter-07/revisions/playtest-01/implementation-report.md) now integrates two English text repairs and three approved replacement sprites with actual hand-to-lap contact. The other thirteen visual bindings and all 24 audio files remain unchanged. Independent revision QA/final documentation acceptance are separate.

### Chapter Seven images

All paths below are relative to `public/assets`. Exact source/runtime hashes and the fourteen-new/two-reuse classification are preserved in [accepted inputs](../../production/chapter-07/coordinator-implementation-acceptance.json), [asset manifest](../../production/chapter-07/asset-manifest.json) and [implementation preservation proof](../../production/chapter-07/implementation/preservation-check.json).

| Exact asset ID                  | Runtime file                                            | Integration          |
| ------------------------------- | ------------------------------------------------------- | -------------------- |
| `language-classroom-corridor`   | `backgrounds/language-classroom-corridor.png`           | New approved image   |
| `campus-dining-hall-lunch`      | `backgrounds/campus-dining-hall-lunch.png`              | New approved image   |
| `international-advising-office` | `backgrounds/international-advising-office.png`         | New approved image   |
| `university-library-printer`    | `backgrounds/university-library-printer.png`            | New approved image   |
| `university-library-steps`      | `backgrounds/university-library-steps.png`              | New approved image   |
| `professor-zhu-appraising`      | `characters/professor-zhu/professor-zhu-appraising.png` | New approved image   |
| `professor-zhu-correcting`      | `characters/professor-zhu/professor-zhu-correcting.png` | New approved image   |
| `miss-ford-welcoming`           | `characters/miss-ford/miss-ford-welcoming.png`          | New approved image   |
| `miss-ford-blushing`            | `characters/miss-ford/miss-ford-blushing.png`           | New approved image   |
| `miss-ford-fond-smile`          | `characters/miss-ford/miss-ford-fond-smile.png`         | New approved image   |
| `han-printer-dry`               | `characters/han-ziqian/han-printer-dry.png`             | New approved image   |
| `han-printer-amused`            | `characters/han-ziqian/han-printer-amused.png`          | New approved image   |
| `sofia-lunch-amused`            | `characters/sofia/sofia-lunch-amused.png`               | New approved image   |
| `zhou-yichen-attentive-bag`     | `characters/zhou-yichen/zhou-yichen-attentive-bag.png`  | New approved image   |
| `placement-exam-room`           | `backgrounds/placement-exam-room.png`                   | Existing exact reuse |
| `story-phone-shell`             | `props/story-phone-shell.png`                           | Existing exact reuse |

Furniture occlusion uses generic `advising-desk-seated` and `dining-table-seated` presets; it never crops or stretches source PNG bytes. Professor Zhu retains existing standing-depth support and Han/Yichen existing portrait support. Ford’s blush and fond smile are separate approved sprites, with no added code-generated blush. The desk-contact repair was approved by Director and integrated in playtest-01 without changing the framing. Exact new source/runtime hashes are listed in the revision implementation report; the old three source files and their earlier approval remain historical.

### Historical Chapter Seven recordings — original integration

| Scope                  | New files | Exact assigned voice                    | Requested model / language boost                         |
| ---------------------- | --------: | --------------------------------------- | -------------------------------------------------------- |
| Professor Zhu dialogue |         3 | `Chinese (Mandarin)_Reliable_Executive` | `speech-2.8-turbo` / Chinese                             |
| Emma dialogue          |         6 | `English_witty_female_1`                | `speech-2.8-turbo` / **English**, including Chinese text |
| Emma phrase tiles      |         2 | `English_witty_female_1`                | `speech-2.8-turbo` / **English**                         |
| Ending vocabulary      |        10 | `Chinese_wenrounvxing`                  | `speech-2.8-turbo` / Chinese                             |

All new requests used speed 1, volume 1, pitch 0, calm, MP3 32000 Hz / 128000 bps / mono, one request at a time and at least seven seconds between starts. Official MCP raw success returns exact voice/file, without a model echo; every new proof keeps `returnedModel: null`. [Generation records](../../production/chapter-07/audio/generation-records.json) retain all successful requests; the initial directory-error attempt and its start remain separately preserved. No successful take was regenerated. Original, staged and runtime files are hash-identical and all 21 new files passed decoding.

Exact per-ID utterance, event, voice, runtime path and hash inventories are in [the implementation audio table](../../production/chapter-07/implementation-report.md#exact-audio-bindings) and runtime provenance. New dialogue lives under `audio/dialogue/minimax/{emma,zhu-ke}/chapter-seven/`, new tiles under `audio/phrases/minimax/emma/chapter-seven/`, and words under `audio/vocabulary/vocabulary-narrator/minimax/`. The three reused IDs are `emma-phrase-please`, `emma-phrase-say-again` and `emma-phrase-once-through`. 请 retains the exact supplied file with unknown generation metadata; 再说/一遍 retain their historical HD proof. All three are included in the new explicit Chapter Seven user approval. Han, Ford, Sofia’s English turns, reading/phone text and other deliberately silent lines gain no recording.

## Character and phrase MiniMax revision checkpoint — September 13, 2026

The [character implementation](../../production/mandarin-contracts/revisions/character-minimax/implementation-report.md) replaces 43 speech bindings, with nine later replacements under the [retake supplement](../../production/mandarin-contracts/revisions/character-minimax/revisions/retakes-01/audio-plan.json). All 63 MiniMax vocabulary recordings remain exact. At that checkpoint, 106 speech URLs resolve exclusively through `speechRecordings.json`; 31 obsolete spoken overrides were removed from `assetManifest.ts`. Music, ambience, SFX, artwork and all historical MP3 bytes remain unchanged.

Current casting follows [the MiniMax voice policy](../../story/voice-cast.md): Emma/Sofia request English boost, others Chinese. At that checkpoint all fourteen phrase tiles used Emma; announcement and vocabulary retain `Chinese_wenrounvxing`. The seven café speaker metadata fields are the only chapter changes. Model is explicitly requested/submitted as `speech-2.8-hd`; the MCP returns exact voice/file evidence but no model echo. Technical verification and exact-file human listening approval remain separate.

The chapter inventories below preserve their original integration/provenance checkpoints. Earlier audio paths, cast names, generation settings, approvals and test outcomes describe historical files, not current active playback. Their bytes remain available for strict preservation checks.

The current eight-chapter runtime contains 1,699 events. Chapter-specific tables below retain their original generation/reuse provenance; [Chapter Six](#chapter-six-the-plan-was-optional) records the 19 approved visual entries (18 active; the prior Sofia pose remains historical) and eight user-approved recordings.

The following assets were supplied by the user for Chapter one on 2026-09-10 and copied unchanged.

| Project file                      | Supplied source                                  |
| --------------------------------- | ------------------------------------------------ |
| `backgrounds/beijing-airport.png` | Image 1, airport viewed from the aircraft window |
| `backgrounds/arrival-phone.png`   | Image 3, Emma’s phone in the cabin               |
| `ui/beijing-heartbeat-title.png`  | Image 2, transparent title artwork               |
| `audio/music/hope.mp3`            | `BGM Pack 1 MP3/hope.mp3`                        |
| `audio/sfx/airplane-landing.mp3`  | `freesound_community-airplane-landing-6732.mp3`  |

URLs are resolved through `src/content/assetManifest.ts`. The source files have not been recolored, cropped, transcoded, or otherwise edited. The game applies presentation-only CSS haze to the airport artwork. No source license documents were supplied; this inventory records provenance, not a separate license grant.

## Mandarin contracts media checkpoint — September 13, 2026

The original [six-chapter contract migration](../../production/mandarin-contracts/implementation-report.md) registered 102 exact recording bindings: 31 retained and 71 planned new. Its [audio plan](../../production/mandarin-contracts/audio-plan.json), [generated provenance](../../production/mandarin-contracts/generated-audio-provenance.json) and [Audio Developer report](../../production/mandarin-contracts/audio-generation-report.md) remain historical records of the 63 completed candidates and eight original missing Emma files. The later [user-selected replacements](../../production/mandarin-contracts/revisions/user-audio-01/implementation-supplement.md) preserve exact supplied/reused dialogue evidence.

The historical [vocabulary recast](../../production/mandarin-contracts/revisions/vocabulary-minimax/implementation-report.md) had **106 active recording entries**: all 43 protected dialogue/phrase entries plus 63 MiniMax vocabulary entries. The 59 superseded Emma vocabulary-only registry IDs were retired after source references migrated; their files/provider history were not deleted. All 68 PNG hashes and protected recording hashes remain unchanged. Historical v3/unknown provenance is not relabeled.

All 63 ending vocabulary entries bind to MiniMax `Chinese_wenrounvxing` through dedicated identity `vocabulary-narrator`, using separate `public/assets/audio/vocabulary/vocabulary-narrator/minimax/` paths. The [approved plan](../../production/mandarin-contracts/revisions/vocabulary-minimax/audio-plan.json) reuses five exact trial files and requests 58 new files. [Current provenance](../../production/mandarin-contracts/revisions/vocabulary-minimax/generated-audio-provenance.json) records requested `speech-2.8-hd`/Chinese and exact tested settings, raw MCP response/capture hashes, original/staged/runtime files and decoding. MCP returns file/voice without model metadata; requested model is not returned proof. Exact-file listening approval remains pending separately. All earlier Emma, 42 Shan Shan v2 and 63 Shan Shan v3 files remain unchanged historical candidates, with no fallback use or transferred approval.

At that checkpoint, `emma-cheers` retained `/assets/audio/vocabulary/emma/emma-vocabulary-ganbei.mp3`, SHA256 `9b49576bf952fcb333c1be474ab07105cc36a0e648b7aa69f495a86053501307`, for Emma dialogue. Retiring the vocabulary registry ID does not remove this physical file or change its cast. New `vocabulary-ganbei` uses a separate MiniMax file/path. Character and phrase-tile voices remain unchanged; the 14 phrase clips retain their approved bytes. Earlier Emma candidate approval does not approve MiniMax replacement files.

`VocabularyEntry`/`PhraseTileContent` keep shared recorded-pronunciation controls and separate 44px targets. `speechRegistry.ts` has a dedicated learning cast alongside character assignments; `legacySpeechAllowances.json` still freezes eight exact uncast announcement/coffee exceptions. The existing multi-report build validator enforces actual files, SHA256, utterance, voice, model and zh provenance. Supported dialogue may remain unvoiced, including Chapter One's repaired `interesting`; reduced-support dialogue requires matching character audio. No fallback, new UI or save migration was added. See [exact voice policy](../../story/voice-cast.md#dedicated-vocabulary-voice); final audio/runtime/documentation acceptance remains Coordinator-owned.

## Character voice assignments

Current MiniMax casting and historical ElevenLabs assignments are recorded in [the shared voice cast](../../story/voice-cast.md), including exact voice names, links, and IDs. The source filenames below describe the supplied recordings; keep that per-file provenance distinct from character voice assignments and record the selected voice ID when producing new character audio.

## Arrival hall and Mandarin voices

| Project file                                          | Supplied source                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `backgrounds/arrival-hall.png`                        | Arrivals-hall image, clipboard `e020b0cd-88fc-4b2d-b40a-cc95e0f0b68f`                                   |
| `characters/li-wei/holding-sign.png`                  | Holding-sign pose, clipboard `d170ca42-8b3b-4ff1-aa78-2d57ea15f8e8`                                     |
| `characters/li-wei/looking-at-sign.png`               | Looking-at-sign pose, clipboard `07d48022-dbf7-4d43-a4da-aa26399aab7d`                                  |
| `characters/li-wei/hands-in-pockets.png`              | Hands-in-pockets pose, clipboard `6de173e7-7a57-4afb-bc78-e32985d88540`                                 |
| `audio/ambience/airport-arrivals.mp3`                 | `freesound_community-airport-walk-through-zurich-international-19026.mp3`                               |
| `audio/dialogue/announcements/mind-your-luggage.mp3`  | `ElevenLabs_2026-09-11T02_05_47_Shan Shan - Young Energetic Female_pvc_sp100_s50_sb75_se0_b_m2.mp3`     |
| `audio/dialogue/li-wei/exchange-student-question.mp3` | `ElevenLabs_2026-09-11T02_40_54_LiuPing - Clear, Professional and Calm_pvc_sp100_s50_sb75_se0_b_m2.mp3` |

The September 13 [listening repair](../../production/listening-repair/implementation-report.md) preserves the original Li Wei question recording and its question/panel playback. The new full-support repetition at `interesting` is deliberately unvoiced; it does not reuse this Chinese-only clip for mixed English/Chinese dialogue. All retained image/audio bytes and historical provenance remain unchanged.

These files are copied unchanged. Phaser scales the transparent character layers for the stage. The street encounter uses the supplied airport curbside background from “Outside, Beijing hits her all at once,” then the crosswalk background when Emma hesitates. Phaser tilts the backdrop and scales Li Wei closer during the catch, with static framing for reduced motion. No traffic recording has been supplied.

| Project file                        | Supplied source                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `backgrounds/airport-curbside.png`  | Airport exterior image, clipboard `fcaa43c9-4466-4feb-839d-a9539166f3a5`, copied unchanged |
| `backgrounds/airport-crosswalk.png` | Crosswalk image, clipboard `d67872e4-1667-462e-a9b2-e29f7d766620`, copied unchanged        |
| `audio/music/dramatic_boi_v5.mp3`   | `BGM Pack 1 MP3/dramatic_boi_v5.mp3`, plays during the catch and close-up                  |

## Airport express finale

| Project file                               | Supplied source                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `backgrounds/airport-express.png`          | Train-window skyline, clipboard `87be3801-fbcb-443c-9471-e6db7e7e4dbe`                 |
| `backgrounds/li-wei-reflection.png`        | Li Wei reflected in the train window, clipboard `0a3c8f72-9a7a-434b-a3d5-0e8ab4031cc5` |
| `audio/ambience/airport-express-train.mp3` | `freesound_community-subway-sound-38903.mp3`                                           |

All three assets are copied unchanged. The train conversation overlays the existing hands-in-pockets Li Wei sprite on the airport-express backdrop with smaller, waist-up framing applied by the renderer. The establishing shot and closing skyline/reflection show the full illustrations alone. Subway ambience loops during the train conversation and reflection, then stops at the chapter-end card.

## Chapter two: dorm and elevator

Seven images supplied on 2026-09-10, copied unchanged and verified byte-for-byte.

| Project file                          | Supplied clipboard source                                 |
| ------------------------------------- | --------------------------------------------------------- |
| `backgrounds/university-dorm.png`     | `a1d04dcb-0aca-4633-abed-f4af5b78de5b`                    |
| `characters/sofia/welcoming.png`      | `c40594ea-a89d-4414-b3e9-1c9ee53f7188`                    |
| `characters/sofia/apologetic.png`     | `c6380c62-7f67-4fb5-b643-4b797f2b1e6c`                    |
| `backgrounds/dorm-elevator.png`       | `b7bd0da8-0264-4504-bcde-636975a07a42`                    |
| `characters/camera-guy/neutral.png`   | `314a08c2-93c2-4e0f-af5a-3a11a6885e3b`                    |
| `characters/camera-guy/smiling.png`   | `9896305d-8b57-450f-a8c6-083b9f12a723`                    |
| `characters/camera-guy/steadying.png` | `d69ca006-f3c5-42fc-8a7c-2ca4b568fe3b` (solo replacement) |

The camera-carrying character is unnamed in the elevator and introduced as Chen Kai in the café; his canonical asset identity remains `camera-guy`. Portrait, left-edge, and solo catch framing are applied only by Phaser. Existing `hope.mp3` plays quietly. `dramatic_boi_v5.mp3` loops from “Someone bumps Emma backward” through the catch and comparison with Li Wei, then `hope.mp3` returns when he lets go. No new voice or elevator recordings have been supplied.

The elevator perspective correction adds `backgrounds/dorm-elevator-rear.png` from clipboard `63344efb-2213-49a2-a7c4-4da8810078e1`, copied unchanged. The button/door view remains until Emma turns; all following beats use the rear wall. Neutral and smiling reaching poses align their left cut edge with the background. The solo steadying image replaces the original crowd composite: students enter and bump Emma from behind the viewpoint, so no students are visible.

Chapter two’s café uses the supplied `backgrounds/university-cafe.png` and the unchanged `characters/camera-guy/cafe-working.png`, `cafe-correcting.png`, and `cafe-serving.png`. The renderer reuses the counter section of the background in front of Kai so he stands behind it. The café continues `hope.mp3` at the normal chapter volume.

`audio/ambience/university-cafe.mp3` is copied unchanged from the supplied `freesound_community-ambience-coffee-shop-5-17059.mp3`. It loops beneath every café beat, including phrase construction and all order outcomes, through the existing ambience channel at 0.32 volume. It does not restart between café lines; mute, pause, navigation, and chapter replay use the existing audio controls.

## Phrase pronunciation recordings

These seven user-supplied MP3s were copied unchanged from Downloads and verified byte-for-byte. Each coffee tile references its registered audio asset; its speaker plays only on request.

| Project file                    | Supplied source  |
| ------------------------------- | ---------------- |
| `audio/phrases/i-want.mp3`      | `我要.mp3`       |
| `audio/phrases/i-like.mp3`      | `我喜欢.mp3`     |
| `audio/phrases/iced-latte.mp3`  | `一杯冰拿铁.mp3` |
| `audio/phrases/hot-latte.mp3`   | `一杯热拿铁.mp3` |
| `audio/phrases/no-sugar.mp3`    | `不要糖.mp3`     |
| `audio/phrases/extra-sugar.mp3` | `多放糖.mp3`     |
| `audio/phrases/no-ice.mp3`      | `不要冰.mp3`     |

## Li Wei’s café arrival

`characters/li-wei/cafe-arrival.png` is copied unchanged from supplied clipboard `aeb293c1-61bd-4d13-8a2e-bca5ff87d169`. The renderer centers and scales the transparent portrait beside Emma on the customer side of the café counter. The bag reminder cuts back to Kai’s existing working pose.

## Campus walk and schedule

These supplied assets are copied unchanged. The four walking expressions retain a common scale and position; no image regeneration or editing is applied.

| Project file                              | Supplied source                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `backgrounds/university-campus.png`       | Clipboard `bcd7fd1b-28c9-40b3-af28-ddb3d7f0c79f`                                                        |
| `characters/li-wei/walking-composed.png`  | Clipboard `3ca9539d-e57e-4439-b510-374c47fc79b4`                                                        |
| `characters/li-wei/walking-surprised.png` | Clipboard `2196bd4f-3cb5-4d22-bbe3-f786a722ee0e`                                                        |
| `characters/li-wei/walking-smirk.png`     | Clipboard `3e1508fe-694d-44bb-a87c-7710c763529e`                                                        |
| `characters/li-wei/walking-guarded.png`   | Clipboard `26f0ca7e-632f-49f8-8875-af4cd5ff6e6d`                                                        |
| `props/class-schedule.png`                | Clipboard `a0dc0c28-f0f0-4cec-9b22-2689cfcbc0e1`                                                        |
| `audio/dialogue/li-wei/kai-question.mp3`  | `ElevenLabs_2026-09-11T05_55_51_LiuPing - Clear, Professional and Calm_pvc_sp100_s50_sb75_se0_b_m2.mp3` |

The question audio is shared by the dialogue and listening panel, with explicit replay. Café ambience stops at the campus transition; quiet `hope.mp3` remains. The foreground schedule is scaled independently on portrait screens and its exam notice is also presented as accessible story text.

## Chapter three: placement exam

The Director approved twelve visual entries in `production/chapter-03/asset-manifest.json`, with current approval in `director-review.md`. Eleven entries reuse the exact existing artwork; their per-file hashes are verified by `src/content/chapterThreeContent.test.ts`. Only the new `backgrounds/placement-exam-room.png` is copied from staging. The approved 1672×941 image is an empty first-person classroom seen from a student desk with blank paper and pen, with no people or readable text. The examiner remains off-screen, with no separate sprite or authored recording. Its SHA-256 is `0d77e4410b0b4015614d76a2c1e66b87d66461490ad2aebc647a0faca6fc8e1a`; the staged and runtime bytes are identical. Renderer/CSS positioning does not alter approved files.

`audio/dialogue/li-wei/li-wei-exam-time-question.mp3` was generated through the installed ElevenLabs plugin text-to-speech workflow for the single authored listening exercise. The exact spoken text is **你明天几点考试？**, voiced by **LiuPing - Clear, Professional and Calm**, [assigned voice](https://elevenlabs.io/voices/pTOe8BQRdydOEIgv0wFL), case-sensitive voice ID `pTOe8BQRdydOEIgv0wFL`. The actual model is `eleven_multilingual_v2`. The generation tool schema used for this clip exposed no speed, stability, similarity, style, or speaker-boost controls; these were unset and provider defaults were used, with no asserted numeric values. Generation ID: `GKlkReMaQ1LQ7g02MXR0`; flow ID: `qrUnaicvVBN3ZDAVf53l`; provider duration: 1.9040362811791383 seconds. The MP3 is 48,227 bytes, SHA-256 `8cac1fb6b9abdb212b63fb656f4bbabe16dcafbaad81c1ab79dcdd46d2058293`, copied unchanged from `production/chapter-03/audio/li-wei-exam-time-question.mp3`.

On 2026-09-11, the user listened to that exact staged file and confirmed **“Yes, wording and voice sound right”** when asked whether it clearly and naturally says the intended Mandarin in Li Wei's established LiuPing voice. This is user perceptual verification; the agent environment could emit but could not ingest audio for perceptual listening. Browser tests independently verify real MP3 playback and lifecycle behavior. Full generation, integration, and test evidence lives in `production/chapter-03/implementation-report.md`. The user subsequently requested the Emma word/accepted-response clips below. Other ordinary dialogue, the examiner, and vocabulary remain outside new voice generation.

### Emma word pronunciation and accepted request

The user requested audio on all four construction tiles and Emma's submitted sentence. The original audio expansion commissioned the five files below. The current [Director impact review](../../production/chapter-03/director-review.md) explicitly retains all five plus Li Wei's question as exact approved reuse: six retained clips, zero new clips to generate. Each was generated once through the installed ElevenLabs text-to-speech plugin with **Arabella - Mysterious and Emotive**, [Emma's assigned voice](https://elevenlabs.io/voices/Z3R5wn05IrDiVCyEkUrK), exact ID `Z3R5wn05IrDiVCyEkUrK`, and `eleven_multilingual_v2`. Unavailable tuning controls were unset/provider defaults, without asserting numerical values. Staged files under `production/chapter-03/audio/` were copied unchanged into `audio/dialogue/emma/`. Historical provenance records no explicitly submitted Chinese override and does not establish compliance with the subsequently supplied Emma preset. The accepted reuse depends on exact text/voice/bytes and the user’s listening review; do not regenerate clips or rewrite historical settings during documentation maintenance.

| File / asset ID                | Exact spoken text | Generation ID          | SHA-256                                                            |
| ------------------------------ | ----------------- | ---------------------- | ------------------------------------------------------------------ |
| `emma-phrase-once-through.mp3` | 一遍              | `oahu3kNxc7AEYbfgUsBk` | `d3afc4e4a80899d2a19c22f0dfafe8aca2d2ee2a08dd0ac397805a3be985e636` |
| `emma-phrase-i.mp3`            | 我                | `pRGEe7KjNvaxzeCVpLFs` | `e95b307c21aa464d1255babd2eff751737b9018f89802ed54bcdeffd8024b070` |
| `emma-phrase-please.mp3`       | 请                | `Upxym8pDzYMJ7309Apqn` | `aa3e9d375ee0b59dc5e06bdc5615a0dfa4604cd450eb8f916760c3cf67f24b8e` |
| `emma-phrase-say-again.mp3`    | 再说              | `jwAwMp1tAwM7glPNv6Mt` | `e34133c0d1f77603f7c337b696d4da01e97c47509bb0583f24d83a6bf976ec0b` |
| `emma-repeat-request.mp3`      | 请再说一遍。      | `07r2btoOj90rCs9YKVel` | `ef1cd74952e53fdf278fc0b4ac11f6d22548725759466f4cfb85e388bae4fa8f` |

On 2026-09-11 the user listened to all five actual staged files and confirmed **“All five sound right”** for exact/natural Mandarin and the intended Arabella voice. The coordinator reverified every hash unchanged. This is user perceptual evidence; the agent did not hear the clips. All five independently decode as mono 44.1kHz MP3. `production/chapter-03/audio/emma-pronunciation-provenance.json` records each actual generation, model, voice, settings availability, duration, byte size, staged/runtime path, hash and review.

`PronunciationButton` now renders separate sibling speaker controls in the bank and occupied slots. Word speakers are explicit and never select/remove tiles, reveal meanings, set Help, or award progress. The same word from either location toggles the same clip; another word replaces it. Submission releases word playback before `emma-repeat-request` plays at either accepted response, using the existing line replay and scene controls. Mute, pause, hidden-tab pause, completion, replay and navigation unmount release the pronunciation channel; restored drafts never replay earlier taps. No examiner or other café line is voiced by Emma. The classroom PNG and all six recordings remain byte-identical to their approved staged files; [runtime source checks](../../src/content/chapterThreeContent.test.ts) and [audio browser tests](../../tests/e2e/chapterThreeAudio.spec.ts) verify the bindings and playback lifecycle.

## Chapter four: dinner and Saturday listening

At the Chapter Four milestone, the runtime contained 730 events; Chapter Four added 233 events, two listening checks and fourteen ending terms. Fourteen visual entries were approved by the Director: eleven new image files copied unchanged from `production/chapter-04/art/`, plus three exact reuses. Source PNGs were never raster-edited during integration. Current approval and per-file staging/runtime hashes are in [the visual manifest](../../production/chapter-04/asset-manifest.json), [Director review](../../production/chapter-04/director-review.md) and [accepted input audit](../../production/chapter-04/implementation-evidence/accepted-inputs.json). `chapterFourContent.test.ts` checks all approved runtime bytes.

| Asset ID                          | Runtime path beneath this directory                          | Integration       |
| --------------------------------- | ------------------------------------------------------------ | ----------------- |
| `campus-east-gate-evening`        | `backgrounds/campus-east-gate-evening.png`                   | New approved copy |
| `wudaokou-noodle-restaurant`      | `backgrounds/wudaokou-noodle-restaurant.png`                 | New approved copy |
| `wudaokou-street-evening`         | `backgrounds/wudaokou-street-evening.png`                    | New approved copy |
| `dorm-entrance-night`             | `backgrounds/dorm-entrance-night.png`                        | New approved copy |
| `zhou-yichen-seated-introduction` | `characters/zhou-yichen/zhou-yichen-seated-introduction.png` | New approved copy |
| `zhou-yichen-seated-teasing`      | `characters/zhou-yichen/zhou-yichen-seated-teasing.png`      | New approved copy |
| `zhou-yichen-walking-basketball`  | `characters/zhou-yichen/zhou-yichen-walking-basketball.png`  | New approved copy |
| `zhou-yichen-brief-goodbye`       | `characters/zhou-yichen/zhou-yichen-brief-goodbye.png`       | New approved copy |
| `li-wei-dinner-attentive`         | `characters/li-wei/li-wei-dinner-attentive.png`              | New approved copy |
| `camera-guy-takeaway-wave`        | `characters/camera-guy/camera-guy-takeaway-wave.png`         | New approved copy |
| `li-wei-dorm-unanswered`          | `cg/li-wei-dorm-unanswered.png`                              | New approved copy |
| `sofia-welcoming`                 | `characters/sofia/welcoming.png`                             | Unchanged reuse   |
| `li-wei-cafe-arrival`             | `characters/li-wei/cafe-arrival.png`                         | Unchanged reuse   |
| `li-wei-walking-guarded`          | `characters/li-wei/walking-guarded.png`                      | Unchanged reuse   |

Canonical sprite identities are `zhou-yichen`, `li-wei`, `camera-guy` and `sofia`. The CG is stored under `cg/` but registered through the existing background group. `dinner-across` centers the seated portrait at x640/y20/height740 behind a foreground tabletop band beginning at 75.8%; `dinner-adjacent` uses x940/y20/height 1120 without foreground. Revision 11 reuses the exact standing Li Wei/Sofia/Kai art in `dinner-standing` (x940/y20/height840), `dinner-seated-full` (x640/y20/height1280) and `restaurant-counter` (x380/y130/height400) on eleven existing beats. These three variants restore the near tabletop above the sprite with an unchanged-background band from `round(sourceHeight * 0.744)` (700px of 941px); no raster edits or new assets were made. Chapter Four’s CSS adjusts portrait viewport crops only: these variants use width 200%, left −100%/−50%/−9.375% respectively. Existing seated framing is unchanged. Ball removal, standing-to-seated timing, the isolated Kai wave, one-beat hug and no-touch CG are authored event changes. Chapter default `hope.mp3` covers the public dinner/walk/goodbye. Revision 13 reuses registered `dramatic-boi` (`audio/music/dramatic_boi_v5.mp3`, SHA-256 `f5cb56dce35cd9401e628a7e25e23eff4c6fa0ad127c4a415b77428ec25ced30`, 3,585,114 bytes) from private warning index 212 at volume 0.15, continuing unchanged through indices 219–229 at 0.025. Fade/title/end indices 230–232 explicitly return to `hope` at 0.12. Only 21 music IDs change; the restaurant also reuses the existing `university-cafe` ambience. No new music, ambience or SFX was generated.

### Three approved Chinese clips

| Asset / runtime file                                             | Exact spoken text | Voice                     | SHA-256                                                            |
| ---------------------------------------------------------------- | ----------------- | ------------------------- | ------------------------------------------------------------------ |
| `audio/dialogue/sofia/sofia-eat-first.mp3`                       | 先吃饭。          | Raquel                    | `7e0ba2918d7458b8cf93494b30d3813d5a4463b0e875504070969ad86dae119f` |
| `audio/dialogue/zhou-yichen/zhou-yichen-saturday-question.mp3`   | 周六你有空吗？    | Jun                       | `72919c6298dcce4591484390830b077b0ac26c33459bb1ad1caf74dbee2dd178` |
| `audio/dialogue/zhou-yichen/zhou-yichen-saturday-correction.mp3` | 周六。星期六。    | Jun, user-selected source | `8773e41dcc0ab989d788da0291cce44b4beac5580694db8be75fea64d2570b92` |

Sofia uses **Raquel - Young, Bright and Cheerful**, exact ID `1eHrpOW5l98cxiSRjbzJ`, [assigned voice](https://elevenlabs.io/voices/1eHrpOW5l98cxiSRjbzJ). The ElevenLabs plugin generated the exact accepted clip with `eleven_multilingual_v2`, explicitly submitted `model_parameters.language_code: "zh"` and returned `Language: zh`. This establishes the recorded request/metadata, not an independent proof of provider language enforcement. Unreported numeric tuning is not claimed. The user confirmed “Yes, use this clip” for natural Chinese and intended identity. See [runtime Sofia provenance](audio/dialogue/sofia/README.md) and [complete generation record](../../production/chapter-04/audio/sofia-listening-provenance.json).

Yichen uses **Jun - Bright and energetic**, exact ID `5s3UifUu3OJ90z17rRMA`, [assigned voice](https://elevenlabs.io/voices/5s3UifUu3OJ90z17rRMA). The original question was generated with `eleven_multilingual_v2`; no numeric tuning or explicit language override was submitted. The user retained it as the preferred reference. The correction is the unchanged user-supplied file `ElevenLabs_2026-09-11T20_15_35_Jun - Bright and energetic_pvc_sp100_s94_sb64_se0_m2.mp3`. Its filename does not establish actual generation model/sliders. The user selected its voice and confirmed “Yes, it says 周六。星期六。” after two ASR models disagreed on the first word. ASR disagreement and rejected/cancelled attempts remain historical; no agent hearing is claimed. See [runtime Yichen provenance](audio/dialogue/zhou-yichen/README.md), [question generation](../../production/chapter-04/audio/jun-listening-provenance.json) and [supplied correction record](../../production/chapter-04/audio/user-correction-provenance.json).

All three files are copied unchanged to runtime and decode cleanly. The user supplies perceptual wording/voice approval; automated checks verify file identity, source mapping, real browser playback and lifecycle. Sofia’s question and panel show Chinese/pinyin with no upfront standalone English translation or hint. The same question recording continues into its panel and repeats only in the wrong-answer feedback; Yichen’s panel starts again after narration cleanup. Replay, mute, pause, hidden-tab pause, navigation and chapter restart use the existing audio lifecycle, with no playback rewards. Sofia’s six English turns remain text-only. Three cancelled English candidates and all superseded attempts remain outside runtime; the final coverage is exactly three Chinese files, not seven Sofia turns.

## Chapter five: placement result and photographs

Chapter Five adds 220 events and seven ending terms. Fifteen visual entries were approved: four exact reuses and eleven new PNGs copied unchanged. [Visual manifest](../../production/chapter-05/asset-manifest.json), [Director review](../../production/chapter-05/director-review.md) and [integration hashes](../../production/chapter-05/implementation-evidence/source-integration-hashes.json) identify exact approved SHA256 values. Runtime IDs resolve through `src/content/assetManifest.ts`; no unapproved art, asset-byte editing or new CG registry group was introduced.

| Asset ID                        | Runtime path beneath this directory                       | Integration       |
| ------------------------------- | --------------------------------------------------------- | ----------------- |
| `university-dorm`               | `backgrounds/university-dorm.png`                         | Unchanged reuse   |
| `university-campus`             | `backgrounds/university-campus.png`                       | Unchanged reuse   |
| `university-cafe`               | `backgrounds/university-cafe.png`                         | Unchanged reuse   |
| `camera-guy-cafe-working`       | `characters/camera-guy/cafe-working.png`                  | Unchanged reuse   |
| `university-cafe-table-morning` | `backgrounds/university-cafe-table-morning.png`           | New approved copy |
| `li-wei-morning-notebook`       | `characters/li-wei/li-wei-morning-notebook.png`           | New approved copy |
| `camera-guy-seated-attentive`   | `characters/camera-guy/camera-guy-seated-attentive.png`   | New approved copy |
| `camera-guy-adjacent-study`     | `characters/camera-guy/camera-guy-adjacent-study.png`     | New approved copy |
| `camera-guy-adjacent-listening` | `characters/camera-guy/camera-guy-adjacent-listening.png` | New approved copy |
| `kai-photo-bus`                 | `props/kai-photo-bus.png`                                 | New approved copy |
| `kai-photo-laundry`             | `props/kai-photo-laundry.png`                             | New approved copy |
| `kai-photo-tile`                | `props/kai-photo-tile.png`                                | New approved copy |
| `kai-photo-shutter`             | `props/kai-photo-shutter.png`                             | New approved copy |
| `kai-photo-stools`              | `props/kai-photo-stools.png`                              | New approved copy |
| `kai-photo-chair`               | `props/kai-photo-chair.png`                               | New approved copy |

Kai retains canonical `camera-guy`; Emma has no sprite. The new empty table background is separate from the three Kai poses. `cafeTableFraming.ts` scales character sprites without changing their bytes: across uses the source 73.2% table band; adjacent study/listening has no mask and identical placement; the small retreat changes placement only. All previous dinner/phone framing remains unchanged. Photos keep 3:2 aspect ratios; their passive strip retains six identities, with the sixth at 80% physical size and a readable active detail. Future subjects are absent from face-down DOM/accessibility. First five pack only at `ch5-photo-listening-callback`. The placement document and paper backs are React/CSS, not new raster assets. The revised card hides English meanings throughout card/context/question and reveals them immediately after either answer; no approved artwork contains the withheld answer.

### Four final ordinary Mandarin recordings

These clips are automatic ordinary dialogue with full Chinese/pinyin/English support and the existing Replay line, mute, pause, resume and cleanup controls. They add no learning effects. Li Wei’s question plays only on accepted practice history; Emma’s photo responses play only when selected. That chapter’s historical vocabulary service is superseded by the required recorded-vocabulary contract documented above.

| Audio ID                      | Runtime file                                            | Exact text                   | SHA256                                                             |
| ----------------------------- | ------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `emma-first-class-time`       | `audio/dialogue/emma/emma-first-class-time.mp3`         | 星期一上午九点。             | `2ec635260ee459238cf92c8773383a89f3993d008096b5c0064e8c79e81dfbd5` |
| `li-wei-first-class-question` | `audio/dialogue/li-wei/li-wei-first-class-question.mp3` | 第一节课是星期一上午九点吗？ | `faa7e40dc99abc49fa4d8f764c5284eaa7e28e0c9c3d5eea7fcbdc859d4dfc17` |
| `emma-quiet-photo-preference` | `audio/dialogue/emma/emma-quiet-photo-preference.mp3`   | 我喜欢这个。很安静。         | `96a86f359e24b3746d0e30f206e5e502cb2290292f625ed6d167202f986e633b` |
| `emma-beijing-photo-memory`   | `audio/dialogue/emma/emma-beijing-photo-memory.mp3`     | 它让我想起我刚来北京的时候。 | `e219c06e669d4fbb0eddbe1425cafb8f9af57944e85e5b00183944fece6d1006` |

Emma uses Arabella `Z3R5wn05IrDiVCyEkUrK` with actual `eleven_multilingual_v2`; the configured unrun plugin nodes submitted zh and returned zh metadata. Unavailable numeric sliders were not submitted or claimed to match estimates. Li Wei’s exact replacement was supplied and selected by the user: assigned LiuPing `pTOe8BQRdydOEIgv0wFL` remains the cast expectation, while the file’s actual model/language override/voice ID/tuning are unknown. Filename tokens are not evidence. The historical new/replacement character Multilingual v2 policy does not relabel these historical takes or the supplied file.

The user identified initial clips 1/2 for correction, supplied replacement 2, explicitly confirmed revised 1 and retained unchanged 3/4. Perceptual review is attributed to that exact-file user history; neither Developer nor QA claims hearing. Technical decoding and real browser lifecycle checks are separate. Final details are in [staged provenance](../../production/chapter-05/audio/final-audio-provenance.json), [runtime provenance](audio/dialogue/chapter-five-provenance.json), [Emma recordings](audio/dialogue/emma/README.md), [Li Wei recordings](audio/dialogue/li-wei/README.md) and the [audio history index](../../production/chapter-05/audio/README.md). The initial `decode-verification.json` retains rejected first takes; final decode metadata is in `final-audio-provenance.json`. All rejected/superseded records remain historical and no audio was regenerated during documentation.

[Independent runtime QA](../../production/chapter-05/qa-evidence/runtime-verification.md) rechecked 15 approved visual hashes, all four selected clips, 16 Chapter Five browser cases and 152 shared cases. The accepted runtime remains local; these records do not claim a new deployment or physical-device test.

Playtest-01 retains all fifteen visual hashes and all four selected MP3 hashes. The existing `audio/ambience/university-cafe.mp3` bytes are unchanged: only the 82 Chapter Five café presentations set base `ambienceVolume: 0.08`, replacing their former 0.32 gain. Earlier chapter defaults remain 0.32 unvoiced/0.12 voiced; the shared ratio yields 0.03 for an override of 0.08 with a voice. Chapter Five has no voiced café-loop overlap, retains same-ID continuity, and releases ambience at `ch5-machine-quiet`. No music/voice gain, recording, provider or provenance changed. [Revision verification](../../production/chapter-05/revisions/playtest-01/developer-verification.json) records exact-byte and actual browser gain/control checks; the current QA report tracks independent acceptance.

## Chapter six: The Plan Was Optional

Chapter Six now contains 261 events and thirteen ending definitions. Its [visual manifest](../../production/chapter-06/asset-manifest.json), [Director approval](../../production/chapter-06/director-review.md) and [current integration hashes](../../production/chapter-06/revisions/playtest-01/implementation/visual-audio-integration.json) identify 19 exact approved entries: 16 new staged files and 3 reused assets across the initial production and playtest revision. Eighteen are active in Six; the older `sofia-welcoming` entry is retained historically. Playtest-01 adds exactly two copies, `story-phone-shell` and `sofia-city-exploring`; all previous art/audio bytes remain unchanged. IDs resolve through `src/content/assetManifest.ts`. The CG stays in the backgrounds registry; runtime framing never edits source images.

| Asset ID                            | Runtime path relative to this directory                  | Origin                          |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------- |
| `dorm-bed-saturday-morning`         | `backgrounds/dorm-bed-saturday-morning.png`              | New approved PNG                |
| `campus-east-gate-morning`          | `backgrounds/campus-east-gate-morning.png`               | New approved PNG                |
| `subway-north-entrance-closed`      | `backgrounds/subway-north-entrance-closed.png`           | New approved PNG                |
| `subway-public-concourse`           | `backgrounds/subway-public-concourse.png`                | New approved PNG                |
| `gulou-hutong-closed-courtyard`     | `backgrounds/gulou-hutong-closed-courtyard.png`          | New approved PNG                |
| `hutong-group-lunch-table`          | `backgrounds/hutong-group-lunch-table.png`               | New approved PNG                |
| `hutong-quiet-bench`                | `backgrounds/hutong-quiet-bench.png`                     | New approved PNG                |
| `campus-athletic-path`              | `backgrounds/campus-athletic-path.png`                   | New approved PNG                |
| `campus-east-gate-evening`          | `backgrounds/campus-east-gate-evening.png`               | Exact reuse                     |
| `zhou-yichen-map-coordinator`       | `characters/zhou-yichen/zhou-yichen-map-coordinator.png` | New approved PNG                |
| `zhou-yichen-bench-attentive`       | `characters/zhou-yichen/zhou-yichen-bench-attentive.png` | New approved PNG                |
| `zhou-yichen-practice-paused`       | `characters/zhou-yichen/zhou-yichen-practice-paused.png` | New approved PNG                |
| `sofia-seated-phone`                | `characters/sofia/sofia-seated-phone.png`                | New approved PNG                |
| `sofia-welcoming`                   | `characters/sofia/welcoming.png`                         | Historical Six use; exact reuse |
| `zhou-yichen-seated-teasing`        | `characters/zhou-yichen/zhou-yichen-seated-teasing.png`  | Exact reuse                     |
| `yichen-loose-basketball`           | `props/yichen-loose-basketball.png`                      | New approved PNG                |
| `zhou-yichen-empty-place-courtyard` | `cg/zhou-yichen-empty-place-courtyard.png`               | New approved PNG                |
| `story-phone-shell`                 | `props/story-phone-shell.png`                            | Playtest-01 new approved PNG    |
| `sofia-city-exploring`              | `characters/sofia/sofia-city-exploring.png`              | Playtest-01 new approved PNG    |

The exact phone shell is 1024×1536 with the approved transparent aperture; authored DOM owns all text/status/messages and retains the notch. [The reusable phone guide](../../docs/phone-presentation.md) records the measured aperture, 9 snapshots, 36 event presentations, hidden/revealed meanings, attachment focus/scroll and responsive controls. `phoneScene.css` proportionally fills the entire phone-stage backdrop, stacks below 1000px and keeps the footer below choices. The Director’s [layout finding](../../production/chapter-06/revisions/playtest-01/runtime-staging-review/director-finding.json) is visually closed; normal-motion settled evidence is separate from reduced-motion captures. Sofia’s City Exploring pose replaces her earlier outdoor outfit only; seated dorm art is retained. Yichen’s practice sprite appears at the first declined campus line, and teasing map handling uses existing upper-body framing and authored environment cuts.

`seatedFraming.ts` adds lunch, bench and dorm placements only. Lunch uses the unchanged source tabletop band at 77.5%; the parked ball/map deliberately remain below/behind the table crop, with no foreground overlay, per [Director lunch staging approval](../../production/chapter-06/lunch-staging-review.md). The bench leaves the seat beside Yichen empty, places the loose basketball and plain CSS folded-map marker by his outer foot and adds a subtle shoe shadow. The serious-admission CG matches the seated bag continuity; the standing departure pose recovers the held props and clears the loose ones. Sofia’s full crossed-leg pose sits behind a rail-only renderer texture clipped from the exact approved dorm background, with transparent gaps. This is source-pixel occlusion, not a painted replacement or edited PNG. Chapter Six’s portrait crops and overflow treatment preserve readable scenes/controls without changing earlier frame constants or crops.

### Chapter six recordings

| Audio ID                           | Runtime path relative to this directory                           | Spoken text                              | SHA-256                                                            |
| ---------------------------------- | ----------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `zhou-yichen-changed-meeting`      | `audio/dialogue/zhou-yichen/zhou-yichen-changed-meeting.mp3`      | 北入口关了。改地方了。现在在西北口集合。 | `45bf8ee126b34522be714607ad150c2b0221e5d05846ce334c148c7a89ca3104` |
| `emma-phrase-excuse-me`            | `audio/dialogue/emma/emma-phrase-excuse-me.mp3`                   | 请问                                     | `565beecb97c34a4b9685519b3f8b919e6cc0aa3a29b9bb3b3063a1c486be085d` |
| `emma-phrase-northwest-exit`       | `audio/dialogue/emma/emma-phrase-northwest-exit.mp3`              | 西北口                                   | `8d40bde62e73a28bc30ef94a239f72c60154271432c571a7014150d567be9aca` |
| `emma-phrase-where-is`             | `audio/dialogue/emma/emma-phrase-where-is.mp3`                    | 在哪儿                                   | `cc9e918c10932707b66db5eb363757e45e5eab6b4f68d201f710b64b7b5eb74c` |
| `emma-northwest-exit-request`      | `audio/dialogue/emma/emma-northwest-exit-request.mp3`             | 请问，西北口在哪儿？                     | `bec85df98ef2ce6fbe1d517555fba35ba9b8691502edcbe3adb7bd42d1c55587` |
| `zhou-yichen-monday-nine`          | `audio/dialogue/zhou-yichen/zhou-yichen-monday-nine.mp3`          | 星期一上午九点？                         | `56c7eab153155aaa5633f4eeed40ea236cd9cc9c642aa8dfef2df0f3fc70f6c2` |
| `emma-yes-first-class`             | `audio/dialogue/emma/emma-yes-first-class.mp3`                    | 对。第一节课。                           | `e5ad23048d9a73115ae07fbacaea08c9a8d01f09bffbaced2e8ede902c8ba1f5` |
| `zhou-yichen-classroom-directions` | `audio/dialogue/zhou-yichen/zhou-yichen-classroom-directions.mp3` | 教学楼在前面，右边。                     | `a3638d44b73f568d1c2311238e92c10640143b07565b11672583483f6f0be217` |

The three Yichen clips use **Jun - Bright and energetic**, exact voice ID `5s3UifUu3OJ90z17rRMA`, [assigned voice](https://elevenlabs.io/voices/5s3UifUu3OJ90z17rRMA), with `eleven_v3`. The five Emma clips use **Arabella - Mysterious and Emotive**, exact ID `Z3R5wn05IrDiVCyEkUrK`, [assigned voice](https://elevenlabs.io/voices/Z3R5wn05IrDiVCyEkUrK), with `eleven_multilingual_v2`. All eight were generated through the ElevenLabs plugin and copied unchanged from `production/chapter-06/audio/`. Requested, submitted and returned fields remain separately recorded. Explicit `zh` was submitted and returned; the plugin did not expose Emma’s requested numeric tuning, so those values were not submitted or verified. Neither metadata nor listening approval establishes acoustic language enforcement.

On September 12, 2026, the user approved all eight exact files in response to the Coordinator’s request to confirm wording, pronunciation, voices and pacing. The [user listening record](../../production/chapter-06/audio/user-listening-approval.json) binds the verbatim confirmation and all eight hashes. This is user perceptual approval; agents do not claim hearing. [Staged final provenance](../../production/chapter-06/audio/final-audio-provenance.json), its [runtime mirror](audio/dialogue/chapter-six-provenance.json), [generation report](../../production/chapter-06/audio-generation-report.md) and [audio review](../../production/chapter-06/audio-review.md) preserve technical and listening evidence separately. Historical files, casting and generation records remain unchanged; the current [cast/model policy](../../story/voice-cast.md#generation-model-assignments) now uses MiniMax for new/replacement character recordings, preserves the old Mr. Chen assignment as historical evidence, and does not imply his appearance or audio in Chapter Six.

The changed-meeting clip automatically supports the chapter’s only Chinese-only character dialogue (Chinese/pinyin, withheld English), then restarts at the listening panel after narrated access to the unpaid concourse. Each wrong answer retains its distinct consequence and complete supported correction. Three Emma chunk clips play only on demand from separate bank/placed-slot buttons without effects; both accepted request routes play the full sentence after tile playback stops. Monday-time, first-class and classroom-direction dialogue retains full Chinese/pinyin/English support with automatic clips. The group-plan reading, worker reply and other unassigned supported lines are deliberately unvoiced. Cast recordings never use browser TTS fallback; ending-word review now follows the required recorded-vocabulary contract above; all thirteen Chapter Six words now follow the current MiniMax revision and its exact-file review.

Chapter Six reuses `hope` at 0.12 ordinary/0.06 spoken or quiet, café ambience at 0.08 for lunch, and the existing generic train loop at 0.08 only during narrated transit. The shared proportional ducking ratio yields 0.03 under voice. No new music, ambience or SFX file is added, and earlier gain defaults are preserved. [Current independent runtime QA](../../production/chapter-06/revisions/playtest-01/qa/runtime-review.md) verifies all nineteen visual entries, eight stage/runtime/user-approved audio hashes, actual browser playback/cleanup, and desktop/mobile staging across four required viewports plus 780×998 and Firefox touch emulation. The original seventeen-entry integration remains historical evidence. Its local acceptance does not assert deployment or physical-device testing.

## Professor Zhu replacement recordings

All four current Zhu IDs resolve to `audio/dialogue/minimax/zhu-ke/professor-zhu-voice-03/`, using exact voice `Chinese_bazong`, submitted `speech-2.8-turbo` and Chinese boost. [Current generation proof](../../production/chapter-12/revisions/playtest-03/voice-replacement/audio/generated-audio-provenance.json) binds the replacement hashes; the [producer approved all four exact files](../../production/chapter-12/revisions/playtest-03/voice-replacement/audio/user-listening-approval.json). Three belong to Chapter Seven; `ch12-zhu-almost-done` belongs to Twelve. All other 328 registry rows remain exact. The prior custom-voice `chapter-seven/professor-zhu-voice-01/` files, previous Twelve Zhu file, earlier Reliable Executive files and all raw proof/listening receipts remain preserved as history.

### Chapter Nine supplied shutter

`audio/sfx/camera-shutter.mp3` is the user's supplied nonspoken21504-byte MP3, copied without transcoding (SHA256 `5941712f82d92fb711e9b1249e086a9b6ea2d879e87d7803f9f981479f111ef8`). It is registered as `camera-shutter` and plays at five approved narration exposures via `presentation.sfx`, with volume0.65 and no loop. [Cue/provenance specification](../../production/chapter-09/revisions/final-playtest-01/cue-order-spec.json) records source/staging paths and exact indices. It adds no speech-registry row; all249 existing recordings and approved visuals remain unchanged.

Playtest-02 adds the existing `language-classroom-corridor` background to Twelve’s uses (SHA-256 `27faa523656daa6cb92799a5272909b58e4b24597d184b2cc48ce6b21e79a295`), without a new registry ID or duplicate asset. All 28 preceding approved bindings remain intact; total current bindings are 29. The four new Zhu files preserve source/staged/runtime byte equality and the original chapter audio files; their separate exact-file approval does not rewrite earlier approvals.

[Playtest-04 counter staging](../../production/chapter-12/revisions/playtest-04/director-review.md) reuses the same print-shop background and neutral sprite. Only `ch12-print-shop` adds source-row548/941 foreground occlusion through `print-shop-counter-standing`, preserving x850/y20/height840. All32 visual binding hashes and all audio files remain unchanged.
