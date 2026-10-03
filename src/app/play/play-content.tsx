"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "@/stores/game-store";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useReviewStore } from "@/stores/review-store";
import { generateValidBoard } from "@/lib/board-generator";
import { getDictionaryAPI } from "@/lib/dictionary-api";
import { GameShell } from "@/components/game/game-shell";
import type { GameMode } from "@/lib/types";

const MODES: GameMode[] = ["classic", "zen", "review"];

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </div>
  );
}

const homeLinkClass =
  "inline-flex min-h-11 items-center rounded-lg px-4 text-blue-500 hover:underline";

export function PlayContent() {
  const searchParams = useSearchParams();
  const param = searchParams.get("mode") as GameMode | null;
  const mode: GameMode = param && MODES.includes(param) ? param : "classic";

  // Narrow subscriptions: this wraps the whole game, so re-rendering it on
  // every timer tick would re-render everything below it
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const { isLoaded, error, loadDictionary } = useDictionaryStore(
    useShallow((s) => ({
      isLoaded: s.isLoaded,
      error: s.error,
      loadDictionary: s.loadDictionary,
    })),
  );
  const settings = useSettingsStore(
    useShallow((s) => ({
      gridSize: s.gridSize,
      dictionary: s.dictionary,
      timerDuration: s.timerDuration,
    })),
  );
  const dueCards = useReviewStore((s) => s.dueCards);
  const reviewLoaded = useReviewStore((s) => s.hasLoaded);
  const noReviewsDue = mode === "review" && reviewLoaded && dueCards.length === 0;

  // One board generation at a time (effects can re-run while it's async)
  const startingRef = useRef(false);
  // A generation that finishes after leaving the page must not start a game
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [startError, setStartError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Wait for the dictionary (loaded app-wide on startup, so a refresh or
  // deep link here works) rather than bouncing to home
  useEffect(() => {
    if (!isLoaded || phase !== "idle" || startingRef.current || startError) {
      return;
    }
    if (mode === "review" && (!reviewLoaded || dueCards.length === 0)) return;
    startingRef.current = true;

    const init = async () => {
      if (mode === "review") {
        const card = dueCards[0];
        // Re-solve the board with the current dictionary
        const api = getDictionaryAPI();
        const wordsAvailable = await api.solve(card.board, card.gridSize);
        if (!mountedRef.current) return;

        startGame({
          gameMode: "review",
          gridSize: card.gridSize,
          dictionary: card.dictionary,
          timerDuration: settings.timerDuration,
          board: card.board,
          wordsAvailable,
          reviewCardId: card.id,
        });
      } else {
        const { board, wordsAvailable } = await generateValidBoard(
          settings.gridSize,
        );
        if (!mountedRef.current) return;

        startGame({
          gameMode: mode,
          gridSize: settings.gridSize,
          dictionary: settings.dictionary,
          timerDuration: mode === "zen" ? null : settings.timerDuration,
          board,
          wordsAvailable,
        });
      }
    };

    init()
      .catch((e) => {
        if (mountedRef.current) {
          setStartError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        startingRef.current = false;
      });
  }, [isLoaded, phase, reviewLoaded, attempt, startError]); // eslint-disable-line react-hooks/exhaustive-deps

  // A game in progress (e.g. resumed from home) doesn't need the dictionary
  if (phase === "playing" || phase === "review") return <GameShell />;

  if (startError) {
    return (
      <Centered>
        <p className="text-red-500">Couldn&apos;t start a game: {startError}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setStartError(null);
              setAttempt((n) => n + 1);
            }}
            className="min-h-11 rounded-lg bg-blue-500 px-4 font-medium text-white"
          >
            Retry
          </button>
          <Link href="/" className={homeLinkClass}>
            Home
          </Link>
        </div>
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <p className="text-red-500">Couldn&apos;t load the dictionary: {error}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadDictionary(settings.dictionary)}
            className="min-h-11 rounded-lg bg-blue-500 px-4 font-medium text-white"
          >
            Retry
          </button>
          <Link href="/" className={homeLinkClass}>
            Home
          </Link>
        </div>
      </Centered>
    );
  }

  if (noReviewsDue && phase === "idle") {
    return (
      <Centered>
        <p className="text-zinc-500 dark:text-zinc-400">
          No boards are due for review right now.
        </p>
        <Link href="/" className={homeLinkClass}>
          &larr; Home
        </Link>
      </Centered>
    );
  }

  if (phase === "idle" || phase === "loading") {
    return (
      <Centered>
        <div className="appear-delayed flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 motion-reduce:animate-none" />
          <p className="text-zinc-400" role="status">
            {!isLoaded
              ? "Loading dictionary..."
              : mode === "review"
                ? "Loading review board..."
                : "Generating board..."}
          </p>
        </div>
      </Centered>
    );
  }

  return <GameShell />;
}
