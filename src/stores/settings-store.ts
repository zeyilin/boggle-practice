import { create } from "zustand";
import type { UserSettings, GridSize, DictionaryName, ThemeSetting, TouchInputMode } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/db";

interface SettingsStore extends UserSettings {
  _hydrated: boolean;
  hydrate: () => Promise<void>;
  setGridSize: (size: GridSize) => void;
  setDictionary: (dict: DictionaryName) => void;
  setTimerDuration: (seconds: number) => void;
  setHintsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeSetting) => void;
  setTouchInputMode: (mode: TouchInputMode) => void;
}

function persist(settings: UserSettings) {
  saveSettings(settings).catch(console.error);
}

function getSettingsFromState(state: SettingsStore): UserSettings {
  return {
    gridSize: state.gridSize,
    dictionary: state.dictionary,
    timerDuration: state.timerDuration,
    hintsEnabled: state.hintsEnabled,
    soundEnabled: state.soundEnabled,
    hapticEnabled: state.hapticEnabled,
    theme: state.theme,
    touchInputMode: state.touchInputMode,
  };
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  _hydrated: false,

  hydrate: async () => {
    const saved = await getSettings();
    set({ ...saved, _hydrated: true });
  },

  setGridSize: (gridSize) => {
    set({ gridSize });
    persist(getSettingsFromState({ ...get(), gridSize }));
  },
  setDictionary: (dictionary) => {
    set({ dictionary });
    persist(getSettingsFromState({ ...get(), dictionary }));
  },
  setTimerDuration: (timerDuration) => {
    set({ timerDuration });
    persist(getSettingsFromState({ ...get(), timerDuration }));
  },
  setHintsEnabled: (hintsEnabled) => {
    set({ hintsEnabled });
    persist(getSettingsFromState({ ...get(), hintsEnabled }));
  },
  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled });
    persist(getSettingsFromState({ ...get(), soundEnabled }));
  },
  setHapticEnabled: (hapticEnabled) => {
    set({ hapticEnabled });
    persist(getSettingsFromState({ ...get(), hapticEnabled }));
  },
  setTheme: (theme) => {
    set({ theme });
    persist(getSettingsFromState({ ...get(), theme }));
  },
  setTouchInputMode: (touchInputMode) => {
    set({ touchInputMode });
    persist(getSettingsFromState({ ...get(), touchInputMode }));
  },
}));
