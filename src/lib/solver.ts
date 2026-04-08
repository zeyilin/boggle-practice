import type { GridSize, Position, WordWithPath } from "./types";
import type { Trie } from "./trie";
import { isWord, isPrefix } from "./trie";
import { getAdjacentPositions } from "./adjacency";
import { MIN_WORD_LENGTH } from "./constants";

/**
 * Solve a Boggle board: find all valid words with their paths.
 *
 * Uses DFS from every cell with Trie prefix pruning.
 * For each word found, stores the shortest/first path discovered.
 */
export function solveBoard(
  board: string[][],
  gridSize: GridSize,
  trie: Trie,
): WordWithPath[] {
  const minLen = MIN_WORD_LENGTH[gridSize];
  const found = new Map<string, Position[]>();
  const visited: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false),
  );

  function dfs(r: number, c: number, path: Position[], prefix: string) {
    // Check if prefix is valid in trie
    if (!isPrefix(trie, prefix)) return;

    // Check if we have a valid word
    if (prefix.length >= minLen && isWord(trie, prefix)) {
      if (!found.has(prefix)) {
        found.set(prefix, [...path]);
      }
    }

    // Explore neighbors
    const neighbors = getAdjacentPositions([r, c], gridSize);
    for (const [nr, nc] of neighbors) {
      if (visited[nr][nc]) continue;

      const letter = board[nr][nc];
      // "Qu" tile contributes "QU" to the prefix
      const addition = letter === "Qu" ? "QU" : letter;

      visited[nr][nc] = true;
      path.push([nr, nc]);

      dfs(nr, nc, path, prefix + addition);

      path.pop();
      visited[nr][nc] = false;
    }
  }

  // Start DFS from every cell
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const letter = board[r][c];
      const start = letter === "Qu" ? "QU" : letter;

      visited[r][c] = true;
      dfs(r, c, [[r, c]], start);
      visited[r][c] = false;
    }
  }

  // Convert map to sorted array
  const results: WordWithPath[] = [];
  for (const [word, path] of found) {
    results.push({ word, path });
  }

  // Sort by word length descending, then alphabetically
  results.sort((a, b) => {
    if (b.word.length !== a.word.length) return b.word.length - a.word.length;
    return a.word.localeCompare(b.word);
  });

  return results;
}
