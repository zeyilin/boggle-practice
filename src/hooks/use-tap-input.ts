"use client";

import { useState, useCallback } from "react";
import type { Position, GridSize } from "@/lib/types";
import { isAdjacent } from "@/lib/adjacency";

interface UseTapInputOptions {
  board: string[][];
  gridSize: GridSize;
  onSubmit: (word: string, path: Position[]) => void;
}

function posKey(r: number, c: number) {
  return `${r},${c}`;
}

function boardLetterToWord(board: string[][], path: Position[]): string {
  return path
    .map(([r, c]) => {
      const letter = board[r][c];
      return letter === "Qu" ? "QU" : letter;
    })
    .join("");
}

export function useTapInput({ board, gridSize, onSubmit }: UseTapInputOptions) {
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  const tapTile = useCallback(
    (row: number, col: number) => {
      setCurrentPath((prev) => {
        const key = posKey(row, col);

        // If tapping the last tile in the path, undo it
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          if (last[0] === row && last[1] === col) {
            return prev.slice(0, -1);
          }
        }

        // Check if already in path
        if (prev.some(([r, c]) => posKey(r, c) === key)) return prev;

        // First tile — always valid
        if (prev.length === 0) return [[row, col]];

        // Check adjacency
        const last = prev[prev.length - 1];
        if (!isAdjacent(last, [row, col])) return prev;

        return [...prev, [row, col]];
      });
    },
    [],
  );

  const submit = useCallback(() => {
    if (currentPath.length === 0) return;
    const word = boardLetterToWord(board, currentPath);
    onSubmit(word, currentPath);
    setCurrentPath([]);
  }, [board, currentPath, onSubmit]);

  const clear = useCallback(() => {
    setCurrentPath([]);
  }, []);

  // Compute which tiles are valid next targets
  const getValidTiles = useCallback((): Set<string> => {
    if (currentPath.length === 0) {
      // All tiles are valid for first tap
      const all = new Set<string>();
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          all.add(posKey(r, c));
        }
      }
      return all;
    }

    const last = currentPath[currentPath.length - 1];
    const visited = new Set(currentPath.map(([r, c]) => posKey(r, c)));
    const valid = new Set<string>();

    // Adjacent unvisited tiles + the last tile (for undo)
    valid.add(posKey(last[0], last[1]));

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = last[0] + dr;
        const nc = last[1] + dc;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
          const k = posKey(nr, nc);
          if (!visited.has(k)) valid.add(k);
        }
      }
    }

    return valid;
  }, [currentPath, gridSize]);

  return {
    currentPath,
    currentWord: boardLetterToWord(board, currentPath),
    validTiles: getValidTiles(),
    handlers: {
      onPointerDown: tapTile,
    },
    submit,
    clear,
  };
}
