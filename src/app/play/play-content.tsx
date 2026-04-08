"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGameStore } from "@/stores/game-store";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useReviewStore } from "@/stores/review-store";
import { generateValidBoard } from "@/lib/board-generator";
import { getDictionaryAPI } from "@/lib/dictionary-api";
import { GameShell } from "@/components/game/game-shell";
import type { GameMode } from "@/lib/types";

export function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "classic") as GameMode;

  const { phase, startGame } = useGameStore();
  const { isLoaded } = useDictionaryStore();
  const settings = useSettingsStore();
  const { dueCards } = useReviewStore();

  useEffect(() => {
    if (!isLoaded) {
      router.push("/");
      return;
    }

    if (phase !== "idle") return;

    const init = async () => {
      if (mode === "review") {
        // Load a board from the review queue
        if (dueCards.length === 0) {
          router.push("/");
          return;
        }

        const card = dueCards[0];
        // Re-solve the board with the current dictionary
        const api = getDictionaryAPI();
        const wordsAvailable = await api.solve(card.board, card.gridSize);

        startGame({
          gameMode: "review",
          gridSize: card.gridSize,
          dictionary: card.dictionary,
          timerDuration: settings.timerDuration,
          board: card.board,
          wordsAvailable,
          reviewCardId: card.id,
        });
      } else {
        const { board, wordsAvailable } = await generateValidBoard(
          settings.gridSize,
        );

        startGame({
          gameMode: mode,
          gridSize: settings.gridSize,
          dictionary: settings.dictionary,
          timerDuration: mode === "zen" ? null : settings.timerDuration,
          board,
          wordsAvailable,
        });
      }
    };

    init();
  }, [isLoaded, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">Loading dictionary...</p>
      </div>
    );
  }

  if (phase === "idle" || phase === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-400">
            {mode === "review" ? "Loading review board..." : "Generating board..."}
          </p>
        </div>
      </div>
    );
  }

  return <GameShell />;
}
