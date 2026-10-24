import type { StoryEvent } from "../story/story.types";
import type { MandarinSegment, MandarinSupport } from "./mandarin.types";

export type ResolvedMandarinSupport = MandarinSupport & {
  sourceCharacterId: string;
  segments: readonly MandarinSegment[];
};
export interface MandarinSupportSession {
  chapterId: string;
  advancedEventIds: ReadonlySet<string>;
}

/** The caller proves rendered/store/engine agreement and a successful advance; this helper records only full dialogue support. */
export function recordAdvancedMandarinSupport(
  session: MandarinSupportSession | undefined,
  chapterId: string,
  outgoing: StoryEvent,
): MandarinSupportSession | undefined {
  if (outgoing.type !== "dialogue" || outgoing.mandarin?.mode !== "supported") return session;
  const ids = session?.chapterId === chapterId ? session.advancedEventIds : [];
  return { chapterId, advancedEventIds: new Set([...ids, outgoing.id]) };
}

/** Saved answers alone cannot prove support exposure in historical content; absent session evidence keeps context visible. */
export function resolveMandarinSupport(
  events: readonly StoryEvent[],
  host: StoryEvent | undefined,
  choices: Readonly<Record<string, string>> = {},
  exposure?: { chapterId: string; session: MandarinSupportSession | undefined },
): ResolvedMandarinSupport | undefined {
  const support = host?.mandarinSupport;
  if (!support) return undefined;
  if (support.kind === "question-context" && support.alreadySupportedOutcome) {
    const prior = support.alreadySupportedOutcome;
    if (
      choices[prior.assessmentEventId] === prior.optionId &&
      exposure?.session?.chapterId === exposure?.chapterId &&
      exposure?.session?.advancedEventIds.has(prior.supportEventId)
    )
      return undefined;
  }
  const source = events.find((event) => event.id === support.sourceEventId);
  if (source?.type !== "dialogue" || !source.mandarin)
    throw new Error(`Missing Mandarin support source: ${support.sourceEventId}`);
  return { ...support, sourceCharacterId: source.characterId, segments: source.mandarin.segments };
}
