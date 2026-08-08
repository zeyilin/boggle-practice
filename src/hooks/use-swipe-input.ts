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

  const addTile = useCallback((row: number, col: number) => {
    const key = posKey(row, col);
    const path = pathRef.current;

    // Dragging back onto the previous tile undoes the last one
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

    if (visitedRef.current.has(key)) return;

    const last = path[path.length - 1];
    if (!isAdjacent(last, [row, col])) return;

    path.push([row, col]);
    visitedRef.current.add(key);
    pathRef.current = [...path];
    setCurrentPath([...path]);
  }, []);

  const startSwipe = useCallback((row: number, col: number) => {
    isSwipingRef.current = true;
    const path: Position[] = [[row, col]];
    pathRef.current = path;
    visitedRef.current = new Set([posKey(row, col)]);
    setCurrentPath(path);
  }, []);

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
    // A single tile can never form a word (min length 3), so a bare
    // tap/click submits nothing instead of flashing "Too short".
    if (path.length >= 2) {
      const word = boardLetterToWord(board, path);
      onSubmit(word, path);
    }

    pathRef.current = [];
    visitedRef.current.clear();
    setCurrentPath([]);
  }, [board, onSubmit]);

  const cancelSwipe = useCallback(() => {
    isSwipingRef.current = false;
    pathRef.current = [];
    visitedRef.current.clear();
    setCurrentPath([]);
  }, []);

  // Track the pointer at the document level. Touch pointers get implicit
  // pointer capture on the tile that received pointerdown, so pointerenter
  // never fires on sibling tiles mid-drag — elementFromPoint is the only
  // reliable way to know which tile the finger is over.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isSwipingRef.current) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const tile = el.closest("button[aria-label^='Tile']");
      if (!tile) return;

      // Only register a tile once the pointer is near its center, so a
      // sloppy diagonal swipe doesn't pick up the orthogonal neighbors
      // it grazes on the way.
      const rect = tile.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) > rect.width * 0.45) {
        return;
      }

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

    // A canceled gesture (browser took over, e.g. for scrolling) discards
    // the trace instead of submitting it.
    const handlePointerCancel = () => {
      if (isSwipingRef.current) {
        cancelSwipe();
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [continueSwipe, endSwipe, cancelSwipe]);

  return {
    currentPath,
    currentWord: boardLetterToWord(board, currentPath),
    handlers: {
      onPointerDown: startSwipe,
      // pointerenter still helps mouse drags between move events
      onPointerEnter: continueSwipe,
      onPointerUp: endSwipe,
    },
    cancelSwipe,
  };
}
