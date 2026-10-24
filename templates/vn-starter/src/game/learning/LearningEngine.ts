import type { ExerciseDefinition, ExerciseResult } from "./learning.types";
// Grading and mastery rules are intentionally left to chapter implementation.
export class LearningEngine {
  private exercise: ExerciseDefinition | null = null;
  load(exercise: ExerciseDefinition): void {
    this.exercise = exercise;
  }
  current(): ExerciseDefinition | null {
    return this.exercise;
  }
  recordResult(result: ExerciseResult): ExerciseResult {
    if (!this.exercise || result.exerciseId !== this.exercise.id)
      throw new Error("Result does not match the active exercise");
    if (
      !Number.isInteger(result.attempts) ||
      result.attempts < 1 ||
      !Number.isInteger(result.hintsUsed) ||
      result.hintsUsed < 0
    )
      throw new Error("Invalid exercise result");
    return { ...result };
  }
  reset(): void {
    this.exercise = null;
  }
}
