"use client";

import { useId } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { DataExport } from "@/components/settings/data-export";
import { DataImport } from "@/components/settings/data-import";
import { PageHeader } from "@/components/layout/page-header";
import type { GridSize, DictionaryName, ThemeSetting, TouchInputMode } from "@/lib/types";
import { MIN_TIMER_DURATION, MAX_TIMER_DURATION, TIMER_STEP } from "@/lib/constants";

export default function SettingsPage() {
  const settings = useSettingsStore();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-md mx-auto">
      <PageHeader title="Settings" />

      <div className="w-full space-y-6">
        {/* Grid Size */}
        <SettingRow label="Grid Size">
          {(labelId) => (
            <Segmented<GridSize>
              labelId={labelId}
              options={[4, 5]}
              value={settings.gridSize}
              onChange={settings.setGridSize}
              format={(size) => `${size}×${size}`}
            />
          )}
        </SettingRow>

        {/* Dictionary */}
        <SettingRow label="Dictionary">
          {(labelId) => (
            <Segmented<DictionaryName>
              labelId={labelId}
              options={["twl06", "sowpods"]}
              value={settings.dictionary}
              onChange={settings.setDictionary}
              format={(dict) => dict.toUpperCase()}
            />
          )}
        </SettingRow>

        {/* Timer Duration */}
        <SettingRow label="Timer Duration">
          {(labelId) => (
            <div className="flex items-center gap-2" role="group" aria-labelledby={labelId}>
              <button
                type="button"
                onClick={() =>
                  settings.setTimerDuration(
                    Math.max(MIN_TIMER_DURATION, settings.timerDuration - TIMER_STEP),
                  )
                }
                disabled={settings.timerDuration <= MIN_TIMER_DURATION}
                aria-label="Decrease timer by 30 seconds"
                className="h-11 w-11 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-lg font-bold disabled:opacity-40"
              >
                −
              </button>
              <span className="text-lg font-mono w-12 text-center" aria-live="polite">
                {formatTime(settings.timerDuration)}
              </span>
              <button
                type="button"
                onClick={() =>
                  settings.setTimerDuration(
                    Math.min(MAX_TIMER_DURATION, settings.timerDuration + TIMER_STEP),
                  )
                }
                disabled={settings.timerDuration >= MAX_TIMER_DURATION}
                aria-label="Increase timer by 30 seconds"
                className="h-11 w-11 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-lg font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          )}
        </SettingRow>

        {/* Hints */}
        <SettingRow label="Hints">
          {(labelId) => (
            <Toggle
              labelId={labelId}
              value={settings.hintsEnabled}
              onChange={settings.setHintsEnabled}
            />
          )}
        </SettingRow>

        {/* Sound */}
        <SettingRow label="Sound Effects">
          {(labelId) => (
            <Toggle
              labelId={labelId}
              value={settings.soundEnabled}
              onChange={settings.setSoundEnabled}
            />
          )}
        </SettingRow>

        {/* Haptic */}
        <SettingRow label="Haptic Feedback">
          {(labelId) => (
            <Toggle
              labelId={labelId}
              value={settings.hapticEnabled}
              onChange={settings.setHapticEnabled}
            />
          )}
        </SettingRow>

        {/* Theme */}
        <SettingRow label="Theme">
          {(labelId) => (
            <Segmented<ThemeSetting>
              labelId={labelId}
              options={["light", "dark", "system"]}
              value={settings.theme}
              onChange={settings.setTheme}
              format={(t) => t[0].toUpperCase() + t.slice(1)}
            />
          )}
        </SettingRow>

        {/* Touch Input Mode */}
        <SettingRow label="Touch Input">
          {(labelId) => (
            <Segmented<TouchInputMode>
              labelId={labelId}
              options={["swipe", "tap", "both"]}
              value={settings.touchInputMode}
              onChange={settings.setTouchInputMode}
              format={(m) => m[0].toUpperCase() + m.slice(1)}
            />
          )}
        </SettingRow>

        {/* Data Management */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
          <h2 className="text-sm font-medium">Data Management</h2>
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
  children: (labelId: string) => React.ReactNode;
}) {
  const labelId = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      {children(labelId)}
    </div>
  );
}

function Segmented<T extends string | number>({
  labelId,
  options,
  value,
  onChange,
  format,
}: {
  labelId: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
}) {
  return (
    <div className="flex gap-2" role="group" aria-labelledby={labelId}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`min-h-11 px-3 rounded-lg text-sm font-medium ${
            value === option
              ? "bg-blue-500 text-white"
              : "bg-zinc-200 dark:bg-zinc-700"
          }`}
        >
          {format(option)}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  labelId,
  value,
  onChange,
}: {
  labelId: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  // The visible switch is 24px tall; the button around it is the full
  // 44px touch target
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      aria-labelledby={labelId}
      className="flex h-11 items-center"
    >
      <span
        className={`relative block w-11 h-6 rounded-full transition-colors motion-reduce:transition-none ${
          value ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${
            value ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}
