"use client";

import { Suspense } from "react";
import { PlayContent } from "./play-content";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="appear-delayed flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin motion-reduce:animate-none" />
            <p className="text-zinc-400">Loading...</p>
          </div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}
