/**
 * Main-thread API for communicating with the DictionaryWorker.
 *
 * Provides a promise-based interface for loading dictionaries,
 * solving boards, and validating words. Handles worker lifecycle
 * including crash recovery (max 3 retries).
 */

import type { GridSize, WordWithPath } from "./types";
import type {
  WorkerRequest,
  WorkerResponse,
} from "./dictionary-worker-messages";

type PendingResolver = {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
};

class DictionaryAPI {
  private worker: Worker | null = null;
  private pendingRequests: PendingResolver[] = [];
  private retryCount = 0;
  private maxRetries = 3;
  private _isLoaded = false;
  private _currentDictionary: string | null = null;

  get isLoaded() {
    return this._isLoaded;
  }

  get currentDictionary() {
    return this._currentDictionary;
  }

  private createWorker(): Worker {
    const worker = new Worker(
      new URL("../workers/dictionary.worker.ts", import.meta.url),
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      const pending = this.pendingRequests.shift();
      if (!pending) return;

      if (msg.type === "error" || msg.type === "load-error") {
        pending.reject(new Error("error" in msg ? msg.error : "Unknown error"));
      } else {
        pending.resolve(msg);
      }
    };

    worker.onerror = (error) => {
      // Reject all pending requests
      const pending = [...this.pendingRequests];
      this.pendingRequests = [];
      for (const p of pending) {
        p.reject(new Error(`Worker error: ${error.message}`));
      }

      // Attempt restart
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.worker?.terminate();
        this.worker = this.createWorker();

        // Re-load dictionary if it was loaded before
        if (this._currentDictionary) {
          this.load(this._currentDictionary).catch(() => {});
        }
      }
    };

    return worker;
  }

  private send(msg: WorkerRequest): Promise<WorkerResponse> {
    if (!this.worker) {
      this.worker = this.createWorker();
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.push({
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.worker!.postMessage(msg);
    });
  }

  async load(dictionary: string): Promise<number> {
    this._isLoaded = false;
    this._currentDictionary = dictionary;
    const response = await this.send({ type: "load", dictionary });
    if (response.type === "loaded") {
      this._isLoaded = true;
      this.retryCount = 0;
      return response.wordCount;
    }
    throw new Error("Unexpected response");
  }

  async solve(board: string[][], gridSize: GridSize): Promise<WordWithPath[]> {
    const response = await this.send({ type: "solve", board, gridSize });
    if (response.type === "solved") {
      return response.words;
    }
    throw new Error("Unexpected response");
  }

  async checkWord(word: string): Promise<boolean> {
    const response = await this.send({ type: "isWord", word });
    if (response.type === "isWord") {
      return response.result;
    }
    throw new Error("Unexpected response");
  }

  async checkPrefix(prefix: string): Promise<boolean> {
    const response = await this.send({ type: "isPrefix", prefix });
    if (response.type === "isPrefix") {
      return response.result;
    }
    throw new Error("Unexpected response");
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this._isLoaded = false;
    this.pendingRequests = [];
  }
}

// Singleton
let instance: DictionaryAPI | null = null;

export function getDictionaryAPI(): DictionaryAPI {
  if (!instance) {
    instance = new DictionaryAPI();
  }
  return instance;
}
