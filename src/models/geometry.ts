export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = "top" | "bottom" | "left" | "right";

export const DIRECTIONS: Direction[] = ["top", "right", "bottom", "left"];

export function rotateDirection(dir: Direction, degrees: number): Direction {
  const steps = Math.round(degrees / 90) % 4;
  const idx = DIRECTIONS.indexOf(dir);
  return DIRECTIONS[((idx + steps) % 4 + 4) % 4];
}
