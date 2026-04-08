"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useGameStore } from "@/stores/game-store";
import { useReviewStore } from "@/stores/review-store";
import { getInProgressGame, clearInProgressGame } from "@/lib/db";
import type { InProgressGame } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const settings = useSettingsStore();
  const { isLoading, isLoaded, error, loadDictionary } = useDictionaryStore();
  const { phase: gamePhase, reset: resetGame, resumeGame } = useGameStore();
  const { dueCards, loadReviewQueue } = useReviewStore();
  const [savedGame, setSavedGame] = useState<InProgressGame | null>(null);

  // Hydrate settings and load dictionary on mount
  useEffect(() => {
    settings.hydrate().then(() => {
      loadDictionary(settings.dictionary);
      loadReviewQueue(settings.dictionary);
    });

    // Check for interrupted game
    getInProgressGame().then((game) => {
      if (game) setSavedGame(game);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset game state when returning to home
  useEffect(() => {
    if (gamePhase !== "idle") {
      resetGame();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startMode = (mode: string) => {
    router.push(`/play?mode=${mode}`);
  };

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
      {savedGame && isLoaded && (
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
              className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white font-medium"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 w-full max-w-sm">
        <button
          onClick={() => startMode("classic")}
          className="h-14 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          disabled={!isLoaded}
        >
          Classic Mode
        </button>
        <button
          onClick={() => startMode("zen")}
          className="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 font-semibold text-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          disabled={!isLoaded}
        >
          Zen Mode
        </button>
        <button
          onClick={() => router.push("/solver")}
          className="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 font-semibold text-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          disabled={!isLoaded}
        >
          Solver
        </button>
        <button
          onClick={() => startMode("review")}
          className="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 font-semibold text-lg transition-transform active:scale-[0.98] disabled:opacity-50 relative"
          disabled={!isLoaded || dueCards.length === 0}
        >
          Review
          {dueCards.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
              {dueCards.length}
            </span>
          )}
        </button>
      </div>

      {/* Settings quick-access */}
      <button
        onClick={() => router.push("/settings")}
        className="mt-6 flex gap-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
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
      </button>

      {/* Status */}
      <div className="mt-4 text-sm">
        {isLoading && (
          <span className="text-zinc-400">Loading dictionary...</span>
        )}
        {error && (
          <div className="text-red-500">
            {error}{" "}
            <button
              onClick={() => loadDictionary(settings.dictionary)}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}
        {isLoaded && (
          <span className="text-green-500">Dictionary ready</span>
        )}
      </div>

      <button
        onClick={() => router.push("/stats")}
        className="mt-4 text-sm text-blue-500 hover:underline"
      >
        View Stats
      </button>
    </div>
  );
}
