import { create } from "zustand";
import type {
  GameMode,
  GamePhase,
  GridSize,
  DictionaryName,
  WordWithPath,
  ValidationResult,
  GameRecord,
  InProgressGame,
  Position,
} from "@/lib/types";
import { scoreWord, calculateScore, calculateMaxScore } from "@/lib/scoring";
import { MIN_WORD_LENGTH } from "@/lib/constants";
import { findWordPath } from "@/lib/word-path";
import {
  saveGameRecord,
  saveInProgressGame,
  clearInProgressGame,
} from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface GameState {
  // Game config
  gameMode: GameMode;
  gridSize: GridSize;
  dictionary: DictionaryName;
  timerDuration: number | null;

  // Board state
  board: string[][];
  wordsAvailable: WordWithPath[];

  // Play state
  phase: GamePhase;
  wordsFound: string[];
  score: number;
  elapsedTime: number;
  hintsUsed: number;
  currentWord: string;
  currentPath: Position[];
  lastSubmitResult: ValidationResult | null;

  // Review mode
  reviewCardId: string | null;

  // Completed game record (set after game ends)
  completedRecord: GameRecord | null;
}

interface GameActions {
  startGame: (config: {
    gameMode: GameMode;
    gridSize: GridSize;
    dictionary: DictionaryName;
    timerDuration: number | null;
    board: string[][];
    wordsAvailable: WordWithPath[];
    reviewCardId?: string;
  }) => void;

  resumeGame: (saved: InProgressGame) => void;

  submitWord: (word: string) => ValidationResult;

  setCurrentWord: (word: string) => void;
  setCurrentPath: (path: Position[]) => void;
  clearCurrentWord: () => void;

  tick: () => void;
  endGame: () => void;
  useHint: () => void;

  reset: () => void;
  autoSave: () => void;
}

const initialState: GameState = {
  gameMode: "classic",
  gridSize: 4,
  dictionary: "twl06",
  timerDuration: null,
  board: [],
  wordsAvailable: [],
  phase: "idle",
  wordsFound: [],
  score: 0,
  elapsedTime: 0,
  hintsUsed: 0,
  currentWord: "",
  currentPath: [],
  lastSubmitResult: null,
  reviewCardId: null,
  completedRecord: null,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: (config) => {
    set({
      ...initialState,
      gameMode: config.gameMode,
      gridSize: config.gridSize,
      dictionary: config.dictionary,
      timerDuration: config.timerDuration,
      board: config.board,
      wordsAvailable: config.wordsAvailable,
      reviewCardId: config.reviewCardId ?? null,
      phase: "playing",
    });
  },

  resumeGame: (saved) => {
    set({
      ...initialState,
      gameMode: saved.gameMode,
      gridSize: saved.gridSize,
      dictionary: saved.dictionary,
      timerDuration: saved.timerDuration,
      board: saved.board,
      wordsAvailable: saved.wordsAvailable,
      wordsFound: saved.wordsFound,
      score: calculateScore(saved.wordsFound, saved.gridSize),
      elapsedTime: saved.elapsedTime,
      hintsUsed: saved.hintsUsed,
      reviewCardId: saved.reviewCardId,
      phase: "playing",
    });
  },

  submitWord: (word: string): ValidationResult => {
    const state = get();
    const normalized = word.toUpperCase();
    const minLen = MIN_WORD_LENGTH[state.gridSize];

    // Check minimum length
    if (normalized.length < minLen) {
      const result: ValidationResult = { valid: false, reason: "too-short" };
      set({ lastSubmitResult: result, currentWord: "", currentPath: [] });
      return result;
    }

    // Check already found
    if (state.wordsFound.includes(normalized)) {
      const result: ValidationResult = {
        valid: false,
        reason: "already-found",
      };
      set({ lastSubmitResult: result, currentWord: "", currentPath: [] });
      return result;
    }

    // Check if word is in the available words
    const match = state.wordsAvailable.find((w) => w.word === normalized);

    if (!match) {
      // Typed words may not be traceable at all; say which it is
      const result: ValidationResult = {
        valid: false,
        reason: findWordPath(state.board, normalized) ? "not-a-word" : "no-path",
      };
      set({ lastSubmitResult: result, currentWord: "", currentPath: [] });
      return result;
    }

    // Valid word!
    const newFound = [...state.wordsFound, normalized];
    const points = scoreWord(normalized, state.gridSize);
    const result: ValidationResult = {
      valid: true,
      reason: "accepted",
      path: match.path,
    };

    set({
      wordsFound: newFound,
      score: state.score + points,
      lastSubmitResult: result,
      currentWord: "",
      currentPath: [],
    });

    return result;
  },

  setCurrentWord: (word) => set({ currentWord: word }),
  setCurrentPath: (path) => set({ currentPath: path }),
  clearCurrentWord: () => set({ currentWord: "", currentPath: [] }),

  tick: () => {
    const state = get();
    if (state.phase !== "playing") return;

    const newElapsed = state.elapsedTime + 1;
    set({ elapsedTime: newElapsed });

    // Check if timer expired (classic mode)
    if (
      state.timerDuration !== null &&
      newElapsed >= state.timerDuration
    ) {
      get().endGame();
    }
  },

  endGame: () => {
    const state = get();
    if (state.phase !== "playing") return;

    const maxScore = calculateMaxScore(state.wordsAvailable, state.gridSize);

    const record: GameRecord = {
      id: uuidv4(),
      timestamp: Date.now(),
      gridSize: state.gridSize,
      dictionary: state.dictionary,
      board: state.board,
      gameMode: state.gameMode,
      timerDuration: state.timerDuration,
      wordsFound: state.wordsFound,
      wordsAvailable: state.wordsAvailable,
      score: state.score,
      maxScore,
      hintsUsed: state.hintsUsed,
      elapsedTime: state.elapsedTime,
    };

    set({ phase: "review", completedRecord: record });

    // Persist to IDB
    saveGameRecord(record).catch(console.error);
    clearInProgressGame().catch(console.error);
  },

  useHint: () => {
    set((state) => ({ hintsUsed: state.hintsUsed + 1 }));
  },

  reset: () => {
    set(initialState);
    clearInProgressGame().catch(console.error);
  },

  autoSave: () => {
    const state = get();
    if (state.phase !== "playing") return;

    const inProgress: InProgressGame = {
      id: "current",
      gameMode: state.gameMode,
      board: state.board,
      gridSize: state.gridSize,
      dictionary: state.dictionary,
      wordsFound: state.wordsFound,
      wordsAvailable: state.wordsAvailable,
      timerDuration: state.timerDuration,
      elapsedTime: state.elapsedTime,
      hintsUsed: state.hintsUsed,
      reviewCardId: state.reviewCardId,
      savedAt: Date.now(),
    };

    saveInProgressGame(inProgress).catch(console.error);
  },
}));
