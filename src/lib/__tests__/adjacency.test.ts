import { describe, it, expect } from "vitest";
import { isAdjacent, getAdjacentPositions } from "../adjacency";
import type { Position } from "../types";

describe("isAdjacent", () => {
  it("should return true for horizontally adjacent cells", () => {
    expect(isAdjacent([0, 0], [0, 1])).toBe(true);
    expect(isAdjacent([1, 2], [1, 3])).toBe(true);
  });

  it("should return true for vertically adjacent cells", () => {
    expect(isAdjacent([0, 0], [1, 0])).toBe(true);
  });

  it("should return true for diagonally adjacent cells", () => {
    expect(isAdjacent([0, 0], [1, 1])).toBe(true);
    expect(isAdjacent([2, 2], [1, 1])).toBe(true);
  });

  it("should return false for the same cell", () => {
    expect(isAdjacent([1, 1], [1, 1])).toBe(false);
  });

  it("should return false for non-adjacent cells", () => {
    expect(isAdjacent([0, 0], [0, 2])).toBe(false);
    expect(isAdjacent([0, 0], [2, 0])).toBe(false);
    expect(isAdjacent([0, 0], [2, 2])).toBe(false);
  });
});

describe("getAdjacentPositions", () => {
  it("should return 3 neighbors for a corner cell (4x4)", () => {
    const neighbors = getAdjacentPositions([0, 0], 4);
    expect(neighbors.length).toBe(3);
  });

  it("should return 5 neighbors for an edge cell (4x4)", () => {
    const neighbors = getAdjacentPositions([0, 1], 4);
    expect(neighbors.length).toBe(5);
  });

  it("should return 8 neighbors for a center cell (4x4)", () => {
    const neighbors = getAdjacentPositions([1, 1], 4);
    expect(neighbors.length).toBe(8);
  });

  it("should return 8 neighbors for a center cell (5x5)", () => {
    const neighbors = getAdjacentPositions([2, 2], 5);
    expect(neighbors.length).toBe(8);
  });

  it("should not include the cell itself", () => {
    const pos: Position = [1, 1];
    const neighbors = getAdjacentPositions(pos, 4);
    for (const n of neighbors) {
      expect(n[0] === pos[0] && n[1] === pos[1]).toBe(false);
    }
  });
});
