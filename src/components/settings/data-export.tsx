"use client";

import { useCallback, useState } from "react";
import { exportAllData } from "@/lib/db";

export function DataExport() {
  const [status, setStatus] = useState<string>("");

  const handleExport = useCallback(async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `boggle-practice-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Exported!");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Export failed");
    }
  }, []);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleExport}
        className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600"
      >
        Export Data
      </button>
      {status && <span className="text-xs text-green-500">{status}</span>}
    </div>
  );
}
