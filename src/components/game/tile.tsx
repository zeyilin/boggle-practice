"use client";

import { cn } from "@/lib/utils";

interface TileProps {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDisabled: boolean;
  gridSize: number;
  onPointerDown?: (row: number, col: number) => void;
  onPointerEnter?: (row: number, col: number) => void;
  onPointerUp?: () => void;
}

export function Tile({
  letter,
  row,
  col,
  isSelected,
  isHighlighted,
  isDisabled,
  gridSize,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
}: TileProps) {
  // Tiles fill their grid cell; letter size scales with the board via
  // container-query units (the Board root is the inline-size container).
  const letterSize = gridSize === 4 ? "text-[10cqw]" : "text-[8cqw]";

  return (
    <button
      type="button"
      className={cn(
        "h-full w-full rounded-[2cqw] font-bold select-none touch-none",
        letterSize,
        "flex items-center justify-center transition-all duration-100",
        "border-2",
        isSelected
          ? "bg-blue-500 text-white border-blue-600 scale-95"
          : isHighlighted
            ? "bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600"
            : isDisabled
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-700"
              : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-blue-400 active:scale-95",
      )}
      aria-label={`Tile row ${row + 1}, column ${col + 1}: letter ${letter}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown?.(row, col);
      }}
      onPointerEnter={() => onPointerEnter?.(row, col)}
      onPointerUp={() => onPointerUp?.()}
    >
      {letter}
    </button>
  );
}
