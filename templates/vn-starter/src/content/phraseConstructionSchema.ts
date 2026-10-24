import { nonblank, containsHan, mandarinSegmentSchema } from "./mandarinSchema";
import { z } from "zod";
import { storyEffectSchema } from "./storyEffectSchema";

const coaching = z.object({
  // This authored English question is silent; Chinese performance needs a recorded story beat.
  preface: z
    .object({
      characterId: nonblank,
      text: nonblank.refine(
        (value) => !containsHan(value),
        "Coaching preface must be English prose",
      ),
    })
    .strict()
    .optional(),
  line: z.string().min(1),
  explanation: z.string().min(1),
});
export const phraseConstructionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    characterId: z.string(),
    question: z.string(),
    showQuestion: z.boolean().optional(),
    pinyin: z.string(),
    translation: z.string(),
    goal: z.string().min(1),
    slots: z
      .array(z.object({ role: z.string().min(1), label: z.string().min(1) }))
      .min(2)
      .max(8),
    tiles: z
      .array(
        z.object({
          id: z.string().min(1),
          text: nonblank.refine(containsHan, "Phrase tile requires Chinese characters"),
          meaning: z
            .string()
            .refine((value) => value.trim().length > 0, "Tile meaning must not be blank"),
          pinyin: mandarinSegmentSchema.shape.pinyin,
          role: z.string().min(1),
          audioId: nonblank,
          speakerId: nonblank.nullable(),
        }),
      )
      .min(2),
    requestTileId: z.string().min(1).optional(),
    // Legacy false is accepted; authors cannot disable the shared translation lookup.
    showMeanings: z.literal(false).optional(),
    showSlotLabels: z.boolean().optional(),
    actionLabels: z.object({ submit: z.string().min(1), help: z.string().min(1) }).optional(),
    helpWording: nonblank.optional(),
    modelTileIds: z.array(z.string().min(1)),
    outcomes: z
      .array(
        z.object({
          id: z.string().min(1),
          tileIds: z.array(z.string().min(1)),
          targetEventId: z.string().min(1),
          assistedTargetEventId: z.string().min(1).optional(),
          effects: z.array(storyEffectSchema),
        }),
      )
      .min(1),
    coaching: z.object({ structure: coaching, request: coaching }),
  })
  .superRefine((exercise, context) => {
    const report = (message: string) => context.addIssue({ code: "custom", message });
    if (exercise.showQuestion !== false && !exercise.question.trim())
      report("Visible phrase question must not be empty");
    if (exercise.showQuestion !== false && !exercise.characterId.trim())
      report("Visible phrase speaker must not be empty");
    const tiles = new Map(exercise.tiles.map((tile) => [tile.id, tile]));
    const roles = new Set(exercise.slots.map((slot) => slot.role));
    if (tiles.size !== exercise.tiles.length || roles.size !== exercise.slots.length)
      report("Duplicate phrase tile IDs or slot roles");
    if (exercise.tiles.some((tile) => !roles.has(tile.role))) report("Unknown phrase role");
    const request = exercise.requestTileId ? tiles.get(exercise.requestTileId) : undefined;
    if (exercise.requestTileId && !request) report("Unknown request tile");
    const validSequence = (ids: string[]) =>
      ids.length === exercise.slots.length &&
      ids.every((id, index) => tiles.get(id)?.role === exercise.slots[index]!.role) &&
      (!exercise.requestTileId || ids.includes(exercise.requestTileId));
    if (!validSequence(exercise.modelTileIds)) report("Invalid model phrase");
    const sequences = new Set<string>();
    for (const outcome of exercise.outcomes) {
      if (!validSequence(outcome.tileIds)) report("Invalid phrase outcome sequence");
      sequences.add(JSON.stringify(outcome.tileIds));
    }
    if (
      sequences.size !== exercise.outcomes.length ||
      new Set(exercise.outcomes.map((outcome) => outcome.id)).size !== exercise.outcomes.length
    )
      report("Duplicate phrase outcomes");
    // Count combinations without generating a potentially large Cartesian product.
    const combinations = exercise.slots.reduce(
      (count, slot) =>
        count *
        exercise.tiles.filter(
          (tile) =>
            tile.role === slot.role &&
            (!request || slot.role !== request.role || tile.id === request.id),
        ).length,
      1,
    );
    if (combinations === 0 || combinations !== sequences.size)
      report("Every valid phrase must have a story outcome");
  });
