import { useProjectStore } from "../../store/projectStore";
import { snapPointToGrid } from "../routing/orthogonalRouter";
import type { Point } from "../../models/geometry";

export function useSnapGrid() {
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);
  const snapEnabled = useProjectStore((s) => s.project.settings.snapEnabled);
  const snapIncrement = useProjectStore((s) => s.project.settings.snapIncrement);

  return {
    snap: (p: Point): Point =>
      snapEnabled ? snapPointToGrid(p, snapIncrement) : p,
    gridSize,
    snapIncrement,
    snapEnabled,
  };
}
