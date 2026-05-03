import type { ReactElement } from "react";
import { Layer, Line, Circle } from "react-konva";
import { useProjectStore } from "../store/projectStore";
import { useThemeStore } from "../store/themeStore";

interface Props {
  width: number;
  height: number;
}

export function GridLayer({ width, height }: Props) {
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);
  const showGrid = useProjectStore((s) => s.project.settings.showGrid);
  const theme = useThemeStore((s) => s.theme);

  if (!showGrid) return <Layer listening={false} />;

  const PIXEL_GRID = gridSize * 4;
  const MAJOR = PIXEL_GRID * 5;

  const minorColor = theme === "dark" ? "#2e2e2e" : "#e0e0e0";
  const majorColor = theme === "dark" ? "#404040" : "#c0c0c0";
  const dotColor   = theme === "dark" ? "#505050" : "#aaaaaa";

  const lines: ReactElement[] = [];

  for (let x = 0; x <= width; x += PIXEL_GRID) {
    const isMajor = Math.round(x / PIXEL_GRID) % 5 === 0;
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, height]}
        stroke={isMajor ? majorColor : minorColor}
        strokeWidth={isMajor ? 0.6 : 0.3}
        listening={false}
      />
    );
  }

  for (let y = 0; y <= height; y += PIXEL_GRID) {
    const isMajor = Math.round(y / PIXEL_GRID) % 5 === 0;
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, width, y]}
        stroke={isMajor ? majorColor : minorColor}
        strokeWidth={isMajor ? 0.6 : 0.3}
        listening={false}
      />
    );
  }

  const dots: ReactElement[] = [];
  for (let x = 0; x <= width; x += MAJOR) {
    for (let y = 0; y <= height; y += MAJOR) {
      dots.push(
        <Circle key={`d${x}${y}`} x={x} y={y} radius={1} fill={dotColor} listening={false} />
      );
    }
  }

  return (
    <Layer listening={false}>
      {lines}
      {dots}
    </Layer>
  );
}
