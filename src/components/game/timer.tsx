"use client";

import { cn } from "@/lib/utils";

interface TimerProps {
  elapsedTime: number;
  timerDuration: number | null; // null for Zen mode
}

export function Timer({ elapsedTime, timerDuration }: TimerProps) {
  const isCountdown = timerDuration !== null;
  const displaySeconds = isCountdown
    ? Math.max(0, timerDuration - elapsedTime)
    : elapsedTime;

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Color changes for countdown
  const remaining = isCountdown ? timerDuration - elapsedTime : Infinity;
  const urgency =
    remaining <= 10
      ? "text-red-500"
      : remaining <= 30
        ? "text-yellow-500"
        : "text-zinc-700 dark:text-zinc-300";

  return (
    <div
      className={cn("text-3xl font-mono font-bold tabular-nums", urgency)}
      role="timer"
      aria-live={remaining <= 30 ? "assertive" : "polite"}
      aria-label={
        isCountdown
          ? `${minutes} minutes ${seconds} seconds remaining`
          : `${minutes} minutes ${seconds} seconds elapsed`
      }
    >
      {formatted}
    </div>
  );
}
