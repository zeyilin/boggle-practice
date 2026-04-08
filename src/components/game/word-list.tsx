"use client";

import { scoreWord } from "@/lib/scoring";
import type { GridSize } from "@/lib/types";

interface WordListProps {
  words: string[];
  gridSize: GridSize;
}

export function WordList({ words, gridSize }: WordListProps) {
  if (words.length === 0) {
    return (
      <div className="text-sm text-zinc-400 dark:text-zinc-500 py-4 text-center">
        No words found yet
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-0.5 max-h-64 sm:max-h-96 overflow-y-auto"
      role="list"
      aria-label="Found words"
      aria-live="polite"
    >
      {[...words].reverse().map((word) => (
        <div
          key={word}
          role="listitem"
          className="flex items-center justify-between px-3 py-1.5 rounded text-sm font-mono bg-zinc-50 dark:bg-zinc-800/50"
        >
          <span>{word}</span>
          <span className="text-zinc-400 text-xs">
            +{scoreWord(word, gridSize)}
          </span>
        </div>
      ))}
    </div>
  );
}
