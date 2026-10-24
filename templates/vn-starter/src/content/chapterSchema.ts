import { mandarinSpeechIssue } from "./mandarinSpeech";
import {
  nonblank,
  mandarinDialogueSchema,
  mandarinSupportSchema,
  containsHan,
  hasCompleteMandarinCoverage,
  mandarinSegmentSchema,
} from "./mandarinSchema";
import { phonePresentationSchema } from "./phoneSchema";
import { z } from "zod";
import { storyEffectSchema } from "./storyEffectSchema";
import { foregroundSchema } from "./foregroundSchema";
import { phraseConstructionSchema } from "./phraseConstructionSchema";

const identity = {
  languageReview: z.never().optional(),
  languageNotes: z.never().optional(),
  mandarinSupport: z.never().optional(),
  id: z.string().min(1),
  sceneId: z.string().min(1).optional(),
  nextEventId: z.string().min(1).nullable().optional(),
  effects: z.array(storyEffectSchema).optional(),
  presentation: z
    .object({
      dialoguePlacement: z.enum(["upper-right"]).optional(),
      decisionPlacement: z.enum(["right"]).optional(),
      view: z.enum([
        "dark",
        "window",
        "phone",
        "title",
        "hall",
        "street",
        "train",
        "chapter-end",
        "chapter-title",
        "dorm",
        "elevator",
        "cafe",
        "campus",
        "exam",
        "schedule",
        "fade-out",
        "phrase-builder",
      ]),
      backgroundId: z.string().min(1).optional(),
      foreground: foregroundSchema.optional(),
      phone: phonePresentationSchema.optional(),
      character: z
        .object({
          id: z.string().min(1),
          assetId: z.string().min(1),
          framing: z
            .enum([
              "cafe-night-dining",
              "cafe-night-table-standing",
              "cafe-night-counter-standing",
              "cafe-night-counter-working",
              "cafe-night-door-standing",
              "campus-night-path-standing",
              "workroom-rain-standing",
              "workroom-rain-floor-standing",
              "print-shop-counter-standing",
              "advising-office-standing",
              "advising-office-departing",
              "sound-room-leaning",
              "sound-room-standing",
              "library-path-waiting",
              "waist-up",
              "portrait",
              "left-edge",
              "close-up",
              "behind-counter",
              "counter-right",
              "counter-side",
              "dinner-across",
              "dinner-adjacent",
              "dinner-standing",
              "dinner-seated-full",
              "restaurant-counter",
              "cafe-table-across",
              "cafe-table-adjacent",
              "cafe-table-room",
              "hutong-table-across",
              "courtyard-bench-seated",
              "great-wall-bench-seated",
              "library-table-seated",
              "advising-desk-seated",
              "dining-table-seated",
              "dorm-bed-seated",
              "volunteer-meeting-seated",
              "volunteer-meeting-standing",
              "small-table-seated",
            ])
            .optional(),
        })
        .optional(),
      sfx: z
        .object({ id: z.string().min(1), volume: z.number().finite().min(0).max(1) })
        .strict()
        .optional(),
      ambienceId: z.string().min(1).optional(),
      ambienceVolume: z.number().finite().min(0).max(1).optional(),
      musicId: z.string().min(1).optional(),
      musicVolume: z.number().min(0).max(1).optional(),
      crossingMotion: z
        .object({
          shot: z.enum(["catch", "close", "release"]),
          durationMs: z.number().int().min(0).max(10000),
        })
        .optional(),
    })
    .optional(),
};
const storyValue = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const languageNotes = z
  .array(
    mandarinSegmentSchema
      .extend({
        explanation: nonblank
          .refine((value) => !containsHan(value), "Put Chinese in its own supported note")
          .optional(),
      })
      .strict(),
  )
  .min(1)
  .optional();
