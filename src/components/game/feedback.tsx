"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "@/lib/types";

interface FeedbackProps {
  result: ValidationResult | null;
}

const MESSAGES: Record<string, { text: string; color: string }> = {
  accepted: { text: "Nice!", color: "text-green-500" },
  "not-a-word": { text: "Not a valid word", color: "text-red-500" },
  "too-short": { text: "Too short", color: "text-red-400" },
  "already-found": { text: "Already found", color: "text-yellow-500" },
  "no-path": { text: "No valid path", color: "text-red-500" },
};

export function Feedback({ result }: FeedbackProps) {
  const [displayResult, setDisplayResult] = useState<ValidationResult | null>(null);
  const [visible, setVisible] = useState(false);

  // When result prop changes, show it
  useEffect(() => {
    if (!result) return;
    // This is responding to prop changes, not a cascading render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayResult(result);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, [result]);

  if (!displayResult || !visible) return null;

  const msg = MESSAGES[displayResult.reason];
  if (!msg) return null;

  return (
    <div
      className={cn(
        "text-sm font-semibold transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        msg.color,
      )}
      role="status"
      aria-live="assertive"
    >
      {msg.text}
    </div>
  );
}
