"use client";

interface ScoreDisplayProps {
  score: number;
  wordsFound: number;
}

export function ScoreDisplay({ score, wordsFound }: ScoreDisplayProps) {
  return (
    <div className="flex gap-6 text-center">
      <div>
        <div className="text-2xl font-bold">{score}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Points
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold">{wordsFound}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Words
        </div>
      </div>
    </div>
  );
}
