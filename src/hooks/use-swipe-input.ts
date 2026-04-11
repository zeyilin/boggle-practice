"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Position } from "@/lib/types";
import { isAdjacent } from "@/lib/adjacency";

interface UseSwipeInputOptions {
  board: string[][];
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

export function useSwipeInput({ board, onSubmit }: UseSwipeInputOptions) {
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const isSwipingRef = useRef(false);
  const pathRef = useRef<Position[]>([]);
  const visitedRef = useRef<Set<string>>(new Set());

  const addTile = useCallback(
    (row: number, col: number) => {
      const key = posKey(row, col);
      const path = pathRef.current;

      // If we're going back to the previous tile, undo
      if (path.length >= 2) {
        const prev = path[path.length - 2];
        if (prev[0] === row && prev[1] === col) {
          const removed = path.pop()!;
          visitedRef.current.delete(posKey(removed[0], removed[1]));
          pathRef.current = [...path];
          setCurrentPath([...path]);
          return;
        }
      }

      // Skip if already visited
      if (visitedRef.current.has(key)) return;

      // Check adjacency with last tile
      const last = path[path.length - 1];
      if (!isAdjacent(last, [row, col])) return;

      path.push([row, col]);
      visitedRef.current.add(key);
      pathRef.current = [...path];
      setCurrentPath([...path]);
    },
    [],
  );

  const startSwipe = useCallback(
    (row: number, col: number) => {
      isSwipingRef.current = true;
      const path: Position[] = [[row, col]];
      pathRef.current = path;
      visitedRef.current = new Set([posKey(row, col)]);
      setCurrentPath(path);
    },
    [],
  );

  const continueSwipe = useCallback(
    (row: number, col: number) => {
      if (!isSwipingRef.current) return;
      addTile(row, col);
    },
    [addTile],
  );

  const endSwipe = useCallback(() => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;

    const path = pathRef.current;
    if (path.length > 0) {
      const word = boardLetterToWord(board, path);
      onSubmit(word, path);
    }

    pathRef.current = [];
    visitedRef.current.clear();
    setCurrentPath([]);
  }, [board, onSubmit]);

  // Use pointermove on document to track finger position over tiles.
  // On touch devices, pointerenter doesn't fire on siblings during a drag,
  // so we use elementFromPoint to detect which tile the pointer is over.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isSwipingRef.current) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      // Find the closest button with an aria-label containing tile info
      const tile = el.closest("button[aria-label^='Tile']");
      if (!tile) return;

      const label = tile.getAttribute("aria-label") ?? "";
      const match = label.match(/row (\d+), column (\d+)/);
      if (!match) return;

      const row = parseInt(match[1], 10) - 1;
      const col = parseInt(match[2], 10) - 1;
      continueSwipe(row, col);
    };

    const handlePointerUp = () => {
      if (isSwipingRef.current) {
        endSwipe();
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [continueSwipe, endSwipe]);

  const cancelSwipe = useCallback(() => {
    isSwipingRef.current = false;
    pathRef.current = [];
    visitedRef.current.clear();
    setCurrentPath([]);
  }, []);

  return {
    currentPath,
    currentWord: boardLetterToWord(board, currentPath),
    handlers: {
      onPointerDown: startSwipe,
      // Keep onPointerEnter for mouse hover (works well on desktop)
      onPointerEnter: continueSwipe,
      onPointerUp: endSwipe,
    },
    cancelSwipe,
  };
}
