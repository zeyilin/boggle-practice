"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import type { GameRecord, WordWithPath } from "@/lib/types";
import { scoreWord } from "@/lib/scoring";
import { useReviewStore } from "@/stores/review-store";
import { useGameStore } from "@/stores/game-store";
import { Board } from "../game/board";

type SortMode = "length" | "points" | "alpha";

interface ResultsScreenProps {
  record: GameRecord;
  onPlayAgain: () => void;
}

export function ResultsScreen({ record, onPlayAgain }: ResultsScreenProps) {
  const [sortMode, setSortMode] = useState<SortMode>("length");
  const [highlighted, setHighlighted] = useState<WordWithPath | undefined>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The word input unmounts when the game ends; move focus to the results
  // (not to Play Again — an Enter meant for a last word mustn't start a game)
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  const { maybeAddToReview, updateAfterReview } = useReviewStore();
  const reviewCardId = useGameStore((s) => s.reviewCardId);

  // Post-game review queue management
  useEffect(() => {
    const discoveryRate = record.wordsAvailable.length > 0
      ? record.wordsFound.length / record.wordsAvailable.length
      : 0;

    if (record.gameMode === "review" && reviewCardId) {
      updateAfterReview(reviewCardId, discoveryRate);
    } else {
      maybeAddToReview(record);
    }
  }, [record]); // eslint-disable-line react-hooks/exhaustive-deps

  const discoveryRate = record.wordsAvailable.length > 0
    ? record.wordsFound.length / record.wordsAvailable.length
    : 0;

  const scorePercent = record.maxScore > 0
    ? Math.round((record.score / record.maxScore) * 100)
    : 0;

  const missedWords = useMemo(() => {
    const foundSet = new Set(record.wordsFound);
    return record.wordsAvailable.filter((w) => !foundSet.has(w.word));
  }, [record]);

  const sortedMissed = useMemo(() => {
    const words = [...missedWords];
    switch (sortMode) {
      case "length":
        return words.sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));
      case "points":
        return words.sort(
          (a, b) =>
            scoreWord(b.word, record.gridSize) - scoreWord(a.word, record.gridSize) ||
            a.word.localeCompare(b.word),
        );
      case "alpha":
        return words.sort((a, b) => a.word.localeCompare(b.word));
      default:
        return words;
    }
  }, [missedWords, sortMode, record.gridSize]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 p-4 lg:mx-auto lg:max-w-[1800px] lg:p-6">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
        Game Over
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
        <StatCard label="Score" value={`${record.score} / ${record.maxScore}`} sub={`${scorePercent}%`} />
        <StatCard label="Words" value={`${record.wordsFound.length} / ${record.wordsAvailable.length}`} sub={`${Math.round(discoveryRate * 100)}%`} />
        <StatCard label="Time" value={formatTime(record.elapsedTime)} />
        <StatCard label="Mode" value={record.gameMode} />
      </div>

      {/* Board + missed words layout */}
      <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
        <div className="w-full lg:flex-[2_1_0%] lg:sticky lg:top-6">
          <Board
            board={record.board}
            gridSize={record.gridSize}
            selectedPath={[]}
            highlightedPath={highlighted?.path}
            className="mx-auto max-w-[max(16rem,calc(100dvh-16rem))]"
          />
        </div>

        <div className="w-full lg:flex-[1_1_0%]">
          {/* Sort controls */}
          <div className="flex items-center gap-2 mb-3">
            <h2 id="missed-words" className="text-sm text-zinc-500 dark:text-zinc-400">
              Missed words ({missedWords.length}):
            </h2>
            <div className="flex gap-1" role="group" aria-label="Sort missed words by">
              {(["length", "points", "alpha"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  aria-pressed={sortMode === mode}
                  className={`px-2 py-0.5 pointer-coarse:min-h-11 pointer-coarse:px-3 text-xs rounded ${
                    sortMode === mode
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Missed words list */}
          {/* Tap or press a missed word to trace it on the board */}
          <div
            className="flex flex-col gap-0.5 max-h-[50dvh] overflow-y-auto"
            aria-labelledby="missed-words"
          >
            {sortedMissed.map((w) => (
              <button
                key={w.word}
                type="button"
                aria-pressed={highlighted?.word === w.word}
                className="flex items-center justify-between px-3 py-1.5 pointer-coarse:min-h-11 rounded text-sm font-mono bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/30 aria-pressed:bg-green-100 dark:aria-pressed:bg-green-900/50 text-left w-full"
                onClick={() => setHighlighted(w)}
              >
                <span>{w.word}</span>
                <span className="text-zinc-400 text-xs">
                  +{scoreWord(w.word, record.gridSize)}
                </span>
              </button>
            ))}
          </div>

          {/* Found words */}
          <div className="mt-4">
            <h2 className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              Found words ({record.wordsFound.length}):
            </h2>
            <div className="flex flex-col gap-0.5 max-h-[30dvh] overflow-y-auto">
              {record.wordsFound.map((word) => (
                <div
                  key={word}
                  className="flex items-center justify-between px-3 py-1.5 rounded text-sm font-mono bg-green-50 dark:bg-green-950/30"
                >
                  <span>{word}</span>
                  <span className="text-zinc-400 text-xs">
                    +{scoreWord(word, record.gridSize)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/"
          className="inline-flex h-12 items-center px-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold text-lg transition-transform active:scale-[0.98] motion-reduce:transition-none"
        >
          Home
        </Link>
        <button
          type="button"
          onClick={onPlayAgain}
          className="h-12 px-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-lg transition-transform active:scale-[0.98] motion-reduce:transition-none"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
      {sub && (
        <div className="text-xs text-zinc-400 dark:text-zinc-500">{sub}</div>
      )}
    </div>
  );
}
