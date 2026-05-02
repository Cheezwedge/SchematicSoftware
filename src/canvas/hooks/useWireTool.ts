import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Wire } from "../../models/wire";
import type { Point } from "../../models/geometry";
import { routeOrthogonal } from "../routing/orthogonalRouter";
import { useSnapGrid } from "./useSnapGrid";
import { useConnectionPoints } from "./useConnectionPoints";
import { useProjectStore } from "../../store/projectStore";
import { useCanvasStore } from "../../store/canvasStore";
import { DEFAULT_WIRE_COLOR, DEFAULT_WIRE_GAUGE } from "../../models/wire";
import { nextWireNumber } from "../../lib/wireNumbering";

type WireState = "idle" | "drawing";

export function useWireTool(sheetId: string) {
  const [state, setState] = useState<WireState>("idle");
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewPoints, setPreviewPoints] = useState<Point[]>([]);

  const { snap } = useSnapGrid();
  const { snapToNearestConnectionPoint } = useConnectionPoints(sheetId);
  const addElement = useProjectStore((s) => s.addElement);
  const getSheet = useProjectStore((s) => s.getSheet);
  const getActiveLayer = useProjectStore((s) => s.getActiveLayer);
  const settings = useProjectStore((s) => s.project.settings);
  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const activeTool = useCanvasStore((s) => s.activeTool);

  const getPointerPos = useCallback(
    (e: KonvaEventObject<MouseEvent>): Point => {
      const stage = e.target.getStage();
      const pos = stage?.getRelativePointerPosition() ?? { x: 0, y: 0 };
      const cp = snapToNearestConnectionPoint(pos);
      if (cp) return { x: cp.worldX, y: cp.worldY };
      return snap(pos);
    },
    [snap, snapToNearestConnectionPoint]
  );

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "wire") return;
      const pos = getPointerPos(e);

      if (state === "idle") {
        setStartPoint(pos);
        setPreviewPoints([pos]);
        setState("drawing");
      } else if (state === "drawing" && startPoint) {
        const routed = routeOrthogonal(startPoint, pos);
        const sheet = getSheet(sheetId);
        const layerId =
          activeLayerId ??
          getActiveLayer(sheetId)?.id ??
          sheet?.layers[0]?.id ??
          "";

        const existingNumbers = (sheet?.elements ?? [])
          .filter((e): e is Wire => e.type === "wire")
          .map((w) => w.number);

        const number = nextWireNumber(existingNumbers, settings.wireNumberFormat);

        const wire: Wire = {
          id: uuidv4(),
          type: "wire",
          layerId,
          sheetId,
          points: routed,
          color: settings.defaultWireColor ?? DEFAULT_WIRE_COLOR,
          gauge: settings.defaultWireGauge ?? DEFAULT_WIRE_GAUGE,
          number,
          netId: uuidv4(),
        };

        addElement(sheetId, wire);
        setStartPoint(pos);
        setPreviewPoints([pos]);
      }
    },
    [activeTool, state, startPoint, getPointerPos, sheetId, addElement, getSheet, getActiveLayer, activeLayerId, settings]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (state !== "drawing" || !startPoint) return;
      const pos = getPointerPos(e);
      setPreviewPoints(routeOrthogonal(startPoint, pos));
    },
    [state, startPoint, getPointerPos]
  );

  const handleDoubleClick = useCallback(() => {
    setState("idle");
    setStartPoint(null);
    setPreviewPoints([]);
  }, []);

  const cancel = useCallback(() => {
    setState("idle");
    setStartPoint(null);
    setPreviewPoints([]);
  }, []);

  return {
    isDrawing: state === "drawing",
    previewPoints,
    handleMouseDown,
    handleMouseMove,
    handleDoubleClick,
    cancel,
  };
}
