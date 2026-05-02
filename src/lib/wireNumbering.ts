import type { Wire, WireNumberFormat } from "../models/wire";
import type { Point } from "../models/geometry";

const SNAP_TOLERANCE = 2;

function pointsEqual(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < SNAP_TOLERANCE && Math.abs(a.y - b.y) < SNAP_TOLERANCE;
}

function formatNumber(n: number, fmt: WireNumberFormat): string {
  const padded = String(n).padStart(fmt.padLength, "0");
  return `${fmt.prefix}${padded}${fmt.suffix}`;
}

class UnionFind {
  private parent: number[];
  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }
  find(i: number): number {
    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }
  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[ra] = rb;
  }
}

export function computeNets(wires: Wire[]): Map<string, string> {
  const uf = new UnionFind(wires.length);

  for (let i = 0; i < wires.length; i++) {
    for (let j = i + 1; j < wires.length; j++) {
      const a = wires[i];
      const b = wires[j];
      const aEnd = a.points[a.points.length - 1];
      const bStart = b.points[0];
      const bEnd = b.points[b.points.length - 1];
      const aStart = a.points[0];
      if (
        pointsEqual(aEnd, bStart) ||
        pointsEqual(aEnd, bEnd) ||
        pointsEqual(aStart, bStart) ||
        pointsEqual(aStart, bEnd)
      ) {
        uf.union(i, j);
      }
    }
  }

  // Map wireId → netId (root index as string)
  const result = new Map<string, string>();
  for (let i = 0; i < wires.length; i++) {
    result.set(wires[i].id, String(uf.find(i)));
  }
  return result;
}

export function assignWireNumbers(wires: Wire[], format: WireNumberFormat): Wire[] {
  const netMap = computeNets(wires);
  const netToNumber = new Map<string, string>();
  let counter = format.startNumber;

  return wires.map((wire) => {
    const netId = netMap.get(wire.id) ?? wire.id;
    if (!netToNumber.has(netId)) {
      netToNumber.set(netId, formatNumber(counter, format));
      counter += format.increment;
    }
    return { ...wire, netId, number: netToNumber.get(netId)! };
  });
}

export function nextWireNumber(existingNumbers: string[], format: WireNumberFormat): string {
  const usedNums = new Set(
    existingNumbers
      .map((n) => {
        const stripped = n.replace(format.prefix, "").replace(format.suffix, "");
        return parseInt(stripped, 10);
      })
      .filter((n) => !isNaN(n))
  );

  let n = format.startNumber;
  while (usedNums.has(n)) n += format.increment;
  return formatNumber(n, format);
}
