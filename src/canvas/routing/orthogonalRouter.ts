import type { Point } from "../../models/geometry";

export function routeOrthogonal(start: Point, end: Point): Point[] {
  if (Math.abs(start.x - end.x) < 1 && Math.abs(start.y - end.y) < 1) {
    return [start];
  }

  const midX = start.x + (end.x - start.x) / 2;

  // Prefer horizontal-first routing (standard for ladder diagrams)
  return [
    start,
    { x: midX, y: start.y },
    { x: midX, y: end.y },
    end,
  ];
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(p: Point, gridSize: number): Point {
  return { x: snapToGrid(p.x, gridSize), y: snapToGrid(p.y, gridSize) };
}
