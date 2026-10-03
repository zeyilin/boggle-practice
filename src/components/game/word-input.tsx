"use client";

import { useRef, useEffect, useCallback } from "react";

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (word: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

export function WordInput({
  value,
  onChange,
  onSubmit,
  disabled,
  autoFocus = true,
}: WordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused during play — but not on touch devices, where
  // focusing would pop the on-screen keyboard over the board.
  useEffect(() => {
    if (!disabled && autoFocus) {
      inputRef.current?.focus();
    }
  }, [disabled, autoFocus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && value.trim()) {
        e.preventDefault();
        onSubmit(value.trim());
      } else if (e.key === "Escape") {
        e.preventDefault();
        onChange("");
      }
    },
    [value, onChange, onSubmit],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.toUpperCase();
      // Auto-expand Q to QU (Boggle Qu tile rule)
      if (val.endsWith("Q") && !val.endsWith("QU")) {
        val = val + "U";
      }
      // Only allow letters
      val = val.replace(/[^A-Z]/g, "");
      onChange(val);
    },
    [onChange],
  );

  const handleBackspace = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle QU deletion — delete both Q and U together
      if (e.key === "Backspace" && value.length >= 2) {
        const lastTwo = value.slice(-2);
        if (lastTwo === "QU") {
          e.preventDefault();
          onChange(value.slice(0, -2));
        }
      }
    },
    [value, onChange],
  );

  return (
    <div className="flex gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          handleBackspace(e);
          handleKeyDown(e);
        }}
        disabled={disabled}
        placeholder="Type a word..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="flex-1 h-12 px-4 rounded-lg bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 text-lg font-mono uppercase tracking-wider focus:outline-none focus:border-blue-500 disabled:opacity-50"
        aria-label="Word input"
      />
      <button
        type="button"
        onClick={() => {
          if (value.trim()) onSubmit(value.trim());
        }}
        disabled={disabled || !value.trim()}
        className="h-12 px-5 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </div>
  );
}
