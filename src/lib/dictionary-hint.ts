import type { DictionaryName } from "./types";
import { DEFAULT_SETTINGS } from "./types";

/**
 * The dictionary setting lives in IndexedDB, which takes a while to open on
 * startup. It's mirrored into localStorage so the dictionary worker can be
 * told which word list to start loading before settings have hydrated.
 */
const STORAGE_KEY = "dictionary";

export function readDictionaryHint(): DictionaryName {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "twl06" || value === "sowpods") return value;
  } catch {
    // Storage unavailable: fall back to the default
  }
  return DEFAULT_SETTINGS.dictionary;
}

export function writeDictionaryHint(name: DictionaryName) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Storage unavailable: the worker just starts on the default next time
  }
}
