import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type Konva from "konva";
import type { Wire } from "../../models/wire";
import type { Point } from "../../models/geometry";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";
import { DEFAULT_WIRE_COLOR, DEFAULT_WIRE_GAUGE } from "../../models/wire";
import { nextWireNumber } from "../../lib/wireNumbering";
import { useSnapGrid } from "./useSnapGrid";

type RungState = "idle" | "drawing";

export function useRungTool(sheetId: string) {
  const [state, setState] = useState<RungState>("idle");
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewEnd, setPreviewEnd] = useState<Point | null>(null);

  const { snap } = useSnapGrid();
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const addElement = useProjectStore((s) => s.addElement);
  const getSheet = useProjectStore((s) => s.getSheet);
  const getActiveLayer = useProjectStore((s) => s.getActiveLayer);
  const settings = useProjectStore((s) => s.project.settings);

  const isRung = activeTool === "rungH" || activeTool === "rungV";
  const isH = activeTool === "rungH";

  const getPos = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): Point => {
      const stage = e.target.getStage();
      const raw = stage?.getRelativePointerPosition() ?? { x: 0, y: 0 };
      return snap(raw);
    },
    [snap]
  );

  // Constrain end point to be purely horizontal or vertical from start
  const constrain = useCallback(
    (end: Point, start: Point): Point =>
      isH ? { x: end.x, y: start.y } : { x: start.x, y: end.y },
    [isH]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isRung) return;

      const pos = getPos(e);

      if (state === "idle") {
        setStartPoint(pos);
        setPreviewEnd(pos);
        setState("drawing");
        return;
      }

      if (state === "drawing" && startPoint) {
        const end = constrain(pos, startPoint);
        const sheet = getSheet(sheetId);
        const layerId =
          activeLayerId ??
          getActiveLayer(sheetId)?.id ??
          sheet?.layers[0]?.id ??
          "";

        const existingNums = (sheet?.elements ?? [])
          .filter((el): el is Wire => el.type === "wire")
          .map((w) => w.number);

        const wire: Wire = {
          id: uuidv4(),
          type: "wire",
          layerId,
          sheetId,
          points: [startPoint, end],
          color: settings.defaultWireColor ?? DEFAULT_WIRE_COLOR,
          gauge: settings.defaultWireGauge ?? DEFAULT_WIRE_GAUGE,
          number: nextWireNumber(existingNums, settings.wireNumberFormat),
          netId: uuidv4(),
        };
        addElement(sheetId, wire);

        // Chain: next rung starts where this one ended
        setStartPoint(end);
        setPreviewEnd(end);
      }
    },
    [isRung, state, startPoint, getPos, constrain, sheetId, activeLayerId, getSheet, getActiveLayer, settings, addElement]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isRung || state !== "drawing" || !startPoint) return;
      setPreviewEnd(constrain(getPos(e), startPoint));
    },
    [isRung, state, startPoint, getPos, constrain]
  );

  const handleDoubleClick = useCallback(() => {
    if (!isRung) return;
    setState("idle");
    setStartPoint(null);
    setPreviewEnd(null);
  }, [isRung]);

  const cancel = useCallback(() => {
    setState("idle");
    setStartPoint(null);
    setPreviewEnd(null);
  }, []);

  const previewPoints =
    state === "drawing" && startPoint && previewEnd
      ? [startPoint.x, startPoint.y, previewEnd.x, previewEnd.y]
      : [];

  return { isDrawingRung: state === "drawing", previewPoints, handleMouseDown, handleMouseMove, handleDoubleClick, cancel };
}
