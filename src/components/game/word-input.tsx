"use client";

import { useEffect } from "react";

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (word: string) => void;
  disabled: boolean;
}

export function WordInput({ value, onChange, onSubmit, disabled }: WordInputProps) {
  // Handle physical keyboard input via document listener
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused on another interactive element
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) onSubmit(trimmed);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onChange("");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (value.length >= 2 && value.slice(-2) === "QU") {
          onChange(value.slice(0, -2));
        } else if (value.length > 0) {
          onChange(value.slice(0, -1));
        }
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();
        if (letter === "Q") {
          onChange(value + "QU");
        } else {
          onChange(value + letter);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled, value, onChange, onSubmit]);

  return (
    <div className="flex items-center gap-2 w-full max-w-[500px] px-2">
      <div
        className="flex-1 h-11 sm:h-12 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-lg font-mono uppercase tracking-wider flex items-center justify-center min-w-0"
        aria-label="Current word"
      >
        {value ? (
          <span className="text-zinc-900 dark:text-white font-bold">{value}</span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500 text-sm">TYPE A WORD...</span>
        )}
      </div>
    </div>
  );
}
