"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface TileProps {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDisabled: boolean;
  gridSize: number;
  /** Interactive tiles are buttons in the board's roving tab order;
   *  static tiles (solver/results boards) aren't focusable at all. */
  interactive: boolean;
  tabIndex?: number;
  onPointerDown?: (row: number, col: number, pointerId: number) => void;
}

// Memoized: only tiles whose state changes re-render as a word is traced
export const Tile = memo(function Tile({
  letter,
  row,
  col,
  isSelected,
  isHighlighted,
  isDisabled,
  gridSize,
  interactive,
  tabIndex,
  onPointerDown,
}: TileProps) {
  // Tiles fill their grid cell; letter size scales with the board via
  // container-query units (the Board root is the inline-size container).
  const letterSize = gridSize === 4 ? "text-[10cqw]" : "text-[8cqw]";
  const label = `Tile row ${row + 1}, column ${col + 1}: letter ${letter}`;

  const className = cn(
    "h-full w-full rounded-[2cqw] font-bold select-none touch-none",
    letterSize,
    "flex items-center justify-center border-2 transition-[color,background-color,border-color,scale] duration-100 motion-reduce:transition-none",
    isSelected
      ? "bg-blue-500 text-white border-blue-600 scale-95"
      : isHighlighted
        ? "bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600"
        : isDisabled
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700"
          : cn(
              "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600",
              interactive && "hover:border-blue-400 active:scale-95",
            ),
  );

  if (!interactive) {
    return (
      <div role="img" aria-label={label} className={className}>
        {letter}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-tile=""
      data-row={row}
      data-col={col}
      tabIndex={tabIndex}
      className={className}
      aria-label={label}
      aria-pressed={isSelected}
      aria-disabled={isDisabled || undefined}
      onPointerDown={(e) => {
        // Keep focus (and the keyboard) where it is, and stop text selection
        e.preventDefault();
        onPointerDown?.(row, col, e.pointerId);
      }}
    >
      {letter}
    </button>
  );
});
