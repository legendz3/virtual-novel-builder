import type { StoryEffect } from "@game/story/story.types";

export const choiceStatCopy: Record<StoryEffect["key"], { label: string; symbol: string }> = {
  LiWei_Affection: { label: "Li Wei · Affection", symbol: "♡" },
  LiWei_Rivalry: { label: "Li Wei · Rivalry", symbol: "◇" },
  Kai_Trust: { label: "Kai · Trust", symbol: "◇" },
  LiWei_Trust: { label: "Li Wei · Trust", symbol: "◇" },
  Kai_Affection: { label: "Kai · Affection", symbol: "♡" },
  Yichen_Affection: { label: "Yichen · Affection", symbol: "♡" },
  Yichen_Trust: { label: "Yichen · Trust", symbol: "◇" },
  Han_Affection: { label: "Han · Affection", symbol: "♡" },
  Han_Trust: { label: "Han · Trust", symbol: "◇" },
  MandarinXP: { label: "Mandarin XP", symbol: "✦" },
  Mandarin: { label: "Mandarin", symbol: "✦" },
  Independence: { label: "Independence", symbol: "✦" },
  Confidence: { label: "Confidence", symbol: "✦" },
};
