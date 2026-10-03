"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useGameStore } from "@/stores/game-store";
import { useReviewStore } from "@/stores/review-store";
import { getInProgressGame, clearInProgressGame } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { InProgressGame } from "@/lib/types";

const modeClass =
  "flex h-14 items-center justify-center rounded-xl font-semibold text-lg transition-transform active:scale-[0.98] motion-reduce:transition-none";
const primaryMode = cn(
  modeClass,
  "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900",
);
const secondaryMode = cn(modeClass, "bg-zinc-200 dark:bg-zinc-800");

export default function Home() {
  const router = useRouter();
  const settings = useSettingsStore();
  // The dictionary loads app-wide on startup (AppBootstrap). Modes are
  // links, usable immediately: /play waits for the dictionary if needed.
  const { isLoading, isLoaded, error, loadDictionary } = useDictionaryStore();
  // Route prefetches (dozens of small requests) wait until the dictionary
  // is in, so they don't compete with it on startup
  const prefetch = isLoaded ? null : false;
  const { phase: gamePhase, reset: resetGame, resumeGame } = useGameStore();
  const dueCards = useReviewStore((s) => s.dueCards);
  const loadReviewQueue = useReviewStore((s) => s.loadReviewQueue);
  const hydrated = useSettingsStore((s) => s._hydrated);
  const [savedGame, setSavedGame] = useState<InProgressGame | null>(null);

  // Boards come due as time passes: refresh the review badge on each visit
  useEffect(() => {
    if (hydrated) loadReviewQueue(settings.dictionary);
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for interrupted game
  useEffect(() => {
    getInProgressGame().then((game) => {
      if (game) setSavedGame(game);
    });
  }, []);

  // Reset game state when returning to home
  useEffect(() => {
    if (gamePhase !== "idle") {
      resetGame();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResume = () => {
    if (!savedGame) return;
    resumeGame(savedGame);
    setSavedGame(null);
    router.push(`/play?mode=${savedGame.gameMode}`);
  };

  const handleDiscard = async () => {
    await clearInProgressGame();
    setSavedGame(null);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6">
      <h1 className="text-4xl font-bold tracking-tight mb-2">
        Boggle Practice
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-10">
        Sharpen your word-finding skills
      </p>

      {/* Resume prompt */}
      {savedGame && (
        <div className="w-full max-w-sm mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium mb-2">
            You have an interrupted {savedGame.gameMode} game
          </p>
          <p className="text-xs text-zinc-500 mb-3">
            {savedGame.wordsFound.length} words found &middot;{" "}
            {savedGame.gridSize}×{savedGame.gridSize}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResume}
              className="min-h-11 px-4 text-sm rounded-lg bg-blue-500 text-white font-medium"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="min-h-11 px-4 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <nav className="grid gap-4 w-full max-w-sm" aria-label="Game modes">
        <Link href="/play?mode=classic" prefetch={prefetch} className={primaryMode}>
          Classic Mode
        </Link>
        <Link href="/play?mode=zen" prefetch={prefetch} className={secondaryMode}>
          Zen Mode
        </Link>
        <Link href="/solver" prefetch={prefetch} className={secondaryMode}>
          Solver
        </Link>
        {dueCards.length > 0 ? (
          <Link
            href="/play?mode=review"
            prefetch={prefetch}
            className={cn(secondaryMode, "relative")}
            aria-label={`Review, ${dueCards.length} boards due`}
          >
            Review
            <span
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold"
              aria-hidden="true"
            >
              {dueCards.length}
            </span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className={cn(secondaryMode, "opacity-50")}
            aria-label="Review, no boards due"
          >
            Review
          </button>
        )}
      </nav>

      {/* Settings quick-access */}
      <Link
        href="/settings"
        prefetch={prefetch}
        className="mt-6 flex min-h-11 items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
          {settings.gridSize}×{settings.gridSize}
        </span>
        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
          {Math.floor(settings.timerDuration / 60)}:{(settings.timerDuration % 60).toString().padStart(2, "0")}
        </span>
        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
          {settings.dictionary.toUpperCase()}
        </span>
        <span className="px-2 py-1">Settings →</span>
      </Link>

      {/* Status: only worth mentioning if it's slow or failed */}
      <div className="mt-4 min-h-5 text-sm" role="status">
        {isLoading && (
          <span className="appear-delayed text-zinc-400">Loading dictionary...</span>
        )}
        {error && (
          <span className="text-red-500">
            {error}{" "}
            <button
              type="button"
              onClick={() => loadDictionary(settings.dictionary)}
              className="min-h-11 px-2 underline"
            >
              Retry
            </button>
          </span>
        )}
      </div>

      <Link
        href="/stats"
        prefetch={prefetch}
        className="mt-2 inline-flex min-h-11 items-center px-3 text-sm text-blue-500 hover:underline"
      >
        View Stats
      </Link>
    </div>
  );
}
