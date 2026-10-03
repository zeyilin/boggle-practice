"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useDictionaryStore } from "@/stores/dictionary-store";
import { useReviewStore } from "@/stores/review-store";
import { getDictionaryAPI } from "@/lib/dictionary-api";
import { readDictionaryHint } from "@/lib/dictionary-hint";

// Start the dictionary worker, and its download of the likely word list, as
// soon as this code is evaluated: before React hydrates, and in parallel
// with reading settings from IndexedDB.
if (typeof window !== "undefined") {
  getDictionaryAPI().warmUp(readDictionaryHint());
}

/**
 * App-wide startup, whatever route the app is opened on (a refresh on
 * /play or a deep link to /solver works the same as starting from home):
 * hydrate settings, then load the chosen dictionary and review queue, and
 * reload them whenever the dictionary setting changes.
 */
export function AppBootstrap() {
  const hydrated = useSettingsStore((s) => s._hydrated);
  const dictionary = useSettingsStore((s) => s.dictionary);
  const loadDictionary = useDictionaryStore((s) => s.loadDictionary);
  const loadReviewQueue = useReviewStore((s) => s.loadReviewQueue);

  useEffect(() => {
    useSettingsStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    loadDictionary(dictionary);
    loadReviewQueue(dictionary);
  }, [hydrated, dictionary, loadDictionary, loadReviewQueue]);

  return null;
}
