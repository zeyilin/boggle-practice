import { describe, it, expect } from "vitest";
import { generateBoard } from "../dice";

describe("generateBoard", () => {
  it("should generate a 4x4 board", () => {
    const board = generateBoard(4);
    expect(board.length).toBe(4);
    for (const row of board) {
      expect(row.length).toBe(4);
    }
  });

  it("should generate a 5x5 board", () => {
    const board = generateBoard(5);
    expect(board.length).toBe(5);
    for (const row of board) {
      expect(row.length).toBe(5);
    }
  });

  it("should only contain valid letters or Qu", () => {
    const board = generateBoard(4);
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toMatch(/^([A-Z]|Qu)$/);
      }
    }
  });

  it("should produce different boards on different calls", () => {
    // Run multiple times — at least one pair should differ
    const boards = Array.from({ length: 5 }, () =>
      generateBoard(4).flat().join(","),
    );
    const unique = new Set(boards);
    expect(unique.size).toBeGreaterThan(1);
  });
});
