"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Position } from "@/lib/types";
import { canExtendPath, pathToWord } from "@/lib/word-path";

interface UseBoardInputOptions {
  board: string[][];
  /** Drag across tiles to trace a word; releasing submits it. */
  swipe: boolean;
  /** Tap tiles one at a time to spell a word; `submit()` submits it. */
  tap: boolean;
  onSubmit: (word: string, path: Position[]) => void;
  /** A new word was started on the board (e.g. to clear typed text). */
  onStart?: () => void;
  /** A tile joined the path under a finger or mouse (e.g. for haptics). */
  onTileAdded?: () => void;
}

interface Gesture {
  pointerId: number;
  /** The path before this press, restored if the press is abandoned. */
  before: Position[];
  /** Tile the press started on. */
  start: Position;
  /** The pointer traced onto at least one other tile: a swipe. */
  moved: boolean;
  /** Pressed the last tile of a tapped word: undo it on release (a tap). */
  undoOnRelease: boolean;
  /** Pressed a tile that can't continue the tapped word: a new word if
   *  dragged, ignored if just tapped (so a mis-tap never loses the word). */
  restart: boolean;
}

function samePos(a: Position | undefined, b: Position): boolean {
  return !!a && a[0] === b[0] && a[1] === b[1];
}

/**
 * Pointer and keyboard input for the board, shared by touch, mouse, and pen.
 *
 * One press is classified by what it does, not by timing or distance: a
 * press that traces onto another tile is a swipe (submits on release); a
 * press that stays on its tile is a tap (tap-to-spell). With both enabled,
 * the two mix freely — tap a few letters, then drag to finish the word.
 *
 * Geometry-free: tiles report pointerdown themselves, and moves are
 * hit-tested against `[data-tile]` elements, so board size never matters.
 */
export function useBoardInput(options: UseBoardInputOptions) {
  const [path, setPathState] = useState<Position[]>([]);
  const [tracing, setTracing] = useState(false);
  const pathRef = useRef<Position[]>([]);
  const gestureRef = useRef<Gesture | null>(null);

  // Latest options for the document-level listeners, which subscribe once.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const setPath = useCallback((next: Position[]) => {
    pathRef.current = next;
    setPathState(next);
  }, []);

  const submit = useCallback((): boolean => {
    const current = pathRef.current;
    if (current.length === 0) return false;
    setPath([]);
    optionsRef.current.onSubmit(
      pathToWord(optionsRef.current.board, current),
      current,
    );
    return true;
  }, [setPath]);

  const clear = useCallback(() => {
    gestureRef.current = null;
    setTracing(false);
    // Called on every typed letter: skip the re-render when already empty
    if (pathRef.current.length > 0) setPath([]);
  }, [setPath]);

  /** Remove the last tile. Returns false if there was nothing to undo. */
  const undo = useCallback((): boolean => {
    if (gestureRef.current || pathRef.current.length === 0) return false;
    setPath(pathRef.current.slice(0, -1));
    return true;
  }, [setPath]);

  const pointerDown = useCallback(
    (row: number, col: number, pointerId: number) => {
      // Ignore extra fingers while one is already tracing
      if (gestureRef.current) return;
      const { swipe, tap, onStart, onTileAdded } = optionsRef.current;
      const before = pathRef.current;
      const tile: Position = [row, col];
      const gesture: Gesture = {
        pointerId,
        before,
        start: tile,
        moved: false,
        undoOnRelease: false,
        restart: false,
      };

      if (before.length > 0 && tap) {
        if (samePos(before[before.length - 1], tile)) {
          gesture.undoOnRelease = true;
        } else if (canExtendPath(before, tile)) {
          setPath([...before, tile]);
          onTileAdded?.();
        } else if (swipe) {
          gesture.restart = true;
        } else {
          return; // tap-only: not a valid next tile (it's shown dimmed)
        }
      } else {
        onStart?.();
        setPath([tile]);
        onTileAdded?.();
      }

      gestureRef.current = gesture;
      setTracing(true);
    },
    [setPath],
  );

  const moveOnto = useCallback(
    (row: number, col: number) => {
      const gesture = gestureRef.current;
      if (!gesture || !optionsRef.current.swipe) return;
      const tile: Position = [row, col];
      const current =
        gesture.restart && !gesture.moved ? [gesture.start] : pathRef.current;
      const last = current[current.length - 1];
      if (samePos(last, tile)) return;

      // Dragging back onto the previous tile undoes the last one
      if (samePos(current[current.length - 2], tile)) {
        gesture.moved = true;
        gesture.undoOnRelease = false;
        setPath(current.slice(0, -1));
        return;
      }

      if (!canExtendPath(current, tile)) return;
      if (gesture.restart && !gesture.moved) optionsRef.current.onStart?.();
      gesture.moved = true;
      gesture.undoOnRelease = false;
      setPath([...current, tile]);
      optionsRef.current.onTileAdded?.();
    },
    [setPath],
  );

  const pointerUp = useCallback(() => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gestureRef.current = null;
    setTracing(false);

    if (gesture.moved) {
      // A swipe: submit what was traced. A single tile can never form a
      // word (min length 3), so it's dropped instead of flashing "Too short".
      if (pathRef.current.length >= 2) submit();
      else setPath([]);
      return;
    }

    // A tap
    if (!optionsRef.current.tap) setPath([]);
    else if (gesture.undoOnRelease) setPath(gesture.before.slice(0, -1));
    else if (gesture.restart) setPath(gesture.before);
    // otherwise keep the tile added on press
  }, [setPath, submit]);

  const pointerCancel = useCallback(() => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    // The browser took over the gesture: discard it rather than submit
    gestureRef.current = null;
    setTracing(false);
    setPath(gesture.before);
  }, [setPath]);

  /**
   * Keyboard: select a tile (tap-to-spell rules). Enter on the last tile
   * submits the word; Space on it undoes it.
   */
  const activate = useCallback(
    (row: number, col: number, submitIfLast: boolean) => {
      if (gestureRef.current) return;
      const current = pathRef.current;
      const tile: Position = [row, col];
      if (samePos(current[current.length - 1], tile)) {
        if (submitIfLast) submit();
        else setPath(current.slice(0, -1));
        return;
      }
      if (!canExtendPath(current, tile)) return;
      if (current.length === 0) optionsRef.current.onStart?.();
      setPath([...current, tile]);
    },
    [setPath, submit],
  );

  // Track the pointer at the document level. Touch pointers get implicit
  // pointer capture on the tile that received pointerdown, so pointerenter
  // never fires on sibling tiles mid-drag — elementFromPoint is the only
  // reliable way to know which tile the finger is over.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || e.pointerId !== gesture.pointerId) return;

      const tile = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-tile]");
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

      moveOnto(Number(tile.dataset.row), Number(tile.dataset.col));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerId === gestureRef.current?.pointerId) pointerUp();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (e.pointerId === gestureRef.current?.pointerId) pointerCancel();
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [moveOnto, pointerUp, pointerCancel]);

  return {
    path,
    word: pathToWord(options.board, path),
    /** A press is in progress (finger or mouse button down on the board). */
    tracing,
    pointerDown,
    activate,
    submit,
    clear,
    undo,
  };
}
