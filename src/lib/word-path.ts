import type { Position } from "./types";
import { isAdjacent } from "./adjacency";

/** The letters a tile contributes to a word ("Qu" tiles contribute "QU"). */
export function tileLetters(letter: string): string {
  return letter === "Qu" ? "QU" : letter.toUpperCase();
}

/**
 * Spell the word traced by a path of tiles.
 */
export function pathToWord(board: string[][], path: Position[]): string {
  return path.map(([r, c]) => tileLetters(board[r][c])).join("");
}

/**
 * Whether `next` can extend `path`: adjacent to its last tile and unused.
 * Any tile can start an empty path.
 */
export function canExtendPath(path: Position[], next: Position): boolean {
  if (path.length === 0) return true;
  if (path.some(([r, c]) => r === next[0] && c === next[1])) return false;
  return isAdjacent(path[path.length - 1], next);
}

/**
 * Find a path of adjacent, non-repeating tiles that spells `word`, or null
 * if the word can't be traced on the board. Used to highlight typed words
 * on the grid in real time, so it returns the first path found (DFS from
 * tiles in row-major order).
 */
export function findWordPath(
  board: string[][],
  word: string,
): Position[] | null {
  const target = word.toUpperCase();
  if (target.length === 0) return null;

  const size = board.length;
  const visited = board.map((row) => row.map(() => false));
  const path: Position[] = [];

  function dfs(r: number, c: number, offset: number): boolean {
    const letters = tileLetters(board[r][c]);
    if (!target.startsWith(letters, offset)) return false;

    visited[r][c] = true;
    path.push([r, c]);
    const next = offset + letters.length;
    if (next === target.length) return true;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (visited[nr][nc]) continue;
        if (dfs(nr, nc, next)) return true;
      }
    }

    path.pop();
    visited[r][c] = false;
    return false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (dfs(r, c, 0)) return path;
    }
  }
  return null;
}

/**
 * Apply one edit to the typed word: uppercase letters only, and a trailing
 * Q expands to QU (the Qu tile always represents both letters).
 *
 * `autoExpanded` is the value the previous edit produced if that edit
 * added the U itself (and is returned likewise for the next call). A U
 * typed straight after it is swallowed, so typing Q-U-I-T naturally gives
 * QUIT, not QUUIT — while S-Q-U-U-S-H still gives SQUUSH.
 */
export function applyTypedChange(
  prev: string,
  raw: string,
  autoExpanded: string | null,
): { value: string; autoExpanded: string | null } {
  const letters = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (autoExpanded !== null && prev === autoExpanded && letters === prev + "U") {
    return { value: prev, autoExpanded: null };
  }
  if (letters.endsWith("Q")) {
    const value = letters + "U";
    return { value, autoExpanded: value };
  }
  return { value: letters, autoExpanded: null };
}

/**
 * Delete the last typed letter, treating "QU" as one letter.
 */
export function deleteTypedLetter(value: string): string {
  return value.slice(0, value.endsWith("QU") ? -2 : -1);
}
