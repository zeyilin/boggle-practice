import type { GridSize, Position, WordWithPath } from "./types";
import type { Trie } from "./trie";
import { findChild, childOf, isEndEdge } from "./trie";
import { getAdjacentPositions } from "./adjacency";
import { MIN_WORD_LENGTH } from "./constants";

const A = 65; // "A".charCodeAt(0)

/**
 * Solve a Boggle board: find all valid words with their paths.
 *
 * DFS from every cell, walking the DAWG one edge per letter as the path
 * grows, so each step is a single lookup and dead prefixes are pruned
 * immediately. A "Qu" tile steps Q then U.
 * For each word found, stores the first path discovered (start cells in
 * row-major order, neighbors in getAdjacentPositions order).
 */
export function solveBoard(
  board: string[][],
  gridSize: GridSize,
  trie: Trie,
): WordWithPath[] {
  const minLen = MIN_WORD_LENGTH[gridSize];
  const found = new Map<string, Position[]>();

  // Per-cell tables, indexed by r * gridSize + c
  const tiles: string[] = []; // letters the tile contributes ("Qu" -> "QU")
  const codes: number[][] = []; // the same letters as DAWG letter codes
  const neighbors: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const letter = board[r][c];
      const tile = letter === "Qu" ? "QU" : letter;
      tiles.push(tile);
      codes.push(Array.from(tile, (ch) => ch.charCodeAt(0) - A));
      neighbors.push(
        getAdjacentPositions([r, c], gridSize).map(
          ([nr, nc]) => nr * gridSize + nc,
        ),
      );
    }
  }

  const visited = new Uint8Array(gridSize * gridSize);
  const path: number[] = [];

  // Extend the walk ending at `edge` (0 = still at the root) by the letters
  // of `cell`. Returns the new last edge, or -1 if no word continues this way.
  function step(edge: number, cell: number): number {
    for (const letter of codes[cell]) {
      const node = edge === 0 ? trie.root : childOf(trie, edge);
      edge = findChild(trie, node, letter);
      if (edge < 0) return -1;
    }
    return edge;
  }

  function dfs(cell: number, edge: number, length: number) {
    // Check if we have a valid word
    if (length >= minLen && isEndEdge(trie, edge)) {
      const word = path.map((i) => tiles[i]).join("");
      if (!found.has(word)) {
        found.set(
          word,
          path.map((i): Position => [Math.floor(i / gridSize), i % gridSize]),
        );
      }
    }

    // Explore neighbors
    for (const next of neighbors[cell]) {
      if (visited[next]) continue;

      const nextEdge = step(edge, next);
      if (nextEdge < 0) continue;

      visited[next] = 1;
      path.push(next);

      dfs(next, nextEdge, length + codes[next].length);

      path.pop();
      visited[next] = 0;
    }
  }

  // Start DFS from every cell
  for (let cell = 0; cell < gridSize * gridSize; cell++) {
    const edge = step(0, cell);
    if (edge < 0) continue;

    visited[cell] = 1;
    path.push(cell);
    dfs(cell, edge, codes[cell].length);
    path.pop();
    visited[cell] = 0;
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
