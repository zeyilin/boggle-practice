"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@/lib/types";

interface FeedbackProps {
  result: ValidationResult | null;
}

// Text (not just color) carries the meaning, per the accessibility spec
const MESSAGES: Record<string, { text: string; color: string }> = {
  accepted: { text: "✓ Nice!", color: "text-green-500" },
  "not-a-word": { text: "✗ Not a word", color: "text-red-500" },
  "too-short": { text: "✗ Too short", color: "text-red-400" },
  "already-found": { text: "↺ Already found", color: "text-yellow-500" },
  "no-path": { text: "✗ Not on board", color: "text-red-500" },
};

export function Feedback({ result }: FeedbackProps) {
  const [shown, setShown] = useState<ValidationResult | null>(null);

  // When result prop changes, show it briefly
  useEffect(() => {
    if (!result) return;
    // This is responding to prop changes, not a cascading render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(result);
    const timer = setTimeout(() => setShown(null), 1500);
    return () => clearTimeout(timer);
  }, [result]);

  const msg = shown ? MESSAGES[shown.reason] : undefined;

  // The live region stays mounted so screen readers announce each change
  return (
    <div
      className={cn("shrink-0 text-sm font-semibold whitespace-nowrap", msg?.color)}
      role="status"
    >
      {msg?.text}
    </div>
  );
}
