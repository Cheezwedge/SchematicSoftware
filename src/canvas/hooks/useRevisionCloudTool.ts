import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type Konva from "konva";
import type { Point } from "../../models/geometry";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";
import { snapPointToGrid } from "../routing/orthogonalRouter";

export function useRevisionCloudTool(sheetId: string) {
  const [cloudPoints, setCloudPoints] = useState<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const addElement = useProjectStore((s) => s.addElement);
  const getActiveLayer = useProjectStore((s) => s.getActiveLayer);
  const getSheet = useProjectStore((s) => s.getSheet);
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);

  const getPos = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): Point => {
      const stage = e.target.getStage();
      const raw = stage?.getRelativePointerPosition() ?? { x: 0, y: 0 };
      return snapPointToGrid(raw, gridSize);
    },
    [gridSize]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "revisionCloud") return;
      setCursorPos(getPos(e));
    },
    [activeTool, getPos]
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "revisionCloud") return;
      setCloudPoints((pts) => [...pts, getPos(e)]);
    },
    [activeTool, getPos]
  );

  const handleDoubleClick = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "revisionCloud") return;

      // The click event preceding dblclick already added one extra point — remove it
      const finalPts = cloudPoints.length > 0 ? cloudPoints.slice(0, -1) : cloudPoints;
      if (finalPts.length < 3) {
        setCloudPoints(finalPts);
        return;
      }

      const label = window.prompt("Revision label:", "Rev A") ?? "Rev A";

      const layer = getActiveLayer(sheetId);
      const sheet = getSheet(sheetId);
      addElement(sheetId, {
        id: uuidv4(),
        type: "revisionCloud",
        sheetId,
        layerId: layer?.id ?? sheet?.layers[0]?.id ?? "",
        points: finalPts,
        arcRadius: 8,
        label: label.trim() || "Rev",
        printable: false,
      });

      setCloudPoints([]);
      setCursorPos(null);
      setActiveTool("select");
    },
    [activeTool, cloudPoints, sheetId, getActiveLayer, getSheet, addElement, setActiveTool]
  );

  const cancel = useCallback(() => {
    setCloudPoints([]);
    setCursorPos(null);
  }, []);

  return { cloudPoints, cursorPos, handleMouseMove, handleClick, handleDoubleClick, cancel };
}
