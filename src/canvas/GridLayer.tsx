import type { ReactElement } from "react";
import { Layer, Line } from "react-konva";
import { useProjectStore } from "../store/projectStore";

interface Props {
  width: number;
  height: number;
}

export function GridLayer({ width, height }: Props) {
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);
  const PIXEL_GRID = gridSize * 4;

  const verticals: ReactElement[] = [];
  const horizontals: ReactElement[] = [];

  for (let x = 0; x <= width; x += PIXEL_GRID) {
    verticals.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, height]}
        stroke="#cccccc"
        strokeWidth={0.5}
        listening={false}
      />
    );
  }

  for (let y = 0; y <= height; y += PIXEL_GRID) {
    horizontals.push(
      <Line
        key={`h${y}`}
        points={[0, y, width, y]}
        stroke="#cccccc"
        strokeWidth={0.5}
        listening={false}
      />
    );
  }

  return (
    <Layer listening={false}>
      {verticals}
      {horizontals}
    </Layer>
  );
}
