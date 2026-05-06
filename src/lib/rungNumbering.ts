import type { Wire } from "../models/wire";
import type { Sheet } from "../models/sheet";
import type { RungNumberFormat } from "../models/project";

export interface RungInfo {
  number: number;
  y: number;
  label: string;
}

const HORIZONTAL_TOLERANCE = 2;
const RUNG_WIRE_MIN_LENGTH = 50;

function isHorizontal(wire: Wire): boolean {
  const start = wire.points[0];
  const end = wire.points[wire.points.length - 1];
  return Math.abs(start.y - end.y) < HORIZONTAL_TOLERANCE;
}

function wireLength(wire: Wire): number {
  let len = 0;
  for (let i = 1; i < wire.points.length; i++) {
    const dx = wire.points[i].x - wire.points[i - 1].x;
    const dy = wire.points[i].y - wire.points[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

export function detectRungs(sheet: Sheet, format: RungNumberFormat, sheetIndex: number): RungInfo[] {
  const wires = sheet.elements.filter((e): e is Wire => e.type === "wire");
  const horizontalWires = wires
    .filter((w) => isHorizontal(w) && wireLength(w) >= RUNG_WIRE_MIN_LENGTH)
    .sort((a, b) => a.points[0].y - b.points[0].y);

  const rungs: RungInfo[] = [];
  let counter = (sheetIndex + 1) * 100;

  for (const wire of horizontalWires) {
    const y = wire.points[0].y;
    rungs.push({ number: counter, y, label: String(counter) });
    counter += format.increment;
  }

  return rungs;
}
