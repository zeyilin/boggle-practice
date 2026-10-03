"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
import { PageHeader } from "@/components/layout/page-header";

// Recharts is by far the largest chunk in the app: load it after the
// numbers are on screen instead of blocking the whole page on it
const chartFallback = () => <div className="h-48" aria-hidden="true" />;
const ScoreChart = dynamic(
  () => import("@/components/stats/score-chart").then((m) => m.ScoreChart),
  { ssr: false, loading: chartFallback },
);
const WordLengthChart = dynamic(
  () =>
    import("@/components/stats/word-length-chart").then(
      (m) => m.WordLengthChart,
    ),
  { ssr: false, loading: chartFallback },
);

export default function StatsPage() {
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
      <div className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto">
        <PageHeader title="Stats" />
        <p className="appear-delayed text-zinc-400" role="status">
          Loading stats...
        </p>
      </div>
    );
  }

  if (!stats || stats.gamesPlayed === 0) {
    return (
      <div className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto">
        <PageHeader title="Stats" />
        <p className="text-zinc-500 mb-6">No games played yet.</p>
        <Link
          href="/play?mode=classic"
          className="inline-flex min-h-11 items-center px-3 text-blue-500 hover:underline"
        >
          Play a game &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto">
      <PageHeader title="Stats" />

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
