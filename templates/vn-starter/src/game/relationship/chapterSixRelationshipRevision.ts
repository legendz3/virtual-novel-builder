import type { RelationshipRewardState } from "./relationshipRevisions";

export const CHAPTER_SIX_RELATIONSHIP_REVISION = "relationship-revision:chapter-six-v1";

// Frozen old-zero additions from the approved playtest-01 specification, independent of later content.
export const chapterSixRelationshipAdditions = [
  {
    choiceId: "ch6-courtyard-choice",
    optionId: "ch6-serious-answer",
    deltas: {
      Yichen_Affection: 1,
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch6-courtyard-choice",
    optionId: "ch6-keep-teasing",
    deltas: {
      Yichen_Affection: 2,
    },
  },
  {
    choiceId: "ch6-courtyard-choice",
    optionId: "ch6-return-to-group",
    deltas: {
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch6-contact-choice",
    optionId: "ch6-direct-contact",
    deltas: {
      Yichen_Affection: 1,
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch6-contact-choice",
    optionId: "ch6-contact-through-sofia",
    deltas: {
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch6-contact-choice",
    optionId: "ch6-contact-earn-it",
    deltas: {
      Yichen_Affection: 1,
    },
  },
  {
    choiceId: "ch6-declined-contact-choice",
    optionId: "ch6-declined-direct-contact",
    deltas: {
      Yichen_Affection: 1,
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch6-declined-contact-choice",
    optionId: "ch6-declined-contact-through-sofia",
    deltas: {
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch6-declined-contact-choice",
    optionId: "ch6-declined-contact-earn-it",
    deltas: {
      Yichen_Affection: 1,
    },
  },
] as const;

export function reconcileChapterSixRelationshipRewards<T extends RelationshipRewardState>(
  state: T,
): T {
  if (state.storyVariables[CHAPTER_SIX_RELATIONSHIP_REVISION] === true) return state;
  const relationships = { ...state.relationships };
  for (const addition of chapterSixRelationshipAdditions) {
    if (state.choicesMade[addition.choiceId] !== addition.optionId) continue;
    for (const [key, delta] of Object.entries(addition.deltas)) {
      relationships[key] = (relationships[key] ?? 0) + delta;
    }
  }
  return {
    ...state,
    relationships,
    storyVariables: { ...state.storyVariables, [CHAPTER_SIX_RELATIONSHIP_REVISION]: true },
  };
}
