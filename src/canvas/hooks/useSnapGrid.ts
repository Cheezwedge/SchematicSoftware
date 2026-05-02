import { useProjectStore } from "../../store/projectStore";
import { snapPointToGrid } from "../routing/orthogonalRouter";
import type { Point } from "../../models/geometry";

export function useSnapGrid() {
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);

  return {
    snap: (p: Point): Point => snapPointToGrid(p, gridSize),
    gridSize,
  };
}
