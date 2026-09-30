"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { normalizeTypedWord } from "@/lib/word-path";

interface WordInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** The current word: typed text, or the word traced on the board. */
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  /** Backspace with the caret at the end; return true if handled
   *  (e.g. undoing a traced tile, or deleting "QU" as one letter). */
  onBackspace: () => boolean;
  disabled: boolean;
  autoFocus?: boolean;
  /** The typed word can't be traced on the board. */
  offBoard?: boolean;
  describedBy?: string;
}

// Buttons keep focus in the text field when clicked, so a keyboard player
// can click Submit and keep typing (and a phone keyboard stays open).
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

export function WordInput({
  inputRef,
  value,
  onChange,
  onSubmit,
  onClear,
  onBackspace,
  disabled,
  autoFocus = true,
  offBoard = false,
  describedBy,
}: WordInputProps) {
  // Keep input focused during play — but not on touch devices, where
  // focusing would pop the on-screen keyboard over the board.
  useEffect(() => {
    if (!disabled && autoFocus) {
      inputRef.current?.focus();
    }
  }, [disabled, autoFocus, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClear();
    } else if (e.key === "Backspace") {
      const el = e.currentTarget;
      const atEnd =
        el.selectionStart === el.value.length &&
        el.selectionEnd === el.value.length;
      if (atEnd && onBackspace()) e.preventDefault();
    }
  };

  return (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onMouseDown={keepFocus}
        onClick={onClear}
        disabled={disabled || !value}
        aria-label="Clear word"
        className="h-12 w-12 shrink-0 rounded-lg bg-zinc-200 text-lg font-semibold dark:bg-zinc-700 disabled:invisible"
      >
        ✕
      </button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(normalizeTypedWord(e.target.value))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a word..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="go"
        className={cn(
          "h-12 min-w-0 flex-1 rounded-lg border-2 bg-white px-4 font-mono text-lg uppercase tracking-wider focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:bg-zinc-800",
          offBoard
            ? "border-red-400 text-red-600 line-through decoration-2 dark:border-red-500 dark:text-red-400"
            : "border-zinc-300 dark:border-zinc-600",
        )}
        aria-label="Word input"
        aria-invalid={offBoard || undefined}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        onMouseDown={keepFocus}
        onClick={onSubmit}
        disabled={disabled || !value}
        className="h-12 shrink-0 rounded-lg bg-blue-500 px-5 font-semibold text-white transition-all hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
      >
        Submit
      </button>
    </div>
  );
}
