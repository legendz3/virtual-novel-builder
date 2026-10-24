import type { CSSProperties } from "react";
import { choiceStatCopy } from "@content/choiceStatCopy";
import type { StoryEffect } from "@game/story/story.types";
import "@/styles/choiceStatFeedback.css";

interface ChoiceStatFeedbackProps {
  feedback: { eventId: string; changes: StoryEffect[] } | null;
  paused: boolean;
  onComplete: () => void;
}

// Choices and authored beat rewards share the same transient stat notice.
export function ChoiceStatFeedback({ feedback, paused, onComplete }: ChoiceStatFeedbackProps) {
  return (
    <div className="choice-stat-feedback" role="status" aria-live="polite" aria-atomic="true">
      {feedback && (
        <div
          key={feedback.eventId}
          className="choice-stat-group"
          data-paused={paused}
          aria-hidden={paused || undefined}
          onAnimationEnd={(event) => {
            // Child entrances bubble too; only the group's lifetime clears the notice.
            if (event.target === event.currentTarget) onComplete();
          }}
        >
          {feedback.changes.map((change, index) => (
            <div
              key={change.key}
              className="choice-stat-change"
              data-stat={change.key}
              style={{ "--stat-delay": `${index * 160}ms` } as CSSProperties}
            >
              <span className="choice-stat-symbol" aria-hidden="true">
                {choiceStatCopy[change.key].symbol}
              </span>
              <span className="choice-stat-label">{choiceStatCopy[change.key].label}</span>
              <strong className="choice-stat-delta">
                {change.delta > 0 ? "+" : "−"}
                {Math.abs(change.delta)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
