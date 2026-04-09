"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

interface CustomKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (word: string) => void;
  disabled: boolean;
}

export function CustomKeyboard({
  value,
  onChange,
  onSubmit,
  disabled,
}: CustomKeyboardProps) {
  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return;
      let next = value + key;
      // Auto-expand Q to QU (Boggle Qu tile rule)
      if (key === "Q") {
        next = value + "QU";
      }
      onChange(next);
    },
    [value, onChange, disabled],
  );

  const handleBackspace = useCallback(() => {
    if (disabled || value.length === 0) return;
    // Delete QU together
    if (value.length >= 2 && value.slice(-2) === "QU") {
      onChange(value.slice(0, -2));
    } else {
      onChange(value.slice(0, -1));
    }
  }, [value, onChange, disabled]);

  const handleSubmit = useCallback(() => {
    if (disabled || !value.trim()) return;
    onSubmit(value.trim());
  }, [value, onSubmit, disabled]);

  return (
    <div className="w-full max-w-md select-none">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-[3px] sm:gap-1 mb-[3px] sm:mb-1">
          {/* Backspace on last row, left side */}
          {i === 2 && (
            <button
              type="button"
              onClick={handleBackspace}
              disabled={disabled}
              className={cn(
                "h-11 sm:h-12 px-2.5 sm:px-3 rounded-md font-semibold text-sm",
                "bg-zinc-300 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200",
                "active:scale-95 active:bg-zinc-400 dark:active:bg-zinc-500 transition-all",
                "disabled:opacity-40",
              )}
              aria-label="Backspace"
            >
              &#9003;
            </button>
          )}
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleKey(letter)}
              disabled={disabled}
              className={cn(
                "h-11 sm:h-12 min-w-[28px] sm:min-w-[34px] px-1 sm:px-1.5 rounded-md",
                "font-bold text-base sm:text-lg",
                "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100",
                "border border-zinc-300 dark:border-zinc-600",
                "active:scale-95 active:bg-zinc-200 dark:active:bg-zinc-600 transition-all",
                "disabled:opacity-40",
              )}
            >
              {letter}
            </button>
          ))}
          {/* Submit on last row, right side */}
          {i === 2 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              className={cn(
                "h-11 sm:h-12 px-2.5 sm:px-3 rounded-md font-semibold text-sm",
                "bg-blue-500 text-white",
                "active:scale-95 active:bg-blue-600 transition-all",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              GO
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
