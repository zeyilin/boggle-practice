import { describe, it, expect } from "vitest";
import { solveBoard } from "../solver";
import { buildTrie } from "../trie";

describe("solveBoard", () => {
  // A known 4x4 board for testing:
  //   T  A  P  E
  //   R  S  E  N
  //   I  L  D  O
  //   N  G  E  T
  const board = [
    ["T", "A", "P", "E"],
    ["R", "S", "E", "N"],
    ["I", "L", "D", "O"],
    ["N", "G", "E", "T"],
  ];

  // Small dictionary for deterministic testing
  const words = [
    "TAP",
    "TAPE",
    "TAPES",
    "APE",
    "APES",
    "PEN",
    "PENS",
    "SLED",
    "SLED",
    "SLID",
    "GLEN",
    "DENSE",
    "NODE",
    "NODES",
    "DONE",
    "ARS",
    "TAR",
    "TARS",
    "RASP",
    "LED",
    "GEL",
    "GELD",
    "NEST",
    // Words that should NOT be findable on this board
    "ZEBRA",
    "QUICK",
  ];

  const trie = buildTrie(words);

  it("should find valid words on the board", () => {
    const results = solveBoard(board, 4, trie);
    const foundWords = results.map((r) => r.word);

    expect(foundWords).toContain("TAP");
    expect(foundWords).toContain("TAPE");
    expect(foundWords).toContain("APE");
    expect(foundWords).toContain("PEN");
    expect(foundWords).toContain("ARS");
  });

  it("should not find words that cannot be traced on the board", () => {
    const results = solveBoard(board, 4, trie);
    const foundWords = results.map((r) => r.word);

    expect(foundWords).not.toContain("ZEBRA");
    expect(foundWords).not.toContain("QUICK");
  });

  it("should include valid paths for each word", () => {
    const results = solveBoard(board, 4, trie);
    const tap = results.find((r) => r.word === "TAP");

    expect(tap).toBeDefined();
    expect(tap!.path.length).toBe(3);
    // T is at [0,0], A at [0,1], P at [0,2]
    expect(tap!.path[0]).toEqual([0, 0]);
    expect(tap!.path[1]).toEqual([0, 1]);
    expect(tap!.path[2]).toEqual([0, 2]);
  });

  it("should not include words shorter than minimum length", () => {
    const results = solveBoard(board, 4, trie);
    for (const r of results) {
      expect(r.word.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("should respect minimum length for 5x5 boards", () => {
    // Use a 5x5 board (just pad our board for testing)
    const board5 = [
      ["T", "A", "P", "E", "S"],
      ["R", "S", "E", "N", "O"],
      ["I", "L", "D", "O", "T"],
      ["N", "G", "E", "T", "A"],
      ["A", "B", "C", "D", "E"],
    ];
    const results = solveBoard(board5, 5, trie);
    for (const r of results) {
      expect(r.word.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("should handle a board with Qu tile", () => {
    const quBoard = [
      ["Qu", "I", "T", "E"],
      ["A", "S", "E", "N"],
      ["R", "L", "D", "O"],
      ["N", "G", "E", "T"],
    ];

    const quWords = ["QUITE", "QUIT", "QUIST"];
    const quTrie = buildTrie(quWords);
    const results = solveBoard(quBoard, 4, quTrie);
    const foundWords = results.map((r) => r.word);

    // QUIT: Qu(0,0) -> I(0,1) -> T(0,2) — that's "QUIT" (4 letters)
    expect(foundWords).toContain("QUIT");
  });

  it("should return results sorted by length descending", () => {
    const results = solveBoard(board, 4, trie);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].word.length).toBeLessThanOrEqual(
        results[i - 1].word.length,
      );
    }
  });
});
