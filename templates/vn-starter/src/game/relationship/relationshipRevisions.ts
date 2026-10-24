import { reconcileChapterSixRelationshipRewards } from "./chapterSixRelationshipRevision";

/** Structural save/state boundary; reconciliation never depends on React or mutable chapter content. */
export interface RelationshipRewardState {
  storyVariables: Record<string, unknown>;
  relationships: Record<string, number>;
  choicesMade: Record<string, string>;
}

export const CHAPTERS_ONE_FIVE_RELATIONSHIP_REVISION = "relationship-revision:chapters-one-five-v1";

// Frozen historical additions approved in production/relationship-stat-retro/gameplay-spec.json.
// Never edit these amounts to follow later content revisions: those need a separate marker.
const historicalRelationshipAdditions = [
  {
    choiceId: "suitcase-choice",
    optionId: "refuse",
    deltas: {
      LiWei_Trust: 1,
    },
  },
  {
    choiceId: "kai-response-choice",
    optionId: "helping",
    deltas: {
      LiWei_Trust: 1,
    },
  },
  {
    choiceId: "kai-response-choice",
    optionId: "private",
    deltas: {
      LiWei_Trust: 1,
    },
  },
  {
    choiceId: "ch3-kai-prints-choice",
    optionId: "wait-for-pictures",
    deltas: {
      Kai_Affection: 1,
    },
  },
  {
    choiceId: "ch3-kai-prints-choice",
    optionId: "pictures-own-terms",
    deltas: {
      Kai_Trust: 1,
    },
  },
  {
    choiceId: "ch3-kai-prints-choice",
    optionId: "leave-prints-private",
    deltas: {
      Kai_Trust: 1,
    },
  },
  {
    choiceId: "ch3-next-question-choice",
    optionId: "question-own-pace",
    deltas: {
      LiWei_Trust: 1,
    },
  },
  {
    choiceId: "ch4-preference-choice",
    optionId: "ch4-preference-funny",
    deltas: {
      Yichen_Affection: 2,
    },
  },
  {
    choiceId: "ch4-preference-choice",
    optionId: "ch4-preference-quiet",
    deltas: {
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch4-preference-choice",
    optionId: "ch4-preference-feeling",
    deltas: {
      LiWei_Affection: 1,
    },
  },
  {
    choiceId: "ch4-saturday-response",
    optionId: "ch4-saturday-yes",
    deltas: {
      Yichen_Affection: 2,
      Yichen_Trust: 1,
    },
  },
  {
    choiceId: "ch4-saturday-response",
    optionId: "ch4-saturday-maybe",
    deltas: {
      Yichen_Trust: 2,
    },
  },
  {
    choiceId: "ch5-photo-choice",
    optionId: "ch5-photo-preference",
    deltas: {
      Kai_Trust: 1,
      Kai_Affection: 1,
    },
  },
  {
    choiceId: "ch5-photo-choice",
    optionId: "ch5-photo-meaning",
    deltas: {
      Kai_Trust: 2,
      Kai_Affection: 1,
    },
  },
  {
    choiceId: "ch5-photo-choice",
    optionId: "ch5-photo-memory",
    deltas: {
      Kai_Trust: 2,
      Kai_Affection: 1,
    },
  },
  {
    beatMarker: "beat-effects:chapter-two:kai-probably",
    deltas: {
      Kai_Affection: 1,
    },
  },
] as const;

export function reconcileRelationshipRewards<T extends RelationshipRewardState>(state: T): T {
  if (state.storyVariables[CHAPTERS_ONE_FIVE_RELATIONSHIP_REVISION] === true)
    return reconcileChapterSixRelationshipRewards(state);
  const relationships = { ...state.relationships };
  for (const addition of historicalRelationshipAdditions) {
    const earned =
      "choiceId" in addition
        ? state.choicesMade[addition.choiceId] === addition.optionId
        : state.storyVariables[addition.beatMarker] === true;
    if (!earned) continue;
    for (const [key, delta] of Object.entries(addition.deltas)) {
      relationships[key] = (relationships[key] ?? 0) + delta;
    }
  }
  return reconcileChapterSixRelationshipRewards({
    ...state,
    relationships,
    storyVariables: { ...state.storyVariables, [CHAPTERS_ONE_FIVE_RELATIONSHIP_REVISION]: true },
  });
}
