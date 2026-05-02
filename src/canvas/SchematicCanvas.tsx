import { useRef, useCallback, useEffect, useState } from "react";
import { Stage, Layer, Rect, Circle, Line } from "react-konva";
import type Konva from "konva";
import { GridLayer } from "./GridLayer";
import { WireLayer } from "./WireLayer";
import { SymbolLayer } from "./SymbolLayer";
import { AnnotationLayer } from "./AnnotationLayer";
import { useWireTool } from "./hooks/useWireTool";
import { useSymbolTool } from "./hooks/useSymbolTool";
import { useRevisionCloudTool } from "./hooks/useRevisionCloudTool";
import { useRungTool } from "./hooks/useRungTool";
import { useCanvasStore } from "../store/canvasStore";
import { useProjectStore } from "../store/projectStore";
import { stageRegistry } from "./stageRef";
import type { Point } from "../models/geometry";
import type { Wire } from "../models/wire";
import type { SymbolInstance } from "../models/symbol";

const PIXELS_PER_MM = 3.7795;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.1;
const BAND_MIN_PX = 5; // minimum drag to trigger rubber-band selection

interface Props {
  sheetId: string;
  containerWidth: number;
  containerHeight: number;
  onArrowClick?: (pos: Point) => void;
}

export function SchematicCanvas({ sheetId, containerWidth, containerHeight, onArrowClick }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
  const rotatePendingSymbol = useCanvasStore((s) => s.rotatePendingSymbol);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const sheet = useProjectStore((s) => s.getSheet(sheetId));
  const removeElement = useProjectStore((s) => s.removeElement);
  const updateElement = useProjectStore((s) => s.updateElement);
  const updateSettings = useProjectStore((s) => s.updateSettings);

  // Rubber-band selection state (in canvas/sheet coordinates)
  const [bandStart, setBandStart] = useState<Point | null>(null);
  const [bandCurrent, setBandCurrent] = useState<Point | null>(null);

  const {
    isDrawing: isDrawingWire,
    previewPoints,
    handleMouseDown: wireMouseDown,
    handleMouseMove: wireMoveMove,
    handleDoubleClick: wireDoubleClick,
    cancel: cancelWire,
  } = useWireTool(sheetId);

  const { handleMouseMove: symbolMouseMove, handleClick: symbolClick } = useSymbolTool();

  const {
    cloudPoints,
    cursorPos: cloudCursor,
    handleMouseMove: cloudMouseMove,
    handleClick: cloudClick,
    handleDoubleClick: cloudDoubleClick,
    cancel: cancelCloud,
  } = useRevisionCloudTool(sheetId);

  const {
    isDrawingRung,
    previewPoints: rungPreviewPoints,
    handleMouseDown: rungMouseDown,
    handleMouseMove: rungMouseMove,
    handleDoubleClick: rungDoubleClick,
    cancel: cancelRung,
  } = useRungTool(sheetId);

  const sheetWidthPx = (sheet?.width ?? 431.8) * PIXELS_PER_MM;
  const sheetHeightPx = (sheet?.height ?? 279.4) * PIXELS_PER_MM;

  useEffect(() => {
    if (stageRef.current) stageRegistry.current = stageRef.current;
    return () => { stageRegistry.current = null; };
  });

  useEffect(() => {
    if (!sheet) return;
    const scale = Math.min(containerWidth / sheetWidthPx, containerHeight / sheetHeightPx) * 0.9;
    const x = (containerWidth - sheetWidthPx * scale) / 2;
    const y = (containerHeight - sheetHeightPx * scale) / 2;
    setViewport({ x, y, scale });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition() ?? { x: 0, y: 0 };
      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };
      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)));
      setViewport({ scale: newScale, x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
    },
    [viewport, setViewport]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      wireMouseDown(e);
      rungMouseDown(e);

      if (activeTool === "select") {
        const isBackground = e.target === stageRef.current || e.target.name() === "sheet-bg";
        if (isBackground) {
          const stage = stageRef.current;
          if (!stage) return;
          const pos = stage.getRelativePointerPosition() ?? { x: 0, y: 0 };
          setBandStart({ x: pos.x, y: pos.y });
          setBandCurrent({ x: pos.x, y: pos.y });
        }
      }
    },
    [activeTool, wireMouseDown, rungMouseDown]
  );

  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!bandStart || !bandCurrent || !sheet) {
        setBandStart(null);
        setBandCurrent(null);
        return;
      }

      const dx = Math.abs(bandCurrent.x - bandStart.x);
      const dy = Math.abs(bandCurrent.y - bandStart.y);

      if (dx > BAND_MIN_PX || dy > BAND_MIN_PX) {
        const minX = Math.min(bandStart.x, bandCurrent.x);
        const maxX = Math.max(bandStart.x, bandCurrent.x);
        const minY = Math.min(bandStart.y, bandCurrent.y);
        const maxY = Math.max(bandStart.y, bandCurrent.y);

        const ids: string[] = [];
        for (const el of sheet.elements) {
          if (el.type === "wire") {
            const wire = el as Wire;
            if (wire.points.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)) {
              ids.push(el.id);
            }
          } else if (el.type === "symbol") {
            const sym = el as SymbolInstance;
            if (sym.x >= minX && sym.x <= maxX && sym.y >= minY && sym.y <= maxY) {
              ids.push(el.id);
            }
          }
        }
        if (ids.length > 0) setSelection(ids);
      }

      setBandStart(null);
      setBandCurrent(null);
    },
    [bandStart, bandCurrent, sheet, setSelection]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === "symbol") { symbolClick(e); return; }

      if (activeTool === "sourceArrow" || activeTool === "destArrow") {
        const stage = stageRef.current;
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const pos: Point = {
          x: (pointer.x - viewport.x) / viewport.scale,
          y: (pointer.y - viewport.y) / viewport.scale,
        };
        onArrowClick?.(pos);
        return;
      }

      if (activeTool === "revisionCloud") { cloudClick(e); return; }

      if (e.target === stageRef.current || e.target.name() === "sheet-bg") {
        clearSelection();
      }
    },
    [activeTool, symbolClick, clearSelection, viewport, onArrowClick, cloudClick]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      wireMoveMove(e);
      symbolMouseMove(e);
      cloudMouseMove(e);
      rungMouseMove(e);

      if (bandStart) {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getRelativePointerPosition() ?? { x: 0, y: 0 };
        setBandCurrent({ x: pos.x, y: pos.y });
      }
    },
    [wireMoveMove, symbolMouseMove, cloudMouseMove, rungMouseMove, bandStart]
  );

  const handleDoubleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      wireDoubleClick();
      cloudDoubleClick(e);
      rungDoubleClick();
    },
    [wireDoubleClick, cloudDoubleClick, rungDoubleClick]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts (not in input)
      if (!inInput && !ctrl) {
        switch (e.key) {
          case "s": case "S": setActiveTool("select"); break;
          case "w": case "W": setActiveTool("wire"); break;
          case "h": case "H": setActiveTool("rungH"); break;
          case "v": case "V": setActiveTool("rungV"); break;
          case " ": e.preventDefault(); setActiveTool("pan"); break;
          case "g": case "G":
            updateSettings({ showGrid: !useProjectStore.getState().project.settings.showGrid });
            break;
          case "q": case "Q":
            updateSettings({ snapEnabled: !useProjectStore.getState().project.settings.snapEnabled });
            break;
        }
      }

      if (e.key === "Escape") {
        cancelWire();
        cancelCloud();
        cancelRung();
        setBandStart(null);
        setBandCurrent(null);
        setActiveTool("select");
      }

      if (!inInput) {
        if (e.key === "Delete" || e.key === "Backspace") {
          selectedElementIds.forEach((id) => removeElement(sheetId, id));
          clearSelection();
        }
        if ((e.key === "r" || e.key === "R") && !ctrl) {
          if (activeTool === "symbol") {
            rotatePendingSymbol();
          } else {
            selectedElementIds.forEach((id) => {
              const el = sheet?.elements.find((el) => el.id === id);
              if (el?.type === "symbol") {
                updateElement(sheetId, id, { rotation: ((el as { rotation: number }).rotation + 90) % 360 });
              }
            });
          }
        }
      }
    },
    [cancelWire, cancelCloud, cancelRung, setActiveTool, selectedElementIds, removeElement, sheetId,
     clearSelection, activeTool, rotatePendingSymbol, sheet, updateElement, updateSettings]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const flatPreview = previewPoints.flatMap((p) => [p.x, p.y]);
  const cloudPreviewPts = cloudPoints.length > 0 && cloudCursor
    ? [...cloudPoints, cloudCursor]
    : cloudPoints;
  const flatCloudPreview = cloudPreviewPts.flatMap((p) => [p.x, p.y]);

  const isRung = activeTool === "rungH" || activeTool === "rungV";

  const cursorStyle =
    activeTool === "wire" || activeTool === "revisionCloud" ? "crosshair"
    : activeTool === "symbol" ? "copy"
    : activeTool === "pan" ? "grab"
    : isRung ? "crosshair"
    : "default";

  if (!sheet) return null;

  // Rubber-band rect in canvas coords
  const bandRect = bandStart && bandCurrent ? {
    x: Math.min(bandStart.x, bandCurrent.x),
    y: Math.min(bandStart.y, bandCurrent.y),
    w: Math.abs(bandCurrent.x - bandStart.x),
    h: Math.abs(bandCurrent.y - bandStart.y),
  } : null;

  return (
    <Stage
      ref={stageRef}
      width={containerWidth}
      height={containerHeight}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      onWheel={handleWheel}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={handleDoubleClick}
      style={{ cursor: cursorStyle, background: "var(--canvas-bg)" }}
    >
      <GridLayer width={sheetWidthPx} height={sheetHeightPx} />

      <Layer listening={false}>
        <Rect
          name="sheet-bg"
          x={0}
          y={0}
          width={sheetWidthPx}
          height={sheetHeightPx}
          fill="white"
          stroke="#999999"
          strokeWidth={1}
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={8}
          shadowOffset={{ x: 2, y: 2 }}
        />
      </Layer>

      <WireLayer sheet={sheet} previewPoints={flatPreview} isDrawingWire={isDrawingWire} />
      <SymbolLayer sheet={sheet} />
      <AnnotationLayer sheet={sheet} canvasWidth={sheetWidthPx} canvasHeight={sheetHeightPx} />

      {/* Revision cloud drawing preview */}
      {activeTool === "revisionCloud" && cloudPoints.length > 0 && (
        <Layer listening={false}>
          <Line points={flatCloudPreview} stroke="#ff6600" strokeWidth={1} dash={[4, 2]} />
          {cloudPoints.map((p, i) => (
            <Circle key={i} x={p.x} y={p.y} radius={3} fill="#ff6600" opacity={0.7} />
          ))}
        </Layer>
      )}

      {/* Rung drawing preview */}
      {isRung && isDrawingRung && rungPreviewPoints.length === 4 && (
        <Layer listening={false}>
          <Line
            points={rungPreviewPoints}
            stroke="#00aadd"
            strokeWidth={1.5}
            dash={[6, 3]}
          />
          <Circle x={rungPreviewPoints[0]} y={rungPreviewPoints[1]} radius={3} fill="#00aadd" />
          <Circle x={rungPreviewPoints[2]} y={rungPreviewPoints[3]} radius={3} fill="#00aadd" />
        </Layer>
      )}

      {/* Rubber-band selection rect */}
      {bandRect && bandRect.w > BAND_MIN_PX && (
        <Layer listening={false}>
          <Rect
            x={bandRect.x}
            y={bandRect.y}
            width={bandRect.w}
            height={bandRect.h}
            stroke="#0066cc"
            strokeWidth={1}
            fill="rgba(0,102,204,0.07)"
            dash={[5, 3]}
          />
        </Layer>
      )}
    </Stage>
  );
}
