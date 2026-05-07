import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { KonvaEventObject } from "konva/lib/Node";
import type { RungMarker } from "../../models/rungMarker";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";
import { useSnapGrid } from "./useSnapGrid";
import { PIXELS_PER_MM, RUNG_COUNT, RUNG_TOP_MARGIN, RUNG_BOTTOM_MARGIN } from "../../lib/constants";

export function useRungMarkerTool() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const { snap } = useSnapGrid();
  const addElements = useProjectStore((s) => s.addElements);
  const getSheet = useProjectStore((s) => s.getSheet);
  const getActiveLayer = useProjectStore((s) => s.getActiveLayer);

  const handleClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "rungColumn") return;

      const sheetId = useCanvasStore.getState().activeSheetId;
      if (!sheetId) return;

      const stage = e.target.getStage();
      const raw = stage?.getRelativePointerPosition() ?? { x: 0, y: 0 };
      const { x: ox, y: oy } = useCanvasStore.getState().multiSheetOffset;
      const pos = snap({ x: raw.x - ox, y: raw.y - oy });

      const sheet = getSheet(sheetId);
      if (!sheet) return;

      const layerId = getActiveLayer(sheetId)?.id ?? sheet.layers[0]?.id ?? "";
      const sheetHeightPx = sheet.height * PIXELS_PER_MM;
      const available = sheetHeightPx - RUNG_TOP_MARGIN - RUNG_BOTTOM_MARGIN;
      const spacing = available / (RUNG_COUNT - 1);

      // Continue from the highest existing rung number on this sheet
      const existingMarkers = sheet.elements.filter(
        (el): el is RungMarker => el.type === "rungMarker"
      );
      const startNumber =
        existingMarkers.length > 0
          ? Math.max(...existingMarkers.map((m) => m.number)) + 1
          : 100;

      const newMarkers: RungMarker[] = Array.from({ length: RUNG_COUNT }, (_, i) => ({
        id: uuidv4(),
        type: "rungMarker" as const,
        sheetId,
        layerId,
        x: pos.x,
        y: Math.round(RUNG_TOP_MARGIN + i * spacing),
        number: startNumber + i,
      }));

      addElements(sheetId, newMarkers);
    },
    [activeTool, snap, getSheet, getActiveLayer, addElements]
  );

  return { handleClick };
}
