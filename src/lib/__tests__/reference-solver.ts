/**
 * Test-only reference implementation: the original Map-per-node Trie and
 * string-prefix DFS solver, kept verbatim so the packed DAWG + incremental
 * solver can be checked for identical output (see solver-equivalence.test.ts).
 *
 * Not imported by app code. Don't "optimize" this file — its value is that
 * it is the known-good behavior.
 */

import type { GridSize, Position, WordWithPath } from "../types";
import { getAdjacentPositions } from "../adjacency";
import { MIN_WORD_LENGTH } from "../constants";

export interface RefTrieNode {
  children: Map<string, RefTrieNode>;
  end: boolean;
}

export interface RefTrie {
  root: RefTrieNode;
  wordCount: number;
}

function createNode(): RefTrieNode {
  return { children: new Map(), end: false };
}

/**
 * Build a Trie from an array of uppercase words.
 */
export function refBuildTrie(words: string[]): RefTrie {
  const root = createNode();
  let wordCount = 0;

  for (const word of words) {
    let node = root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = createNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    if (!node.end) {
      node.end = true;
      wordCount++;
    }
  }

  return { root, wordCount };
}

/**
 * Check if the trie contains the exact word.
 */
export function refIsWord(trie: RefTrie, word: string): boolean {
  let node = trie.root;
  for (const ch of word) {
    const child = node.children.get(ch);
    if (!child) return false;
    node = child;
  }
  return node.end;
}

/**
 * Check if any word in the trie starts with the given prefix.
 */
export function refIsPrefix(trie: RefTrie, prefix: string): boolean {
  let node = trie.root;
  for (const ch of prefix) {
    const child = node.children.get(ch);
    if (!child) return false;
    node = child;
  }
  return true;
}

/**
 * Solve a Boggle board: find all valid words with their paths.
 *
 * Uses DFS from every cell with Trie prefix pruning.
 * For each word found, stores the shortest/first path discovered.
 */
export function refSolveBoard(
  board: string[][],
  gridSize: GridSize,
  trie: RefTrie,
): WordWithPath[] {
  const minLen = MIN_WORD_LENGTH[gridSize];
  const found = new Map<string, Position[]>();
  const visited: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false),
  );

  function dfs(r: number, c: number, path: Position[], prefix: string) {
    // Check if prefix is valid in trie
    if (!refIsPrefix(trie, prefix)) return;

    // Check if we have a valid word
    if (prefix.length >= minLen && refIsWord(trie, prefix)) {
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
