import type { GridSize, WordWithPath } from "./types";

// Messages sent TO the worker
export type WorkerRequest =
  | { type: "load"; dictionary: string }
  | { type: "solve"; board: string[][]; gridSize: GridSize }
  | { type: "isWord"; word: string }
  | { type: "isPrefix"; prefix: string };

// Messages sent FROM the worker
export type WorkerResponse =
  | { type: "loaded"; wordCount: number }
  | { type: "load-error"; error: string }
  | { type: "solved"; words: WordWithPath[] }
  | { type: "isWord"; result: boolean }
  | { type: "isPrefix"; result: boolean }
  | { type: "error"; error: string };
