import type { RungMarker } from "../models/rungMarker";
import type { Sheet } from "../models/sheet";

/**
 * Returns the rung number label of the RungMarker nearest to (x, y) on the
 * sheet, using Euclidean distance so columns on the right "own" nearby devices.
 * Returns null if the sheet has no rung markers.
 */
export function rungNumberForXY(sheet: Sheet, x: number, y: number): string | null {
  const markers = sheet.elements.filter((e): e is RungMarker => e.type === "rungMarker");
  if (markers.length === 0) return null;
  const nearest = markers.reduce((best, m) =>
    Math.hypot(m.x - x, m.y - y) < Math.hypot(best.x - x, best.y - y) ? m : best
  );
  return String(nearest.number);
}
