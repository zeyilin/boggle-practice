import type { GridSize } from "./types";
import { DICE_4X4, DICE_5X5 } from "./constants";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a Boggle board by shuffling dice and rolling each one.
 * Returns a 2D array of letters (e.g., "A", "Qu", "S").
 */
export function generateBoard(gridSize: GridSize): string[][] {
  const dice = gridSize === 4 ? DICE_4X4 : DICE_5X5;
  const shuffled = shuffleArray(dice);

  const board: string[][] = [];
  let idx = 0;
  for (let r = 0; r < gridSize; r++) {
    const row: string[] = [];
    for (let c = 0; c < gridSize; c++) {
      const die = shuffled[idx++];
      const face = die[Math.floor(Math.random() * 6)];
      row.push(face);
    }
    board.push(row);
  }
  return board;
}
