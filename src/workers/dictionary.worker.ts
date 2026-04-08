/**
 * Dictionary Web Worker
 *
 * Loads the word list and builds a Trie off the main thread.
 * Handles board solving and word validation requests.
 */

import { buildTrie, isWord, isPrefix, type Trie } from "../lib/trie";
import { solveBoard } from "../lib/solver";
import type {
  WorkerRequest,
  WorkerResponse,
} from "../lib/dictionary-worker-messages";

let trie: Trie | null = null;

function respond(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function loadDictionary(dictionary: string) {
  try {
    const url = `/dictionaries/${dictionary}.txt`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch dictionary: ${response.status}`);
    }
    const text = await response.text();
    const words = text
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    trie = buildTrie(words);
    respond({ type: "loaded", wordCount: trie.wordCount });
  } catch (e) {
    respond({
      type: "load-error",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  switch (msg.type) {
    case "load":
      loadDictionary(msg.dictionary);
      break;

    case "solve":
      if (!trie) {
        respond({ type: "error", error: "Dictionary not loaded" });
        return;
      }
      const words = solveBoard(msg.board, msg.gridSize, trie);
      respond({ type: "solved", words });
      break;

    case "isWord":
      if (!trie) {
        respond({ type: "error", error: "Dictionary not loaded" });
        return;
      }
      respond({ type: "isWord", result: isWord(trie, msg.word) });
      break;

    case "isPrefix":
      if (!trie) {
        respond({ type: "error", error: "Dictionary not loaded" });
        return;
      }
      respond({ type: "isPrefix", result: isPrefix(trie, msg.prefix) });
      break;
  }
};
