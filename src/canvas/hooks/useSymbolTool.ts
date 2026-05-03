import { useCallback } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Point } from "../../models/geometry";
import { useCanvasStore } from "../../store/canvasStore";
import { useSnapGrid } from "./useSnapGrid";

export function useSymbolTool() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const pendingSymbolDefinitionId = useCanvasStore((s) => s.pendingSymbolDefinitionId);
  const pendingSymbolRotation = useCanvasStore((s) => s.pendingSymbolRotation);
  const setGhostPosition = useCanvasStore((s) => s.setGhostPosition);
  const setPendingPlacement = useCanvasStore((s) => s.setPendingPlacement);
  const { snap } = useSnapGrid();

  const getPos = useCallback(
    (e: KonvaEventObject<MouseEvent>): Point => {
      const raw = e.target.getStage()?.getRelativePointerPosition() ?? { x: 0, y: 0 };
      const { x: ox, y: oy } = useCanvasStore.getState().multiSheetOffset;
      return snap({ x: raw.x - ox, y: raw.y - oy });
    },
    [snap]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "symbol" || !pendingSymbolDefinitionId) return;
      setGhostPosition(getPos(e));
    },
    [activeTool, pendingSymbolDefinitionId, setGhostPosition, getPos]
  );

  const handleClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "symbol" || !pendingSymbolDefinitionId) return;
      // Only place on background clicks (not on top of existing elements)
      const targetName = e.target.name();
      if (targetName !== "sheet-bg" && e.target !== e.target.getStage()) {
        const stage = e.target.getStage();
        if (!stage) return;
      }
      const pos = getPos(e);
      setPendingPlacement({ pos, definitionId: pendingSymbolDefinitionId, rotation: pendingSymbolRotation });
    },
    [activeTool, pendingSymbolDefinitionId, pendingSymbolRotation, getPos, setPendingPlacement]
  );

  return { handleMouseMove, handleClick };
}