const languageSupport = { pinyin: z.string().optional(), translation: z.string().optional() };
const storyEventSchema = z.discriminatedUnion("type", [
  z.object({
    ...identity,
    type: z.literal("phrase_construction"),
    exercise: phraseConstructionSchema,
  }),
  z.object({
    ...identity,
    mandarinSupport: mandarinSupportSchema.optional(),
    languageNotes,
    ...languageSupport,
    type: z.literal("narration"),
    text: z.string(),
  }),
  z.object({
    ...identity,
    ...languageSupport,
    type: z.literal("dialogue"),
    mandarinSupport: mandarinSupportSchema.optional(),
    languageNotes,
    characterId: z.string(),
    text: z.string(),
    mandarin: mandarinDialogueSchema.optional(),
    audioId: z.string().optional(),
    textDisplay: z.enum(["text", "audio-only"]).optional(),
  }),
  z.object({
    ...identity,
    type: z.literal("phone_message"),
    senderId: z.string(),
    text: z.string(),
  }),
  z.object({
    ...identity,
    type: z.literal("pause"),
    durationMs: z.number().int().positive(),
    text: z.string().optional(),
    sfxId: z.string().optional(),
  }),
  z.object({
    ...identity,
    type: z.literal("title"),
    title: z.string(),
    subtitle: z.string(),
    assetId: z.string().optional(),
    eyebrow: z.string().optional(),
    pinyin: z.string().optional(),
  }),
  z.object({
    ...identity,
    type: z.literal("choice"),
    mandarinSupport: mandarinSupportSchema.optional(),
    languageNotes,
    prompt: z.string().optional(),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string(),
          targetEventId: z.string().min(1),
          quote: z.string().optional(),
          ...languageSupport,
          effects: z.array(storyEffectSchema).optional(),
        }),
      )
      .min(1),
  }),
  z.object({
    ...identity,
    type: z.literal("comprehension"),
    exercise: z.object({
      id: z.string().min(1),
      type: z.literal("meaning_choice"),
      question: z.string(),
      translation: z.string().optional(),
      presentationLabel: z.string().min(1).optional(),
      pinyin: z.string(),
      prompt: z.string(),
      readingAids: z.array(mandarinSegmentSchema).min(1).optional(),
      options: z.array(z.object({ id: z.string().min(1), text: z.string() })).min(2),
      correctOptionId: z.string().min(1),
      audioId: z.string().min(1).optional(),
      textDisplay: z.enum(["text", "audio-only"]).optional(),
      retryHint: z.string().min(1).optional(),
    }),
    correctEventId: z.string().min(1),
    incorrectEventId: z.string().min(1),
  }),
  z.object({
    ...identity,
    type: z.literal("choice_route"),
    choiceEventId: z.string().min(1),
    sourceChapterId: z.string().min(1).optional(),
    cases: z.record(z.string().min(1), z.string().min(1)),
    defaultEventId: z.string().min(1),
  }),
  z.object({ ...identity, type: z.literal("learning"), exerciseId: z.string() }),
  z.object({
    ...identity,
    type: z.literal("chapter_end"),
    title: z.string().min(1),
    vocabularyTitle: z.string().min(1),
    vocabulary: z
      .array(
        z.object({
          id: z.string().min(1),
          hanzi: mandarinSegmentSchema.shape.hanzi,
          pinyin: mandarinSegmentSchema.shape.pinyin,
          meaning: nonblank,
          audioId: nonblank,
          speakerId: nonblank,
        }),
      )
      .min(1),
    nextEventId: z.null(),
  }),
  z.object({ ...identity, type: z.literal("set_variable"), key: z.string(), value: storyValue }),
  z.object({
    ...identity,
    type: z.literal("relationship"),
    characterId: z.string(),
    delta: z.number().finite(),
  }),
  z.object({
    ...identity,
    type: z.literal("conditional"),
    variable: z.string(),
    equals: storyValue,
    targetEventId: z.string(),
  }),
  z.object({
    ...identity,
    type: z.literal("scene_change"),
    sceneId: z.string(),
    backgroundId: z.string().optional(),
  }),
  z.object({
    ...identity,
    type: z.literal("audio"),
    action: z.enum(["play", "stop"]),
    audioId: z.string().optional(),
  }),
]);

