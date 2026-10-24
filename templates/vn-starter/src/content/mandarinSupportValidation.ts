import type { ChapterDefinition } from "./content.types";
import type { DialogueEvent, StoryEvent } from "../game/story/story.types";

export interface MandarinSupportGraph {
  event: (id: string) => StoryEvent | undefined;
  targets: (event: StoryEvent) => string[];
  hasTerminalBranch: (event: StoryEvent) => boolean;
  reachable: (start: string, target: string, forbidden?: string) => boolean;
  stimuli: ReadonlyMap<string, DialogueEvent>;
}
/** Explicit authoring bindings prove placement and whole-meaning correspondence, never fuzzy prose matching. */
export function validateMandarinSupport(
  chapter: ChapterDefinition,
  graph: MandarinSupportGraph,
): void {
  for (const host of chapter.events) {
    const support = host.mandarinSupport;
    if (!support) continue;
    const fail = (reason: string): never => {
      throw new Error(`Invalid Mandarin support ${host.id}: ${reason}`);
    };
    if (!["dialogue", "narration", "choice"].includes(host.type)) fail("unsupported host kind");
    const source = graph.event(support.sourceEventId);
    if (source?.type !== "dialogue" || !source.mandarin || source.mandarin.mode === "supported")
      fail("source must be a reduced-support dialogue");
    // Type narrowing remains local because fail's closure is not a TS control-flow assertion.
    if (source?.type !== "dialogue" || !source.mandarin || source.mandarin.mode === "supported")
      continue;
    if (!source.mandarin.reveal.eventIds.includes(host.id))
      fail("source and host reveal must be reciprocal");
    if (support.kind === "natural-meaning") {
      const text =
        host.type === "choice"
          ? host.prompt
          : host.type === "dialogue" || host.type === "narration"
            ? host.text
            : undefined;
      const field = host.type === "choice" ? "prompt" : "text";
      if (support.english.field !== field || !text || !support.english.exactSpan.trim())
        fail("wrong natural English field");
      if (text!.split(support.english.exactSpan).length !== 2)
        fail("natural English span must occur exactly once");
      if (host.type === "dialogue" && host.mandarin)
        fail("natural support cannot compete with a canonical Mandarin body");
    }
    const placement = support.placement;
    if (placement.kind === "resolved-answer") {
      const assessment = graph.event(placement.assessmentEventId);
      if (
        assessment?.type !== "comprehension" ||
        graph.stimuli.get(assessment.id)?.id !== source.id
      )
        fail("resolved answer requires its matching assessment stimulus");
      if (assessment?.type !== "comprehension") continue;
      if (placement.outcome === "incorrect" && assessment.exercise.retryHint)
        fail("retry has no resolved incorrect destination");
      const dispatch = placement.viaChoiceRoute;
      if (dispatch) {
        if (placement.outcome !== "incorrect") fail("routed support requires an incorrect outcome");
        const route = graph.event(dispatch.eventId);
        if (
          dispatch.eventId !== assessment.incorrectEventId ||
          route?.type !== "choice_route" ||
          route.choiceEventId !== assessment.id ||
          (route.sourceChapterId !== undefined && route.sourceChapterId !== chapter.id)
        )
          fail("routed support requires the exact local assessment dispatcher");
        if (route?.type !== "choice_route") continue;
        const wrongOptions = assessment.exercise.options
          .filter((option) => option.id !== assessment.exercise.correctOptionId)
          .map((option) => option.id);
        if (
          !wrongOptions.includes(dispatch.optionId) ||
          route.cases[dispatch.optionId] !== host.id ||
          Object.keys(route.cases).length !== wrongOptions.length ||
          !wrongOptions.every((optionId) => Object.hasOwn(route.cases, optionId))
        )
          fail("routed support requires every exact wrong option and its direct host");
        if (
          dispatch.defaultEventId !== route.defaultEventId ||
          !Object.values(route.cases).includes(route.defaultEventId)
        )
          fail("routed support default must be an exact direct wrong-case host");
        // Inspect all destinations, including the default, without following arbitrary graph hops.
        for (const optionId of wrongOptions) {
          const target = graph.event(route.cases[optionId]!);
          const binding = target?.mandarinSupport;
          const targetPlacement = binding?.placement;
          if (
            !target ||
            !["narration", "dialogue", "choice"].includes(target.type) ||
            binding?.sourceEventId !== source.id ||
            !source.mandarin.reveal.eventIds.includes(target.id) ||
            targetPlacement?.kind !== "resolved-answer" ||
            targetPlacement.assessmentEventId !== assessment.id ||
            targetPlacement.outcome !== "incorrect" ||
            targetPlacement.viaChoiceRoute?.eventId !== route.id ||
            targetPlacement.viaChoiceRoute.optionId !== optionId ||
            targetPlacement.viaChoiceRoute.defaultEventId !== route.defaultEventId
          )
            fail("routed support target must carry its exact reciprocal direct outcome binding");
        }
      } else if (
        host.id !==
        (placement.outcome === "correct" ? assessment.correctEventId : assessment.incorrectEventId)
      )
        fail("resolved answer must be the immediate outcome destination");
      if (graph.reachable(source.id, host.id, assessment.id))
        fail("support bypasses assessment resolution");
    } else {
      const sequence = [source.id, ...placement.interveningEventIds, host.id];
      if (new Set(sequence).size !== sequence.length) fail("placement path repeats an event");
      for (let index = 0; index < sequence.length - 1; index++) {
        const event = graph.event(sequence[index]!);
        if (
          !event ||
          ["comprehension", "choice", "phrase_construction", "chapter_end"].includes(event.type)
        )
          fail("placement path has missing or interrupting event");
        const targets = graph.targets(event!);
        if (
          graph.hasTerminalBranch(event!) ||
          targets.length !== 1 ||
          targets[0] !== sequence[index + 1]
        )
          fail("placement path must be exact and contiguous");
      }
    }
    if (support.kind !== "question-context" || !support.alreadySupportedOutcome) continue;
    const prior = support.alreadySupportedOutcome;
    const assessment = graph.event(prior.assessmentEventId);
    const repeat = graph.event(prior.supportEventId);
    if (
      placement.kind !== "resolved-answer" ||
      placement.assessmentEventId !== prior.assessmentEventId ||
      placement.outcome !== "correct" ||
      assessment?.type !== "comprehension" ||
      assessment.exercise.retryHint ||
      !assessment.exercise.options.some((option) => option.id === prior.optionId) ||
      prior.optionId === assessment.exercise.correctOptionId
    )
      fail("deduplication requires an exact resolved wrong option");
    if (assessment?.type !== "comprehension") continue;
    if (
      repeat?.type !== "dialogue" ||
      repeat.mandarin?.mode !== "supported" ||
      JSON.stringify(repeat.mandarin.segments) !== JSON.stringify(source.mandarin.segments)
    )
      fail("deduplication requires an exact fully supported repeat");
    const pending = [assessment.incorrectEventId];
    const visited = new Set<string>();
    if (graph.reachable(assessment.incorrectEventId, host.id, prior.supportEventId))
      fail("wrong route bypasses supported repeat");
    // Every wrong-route branch must reach the shared host; terminal/closed-cycle branches cannot justify suppression.
    while (pending.length) {
      const id = pending.pop()!;
      if (id === host.id || visited.has(id)) continue;
      visited.add(id);
      const event = graph.event(id);
      if (
        !event ||
        graph.hasTerminalBranch(event) ||
        !graph.reachable(id, host.id) ||
        !graph.targets(event).length
      )
        fail("wrong route cannot complete supported merge");
      pending.push(...graph.targets(event!));
    }
  }
}
