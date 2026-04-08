import type { GridSize, Position } from "./types";

/**
 * Check if two positions are adjacent (including diagonals).
 */
export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

/**
 * Get all adjacent positions for a given position on the grid.
 */
export function getAdjacentPositions(
  pos: Position,
  gridSize: GridSize,
): Position[] {
  const [r, c] = pos;
  const neighbors: Position[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}
