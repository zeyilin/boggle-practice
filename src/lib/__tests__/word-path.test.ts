import { describe, it, expect } from "vitest";
import {
  canExtendPath,
  deleteTypedLetter,
  findWordPath,
  normalizeTypedWord,
  pathToWord,
  tileLetters,
} from "../word-path";
import { isAdjacent } from "../adjacency";
import type { Position } from "../types";

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

const quBoard = [
  ["Qu", "I", "T", "E"],
  ["A", "B", "C", "D"],
  ["E", "F", "G", "H"],
  ["I", "J", "K", "L"],
];

function isValidPath(path: Position[]): boolean {
  const seen = new Set(path.map(([r, c]) => `${r},${c}`));
  if (seen.size !== path.length) return false;
  return path.every((p, i) => i === 0 || isAdjacent(path[i - 1], p));
}

describe("tileLetters", () => {
  it("expands the Qu tile", () => {
    expect(tileLetters("Qu")).toBe("QU");
    expect(tileLetters("A")).toBe("A");
  });
});

describe("pathToWord", () => {
  it("spells the traced tiles", () => {
    expect(
      pathToWord(board, [
        [0, 0],
        [0, 1],
        [0, 2],
      ]),
    ).toBe("TAP");
  });

  it("spells Qu as QU", () => {
    expect(
      pathToWord(quBoard, [
        [0, 0],
        [0, 1],
        [0, 2],
      ]),
    ).toBe("QUIT");
  });
});

describe("canExtendPath", () => {
  it("lets any tile start a path", () => {
    expect(canExtendPath([], [3, 3])).toBe(true);
  });

  it("requires adjacency to the last tile", () => {
    expect(canExtendPath([[0, 0]], [1, 1])).toBe(true);
    expect(canExtendPath([[0, 0]], [0, 2])).toBe(false);
  });

  it("rejects reusing a tile", () => {
    expect(
      canExtendPath(
        [
          [0, 0],
          [0, 1],
        ],
        [0, 0],
      ),
    ).toBe(false);
  });
});

describe("findWordPath", () => {
  it("finds a straight path", () => {
    expect(findWordPath(board, "TAPE")).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ]);
  });

  it("finds a path that turns and goes diagonal", () => {
    const path = findWordPath(board, "SLED");
    expect(path).not.toBeNull();
    expect(pathToWord(board, path!)).toBe("SLED");
    expect(isValidPath(path!)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(findWordPath(board, "tap")).toEqual(findWordPath(board, "TAP"));
  });

  it("returns null when letters aren't adjacent", () => {
    // The only A (0,1) and the only O (2,3) are not adjacent
    expect(findWordPath(board, "AO")).toBeNull();
  });

  it("returns null when a tile would be reused", () => {
    // Only one A on the board
    expect(findWordPath(board, "TATA")).toBeNull();
  });

  it("returns null for letters not on the board", () => {
    expect(findWordPath(board, "ZOO")).toBeNull();
    expect(findWordPath(board, "")).toBeNull();
  });

  it("backtracks when the first candidate tile is a dead end", () => {
    // From C, the A at (0,1) is tried first but has no adjacent T;
    // the A at (1,0) does.
    const small = [
      ["C", "A", "X"],
      ["A", "X", "X"],
      ["T", "X", "X"],
    ];
    expect(findWordPath(small, "CAT")).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
  });

  it("matches Qu as a single tile", () => {
    expect(findWordPath(quBoard, "QUIT")).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
    ]);
  });

  it("can't use half of a Qu tile", () => {
    // Typing just "Q" or "QI" never matches the Qu tile
    expect(findWordPath(quBoard, "Q")).toBeNull();
    expect(findWordPath(quBoard, "QI")).toBeNull();
  });
});

describe("normalizeTypedWord", () => {
  it("uppercases and strips non-letters", () => {
    expect(normalizeTypedWord("ca t1!")).toBe("CAT");
  });

  it("expands a trailing Q to QU", () => {
    expect(normalizeTypedWord("q")).toBe("QU");
    expect(normalizeTypedWord("SQ")).toBe("SQU");
  });

  it("leaves an existing QU alone", () => {
    expect(normalizeTypedWord("QU")).toBe("QU");
    expect(normalizeTypedWord("QUIT")).toBe("QUIT");
  });
});

describe("deleteTypedLetter", () => {
  it("deletes one letter", () => {
    expect(deleteTypedLetter("CAT")).toBe("CA");
    expect(deleteTypedLetter("")).toBe("");
  });

  it("deletes QU as a single letter", () => {
    expect(deleteTypedLetter("SQU")).toBe("S");
    expect(deleteTypedLetter("QUIT")).toBe("QUI");
  });
});
