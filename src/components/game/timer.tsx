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

  // Screen readers hear the time at 30s and 10s left, not every tick
  const announcement =
    remaining <= 10
      ? "10 seconds remaining"
      : remaining <= 30
        ? "30 seconds remaining"
        : "";

  return (
    <div className="shrink-0">
      {/* Fixed-size and contained, so the per-second text change is laid
          out in isolation instead of re-laying out the whole game screen
          (it's monospace, so one ch per character fits exactly) */}
      <div
        className={cn(
          "h-9 text-3xl font-mono font-bold tabular-nums [contain:strict]",
          urgency,
        )}
        style={{ width: `${formatted.length}ch` }}
        role="timer"
        aria-label={
          isCountdown
            ? `${minutes} minutes ${seconds} seconds remaining`
            : `${minutes} minutes ${seconds} seconds elapsed`
        }
      >
        {formatted}
      </div>
      <span className="sr-only" aria-live="assertive">
        {announcement}
      </span>
    </div>
  );
}
