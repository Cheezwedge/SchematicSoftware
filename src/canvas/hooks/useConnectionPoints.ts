import { useProjectStore } from "../../store/projectStore";
import { useLibraryStore } from "../../store/libraryStore";
import { resolveConnectionPoints } from "../../lib/transforms";
import type { Point } from "../../models/geometry";
import type { ResolvedConnectionPoint } from "../../models/symbol";
import type { SymbolInstance } from "../../models/symbol";

const SNAP_THRESHOLD = 12;

export function useConnectionPoints(sheetId: string) {
  const sheet = useProjectStore((s) => s.getSheet(sheetId));
  const libraries = useLibraryStore((s) => s.libraries);
  const getSymbolById = (id: string) =>
    libraries.flatMap((l) => l.symbols).find((s) => s.id === id);

  function getAllConnectionPoints(): (ResolvedConnectionPoint & { instanceId: string })[] {
    if (!sheet) return [];
    const symbols = sheet.elements.filter((e): e is SymbolInstance => e.type === "symbol");
    return symbols.flatMap((inst) => {
      const def = getSymbolById(inst.definitionId);
      if (!def) return [];
      const resolved = resolveConnectionPoints(def.connectionPoints, inst.x, inst.y, inst.rotation);
      return resolved.map((rcp) => ({ ...rcp, instanceId: inst.id }));
    });
  }

  function snapToNearestConnectionPoint(p: Point): (ResolvedConnectionPoint & { instanceId: string }) | null {
    const allPoints = getAllConnectionPoints();
    let nearest: (typeof allPoints)[0] | null = null;
    let minDist = SNAP_THRESHOLD;

    for (const cp of allPoints) {
      const dx = p.x - cp.worldX;
      const dy = p.y - cp.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = cp;
      }
    }

    return nearest;
  }

  return { getAllConnectionPoints, snapToNearestConnectionPoint };
}
