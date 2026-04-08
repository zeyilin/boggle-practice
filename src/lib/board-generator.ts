import type { GridSize, WordWithPath } from "./types";
import { generateBoard } from "./dice";
import { MAX_REROLL_ATTEMPTS, MIN_WORDS_THRESHOLD } from "./constants";
import { getDictionaryAPI } from "./dictionary-api";

export interface GeneratedBoard {
  board: string[][];
  wordsAvailable: WordWithPath[];
}

/**
 * Generate a valid Boggle board with a minimum number of words.
 * Re-rolls up to MAX_REROLL_ATTEMPTS times if the board is too sparse.
 */
export async function generateValidBoard(
  gridSize: GridSize,
): Promise<GeneratedBoard> {
  const api = getDictionaryAPI();
  const threshold = MIN_WORDS_THRESHOLD[gridSize];

  for (let attempt = 0; attempt < MAX_REROLL_ATTEMPTS; attempt++) {
    const board = generateBoard(gridSize);
    const wordsAvailable = await api.solve(board, gridSize);

    if (wordsAvailable.length >= threshold || attempt === MAX_REROLL_ATTEMPTS - 1) {
      return { board, wordsAvailable };
    }
  }

  // Should never reach here due to the check above, but TypeScript needs it
  const board = generateBoard(gridSize);
  const wordsAvailable = await api.solve(board, gridSize);
  return { board, wordsAvailable };
}
