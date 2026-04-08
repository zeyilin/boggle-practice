import type { GridSize } from "./types";

// Official Boggle 4x4 dice (16 dice, 6 faces each)
export const DICE_4X4: string[][] = [
  ["A", "A", "E", "E", "G", "N"],
  ["A", "B", "B", "J", "O", "O"],
  ["A", "C", "H", "O", "P", "S"],
  ["A", "F", "F", "K", "P", "S"],
  ["A", "O", "O", "T", "T", "W"],
  ["C", "I", "M", "O", "T", "U"],
  ["D", "E", "I", "L", "R", "X"],
  ["D", "E", "L", "R", "V", "Y"],
  ["D", "I", "S", "T", "T", "Y"],
  ["E", "E", "G", "H", "N", "W"],
  ["E", "E", "I", "N", "S", "U"],
  ["E", "H", "R", "T", "V", "W"],
  ["E", "I", "O", "S", "S", "T"],
  ["E", "L", "R", "T", "T", "Y"],
  ["H", "I", "M", "N", "Qu", "U"],
  ["H", "L", "N", "N", "R", "Z"],
];

// Official Big Boggle 5x5 dice (25 dice, 6 faces each)
export const DICE_5X5: string[][] = [
  ["A", "A", "A", "F", "R", "S"],
  ["A", "A", "E", "E", "E", "E"],
  ["A", "A", "F", "I", "R", "S"],
  ["A", "D", "E", "N", "N", "N"],
  ["A", "E", "E", "E", "E", "M"],
  ["A", "E", "E", "G", "M", "U"],
  ["A", "E", "G", "M", "N", "N"],
  ["A", "F", "I", "R", "S", "Y"],
  ["B", "J", "K", "Qu", "X", "Z"],
  ["C", "C", "E", "N", "S", "T"],
  ["C", "E", "I", "I", "L", "T"],
  ["C", "E", "I", "L", "P", "T"],
  ["C", "E", "I", "P", "S", "T"],
  ["D", "D", "H", "N", "O", "T"],
  ["D", "H", "H", "L", "O", "R"],
  ["D", "H", "L", "N", "O", "R"],
  ["E", "I", "I", "I", "T", "T"],
  ["E", "M", "O", "T", "T", "T"],
  ["E", "N", "S", "S", "S", "U"],
  ["F", "I", "P", "R", "S", "Y"],
  ["G", "O", "R", "R", "V", "W"],
  ["I", "P", "R", "R", "R", "Y"],
  ["N", "O", "O", "T", "U", "W"],
  ["O", "O", "O", "T", "T", "U"],
  ["H", "L", "N", "N", "R", "Z"],
];

// Standard Boggle scoring by word length
export const SCORING_TABLE: Record<number, number> = {
  3: 1,
  4: 1,
  5: 2,
  6: 3,
  7: 5,
};
// 8+ letters = 11 points (handled in scoreWord)

export const SCORE_8_PLUS = 11;

// Minimum word length per grid size
export const MIN_WORD_LENGTH: Record<GridSize, number> = {
  4: 3,
  5: 4,
};

// Board generation: minimum number of valid words before accepting the board
export const MIN_WORDS_THRESHOLD: Record<GridSize, number> = {
  4: 20,
  5: 40,
};

export const MAX_REROLL_ATTEMPTS = 10;

// Timer
export const DEFAULT_TIMER_DURATION = 180; // 3 minutes in seconds
export const MIN_TIMER_DURATION = 60;
export const MAX_TIMER_DURATION = 600;
export const TIMER_STEP = 30;

// Hints
export const MAX_HINTS_CLASSIC = 3;

// Review mode thresholds
export const REVIEW_ADD_THRESHOLD = 0.4; // Add to review if discovery < 40%
export const REVIEW_INTERVALS: [number, number][] = [
  [0.3, 1],   // < 30% -> 1 day
  [0.5, 3],   // 30-50% -> 3 days
  [0.7, 7],   // 50-70% -> 7 days
];
export const REVIEW_GRADUATE_THRESHOLD = 0.7;

// Auto-save interval in Classic mode (milliseconds)
export const AUTO_SAVE_INTERVAL = 5000;
