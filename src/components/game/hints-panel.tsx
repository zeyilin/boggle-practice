"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/stores/game-store";
import { useSettingsStore } from "@/stores/settings-store";
import { generateHint, type HintResult } from "@/lib/hints";
import { MAX_HINTS_CLASSIC } from "@/lib/constants";
import type { HintType } from "@/lib/types";

export function HintsPanel() {
  const { wordsFound, wordsAvailable, gridSize, gameMode, hintsUsed, useHint: recordHint } =
    useGameStore();
  const hintsEnabled = useSettingsStore((s) => s.hintsEnabled);
  const [lastHint, setLastHint] = useState<HintResult | null>(null);

  const maxHints = gameMode === "classic" ? MAX_HINTS_CLASSIC : Infinity;
  const remaining = maxHints - hintsUsed;
  const canUseHint = remaining > 0;

  const requestHint = useCallback(
    (type: HintType) => {
      if (!canUseHint) return;
      const hint = generateHint(type, wordsFound, wordsAvailable, gridSize);
      setLastHint(hint);
      recordHint();
    },
    [canUseHint, wordsFound, wordsAvailable, gridSize, recordHint],
  );

  if (!hintsEnabled) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">
          Hints
        </span>
        {maxHints !== Infinity && (
          <span className="text-xs text-zinc-400">
            {remaining} remaining
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => requestHint("count-by-length")}
          disabled={!canUseHint}
          className="px-3 py-1.5 text-xs rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          Count
        </button>
        <button
          type="button"
          onClick={() => requestHint("first-letter")}
          disabled={!canUseHint}
          className="px-3 py-1.5 text-xs rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          Letters
        </button>
        <button
          type="button"
          onClick={() => requestHint("reveal-word")}
          disabled={!canUseHint}
          className="px-3 py-1.5 text-xs rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          Reveal
        </button>
      </div>

      {/* Line is always reserved so the board doesn't resize when a hint appears */}
      <p className="min-h-5 text-sm text-blue-500 dark:text-blue-400">
        {lastHint?.text}
      </p>
    </div>
  );
}
