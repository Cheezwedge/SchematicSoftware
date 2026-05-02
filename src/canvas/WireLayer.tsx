import { Layer, Line, Text, Circle } from "react-konva";
import type { Wire } from "../models/wire";
import type { Sheet } from "../models/sheet";
import { useCanvasStore } from "../store/canvasStore";

interface Props {
  sheet: Sheet;
  previewPoints: number[];
  isDrawingWire: boolean;
}

function flattenPoints(points: { x: number; y: number }[]): number[] {
  return points.flatMap((p) => [p.x, p.y]);
}

function wireMidpoint(wire: Wire): { x: number; y: number } {
  const pts = wire.points;
  const mid = Math.floor(pts.length / 2);
  return pts[mid] ?? pts[0];
}

export function WireLayer({ sheet, previewPoints, isDrawingWire }: Props) {
  const selectedIds = useCanvasStore((s) => s.selectedElementIds);
  const setSelection = useCanvasStore((s) => s.setSelection);

  const wires = sheet.elements.filter((e): e is Wire => e.type === "wire");
  const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));

  return (
    <Layer>
      {wires.map((wire) => {
        const layer = layerMap.get(wire.layerId);
        if (layer && !layer.visible) return null;
        const isSelected = selectedIds.has(wire.id);
        const flat = flattenPoints(wire.points);
        const mid = wireMidpoint(wire);

        return (
          <Fragment key={wire.id}>
            <Line
              points={flat}
              stroke={wire.color}
              strokeWidth={isSelected ? 3 : 1.5}
              hitStrokeWidth={8}
              onClick={() => setSelection([wire.id])}
              listening={true}
              lineCap="round"
              lineJoin="round"
            />
            {wire.number && (
              <Text
                x={mid.x + 2}
                y={mid.y - 10}
                text={wire.number}
                fontSize={8}
                fill="#444444"
                listening={false}
              />
            )}
          </Fragment>
        );
      })}

      {isDrawingWire && previewPoints.length >= 4 && (
        <>
          <Line
            points={previewPoints}
            stroke="#0066cc"
            strokeWidth={1.5}
            dash={[4, 3]}
            listening={false}
          />
          <Circle
            x={previewPoints[previewPoints.length - 2]}
            y={previewPoints[previewPoints.length - 1]}
            radius={3}
            fill="#0066cc"
            listening={false}
          />
        </>
      )}
    </Layer>
  );
}

import { Fragment } from "react";
