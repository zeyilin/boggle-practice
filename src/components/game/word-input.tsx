"use client";

import { useEffect, useCallback } from "react";

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

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      <div
        className="flex-1 h-12 px-4 rounded-lg bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 text-lg font-mono uppercase tracking-wider flex items-center min-w-0"
        aria-label="Current word"
      >
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">TYPE A WORD...</span>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="h-12 px-3 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold active:scale-95 transition-all disabled:opacity-50"
          aria-label="Clear word"
        >
          &#10005;
        </button>
      )}
    </div>
  );
}
