import type { ExerciseResult, MeaningChoiceExercise } from "./learning.types";

export function gradeComprehension(
  exercise: MeaningChoiceExercise,
  optionId: string,
): ExerciseResult {
  if (!exercise.options.some((option) => option.id === optionId))
    throw new Error(`Unknown comprehension option: ${optionId}`);
  return {
    exerciseId: exercise.id,
    correct: optionId === exercise.correctOptionId,
    attempts: 1,
    hintsUsed: 0,
  };
}
