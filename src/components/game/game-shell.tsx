"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/game-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useBoardInput } from "@/hooks/use-board-input";
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
import {
  canExtendPath,
  deleteTypedLetter,
  findWordPath,
  normalizeTypedWord,
} from "@/lib/word-path";
import { cn } from "@/lib/utils";
import type { Position } from "@/lib/types";

const KEYS_HELP_ID = "board-keys-help";
const NO_PATH: Position[] = [];

function isEditable(el: EventTarget | null): boolean {
  return (
    el instanceof HTMLElement &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  );
}

export function GameShell() {
  // Everything except the clock: timer ticks re-render only <GameTimer>
  const {
    phase,
    board,
    gridSize,
    gameMode,
    wordsFound,
    score,
    currentWord,
    lastSubmitResult,
    completedRecord,
    setCurrentWord,
    submitWord,
    tick,
    endGame,
    autoSave,
    reset,
  } = useGameStore(
    useShallow((s) => ({
      phase: s.phase,
      board: s.board,
      gridSize: s.gridSize,
      gameMode: s.gameMode,
      wordsFound: s.wordsFound,
      score: s.score,
      currentWord: s.currentWord,
      lastSubmitResult: s.lastSubmitResult,
      completedRecord: s.completedRecord,
      setCurrentWord: s.setCurrentWord,
      submitWord: s.submitWord,
      tick: s.tick,
      endGame: s.endGame,
      autoSave: s.autoSave,
      reset: s.reset,
    })),
  );

  const touchInputMode = useSettingsStore((s) => s.touchInputMode);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  // Touchscreen laptops still play with a keyboard: only suppress input
  // autofocus on touch-primary devices (where focus pops the OS keyboard).
  const prefersKeyboard = typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Swipe and tap work with any pointer (finger, mouse, pen); the setting
  // picks which gestures the board responds to.
  const tapEnabled = touchInputMode !== "swipe";
  const input = useBoardInput({
    board,
    swipe: touchInputMode !== "tap",
    tap: tapEnabled,
    onSubmit: (word) => submitWord(word),
    // Tracing a word on the board replaces any typed text
    onStart: () => setCurrentWord(""),
    onTileAdded: () => {
      if (hapticEnabled) navigator.vibrate?.(8);
    },
  });

  // The current word is either traced on the board or typed — never both
  const traced = input.path.length > 0;
  const displayWord = traced ? input.word : currentWord;

  // Typed letters light up their path on the grid in real time
  const typedPath = useMemo(
    () => (traced || !currentWord ? null : findWordPath(board, currentWord)),
    [traced, currentWord, board],
  );
  const offBoard = !traced && currentWord.length > 0 && typedPath === null;
  const selectedPath = traced ? input.path : (typedPath ?? NO_PATH);

  // While a tapped word is pending, dim tiles that can't come next (a tap
  // there is ignored; a swipe from there still starts a new word)
  const dimPending = tapEnabled && traced && !input.tracing;
  const disabledTiles = useMemo(() => {
    if (!dimPending) return undefined;
    const dimmed = new Set<string>();
    const last = input.path[input.path.length - 1];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isLast = last[0] === r && last[1] === c;
        if (!isLast && !canExtendPath(input.path, [r, c])) {
          dimmed.add(`${r},${c}`);
        }
      }
    }
    return dimmed;
  }, [dimPending, input.path, gridSize]);

  const { activate } = input;
  const handleTileActivate = useCallback(
    (r: number, c: number, key: "Enter" | " ") => activate(r, c, key === "Enter"),
    [activate],
  );

  const submitCurrent = useCallback(() => {
    if (input.submit()) return;
    if (currentWord) submitWord(currentWord);
  }, [input, currentWord, submitWord]);

  const clearCurrent = useCallback(() => {
    input.clear();
    setCurrentWord("");
  }, [input, setCurrentWord]);

  const handleBackspace = useCallback((): boolean => {
    if (input.undo()) return true;
    if (currentWord.endsWith("QU")) {
      setCurrentWord(deleteTypedLetter(currentWord));
      return true;
    }
    return false;
  }, [input, currentWord, setCurrentWord]);

  const handleTyped = useCallback(
    (value: string) => {
      // Typing takes over from a traced word (the field shows it, so
      // typing after tracing C-A-T and pressing S gives "CATS")
      input.clear();
      setCurrentWord(value);
    },
    [input, setCurrentWord],
  );

  // Keyboard play works wherever focus is (after clicking a hint or a
  // button, on the board, or nowhere): letters go into the word, and
  // Enter / Escape / Backspace act on it.
  const globalKeyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    globalKeyRef.current = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.isComposing || isEditable(e.target)) return;

      if (/^[a-z]$/i.test(e.key)) {
        e.preventDefault();
        // Continues the word on screen, traced or typed (C-A-T then S → CATS)
        handleTyped(normalizeTypedWord(displayWord + e.key));
        inputRef.current?.focus({ preventScroll: true });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (!handleBackspace()) setCurrentWord(deleteTypedLetter(currentWord));
      } else if (e.key === "Escape") {
        clearCurrent();
      } else if (
        e.key === "Enter" &&
        !(e.target instanceof HTMLButtonElement) &&
        !(e.target instanceof HTMLAnchorElement)
      ) {
        // (buttons keep their own Enter; board tiles handle theirs)
        e.preventDefault();
        submitCurrent();
      }
    };
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const handler = (e: KeyboardEvent) => globalKeyRef.current(e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [phase]);

  // Size the board to the largest square that fits its stage: measure the
  // stage (on mount, before paint, and on every resize) and size the board
  // in px. Unlike sizing via a size container query, nothing inside the
  // board then has to be restyled when unrelated parts of the screen
  // re-lay out (timer ticks, typed letters, new words). The board renders
  // only once measured, so it's laid out once, at its final size.
  const [boardSize, setBoardSize] = useState<number | null>(null);
  const playing = phase === "playing" && board.length > 0;
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = (width: number, height: number) =>
      setBoardSize(Math.floor(Math.min(width, height)));
    const rect = stage.getBoundingClientRect();
    fit(rect.width, rect.height);
    const observer = new ResizeObserver(([entry]) =>
      fit(entry.contentRect.width, entry.contentRect.height),
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [playing]);

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

  const handleDone = useCallback(() => {
    endGame();
  }, [endGame]);

  // Review phase
  if (phase === "review" && completedRecord) {
    return <ResultsScreen record={completedRecord} onPlayAgain={reset} />;
  }

  if (phase !== "playing" || board.length === 0) return null;

  return (
    <div className="flex h-dvh w-full flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-[1800px] lg:flex-row lg:gap-8 lg:p-6 lg:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Board column: header, board stage, mobile chip strip */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 lg:flex-[2_1_0%]">
        {/* Header: timer | current word + feedback | score */}
        <div className="flex w-full shrink-0 items-center justify-between gap-4">
          <GameTimer />
          {/* The word changes on every keystroke/tile: a fixed-height,
              contained box (a block child, so it can be a relayout
              boundary) keeps that from re-laying out the whole screen */}
          <div className="min-w-0 flex-1">
            <div className="flex h-8 items-center justify-center gap-3 [contain:strict]">
              {displayWord && (
                <span
                  className={cn(
                    "truncate font-mono text-xl font-bold tracking-widest sm:text-2xl",
                    offBoard && "text-red-500 line-through decoration-2",
                  )}
                >
                  {displayWord}
                </span>
              )}
              <Feedback result={lastSubmitResult} />
            </div>
          </div>
          <ScoreDisplay score={score} wordsFound={wordsFound.length} />
        </div>

        {/* Board stage: fills whatever space remains, and the board inside
            is the largest square that fits it (see --board-size above).
            Absolutely positioned over its flex slot so the board can never
            push the slot's size around. */}
        {/* Top-aligned on phones so slack collects in one place (above the
            input) instead of splitting into gaps around the board */}
        <div className="relative min-h-0 w-full flex-1">
          <div
            ref={stageRef}
            className="absolute inset-0 flex items-start justify-center lg:items-center"
            style={
              boardSize === null
                ? undefined
                : ({ "--board-size": `${boardSize}px` } as React.CSSProperties)
            }
          >
            {boardSize !== null && (
              <Board
                board={board}
                gridSize={gridSize}
                selectedPath={selectedPath}
                disabledTiles={disabledTiles}
                className="w-(--board-size)"
                onTilePointerDown={input.pointerDown}
                onTileActivate={handleTileActivate}
                describedBy={KEYS_HELP_ID}
              />
            )}
          </div>
        </div>

        {/* Found words as a chip strip on small screens */}
        <div className="lg:hidden">
          <WordChips words={wordsFound} gridSize={gridSize} />
        </div>
      </div>

      {/* Sidebar: word list (desktop), hints, input */}
      <aside className="flex w-full shrink-0 flex-col gap-3 lg:min-h-0 lg:w-auto lg:flex-[1_1_0%]">
        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Found Words ({wordsFound.length})
          </h2>
          <WordList words={wordsFound} gridSize={gridSize} />
        </div>

        <HintsPanel />

        {/* One Submit/Clear row for every input method: typed words,
            tapped words, and keyboard-selected tiles */}
        <WordInput
          inputRef={inputRef}
          value={displayWord}
          onChange={handleTyped}
          onSubmit={submitCurrent}
          onClear={clearCurrent}
          onBackspace={handleBackspace}
          disabled={phase !== "playing"}
          autoFocus={prefersKeyboard}
          offBoard={offBoard}
          describedBy={KEYS_HELP_ID}
        />

        <p
          id={KEYS_HELP_ID}
          className="hidden text-xs text-zinc-400 dark:text-zinc-500 pointer-fine:block"
        >
          Type a word and press Enter · Esc clears · Tab to the board, then
          arrow keys and Space to pick tiles, Enter on the last tile to submit
        </p>

        <button
          type="button"
          onClick={handleDone}
          className="min-h-11 self-center px-4 text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {gameMode === "zen" ? "I'm done" : "End early"}
        </button>
      </aside>
    </div>
  );
}

function GameTimer() {
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const timerDuration = useGameStore((s) => s.timerDuration);
  return <Timer elapsedTime={elapsedTime} timerDuration={timerDuration} />;
}
