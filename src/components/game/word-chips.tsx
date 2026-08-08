"use client";

import { scoreWord } from "@/lib/scoring";
import type { GridSize } from "@/lib/types";

interface WordChipsProps {
  words: string[];
  gridSize: GridSize;
}

// Compact horizontal strip of found words for small screens, newest first.
// Fixed height so the board above it never shifts as words come in.
export function WordChips({ words, gridSize }: WordChipsProps) {
  return (
    <div className="flex h-9 w-full shrink-0 items-center gap-1.5">
      <span
        className="shrink-0 rounded-full bg-zinc-200 px-2 py-1 text-xs font-semibold tabular-nums dark:bg-zinc-700"
        aria-label={`${words.length} words found`}
      >
        {words.length}
      </span>
      {words.length === 0 ? (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          No words found yet
        </span>
      ) : (
        <div
          className="flex h-full items-center gap-1.5 overflow-x-auto"
          role="list"
          aria-label="Found words"
          aria-live="polite"
        >
          {[...words].reverse().map((word) => (
            <span
              key={word}
              role="listitem"
              className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs dark:bg-zinc-800"
            >
              {word}
              <span className="ml-1 text-zinc-400">
                +{scoreWord(word, gridSize)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
