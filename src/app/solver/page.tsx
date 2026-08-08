"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useSettingsStore } from "@/stores/settings-store";
import { generateBoard } from "@/lib/dice";
import { getDictionaryAPI } from "@/lib/dictionary-api";
import { scoreWord } from "@/lib/scoring";
import { Board } from "@/components/game/board";
import type { WordWithPath, GridSize, Position } from "@/lib/types";

export default function SolverPage() {
  const router = useRouter();
  const { isLoaded } = useDictionaryStore();
  const gridSize = useSettingsStore((s) => s.gridSize);

  const [board, setBoard] = useState<string[][]>([]);
  const [words, setWords] = useState<WordWithPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [highlightedPath, setHighlightedPath] = useState<Position[] | undefined>();

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
    setHighlightedPath(undefined);
    solve(b, gridSize);
  }, [gridSize, solve]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!isLoaded) {
      router.push("/");
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      generateNew();
    }
  }, [isLoaded, generateNew, router]);

  if (!isLoaded) return null;

  // Group words by length
  const grouped = new Map<number, WordWithPath[]>();
  for (const w of words) {
    const len = w.word.length;
    if (!grouped.has(len)) grouped.set(len, []);
    grouped.get(len)!.push(w);
  }
  const sortedGroups = [...grouped.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="flex w-full flex-col items-center p-4 lg:mx-auto lg:max-w-[1800px] lg:p-6">
      <div className="flex items-center w-full mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-500 hover:underline"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold flex-1 text-center mr-10">
          Solver
        </h1>
      </div>

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
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium"
            >
              New Board
            </button>
            <button
              type="button"
              onClick={() => setShowWords(!showWords)}
              className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-medium"
            >
              {showWords ? "Hide Words" : "Show Words"}
            </button>
          </div>

          <div className="text-sm text-zinc-500">
            {words.length} words found
          </div>
        </div>

        {/* Words list */}
        {showWords && (
          <div className="w-full max-h-[70dvh] overflow-y-auto lg:flex-[1_1_0%]">
            {isLoading ? (
              <p className="text-zinc-400 text-center py-4">Solving...</p>
            ) : (
              sortedGroups.map(([len, group]) => (
                <div key={len} className="mb-4">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                    {len} letters ({group.length})
                  </h3>
                  <div className="flex flex-col gap-0.5">
                    {group
                      .sort((a, b) => a.word.localeCompare(b.word))
                      .map((w) => (
                        <button
                          key={w.word}
                          type="button"
                          className="flex items-center justify-between px-3 py-1 rounded text-sm font-mono bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-left w-full"
                          onClick={() => setHighlightedPath(w.path)}
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
    </div>
  );
}
