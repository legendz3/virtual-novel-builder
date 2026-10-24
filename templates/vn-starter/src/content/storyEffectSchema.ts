import { z } from "zod";

export const storyEffectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("relationship"),
    key: z.enum([
      "LiWei_Affection",
      "LiWei_Trust",
      "LiWei_Rivalry",
      "Kai_Affection",
      "Kai_Trust",
      "Yichen_Affection",
      "Yichen_Trust",
      "Han_Affection",
      "Han_Trust",
    ]),
    delta: z.number().finite(),
  }),
  z.object({
    type: z.literal("stat"),
    key: z.enum(["Mandarin", "MandarinXP", "Independence", "Confidence"]),
    delta: z.number().finite(),
  }),
]);
