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

// Tile centers as percentages of the board, for the SVG trace overlay.
// With 1fr grid tracks and a small even gap, centers sit at the
// fraction midpoints closely enough for the line to read correctly.
function tileCenterPct(index: number, gridSize: number): number {
  return ((index + 0.5) / gridSize) * 100;
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

  // Trace line over the active path: the live swipe path while tracing,
  // otherwise a highlighted word path (solver / results).
  const isTracing = selectedPath.length >= 2;
  const tracePath = isTracing ? selectedPath : (highlightedPath ?? []);
  const traceColor = isTracing
    ? "rgba(59, 130, 246, 0.75)" // blue-500
    : "rgba(34, 197, 94, 0.75)"; // green-500
  const linePoints = tracePath.map(([r, c]) => ({
    x: tileCenterPct(c, gridSize),
    y: tileCenterPct(r, gridSize),
  }));

  // The board is a fluid square that fills whatever width its parent gives it.
  // It registers as an inline-size container so tile gaps, corner radii, and
  // letter sizes (cqw units) all scale with the board itself.
  return (
    <div
      className={cn(
        "relative aspect-square w-full [container-type:inline-size]",
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

      {/* Trace-line overlay for the active swipe or highlighted word path */}
      {linePoints.length >= 2 && (
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <polyline
            points={linePoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={traceColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {linePoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 2.2 : 1.4}
              fill={traceColor}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
