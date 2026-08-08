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
import { WordChips } from "./word-chips";
import { ScoreDisplay } from "./score-display";
import { Feedback } from "./feedback";
import { HintsPanel } from "./hints-panel";
import { ResultsScreen } from "../review/results-screen";
import { AUTO_SAVE_INTERVAL } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
  // Touchscreen laptops still play with a keyboard: only suppress input
  // autofocus on touch-primary devices (where focus pops the OS keyboard).
  const prefersKeyboard = typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
    <div className="flex h-dvh w-full flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-[1800px] lg:flex-row lg:gap-8 lg:p-6 lg:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Board column: header, board stage, mobile chip strip */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 lg:flex-[2_1_0%]">
        {/* Header: timer | current word + feedback | score */}
        <div className="flex w-full shrink-0 items-center justify-between gap-4">
          <Timer elapsedTime={elapsedTime} timerDuration={timerDuration} />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
            {displayWord && (
              <span className="truncate font-mono text-xl font-bold tracking-widest sm:text-2xl">
                {displayWord}
              </span>
            )}
            <Feedback result={lastSubmitResult} />
          </div>
          <ScoreDisplay score={score} wordsFound={wordsFound.length} />
        </div>

        {/* Board stage: a size container so the board fills whatever space
            remains, constrained by both width and height, on any resize */}
        <div className="min-h-0 w-full flex-1 [container-type:size]">
          <div className="flex h-full w-full items-center justify-center">
            <Board
              board={board}
              gridSize={gridSize}
              selectedPath={touchPath}
              disabledTiles={disabledTiles}
              className="w-[min(100cqw,100cqh)]"
              {...boardHandlers}
            />
          </div>
        </div>

        {/* Found words as a chip strip on small screens */}
        <div className="lg:hidden">
          <WordChips words={wordsFound} gridSize={gridSize} />
        </div>
      </div>

      {/* Sidebar: word list (desktop), hints, tap controls, input */}
      <aside className="flex w-full shrink-0 flex-col gap-3 lg:min-h-0 lg:w-auto lg:flex-[1_1_0%]">
        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Found Words ({wordsFound.length})
          </h2>
          <WordList words={wordsFound} gridSize={gridSize} />
        </div>

        <HintsPanel />

        {/* Touch controls for tap mode — row space is always reserved so the
            board above never resizes mid-word when the buttons appear */}
        {useTap && (
          <div
            className={cn(
              "flex h-12 shrink-0 gap-3",
              tap.currentPath.length === 0 && "invisible",
            )}
          >
            <button
              type="button"
              onClick={tap.clear}
              className="h-12 flex-1 rounded-lg bg-zinc-200 font-medium dark:bg-zinc-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={tap.submit}
              className="h-12 flex-1 rounded-lg bg-blue-500 font-medium text-white"
            >
              Submit
            </button>
          </div>
        )}

        {/* Keyboard input */}
        <WordInput
          value={currentWord}
          onChange={setCurrentWord}
          onSubmit={handleKeyboardSubmit}
          disabled={phase !== "playing"}
          autoFocus={prefersKeyboard}
        />

        <button
          type="button"
          onClick={handleDone}
          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {gameMode === "zen" ? "I'm done" : "End early"}
        </button>
      </aside>
    </div>
  );
}
