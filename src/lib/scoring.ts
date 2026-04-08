import type { GridSize } from "./types";
import { SCORING_TABLE, SCORE_8_PLUS, MIN_WORD_LENGTH } from "./constants";

/**
 * Score a single word by its length.
 * "Qu" on the board counts as 2 letters in the word.
 */
export function scoreWord(word: string, gridSize: GridSize): number {
  const len = word.length;
  const minLen = MIN_WORD_LENGTH[gridSize];
  if (len < minLen) return 0;
  if (len >= 8) return SCORE_8_PLUS;
  return SCORING_TABLE[len] ?? 0;
}

/**
 * Calculate total score for a list of found words.
 */
export function calculateScore(words: string[], gridSize: GridSize): number {
  return words.reduce((sum, w) => sum + scoreWord(w, gridSize), 0);
}

/**
 * Calculate the maximum possible score for all available words.
 */
export function calculateMaxScore(
  words: { word: string }[],
  gridSize: GridSize,
): number {
  return words.reduce((sum, w) => sum + scoreWord(w.word, gridSize), 0);
}
