export type GridSize = 4 | 5;

export type GameMode = "classic" | "zen" | "review";

export type GamePhase = "idle" | "loading" | "playing" | "paused" | "review";

export type DictionaryName = "twl06" | "sowpods";

export type TouchInputMode = "swipe" | "tap" | "both";

export type ThemeSetting = "light" | "dark" | "system";

export type HintType = "count-by-length" | "first-letter" | "reveal-word";

export type Position = [row: number, col: number];

export interface WordWithPath {
  word: string;
  path: Position[];
}

export type ValidationResult = {
  valid: boolean;
  reason:
    | "accepted"
    | "not-a-word"
    | "too-short"
    | "already-found"
    | "no-path";
  path?: Position[];
};

export interface GameRecord {
  id: string;
  timestamp: number;
  gridSize: GridSize;
  dictionary: DictionaryName;
  board: string[][];
  gameMode: GameMode;
  timerDuration: number | null;
  wordsFound: string[];
  wordsAvailable: WordWithPath[];
  score: number;
  maxScore: number;
  hintsUsed: number;
  elapsedTime: number;
}

export interface ReviewCard {
  id: string;
  gameId: string;
  board: string[][];
  gridSize: GridSize;
  dictionary: DictionaryName;
  easeFactor: number;
  interval: number;
  nextReviewDate: number;
  reviewCount: number;
  bestDiscoveryRate: number;
}

export interface InProgressGame {
  id: "current";
  gameMode: GameMode;
  board: string[][];
  gridSize: GridSize;
  dictionary: DictionaryName;
  wordsFound: string[];
  wordsAvailable: WordWithPath[];
  timerDuration: number | null;
  elapsedTime: number;
  hintsUsed: number;
  reviewCardId: string | null;
  savedAt: number;
}

export interface UserSettings {
  gridSize: GridSize;
  dictionary: DictionaryName;
  timerDuration: number;
  hintsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: ThemeSetting;
  touchInputMode: TouchInputMode;
}

export const DEFAULT_SETTINGS: UserSettings = {
  gridSize: 4,
  dictionary: "twl06",
  timerDuration: 180,
  hintsEnabled: false,
  soundEnabled: true,
  hapticEnabled: true,
  theme: "system",
  touchInputMode: "both",
};
