import { useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type Konva from "konva";
import { GridLayer } from "./GridLayer";
import { WireLayer } from "./WireLayer";
import { SymbolLayer } from "./SymbolLayer";
import { AnnotationLayer } from "./AnnotationLayer";
import { useWireTool } from "./hooks/useWireTool";
import { useCanvasStore } from "../store/canvasStore";
import { useProjectStore } from "../store/projectStore";

const PIXELS_PER_MM = 3.7795;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.1;

interface Props {
  sheetId: string;
  containerWidth: number;
  containerHeight: number;
}

export function SchematicCanvas({ sheetId, containerWidth, containerHeight }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const sheet = useProjectStore((s) => s.getSheet(sheetId));

  const { isDrawing: isDrawingWire, previewPoints, handleMouseDown, handleMouseMove, handleDoubleClick, cancel } =
    useWireTool(sheetId);

  const sheetWidthPx = (sheet?.width ?? 431.8) * PIXELS_PER_MM;
  const sheetHeightPx = (sheet?.height ?? 279.4) * PIXELS_PER_MM;

  useEffect(() => {
    if (!sheet) return;
    const scale = Math.min(containerWidth / sheetWidthPx, containerHeight / sheetHeightPx) * 0.9;
    const x = (containerWidth - sheetWidthPx * scale) / 2;
    const y = (containerHeight - sheetHeightPx * scale) / 2;
    setViewport({ x, y, scale });
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

      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === stageRef.current || e.target.name() === "sheet-bg") {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    },
    [cancel]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const flatPreview = previewPoints.flatMap((p) => [p.x, p.y]);

  const cursorStyle =
    activeTool === "wire" ? "crosshair" : activeTool === "pan" ? "grab" : "default";

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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onDblClick={handleDoubleClick}
      style={{ cursor: cursorStyle, background: "var(--canvas-bg)" }}
    >
      <GridLayer width={sheetWidthPx} height={sheetHeightPx} />

      {/* Sheet boundary */}
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
