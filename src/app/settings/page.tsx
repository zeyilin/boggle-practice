"use client";

import { useRouter } from "next/navigation";
import { useSettingsStore } from "@/stores/settings-store";
import { DataExport } from "@/components/settings/data-export";
import { DataImport } from "@/components/settings/data-import";
import type { GridSize, DictionaryName, ThemeSetting, TouchInputMode } from "@/lib/types";
import { MIN_TIMER_DURATION, MAX_TIMER_DURATION, TIMER_STEP } from "@/lib/constants";

export default function SettingsPage() {
  const router = useRouter();
  const settings = useSettingsStore();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
      <div className="flex items-center w-full mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-blue-500 hover:underline"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold flex-1 text-center mr-10">
          Settings
        </h1>
      </div>

      <div className="w-full space-y-6">
        {/* Grid Size */}
        <SettingRow label="Grid Size">
          <div className="flex gap-2">
            {([4, 5] as GridSize[]).map((size) => (
              <button
                key={size}
                onClick={() => settings.setGridSize(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  settings.gridSize === size
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Dictionary */}
        <SettingRow label="Dictionary">
          <div className="flex gap-2">
            {(["twl06", "sowpods"] as DictionaryName[]).map((dict) => (
              <button
                key={dict}
                onClick={() => settings.setDictionary(dict)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  settings.dictionary === dict
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                {dict.toUpperCase()}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Timer Duration */}
        <SettingRow label="Timer Duration">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                settings.setTimerDuration(
                  Math.max(MIN_TIMER_DURATION, settings.timerDuration - TIMER_STEP),
                )
              }
              className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-lg font-bold"
            >
              −
            </button>
            <span className="text-lg font-mono w-12 text-center">
              {formatTime(settings.timerDuration)}
            </span>
            <button
              onClick={() =>
                settings.setTimerDuration(
                  Math.min(MAX_TIMER_DURATION, settings.timerDuration + TIMER_STEP),
                )
              }
              className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-lg font-bold"
            >
              +
            </button>
          </div>
        </SettingRow>

        {/* Hints */}
        <SettingRow label="Hints">
          <Toggle
            value={settings.hintsEnabled}
            onChange={settings.setHintsEnabled}
          />
        </SettingRow>

        {/* Sound */}
        <SettingRow label="Sound Effects">
          <Toggle
            value={settings.soundEnabled}
            onChange={settings.setSoundEnabled}
          />
        </SettingRow>

        {/* Haptic */}
        <SettingRow label="Haptic Feedback">
          <Toggle
            value={settings.hapticEnabled}
            onChange={settings.setHapticEnabled}
          />
        </SettingRow>

        {/* Theme */}
        <SettingRow label="Theme">
          <div className="flex gap-2">
            {(["light", "dark", "system"] as ThemeSetting[]).map((t) => (
              <button
                key={t}
                onClick={() => settings.setTheme(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  settings.theme === t
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Touch Input Mode */}
        <SettingRow label="Touch Input">
          <div className="flex gap-2">
            {(["swipe", "tap", "both"] as TouchInputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => settings.setTouchInputMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  settings.touchInputMode === m
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Data Management */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
          <span className="text-sm font-medium">Data Management</span>
          <DataExport />
          <DataImport />
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        value ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          value ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