export const chapterSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1).optional(),
    nextChapterId: z.string().min(1).optional(),
    endpointNote: z.string().min(1).optional(),
    sceneId: z.string().optional(),
    musicId: z.string().optional(),
    events: z.array(storyEventSchema).min(1),
  })
  .refine(
    (chapter) => new Set(chapter.events.map((event) => event.id)).size === chapter.events.length,
    "Duplicate event IDs",
  )
  .superRefine((chapter, context) => {
    const ids = new Set(chapter.events.map((event) => event.id));
    for (const [index, event] of chapter.events.entries()) {
      if (
        event.type === "chapter_end" &&
        new Set(event.vocabulary.map((word) => word.id)).size !== event.vocabulary.length
      )
        context.addIssue({
          code: "custom",
          message: "Duplicate vocabulary IDs",
          path: ["events", index, "vocabulary"],
        });
      if (event.type === "dialogue") {
        const content = event.mandarin;
        const issue = (message: string) =>
          context.addIssue({ code: "custom", message, path: ["events", index, "mandarin"] });
        if (containsHan(event.text) && !content)
          issue("Chinese dialogue requires a Mandarin contract");
        if (content) {
          const speechIssue = mandarinSpeechIssue(event.text, content);
          if (speechIssue) issue(speechIssue);
          if (!hasCompleteMandarinCoverage(event.text, content.segments))
            issue("Unmapped Chinese dialogue occurrence");
          if (
            content.layout === "block" &&
            (content.segments.length !== 1 || content.segments[0]!.hanzi !== event.text)
          )
            issue("Block Mandarin must match the entire dialogue");
          if (
            content.mode !== "supported" &&
            content.segments.some((segment) => event.text.includes(segment.meaning))
          )
            issue("Hidden meaning is present in dialogue text");
          if (
            event.pinyin !== undefined &&
            !content.segments.some((segment) => segment.pinyin === event.pinyin)
          )
            issue("Conflicting legacy pinyin");
          if (
            event.translation !== undefined &&
            (content.mode !== "supported" ||
              !content.segments.some((segment) => segment.meaning === event.translation))
          )
            issue("Conflicting legacy translation");
          if (
            event.audioId !== undefined &&
            (content.speech.mode !== "recorded" || event.audioId !== content.speech.audioId)
          )
            issue("Conflicting legacy audio");
          if (
            event.textDisplay !== undefined &&
            (event.textDisplay === "audio-only") !== (content.mode === "audio-only")
          )
            issue("Conflicting legacy text display");
        }
      }
      const targets = [event.nextEventId];
      const spoken =
        event.type === "dialogue"
          ? event
          : event.type === "comprehension"
            ? event.exercise
            : undefined;
      if (
        spoken?.textDisplay === "audio-only" &&
        !spoken.audioId &&
        !(event.type === "dialogue" && event.mandarin?.speech.mode === "recorded")
      )
        context.addIssue({
          code: "custom",
          message: "Audio-only content requires audioId",
          path: ["events", index],
        });
      if (event.type === "choice_route") {
        targets.push(event.defaultEventId, ...Object.values(event.cases));
        const choice = chapter.events.find((item) => item.id === event.choiceEventId);
        const sourceOptions =
          choice?.type === "choice"
            ? choice.options
            : choice?.type === "comprehension"
              ? choice.exercise.options
              : undefined;
        if (
          (!event.sourceChapterId || event.sourceChapterId === chapter.id) &&
          (!sourceOptions ||
            Object.keys(event.cases).some(
              (key) => !sourceOptions.some((option) => option.id === key),
            ))
        )
          context.addIssue({
            code: "custom",
            message: "Choice route references unknown choice or option",
            path: ["events", index],
          });
        if (event.effects?.length || event.nextEventId !== undefined)
          context.addIssue({
            code: "custom",
            message: "Choice routes only route; effects and nextEventId are not supported",
            path: ["events", index],
          });
      }
      if (event.type === "phrase_construction")
        targets.push(
          ...event.exercise.outcomes.flatMap((outcome) => [
            outcome.targetEventId,
            outcome.assistedTargetEventId,
          ]),
        );
      if (event.type === "conditional") targets.push(event.targetEventId);
      if (event.type === "choice")
        targets.push(...event.options.map((option) => option.targetEventId));
      if (event.type === "comprehension") {
        targets.push(event.correctEventId, event.incorrectEventId);
        if (!event.exercise.options.some((option) => option.id === event.exercise.correctOptionId))
          context.addIssue({
            code: "custom",
            message: "Unknown correct option",
            path: ["events", index],
          });
      }
      const options =
        event.type === "choice"
          ? event.options
          : event.type === "comprehension"
            ? event.exercise.options
            : [];
      if (new Set(options.map((option) => option.id)).size !== options.length)
        context.addIssue({
          code: "custom",
          message: "Duplicate option IDs",
          path: ["events", index],
        });
      for (const target of targets) {
        if (target != null && !ids.has(target))
          context.addIssue({
            code: "custom",
            message: `Unknown event target: ${target}`,
            path: ["events", index],
          });
      }
    }
    // All route-only paths must reach a visible beat, including unselected/fallback cases.
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const events = new Map(chapter.events.map((event) => [event.id, event]));
    const visit = (id: string): void => {
      const event = events.get(id);
      if (event?.type !== "choice_route" || visited.has(id)) return;
      if (visiting.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Choice route cycle: ${id}`,
          path: ["events"],
        });
        return;
      }
      visiting.add(id);
      for (const target of [event.defaultEventId, ...Object.values(event.cases)]) visit(target);
      visiting.delete(id);
      visited.add(id);
    };
    for (const event of chapter.events) visit(event.id);
  });
