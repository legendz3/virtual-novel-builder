import { z } from "zod";

// Face-down entries contain no asset or subject, including in accessible output.
export const foregroundSchema = z.union([
  z.object({
    kind: z.literal("image").optional(),
    assetId: z.string().min(1),
    alt: z.string().min(1),
  }),
  z.object({
    kind: z.literal("document"),
    id: z.string().min(1),
    showMeanings: z.boolean().optional(),
    rows: z
      .array(
        z.object({
          hanzi: z.string().min(1),
          pinyin: z.string().min(1),
          meaning: z.string().min(1),
        }),
      )
      .min(1),
  }),
  z
    .object({
      kind: z.literal("collection"),
      accessibleLabel: z.string().trim().min(1).optional(),
      items: z
        .array(
          z.object({
            id: z.string().min(1),
            assetId: z.string().min(1).optional(),
            alt: z.string().min(1).optional(),
            physicalScale: z.number().positive().max(1).optional(),
          }),
        )
        .min(1),
      activeId: z.string().min(1).optional(),
    })
    .superRefine((collection, context) => {
      if (new Set(collection.items.map((item) => item.id)).size !== collection.items.length)
        context.addIssue({ code: "custom", message: "Duplicate foreground item IDs" });
      for (const item of collection.items)
        if (Boolean(item.assetId) !== Boolean(item.alt))
          context.addIssue({
            code: "custom",
            message: "Revealed foreground items require both asset and alt",
          });
      if (
        collection.activeId &&
        !collection.items.some((item) => item.id === collection.activeId && item.assetId)
      )
        context.addIssue({ code: "custom", message: "Active foreground item must be revealed" });
    }),
]);
