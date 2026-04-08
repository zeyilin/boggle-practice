"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/game-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useSwipeInput } from "@/hooks/use-swipe-input";
import { useTapInput } from "@/hooks/use-tap-input";
import { Board } from "./board";
import { Timer } from "./timer";
import { WordInput } from "./word-input";
import { WordList } from "./word-list";
import { ScoreDisplay } from "./score-display";
import { Feedback } from "./feedback";
import { HintsPanel } from "./hints-panel";
import { ResultsScreen } from "../review/results-screen";
import { AUTO_SAVE_INTERVAL } from "@/lib/constants";
import type { Position } from "@/lib/types";

export function GameShell() {
  const {
    phase,
    board,
    gridSize,
    gameMode,
    timerDuration,
    wordsFound,
    score,
    elapsedTime,
    currentWord,
    lastSubmitResult,
    completedRecord,
    setCurrentWord,
    submitWord,
    tick,
    endGame,
    autoSave,
    reset,
  } = useGameStore();

  const touchInputMode = useSettingsStore((s) => s.touchInputMode);
  const isTouchDevice = typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch submit handler
  const handleTouchSubmit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (word: string, _path: Position[]) => {
      submitWord(word);
    },
    [submitWord],
  );

  // Swipe input
  const swipe = useSwipeInput({
    board,
    onSubmit: handleTouchSubmit,
  });

  // Tap input
  const tap = useTapInput({
    board,
    gridSize,
    onSubmit: handleTouchSubmit,
  });

  // Timer tick
  useEffect(() => {
    if (phase !== "playing") return;

    tickRef.current = setInterval(() => {
      tick();
    }, 1000);

    autoSaveRef.current = setInterval(() => {
      autoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.hidden) autoSave();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [autoSave]);

  const handleKeyboardSubmit = useCallback(
    (word: string) => {
      submitWord(word);
    },
    [submitWord],
  );

  const handleDone = useCallback(() => {
    endGame();
  }, [endGame]);

  // Review phase
  if (phase === "review" && completedRecord) {
    return <ResultsScreen record={completedRecord} onPlayAgain={reset} />;
  }

  if (phase !== "playing" || board.length === 0) return null;

  // Determine which touch path/word to show
  const touchPath =
    swipe.currentPath.length > 0 ? swipe.currentPath : tap.currentPath;
  const touchWord =
    swipe.currentWord.length > 0 ? swipe.currentWord : tap.currentWord;
  const displayWord = touchWord || currentWord;

  // Determine which handlers to pass to Board based on input mode
  const useSwipe =
    isTouchDevice && (touchInputMode === "swipe" || touchInputMode === "both");
  const useTap =
    isTouchDevice && (touchInputMode === "tap" || touchInputMode === "both");

  // For "both" mode, swipe handlers take priority (tap uses onPointerDown only)
  const boardHandlers = useSwipe
    ? {
        onPointerDown: swipe.handlers.onPointerDown,
        onPointerEnter: swipe.handlers.onPointerEnter,
        onPointerUp: swipe.handlers.onPointerUp,
      }
    : useTap
      ? {
          onPointerDown: tap.handlers.onPointerDown,
        }
      : {};

  // Compute disabled tiles for tap mode
  const disabledTiles =
    useTap && !useSwipe
      ? (() => {
          const valid = tap.validTiles;
          const disabled = new Set<string>();
          for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
              const k = `${r},${c}`;
              if (!valid.has(k)) disabled.add(k);
            }
          }
          return disabled;
        })()
      : undefined;

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <Timer elapsedTime={elapsedTime} timerDuration={timerDuration} />
        <ScoreDisplay score={score} wordsFound={wordsFound.length} />
      </div>

      {/* Current word display */}
      <div className="h-8 flex items-center gap-3">
        {displayWord && (
          <span className="text-xl font-mono font-bold tracking-widest">
            {displayWord}
          </span>
        )}
        <Feedback result={lastSubmitResult} />
      </div>

      {/* Board + word list */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full justify-center">
        <Board
          board={board}
          gridSize={gridSize}
          selectedPath={touchPath}
          disabledTiles={disabledTiles}
          {...boardHandlers}
        />

        <div className="w-full lg:w-64">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Found Words ({wordsFound.length})
          </h2>
          <WordList words={wordsFound} gridSize={gridSize} />
        </div>
      </div>

      {/* Hints */}
      <HintsPanel />

      {/* Touch controls for tap mode */}
      {useTap && tap.currentPath.length > 0 && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={tap.clear}
            className="h-10 px-5 rounded-lg bg-zinc-200 dark:bg-zinc-700 font-medium"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={tap.submit}
            className="h-10 px-5 rounded-lg bg-blue-500 text-white font-medium"
          >
            Submit
          </button>
        </div>
      )}

      {/* Keyboard input */}
      <div className="flex flex-col items-center gap-3 w-full">
        <WordInput
          value={currentWord}
          onChange={setCurrentWord}
          onSubmit={handleKeyboardSubmit}
          disabled={phase !== "playing"}
        />

        <button
          type="button"
          onClick={handleDone}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
        >
          {gameMode === "zen" ? "I'm done" : "End early"}
        </button>
      </div>
    </div>
  );
}
