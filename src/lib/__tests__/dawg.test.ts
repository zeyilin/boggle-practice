// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import {
  buildTrie,
  serializeTrie,
  loadTrie,
  isWord,
  isPrefix,
  type Trie,
} from "../trie";
import { solveBoard } from "../solver";
import { generateBoard } from "../dice";
import type { GridSize } from "../types";
import {
  refBuildTrie,
  refIsWord,
  refIsPrefix,
  refSolveBoard,
  type RefTrie,
} from "./reference-solver";

const DICT_DIR = path.join(__dirname, "../../../public/dictionaries");

/** Copy a Node Buffer into its own exactly-sized ArrayBuffer. */
function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}

/** Small deterministic PRNG (mulberry32) so board sets are reproducible. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Roll boards with the real dice, driven by a seeded Math.random. */
function seededBoards(gridSize: GridSize, count: number, seed: number) {
  const spy = vi.spyOn(Math, "random").mockImplementation(seededRandom(seed));
  try {
    return Array.from({ length: count }, () => generateBoard(gridSize));
  } finally {
    spy.mockRestore();
  }
}

describe("packed DAWG format", () => {
  const words = ["CARS", "CAT", "CAR", "SLED", "DOG", "SLED", "CARD", "DO"];

  it("should round-trip through serialize/load", () => {
    const trie = buildTrie(words);
    const loaded = loadTrie(toArrayBuffer(serializeTrie(trie)));

    expect(loaded.wordCount).toBe(7);
    expect(loaded.root).toBe(trie.root);
    expect(Array.from(loaded.edges)).toEqual(Array.from(trie.edges));
    for (const w of ["CAT", "CARD", "SLED", "DO"]) {
      expect(isWord(loaded, w)).toBe(true);
    }
    expect(isWord(loaded, "CA")).toBe(false);
    expect(isPrefix(loaded, "SLE")).toBe(true);
    expect(isPrefix(loaded, "SLEDS")).toBe(false);
  });

  it("should handle an empty word list", () => {
    const trie = loadTrie(toArrayBuffer(serializeTrie(buildTrie([]))));
    expect(trie.wordCount).toBe(0);
    expect(isWord(trie, "A")).toBe(false);
    expect(isPrefix(trie, "A")).toBe(false);
    expect(isPrefix(trie, "")).toBe(true);
    expect(solveBoard(seededBoards(4, 1, 0)[0], 4, trie)).toEqual([]);
  });

  it("should reject words outside A–Z", () => {
    expect(() => buildTrie(["cat"])).toThrow(/invalid word/);
    expect(() => buildTrie(["CAT", ""])).toThrow(/invalid word/);
  });

  it("should reject buffers that aren't a DAWG", () => {
    const bytes = serializeTrie(buildTrie(words));

    expect(() => loadTrie(new ArrayBuffer(18))).toThrow(/not a packed DAWG/);
    expect(() => loadTrie(new ArrayBuffer(16))).toThrow(/bad magic/);

    // Still gzipped
    const gz = zlib.gzipSync(bytes);
    const padded = new Uint8Array(Math.ceil(gz.length / 4) * 4);
    padded.set(gz);
    expect(() => loadTrie(padded.buffer)).toThrow(/bad magic/);

    // Byte-swapped, as a big-endian host would see it
    const swapped = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      swapped[i] = bytes[i - (i % 4) + 3 - (i % 4)];
    }
    expect(() => loadTrie(swapped.buffer)).toThrow(/bad magic/);

    // Future format version
    const future = bytes.slice();
    new DataView(future.buffer).setUint32(4, 2, true);
    expect(() => loadTrie(future.buffer)).toThrow(/version 2/);
  });
});

describe("twl06 dictionary", () => {
  let wordList: string[];
  let trie: Trie;
  let ref: RefTrie;

  beforeAll(() => {
    wordList = fs
      .readFileSync(path.join(DICT_DIR, "twl06.txt"), "utf-8")
      .split("\n");
    const gz = fs.readFileSync(path.join(DICT_DIR, "twl06.dawg.gz"));
    trie = loadTrie(toArrayBuffer(zlib.gunzipSync(gz)));
    ref = refBuildTrie(wordList);
  });

  it("should load the committed binary with every word", () => {
    expect(trie.wordCount).toBe(178_590);
    expect(ref.wordCount).toBe(178_590);
  });

  // If this fails, the .txt changed: regenerate with `npm run compile-dicts`
  it("should match a fresh build of twl06.txt", () => {
    const rebuilt = buildTrie(wordList);
    expect(rebuilt.wordCount).toBe(178_590);
    // Buffer.equals: a deep toEqual over ~500k bytes takes seconds
    const same = Buffer.from(serializeTrie(rebuilt)).equals(
      Buffer.from(trie.edges.buffer),
    );
    expect(same).toBe(true);
  });

  it("should agree with the reference trie on isWord/isPrefix", () => {
    expect(wordList.filter((w) => !isWord(trie, w))).toEqual([]);

    // Prefixes and near-misses of every 10th word
    const probes = new Set<string>(["", "Q", "QU", "XYZ"]);
    for (let i = 0; i < wordList.length; i += 10) {
      const w = wordList[i];
      for (let j = 1; j < w.length; j++) probes.add(w.slice(0, j));
      probes.add(w + "S");
      probes.add(w + "Q");
      probes.add(w.slice(1));
      probes.add(w.slice(0, -2) + w.slice(-1));
      probes.add(w.slice(0, 1) + "Z" + w.slice(2));
    }
    for (const p of probes) {
      if (isWord(trie, p) !== refIsWord(ref, p)) {
        expect.fail(`isWord mismatch for ${JSON.stringify(p)}`);
      }
      if (isPrefix(trie, p) !== refIsPrefix(ref, p)) {
        expect.fail(`isPrefix mismatch for ${JSON.stringify(p)}`);
      }
    }
  });

  it("should solve boards identically to the reference solver", () => {
    const boards: [string[][], GridSize][] = [
      ...seededBoards(4, 300, 1).map((b): [string[][], GridSize] => [b, 4]),
      ...seededBoards(5, 100, 2).map((b): [string[][], GridSize] => [b, 5]),
      // Several (adjacent) Qu tiles and dense, word-rich letters
      [
        [
          ["Qu", "Qu", "E", "E"],
          ["I", "T", "S", "Qu"],
          ["E", "R", "A", "N"],
          ["S", "Qu", "I", "T"],
        ],
        4,
      ],
      [
        [
          ["S", "E", "R", "S", "T"],
          ["T", "A", "E", "N", "E"],
          ["R", "E", "S", "I", "D"],
          ["E", "S", "T", "A", "R"],
          ["D", "E", "R", "S", "Qu"],
        ],
        5,
      ],
      [
        [
          ["B", "C", "D", "F"],
          ["G", "H", "J", "K"],
          ["L", "M", "N", "P"],
          ["Qu", "R", "S", "T"],
        ],
        4,
      ],
    ];

    let totalWords = 0;
    for (const [board, size] of boards) {
      const actual = solveBoard(board, size, trie);
      const expected = refSolveBoard(board, size, ref);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        // Only build the (large) structural diff when something differs
        expect({ board, words: actual }).toEqual({ board, words: expected });
      }
      totalWords += actual.length;
    }
    // Sanity check that the boards actually exercise the dictionary
    expect(totalWords).toBeGreaterThan(boards.length * 20);
  });
});
