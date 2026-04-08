import type { WordWithPath, GridSize } from "./types";
import type { HintType } from "./types";
import { scoreWord } from "./scoring";

export interface HintResult {
  type: HintType;
  text: string;
  revealedWord?: string;
}

export function generateHint(
  type: HintType,
  foundWords: string[],
  wordsAvailable: WordWithPath[],
  gridSize: GridSize,
): HintResult {
  const foundSet = new Set(foundWords);
  const missed = wordsAvailable.filter((w) => !foundSet.has(w.word));

  if (missed.length === 0) {
    return { type, text: "You found all the words!" };
  }

  switch (type) {
    case "count-by-length": {
      const byLength = new Map<number, number>();
      for (const w of missed) {
        const len = w.word.length;
        byLength.set(len, (byLength.get(len) ?? 0) + 1);
      }
      const parts = [...byLength.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([len, count]) => `${count} × ${len}-letter`);
      return {
        type,
        text: `Missing: ${parts.join(", ")}`,
      };
    }

    case "first-letter": {
      const letters = new Set(missed.map((w) => w.word[0]));
      const sorted = [...letters].sort();
      return {
        type,
        text: `Missing words start with: ${sorted.join(", ")}`,
      };
    }

    case "reveal-word": {
      // Reveal lowest-value word first
      const sorted = [...missed].sort(
        (a, b) =>
          scoreWord(a.word, gridSize) - scoreWord(b.word, gridSize) ||
          a.word.localeCompare(b.word),
      );
      const word = sorted[0];
      return {
        type,
        text: `Try: ${word.word}`,
        revealedWord: word.word,
      };
    }
  }
}
