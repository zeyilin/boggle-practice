import type { GameRecord } from "./types";

export interface DashboardStats {
  gamesPlayed: number;
  averageScore: number;
  bestScore: number;
  totalWordsFound: number;
  uniqueWordsFound: number;
  discoveryRate: number;
  avgWordsPerRound: number;
  longestWord: string;
  currentStreak: number;
  bestStreak: number;
}

export interface ChartDataPoint {
  index: number;
  score: number;
  discoveryRate: number;
  date: string;
}

export interface WordLengthData {
  length: number;
  count: number;
}

export function calculateDashboardStats(records: GameRecord[]): DashboardStats {
  if (records.length === 0) {
    return {
      gamesPlayed: 0,
      averageScore: 0,
      bestScore: 0,
      totalWordsFound: 0,
      uniqueWordsFound: 0,
      discoveryRate: 0,
      avgWordsPerRound: 0,
      longestWord: "",
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  const totalScore = records.reduce((sum, r) => sum + r.score, 0);
  const bestScore = Math.max(...records.map((r) => r.score));
  const totalWords = records.reduce((sum, r) => sum + r.wordsFound.length, 0);

  // Unique words across all games
  const allWords = new Set<string>();
  let longestWord = "";
  for (const r of records) {
    for (const w of r.wordsFound) {
      allWords.add(w);
      if (w.length > longestWord.length) longestWord = w;
    }
  }

  // Discovery rate
  const rates = records.map((r) =>
    r.wordsAvailable.length > 0
      ? r.wordsFound.length / r.wordsAvailable.length
      : 0,
  );
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;

  // Streaks (by day)
  const days = new Set(
    records.map((r) => new Date(r.timestamp).toDateString()),
  );
  const sortedDays = [...days]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let bestStreak = 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i];
    day.setHours(0, 0, 0, 0);

    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);

    if (day.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  currentStreak = streak;

  // Best streak — scan all days
  streak = 1;
  bestStreak = 1;
  const allDays = [...days]
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < allDays.length; i++) {
    const prev = allDays[i - 1];
    const curr = allDays[i];
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 1;
    }
  }
  if (allDays.length <= 1) bestStreak = allDays.length;

  return {
    gamesPlayed: records.length,
    averageScore: Math.round(totalScore / records.length),
    bestScore,
    totalWordsFound: totalWords,
    uniqueWordsFound: allWords.size,
    discoveryRate: Math.round(avgRate * 100),
    avgWordsPerRound: Math.round(totalWords / records.length),
    longestWord,
    currentStreak,
    bestStreak,
  };
}

export function getChartData(records: GameRecord[]): ChartDataPoint[] {
  // Last 30 games, in chronological order
  const recent = records
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-30);

  return recent.map((r, i) => ({
    index: i + 1,
    score: r.score,
    discoveryRate: r.wordsAvailable.length > 0
      ? Math.round((r.wordsFound.length / r.wordsAvailable.length) * 100)
      : 0,
    date: new Date(r.timestamp).toLocaleDateString(),
  }));
}

export function getWordLengthData(records: GameRecord[]): WordLengthData[] {
  const counts = new Map<number, number>();
  for (const r of records) {
    for (const w of r.wordsFound) {
      const len = w.length;
      counts.set(len, (counts.get(len) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([length, count]) => ({ length, count }))
    .sort((a, b) => a.length - b.length);
}
