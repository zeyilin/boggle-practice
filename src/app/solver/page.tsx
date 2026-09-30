"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useSettingsStore } from "@/stores/settings-store";
import { generateBoard } from "@/lib/dice";
import { getDictionaryAPI } from "@/lib/dictionary-api";
import { scoreWord } from "@/lib/scoring";
import { Board } from "@/components/game/board";
import { PageHeader } from "@/components/layout/page-header";
import type { WordWithPath, GridSize, Position } from "@/lib/types";

export default function SolverPage() {
  const { isLoaded, error, loadDictionary } = useDictionaryStore();
  const gridSize = useSettingsStore((s) => s.gridSize);
  const dictionary = useSettingsStore((s) => s.dictionary);

  const [board, setBoard] = useState<string[][]>([]);
  const [words, setWords] = useState<WordWithPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [highlighted, setHighlighted] = useState<WordWithPath | undefined>();

  const solve = useCallback(
    async (b: string[][], gs: GridSize) => {
      setIsLoading(true);
      const api = getDictionaryAPI();
      const result = await api.solve(b, gs);
      setWords(result);
      setIsLoading(false);
    },
    [],
  );

  const generateNew = useCallback(() => {
    const b = generateBoard(gridSize);
    setBoard(b);
    setHighlighted(undefined);
    solve(b, gridSize);
  }, [gridSize, solve]);

  // The dictionary loads app-wide on startup; a deep link here just waits
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded || initializedRef.current) return;
    initializedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generateNew();
  }, [isLoaded, generateNew]);

  // Group words by length
  const grouped = new Map<number, WordWithPath[]>();
  for (const w of words) {
    const len = w.word.length;
    if (!grouped.has(len)) grouped.set(len, []);
    grouped.get(len)!.push(w);
  }
  const sortedGroups = [...grouped.entries()].sort((a, b) => b[0] - a[0]);
  const highlightedPath: Position[] | undefined = highlighted?.path;

  return (
    <div className="flex w-full flex-col items-center p-4 lg:mx-auto lg:max-w-[1800px] lg:p-6">
      <PageHeader title="Solver" />

      {error ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-red-500">Couldn&apos;t load the dictionary: {error}</p>
          <button
            type="button"
            onClick={() => loadDictionary(dictionary)}
            className="min-h-11 rounded-lg bg-blue-500 px-4 font-medium text-white"
          >
            Retry
          </button>
        </div>
      ) : board.length === 0 ? (
        <p className="appear-delayed py-8 text-zinc-400" role="status">
          Loading dictionary...
        </p>
      ) : (
        <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full flex-col items-center gap-4 lg:flex-[2_1_0%]">
            <Board
              board={board}
              gridSize={gridSize}
              selectedPath={[]}
              highlightedPath={highlightedPath}
              className="max-w-[max(16rem,calc(100dvh-14rem))]"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={generateNew}
                className="min-h-11 px-4 rounded-lg bg-blue-500 text-white text-sm font-medium"
              >
                New Board
              </button>
              <button
                type="button"
                onClick={() => setShowWords(!showWords)}
                aria-expanded={showWords}
                aria-controls="solver-words"
                className="min-h-11 px-4 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-medium"
              >
                {showWords ? "Hide Words" : "Show Words"}
              </button>
            </div>

            <div className="text-sm text-zinc-500" role="status">
              {highlighted
                ? `Showing ${highlighted.word} on the board`
                : `${words.length} words found`}
            </div>
          </div>

          {/* Words list: tap or press a word to trace it on the board */}
          {showWords && (
            <div
              id="solver-words"
              className="w-full max-h-[70dvh] overflow-y-auto lg:flex-[1_1_0%]"
            >
              {isLoading ? (
                <p className="text-zinc-400 text-center py-4">Solving...</p>
              ) : (
                sortedGroups.map(([len, group]) => (
                  <div key={len} className="mb-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                      {len} letters ({group.length})
                    </h2>
                    <div className="flex flex-col gap-0.5">
                      {group
                        .sort((a, b) => a.word.localeCompare(b.word))
                        .map((w) => (
                          <button
                            key={w.word}
                            type="button"
                            aria-pressed={highlighted?.word === w.word}
                            className="flex items-center justify-between px-3 py-1 pointer-coarse:min-h-11 rounded text-sm font-mono bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 aria-pressed:bg-green-100 dark:aria-pressed:bg-green-900/50 text-left w-full"
                            onClick={() => setHighlighted(w)}
                          >
                            <span>{w.word}</span>
                            <span className="text-zinc-400 text-xs">
                              +{scoreWord(w.word, gridSize)}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
