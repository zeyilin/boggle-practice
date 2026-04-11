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
    <div className="w-full max-w-[500px] select-none px-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-[6px] mb-[8px]">
          {/* Half-key spacer for row 2 (ASDFGHJKL) to match Wordle indentation */}
          {i === 1 && <div className="flex-[0.5]" />}
          {/* Enter on last row, left side (Wordle layout) */}
          {i === 2 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              className={cn(
                "h-[50px] sm:h-[58px] flex-[1.5] rounded text-[11px] sm:text-xs font-bold uppercase",
                "bg-[#d3d6da] dark:bg-[#818384] text-zinc-900 dark:text-white",
                "active:brightness-110 transition-all",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              ENTER
            </button>
          )}
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleKey(letter)}
              disabled={disabled}
              className={cn(
                "h-[50px] sm:h-[58px] flex-1 rounded",
                "font-bold text-[14px] sm:text-[15px]",
                "bg-[#d3d6da] dark:bg-[#818384] text-zinc-900 dark:text-white",
                "active:brightness-110 transition-all",
                "disabled:opacity-40",
              )}
            >
              {letter}
            </button>
          ))}
          {/* Backspace on last row, right side (Wordle layout) */}
          {i === 2 && (
            <button
              type="button"
              onClick={handleBackspace}
              disabled={disabled}
              className={cn(
                "h-[50px] sm:h-[58px] flex-[1.5] rounded font-bold text-base sm:text-lg",
                "bg-[#d3d6da] dark:bg-[#818384] text-zinc-900 dark:text-white",
                "active:brightness-110 transition-all",
                "disabled:opacity-40",
              )}
              aria-label="Backspace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" className="mx-auto fill-current">
                <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z" />
              </svg>
            </button>
          )}
          {/* Half-key spacer for row 2 */}
          {i === 1 && <div className="flex-[0.5]" />}
        </div>
      ))}
    </div>
  );
}
