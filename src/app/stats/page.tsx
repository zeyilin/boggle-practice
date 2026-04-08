"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllGameRecords } from "@/lib/db";
import {
  calculateDashboardStats,
  getChartData,
  getWordLengthData,
  type DashboardStats,
  type ChartDataPoint,
  type WordLengthData,
} from "@/lib/stats-calculator";
import type { GameRecord } from "@/lib/types";
import { ScoreChart } from "@/components/stats/score-chart";
import { WordLengthChart } from "@/components/stats/word-length-chart";

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [wordLengthData, setWordLengthData] = useState<WordLengthData[]>([]);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllGameRecords().then((recs) => {
      setRecords(recs);
      setStats(calculateDashboardStats(recs));
      setChartData(getChartData(recs));
      setWordLengthData(getWordLengthData(recs));
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">Loading stats...</p>
      </div>
    );
  }

  if (!stats || stats.gamesPlayed === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4">Stats</h1>
        <p className="text-zinc-500 mb-6">No games played yet.</p>
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 hover:underline"
        >
          &larr; Play a game
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto">
      <div className="flex items-center w-full mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-500 hover:underline"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold flex-1 text-center mr-10">
          Stats
        </h1>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full mb-8">
        <MetricCard label="Games" value={stats.gamesPlayed} />
        <MetricCard label="Avg Score" value={stats.averageScore} />
        <MetricCard label="Best Score" value={stats.bestScore} />
        <MetricCard label="Total Words" value={stats.totalWordsFound} />
        <MetricCard label="Unique Words" value={stats.uniqueWordsFound} />
        <MetricCard label="Discovery" value={`${stats.discoveryRate}%`} />
        <MetricCard label="Avg Words/Game" value={stats.avgWordsPerRound} />
        <MetricCard label="Longest Word" value={stats.longestWord || "—"} small />
        <MetricCard label="Streak" value={`${stats.currentStreak}d`} />
        <MetricCard label="Best Streak" value={`${stats.bestStreak}d`} />
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="w-full space-y-6 mb-8">
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Score over time
            </h2>
            <ScoreChart data={chartData} dataKey="score" color="#3b82f6" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Discovery rate over time
            </h2>
            <ScoreChart data={chartData} dataKey="discoveryRate" color="#22c55e" yLabel="%" />
          </div>
        </div>
      )}

      {wordLengthData.length > 0 && (
        <div className="w-full mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Words by length
          </h2>
          <WordLengthChart data={wordLengthData} />
        </div>
      )}

      {/* Game history */}
      <div className="w-full">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
          Game History ({records.length})
        </h2>
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm"
            >
              <span className="text-zinc-500 w-24">
                {new Date(r.timestamp).toLocaleDateString()}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700">
                {r.gridSize}×{r.gridSize}
              </span>
              <span className="font-medium w-16 text-right">{r.score} pts</span>
              <span className="text-zinc-500 w-20 text-right">
                {r.wordsFound.length}/{r.wordsAvailable.length}
              </span>
              <span className="text-zinc-400 w-12 text-right">
                {r.wordsAvailable.length > 0
                  ? Math.round(
                      (r.wordsFound.length / r.wordsAvailable.length) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`font-bold ${small ? "text-sm" : "text-lg"} truncate max-w-full`}
      >
        {value}
      </div>
    </div>
  );
}
