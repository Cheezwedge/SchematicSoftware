import { Fragment } from "react";
import { Layer, Line, Text, Circle } from "react-konva";
import type Konva from "konva";
import type { Wire } from "../models/wire";
import type { Sheet } from "../models/sheet";
import { useCanvasStore } from "../store/canvasStore";
import { useProjectStore } from "../store/projectStore";
import { snapToGrid } from "./routing/orthogonalRouter";

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
  const activeTool = useCanvasStore((s) => s.activeTool);
  const updateElement = useProjectStore((s) => s.updateElement);
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);

  const wires = sheet.elements.filter((e): e is Wire => e.type === "wire");
  const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));

  const handleWireDragEnd = (wire: Wire, e: Konva.KonvaEventObject<DragEvent>) => {
    const dx = snapToGrid(e.target.x(), gridSize);
    const dy = snapToGrid(e.target.y(), gridSize);
    if (dx === 0 && dy === 0) return;
    const newPoints = wire.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    e.target.x(0);
    e.target.y(0);
    updateElement(sheet.id, wire.id, { points: newPoints });
  };

  return (
    <Layer>
      {wires.map((wire) => {
        const layer = layerMap.get(wire.layerId);
        if (layer && !layer.visible) return null;
        const isSelected = selectedIds.has(wire.id);
        const flat = flattenPoints(wire.points);
        const mid = wireMidpoint(wire);
        const isDraggable = activeTool === "select";

        return (
          <Fragment key={wire.id}>
            <Line
              points={flat}
              stroke={wire.color}
              strokeWidth={isSelected ? 3 : 1.5}
              hitStrokeWidth={10}
              onClick={() => setSelection([wire.id])}
              draggable={isDraggable}
              onDragEnd={(e) => handleWireDragEnd(wire, e)}
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
