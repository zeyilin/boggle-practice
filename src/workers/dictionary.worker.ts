/**
 * Dictionary Web Worker
 *
 * Loads the precompiled DAWG (see scripts/compile-dawg.ts) off the main
 * thread and handles board solving and word validation requests.
 */

import {
  buildTrie,
  loadTrie,
  isWord,
  isPrefix,
  type Trie,
} from "../lib/trie";
import { solveBoard } from "../lib/solver";
import type {
  WorkerRequest,
  WorkerResponse,
} from "../lib/dictionary-worker-messages";

let trie: Trie | null = null;

function respond(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dictionary: ${response.status}`);
  }
  return response;
}

/**
 * Fetch the gzipped DAWG and wrap it without parsing. The file is gunzipped
 * here unless something upstream (server, CDN, service worker) already did.
 */
async function loadDawg(dictionary: string): Promise<Trie> {
  const response = await fetchOk(`/dictionaries/${dictionary}.dawg.gz`);
  let buffer = await response.arrayBuffer();
  const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  if (head[0] === 0x1f && head[1] === 0x8b) {
    buffer = await new Response(
      new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer();
  }
  return loadTrie(buffer);
}

/**
 * Fallback for browsers without DecompressionStream: build the DAWG from
 * the plain word list (slow — hundreds of ms on phones).
 */
async function buildFromWordList(dictionary: string): Promise<Trie> {
  const response = await fetchOk(`/dictionaries/${dictionary}.txt`);
  const text = await response.text();
  const words = text
    .split("\n")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  return buildTrie(words);
}

// Loads by name, so a load started at boot is reused by the "load" request
const loads = new Map<string, Promise<Trie>>();

function startLoad(dictionary: string): Promise<Trie> {
  let load = loads.get(dictionary);
  if (!load) {
    load =
      typeof DecompressionStream === "undefined"
        ? buildFromWordList(dictionary)
        : loadDawg(dictionary);
    // A failed load can be retried
    load.catch(() => loads.delete(dictionary));
    loads.set(dictionary, load);
  }
  return load;
}

// The main thread names the worker after the dictionary it expects to need
// (see DictionaryAPI.warmUp), so fetching starts before settings hydrate
if (self.name) startLoad(self.name);

async function loadDictionary(dictionary: string) {
  try {
    trie = await startLoad(dictionary);
    respond({ type: "loaded", wordCount: trie.wordCount });
  } catch (e) {
    respond({
      type: "load-error",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function handle(msg: WorkerRequest) {
  switch (msg.type) {
    case "load":
      await loadDictionary(msg.dictionary);
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
}

// The main thread matches each reply to the oldest pending request, so
// messages are handled strictly in order: a request sent while a load is
// in flight waits for it instead of being answered first.
let queue: Promise<void> = Promise.resolve();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  queue = queue
    .then(() => handle(event.data))
    // Every request gets exactly one reply, and one failure can't stall
    // the queue for the requests behind it
    .catch((e) =>
      respond({
        type: "error",
        error: e instanceof Error ? e.message : String(e),
      }),
    );
};
