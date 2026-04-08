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
  const size = gridSize === 4 ? "w-16 h-16 sm:w-20 sm:h-20" : "w-14 h-14 sm:w-16 sm:h-16";

  return (
    <button
      type="button"
      className={cn(
        size,
        "rounded-lg font-bold text-xl sm:text-2xl select-none touch-none",
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
