"use client";

import { Tile } from "./tile";
import { cn } from "@/lib/utils";
import type { Position } from "@/lib/types";

interface BoardProps {
  board: string[][];
  gridSize: number;
  selectedPath: Position[];
  highlightedPath?: Position[];
  disabledTiles?: Set<string>;
  className?: string;
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
  className,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
}: BoardProps) {
  const selectedSet = new Set(selectedPath.map(([r, c]) => posKey(r, c)));
  const highlightedSet = new Set(
    (highlightedPath ?? []).map(([r, c]) => posKey(r, c)),
  );

  // The board is a fluid square that fills whatever width its parent gives it.
  // It registers as an inline-size container so tile gaps, corner radii, and
  // letter sizes (cqw units) all scale with the board itself.
  return (
    <div
      className={cn(
        "aspect-square w-full [container-type:inline-size]",
        className,
      )}
    >
      <div
        className="grid h-full w-full gap-[2cqw] touch-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
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
    </div>
  );
}
