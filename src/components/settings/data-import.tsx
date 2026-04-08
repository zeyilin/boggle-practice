"use client";

import { useCallback, useRef, useState } from "react";
import { importAllData, type ExportPayload } from "@/lib/db";

export function DataImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [pendingData, setPendingData] = useState<ExportPayload | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text) as ExportPayload;

        if (data.version !== 1 || !data.gameRecords || !data.userSettings) {
          setStatus("Invalid file format");
          return;
        }

        setPendingData(data);
        setConfirming(true);
      } catch {
        setStatus("Failed to read file");
      }

      // Reset input
      if (fileRef.current) fileRef.current.value = "";
    },
    [],
  );

  const confirmImport = useCallback(async () => {
    if (!pendingData) return;

    try {
      await importAllData(pendingData);
      setStatus("Imported! Reloading...");
      setConfirming(false);
      setPendingData(null);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setStatus("Import failed");
      setConfirming(false);
    }
  }, [pendingData]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Import Data
        </button>
        {status && <span className="text-xs text-blue-500">{status}</span>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {confirming && pendingData && (
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            This will overwrite all current data ({pendingData.gameRecords.length} games,{" "}
            {pendingData.reviewCards.length} review cards). Continue?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="px-3 py-1 text-sm rounded bg-yellow-500 text-white font-medium"
            >
              Yes, import
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setPendingData(null);
              }}
              className="px-3 py-1 text-sm rounded bg-zinc-200 dark:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
