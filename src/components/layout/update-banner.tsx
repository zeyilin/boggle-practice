"use client";

import { useState, useEffect } from "react";
import { registerServiceWorker, skipWaiting } from "@/lib/sw-registration";

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    registerServiceWorker(() => setUpdateAvailable(true));
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 p-3 rounded-lg bg-blue-500 text-white text-sm shadow-lg flex items-center justify-between"
      role="status"
    >
      <span>Update available</span>
      <button
        type="button"
        onClick={skipWaiting}
        className="min-h-11 px-4 rounded bg-white text-blue-500 font-medium text-sm"
      >
        Refresh
      </button>
    </div>
  );
}
