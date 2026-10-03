import { create } from "zustand";
import type { DictionaryName } from "@/lib/types";
import { getDictionaryAPI } from "@/lib/dictionary-api";

interface DictionaryStore {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  activeDictionary: DictionaryName | null;
  wordCount: number;
  loadDictionary: (name: DictionaryName) => Promise<void>;
}

// Several screens ask for the dictionary on startup; they share one load
let inflight: { name: DictionaryName; promise: Promise<void> } | null = null;

export const useDictionaryStore = create<DictionaryStore>((set, get) => ({
  isLoading: false,
  isLoaded: false,
  error: null,
  activeDictionary: null,
  wordCount: 0,

  loadDictionary: (name) => {
    // Don't reload the same dictionary
    if (get().activeDictionary === name && get().isLoaded) {
      return Promise.resolve();
    }
    if (inflight?.name === name) return inflight.promise;

    const load = async () => {
      set({ isLoading: true, error: null, isLoaded: false });

      try {
        const api = getDictionaryAPI();
        const wordCount = await api.load(name);
        set({
          isLoading: false,
          isLoaded: true,
          activeDictionary: name,
          wordCount,
          error: null,
        });
      } catch (e) {
        set({
          isLoading: false,
          isLoaded: false,
          error: e instanceof Error ? e.message : "Failed to load dictionary",
        });
      }
    };

    const promise = load().finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });
    inflight = { name, promise };
    return promise;
  },
}));
