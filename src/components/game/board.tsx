"use client";

import { memo, useRef, useState } from "react";
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
  /** Pointer press on a tile (touch, mouse, or pen). */
  onTilePointerDown?: (row: number, col: number, pointerId: number) => void;
  /** Enter/Space on the focused tile. */
  onTileActivate?: (row: number, col: number, key: "Enter" | " ") => void;
  /** id of an element describing the keyboard controls. */
  describedBy?: string;
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

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

// Memoized so timer ticks and other screen updates don't re-render the board
export const Board = memo(function Board({
  board,
  gridSize,
  selectedPath,
  highlightedPath,
  disabledTiles,
  className,
  onTilePointerDown,
  onTileActivate,
  describedBy,
}: BoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  // Roving tabindex: the board is one tab stop; arrow keys move between tiles
  const [focusPos, setFocusPos] = useState<Position>([0, 0]);
  const interactive = !!(onTilePointerDown || onTileActivate);

  const selectedSet = new Set(selectedPath.map(([r, c]) => posKey(r, c)));
  const highlightedSet = new Set(
    (highlightedPath ?? []).map(([r, c]) => posKey(r, c)),
  );

  // Trace line over the active path: the live selection while tracing,
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

  const tileFromEvent = (target: EventTarget): Position | null => {
    const el = (target as HTMLElement).closest?.<HTMLElement>("[data-tile]");
    if (!el) return null;
    return [Number(el.dataset.row), Number(el.dataset.col)];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const pos = tileFromEvent(e.target);
    if (!pos) return;
    const [r, c] = pos;

    const arrow = ARROWS[e.key];
    if (arrow) {
      e.preventDefault();
      const nr = Math.min(gridSize - 1, Math.max(0, r + arrow[0]));
      const nc = Math.min(gridSize - 1, Math.max(0, c + arrow[1]));
      setFocusPos([nr, nc]);
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-row="${nr}"][data-col="${nc}"]`)
        ?.focus();
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTileActivate?.(r, c, e.key);
    }
  };

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
        ref={gridRef}
        role="group"
        aria-label="Board"
        aria-describedby={describedBy}
        className="grid h-full w-full gap-[2cqw] touch-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
        onKeyDown={interactive ? handleKeyDown : undefined}
        onFocus={
          interactive
            ? (e) => {
                const pos = tileFromEvent(e.target);
                if (pos) setFocusPos(pos);
              }
            : undefined
        }
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
              interactive={interactive}
              tabIndex={
                focusPos[0] === r && focusPos[1] === c ? 0 : -1
              }
              onPointerDown={onTilePointerDown}
            />
          )),
        )}
      </div>

      {/* Trace-line overlay for the active path or highlighted word path */}
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
});
