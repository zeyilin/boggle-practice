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

/**
 * Compute tile center as a percentage of the grid, accounting for gaps.
 * With CSS grid `1fr` columns and a gap, each tile center is at:
 *   offset = (index + 0.5) / gridSize * 100%
 * This works because the gap is small relative to tile size and
 * distributes evenly, keeping centers roughly at the fraction midpoints.
 */
function tileCenterPct(index: number, gridSize: number): number {
  return ((index + 0.5) / gridSize) * 100;
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

  // Compute line coordinates as percentages for the SVG viewBox
  const linePoints = selectedPath.map(([r, c]) => ({
    x: tileCenterPct(c, gridSize),
    y: tileCenterPct(r, gridSize),
  }));

  return (
    <div className="relative w-full max-w-[400px] sm:max-w-[420px] max-h-full aspect-square">
      {/* SVG trace lines overlay */}
      {linePoints.length >= 2 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          style={{ zIndex: 10 }}
        >
          <polyline
            points={linePoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Dots at each node */}
          {linePoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="rgba(59, 130, 246, 0.8)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}

      {/* Tile grid */}
      <div
        className="grid gap-1.5 sm:gap-2 touch-none w-full h-full"
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
    </div>
  );
}
