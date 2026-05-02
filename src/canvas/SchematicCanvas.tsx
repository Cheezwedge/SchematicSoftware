import { useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import { GridLayer } from "./GridLayer";
import { WireLayer } from "./WireLayer";
import { SymbolLayer } from "./SymbolLayer";
import { AnnotationLayer } from "./AnnotationLayer";
import { useWireTool } from "./hooks/useWireTool";
import { useSymbolTool } from "./hooks/useSymbolTool";
import { useCanvasStore } from "../store/canvasStore";
import { useProjectStore } from "../store/projectStore";
import { stageRegistry } from "./stageRef";
import type { Point } from "../models/geometry";

const PIXELS_PER_MM = 3.7795;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.1;

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
  const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
  const rotatePendingSymbol = useCanvasStore((s) => s.rotatePendingSymbol);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const sheet = useProjectStore((s) => s.getSheet(sheetId));
  const removeElement = useProjectStore((s) => s.removeElement);
  const updateElement = useProjectStore((s) => s.updateElement);

  const { isDrawing: isDrawingWire, previewPoints, handleMouseDown: wireMouseDown, handleMouseMove: wireMoveMove, handleDoubleClick, cancel: cancelWire } =
    useWireTool(sheetId);

  const { handleMouseMove: symbolMouseMove, handleClick: symbolClick } = useSymbolTool();

  const sheetWidthPx = (sheet?.width ?? 431.8) * PIXELS_PER_MM;
  const sheetHeightPx = (sheet?.height ?? 279.4) * PIXELS_PER_MM;

  // Register stage in singleton so PDF export can access it
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

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === "symbol") {
        symbolClick(e);
        return;
      }
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
      if (e.target === stageRef.current || e.target.name() === "sheet-bg") {
        clearSelection();
      }
    },
    [activeTool, symbolClick, clearSelection, viewport, onArrowClick]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      wireMoveMove(e);
      symbolMouseMove(e);
    },
    [wireMoveMove, symbolMouseMove]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Escape") {
        cancelWire();
        setActiveTool("select");
      }

      if (!inInput) {
        if (e.key === "Delete" || e.key === "Backspace") {
          selectedElementIds.forEach((id) => removeElement(sheetId, id));
          clearSelection();
        }
        if (e.key === "r" || e.key === "R") {
          if (activeTool === "symbol") {
            rotatePendingSymbol();
          } else {
            // Rotate selected symbols 90°
            selectedElementIds.forEach((id) => {
              const el = sheet?.elements.find((e) => e.id === id);
              if (el?.type === "symbol") {
                updateElement(sheetId, id, { rotation: ((el as { rotation: number }).rotation + 90) % 360 });
              }
            });
          }
        }
      }
    },
    [cancelWire, setActiveTool, selectedElementIds, removeElement, sheetId, clearSelection, activeTool, rotatePendingSymbol, sheet, updateElement]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const flatPreview = previewPoints.flatMap((p) => [p.x, p.y]);

  const cursorStyle =
    activeTool === "wire" ? "crosshair"
    : activeTool === "symbol" ? "copy"
    : activeTool === "pan" ? "grab"
    : "default";

  if (!sheet) return null;

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
      onMouseDown={wireMouseDown}
      onMouseMove={handleMouseMove}
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
      <AnnotationLayer sheet={sheet} canvasWidth={sheetWidthPx} />
    </Stage>
  );
}
