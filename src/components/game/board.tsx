"use client";

import { Tile } from "./tile";
import type { Position } from "@/lib/types";

interface BoardProps {
  board: string[][];
  gridSize: number;
  selectedPath: Position[];
  highlightedPath?: Position[];
  disabledTiles?: Set<string>;
  onPointerDown?: (row: number, col: number) => void;
  onPointerEnter?: (row: number, col: number) => void;
  onPointerUp?: () => void;
}

function posKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function Board({
  board,
  gridSize,
  selectedPath,
  highlightedPath,
  disabledTiles,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
}: BoardProps) {
  const selectedSet = new Set(selectedPath.map(([r, c]) => posKey(r, c)));
  const highlightedSet = new Set(
    (highlightedPath ?? []).map(([r, c]) => posKey(r, c)),
  );

  return (
    <div
      className="grid gap-1.5 sm:gap-2 touch-none w-full max-w-[400px] sm:max-w-[420px]"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      onPointerUp={onPointerUp}
    >
      {board.map((row, r) =>
        row.map((letter, c) => (
          <Tile
            key={posKey(r, c)}
            letter={letter}
            row={r}
            col={c}
            gridSize={gridSize}
            isSelected={selectedSet.has(posKey(r, c))}
            isHighlighted={highlightedSet.has(posKey(r, c))}
            isDisabled={disabledTiles?.has(posKey(r, c)) ?? false}
            onPointerDown={onPointerDown}
            onPointerEnter={onPointerEnter}
            onPointerUp={onPointerUp}
          />
        )),
      )}
    </div>
  );
}
