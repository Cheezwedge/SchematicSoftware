import { useRef, useCallback, useEffect, useState, useMemo, Fragment } from "react";
import { Stage, Layer, Group, Rect, Text, Circle, Line, Path } from "react-konva";
import type Konva from "konva";
import { GridLayer } from "./GridLayer";
import { SymbolNode, GhostSymbol } from "./SymbolLayer";
import { useWireTool } from "./hooks/useWireTool";
import { useSymbolTool } from "./hooks/useSymbolTool";
import { useRevisionCloudTool } from "./hooks/useRevisionCloudTool";
import { useRungTool } from "./hooks/useRungTool";
import { useCanvasStore } from "../store/canvasStore";
import { useProjectStore } from "../store/projectStore";
import { useThemeStore } from "../store/themeStore";
import { stageRegistry } from "./stageRef";
import { generateRevisionCloudPath } from "../lib/revisionCloud";
import { snapToGrid } from "./routing/orthogonalRouter";
import type { Point } from "../models/geometry";
import type { Wire } from "../models/wire";
import type { SymbolInstance } from "../models/symbol";
import type { RevisionCloud } from "../models/revision";
import type { CrossSheetArrow } from "../models/crossSheetArrow";
import type { Sheet } from "../models/sheet";

function isHexDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.4;
}
function resolveWireColor(color: string, theme: string): string {
  return theme === "dark" && isHexDark(color) ? "#cccccc" : color;
}

const PIXELS_PER_MM = 3.7795;
const SHEET_GAP = 60;
const LABEL_Y = -22;
const MIN_SCALE = 0.05;
const MAX_SCALE = 10;
const ZOOM_FACTOR = 1.1;
const BAND_MIN_PX = 5;
const ARROW_W = 60;
const ARROW_H = 20;

interface SheetLayout {
  sheet: Sheet;
  x: number;
  widthPx: number;
  heightPx: number;
}

function flatPts(pts: Point[]): number[] {
  return pts.flatMap((p) => [p.x, p.y]);
}

function wireMid(w: Wire): Point {
  return w.points[Math.floor(w.points.length / 2)] ?? w.points[0];
}

interface Props {
  containerWidth: number;
  containerHeight: number;
  onArrowClick?: (pos: Point) => void;
}

export function MultiSheetCanvas({ containerWidth, containerHeight, onArrowClick }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const panStartRef = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);

  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const rotatePendingSymbol = useCanvasStore((s) => s.rotatePendingSymbol);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const theme = useThemeStore((s) => s.theme);
  const project = useProjectStore((s) => s.project);
  const removeElement = useProjectStore((s) => s.removeElement);
  const updateElement = useProjectStore((s) => s.updateElement);
  const updateSettings = useProjectStore((s) => s.updateSettings);
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);

  const sheetBgColor = theme === "dark" ? "#1a1a1a" : "#ffffff";
  const symbolColor = theme === "dark" ? "#cccccc" : "#000000";

  const [bandStart, setBandStart] = useState<Point | null>(null);
  const [bandCurrent, setBandCurrent] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // ── Layout ──────────────────────────────────────────────────────────
  const sheetLayouts = useMemo((): SheetLayout[] => {
    const sorted = [...project.sheets].sort((a, b) => a.index - b.index);
    let cumX = 0;
    return sorted.map((sheet) => {
      const widthPx = sheet.width * PIXELS_PER_MM;
      const heightPx = sheet.height * PIXELS_PER_MM;
      const layout = { sheet, x: cumX, widthPx, heightPx };
      cumX += widthPx + SHEET_GAP;
      return layout;
    });
  }, [project.sheets]);

  const activeLayout = sheetLayouts.find((l) => l.sheet.id === activeSheetId);
  const activeOffset: Point = { x: activeLayout?.x ?? 0, y: 0 };

  const totalWidthPx =
    sheetLayouts.length > 0
      ? sheetLayouts[sheetLayouts.length - 1].x + sheetLayouts[sheetLayouts.length - 1].widthPx
      : 800;
  const maxHeightPx =
    sheetLayouts.length > 0 ? Math.max(...sheetLayouts.map((l) => l.heightPx)) : 600;

  // ── Tools ────────────────────────────────────────────────────────────
  const {
    isDrawing: isDrawingWire,
    previewPoints,
    handleMouseDown: wireMouseDown,
    handleMouseMove: wireMoveMove,
    handleDoubleClick: wireDoubleClick,
    cancel: cancelWire,
  } = useWireTool(activeSheetId ?? "");

  const { handleMouseMove: symbolMouseMove, handleClick: symbolClick } = useSymbolTool();

  const {
    cloudPoints,
    cursorPos: cloudCursor,
    handleMouseMove: cloudMouseMove,
    handleClick: cloudClick,
    handleDoubleClick: cloudDoubleClick,
    cancel: cancelCloud,
  } = useRevisionCloudTool(activeSheetId ?? "");

  const {
    isDrawingRung,
    previewPoints: rungPreviewPoints,
    handleMouseDown: rungMouseDown,
    handleMouseMove: rungMouseMove,
    handleDoubleClick: rungDoubleClick,
    cancel: cancelRung,
  } = useRungTool(activeSheetId ?? "");

  // ── Init viewport to show all sheets ─────────────────────────────────
  useEffect(() => {
    if (stageRef.current) stageRegistry.current = stageRef.current;
    return () => { stageRegistry.current = null; };
  });

  useEffect(() => {
    if (sheetLayouts.length === 0) return;
    const scale =
      Math.min(containerWidth / totalWidthPx, (containerHeight - 40) / maxHeightPx) * 0.85;
    const x = (containerWidth - totalWidthPx * scale) / 2;
    const y = (containerHeight - maxHeightPx * scale) / 2 + 20 * scale;
    setViewport({ x, y, scale });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // ── Helpers ───────────────────────────────────────────────────────────
  const getSheetAtStagePos = useCallback(
    (pos: Point): SheetLayout | null => {
      for (const layout of sheetLayouts) {
        if (
          pos.x >= layout.x && pos.x < layout.x + layout.widthPx &&
          pos.y >= 0 && pos.y < layout.heightPx
        ) return layout;
      }
      return null;
    },
    [sheetLayouts]
  );

  const activateSheet = useCallback(
    (layout: SheetLayout) => {
      setActiveSheet(layout.sheet.id);
      setActiveLayer(layout.sheet.layers[0]?.id ?? null);
      // Synchronous Zustand write — tool hooks read this via getState() in the same event
      useCanvasStore.getState().setMultiSheetOffset({ x: layout.x, y: 0 });
    },
    [setActiveSheet, setActiveLayer]
  );

  // ── Wheel (zoom) ──────────────────────────────────────────────────────
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
      const dir = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, oldScale * (dir > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))
      );
      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport]
  );

  // ── Mouse events ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const stagePos = stage.getRelativePointerPosition() ?? { x: 0, y: 0 };

      // Middle mouse or pan tool → pan
      if (e.evt.button === 1 || activeTool === "pan") {
        e.evt.preventDefault?.();
        const screenPos = stage.getPointerPosition() ?? { x: 0, y: 0 };
        panStartRef.current = { px: screenPos.x, py: screenPos.y, vx: viewport.x, vy: viewport.y };
        setIsPanning(true);
        return;
      }

      // Activate the sheet under the cursor (synchronous before tool handlers)
      const layout = getSheetAtStagePos(stagePos);
      if (layout) activateSheet(layout);

      wireMouseDown(e);
      rungMouseDown(e);

      if (activeTool === "select") {
        const isBackground = e.target === stage || e.target.name() === "sheet-bg";
        if (isBackground) {
          setBandStart(stagePos);
          setBandCurrent(stagePos);
        }
      }
    },
    [activeTool, viewport, getSheetAtStagePos, activateSheet, wireMouseDown, rungMouseDown]
  );

  const handleMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        return;
      }

      if (!bandStart || !bandCurrent) {
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
        for (const { sheet, x: sx } of sheetLayouts) {
          for (const el of sheet.elements) {
            if (el.type === "wire") {
              const wire = el as Wire;
              if (
                wire.points.some((p) => {
                  const wx = p.x + sx;
                  return wx >= minX && wx <= maxX && p.y >= minY && p.y <= maxY;
                })
              ) ids.push(el.id);
            } else if (el.type === "symbol") {
              const sym = el as SymbolInstance;
              const wx = sym.x + sx;
              if (wx >= minX && wx <= maxX && sym.y >= minY && sym.y <= maxY)
                ids.push(el.id);
            }
          }
        }
        if (ids.length > 0) setSelection(ids);
      }

      setBandStart(null);
      setBandCurrent(null);
    },
    [isPanning, bandStart, bandCurrent, sheetLayouts, setSelection]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === "symbol") { symbolClick(e); return; }

      if (activeTool === "sourceArrow" || activeTool === "destArrow") {
        const stage = stageRef.current;
        if (!stage) return;
        const stagePos = stage.getRelativePointerPosition();
        if (!stagePos) return;
        const layout = getSheetAtStagePos(stagePos);
        if (layout) onArrowClick?.({ x: stagePos.x - layout.x, y: stagePos.y });
        return;
      }

      if (activeTool === "revisionCloud") { cloudClick(e); return; }

      if (e.target === stageRef.current || e.target.name() === "sheet-bg") {
        clearSelection();
      }
    },
    [activeTool, symbolClick, clearSelection, getSheetAtStagePos, onArrowClick, cloudClick]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning && panStartRef.current) {
        const stage = stageRef.current;
        if (!stage) return;
        const sp = stage.getPointerPosition() ?? { x: 0, y: 0 };
        const p = panStartRef.current;
        setViewport({ x: p.vx + (sp.x - p.px), y: p.vy + (sp.y - p.py) });
        return;
      }

      wireMoveMove(e);
      symbolMouseMove(e);
      cloudMouseMove(e);
      rungMouseMove(e);

      if (bandStart) {
        const stage = stageRef.current;
        if (!stage) return;
        setBandCurrent(stage.getRelativePointerPosition() ?? { x: 0, y: 0 });
      }
    },
    [isPanning, setViewport, wireMoveMove, symbolMouseMove, cloudMouseMove, rungMouseMove, bandStart]
  );

  const handleDoubleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      wireDoubleClick();
      cloudDoubleClick(e);
      rungDoubleClick();
    },
    [wireDoubleClick, cloudDoubleClick, rungDoubleClick]
  );

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const ctrl = e.ctrlKey || e.metaKey;

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
        cancelWire(); cancelCloud(); cancelRung();
        setBandStart(null); setBandCurrent(null);
        setActiveTool("select");
      }

      if (!inInput) {
        if (e.key === "Delete" || e.key === "Backspace") {
          selectedElementIds.forEach((id) => {
            for (const { sheet } of sheetLayouts) {
              if (sheet.elements.find((el) => el.id === id)) {
                removeElement(sheet.id, id);
                break;
              }
            }
          });
          clearSelection();
        }
        if ((e.key === "r" || e.key === "R") && !ctrl) {
          if (activeTool === "symbol") {
            rotatePendingSymbol();
          } else {
            selectedElementIds.forEach((id) => {
              for (const { sheet } of sheetLayouts) {
                const el = sheet.elements.find((el) => el.id === id);
                if (el?.type === "symbol") {
                  updateElement(sheet.id, id, {
                    rotation: ((el as SymbolInstance).rotation + 90) % 360,
                  });
                  break;
                }
              }
            });
          }
        }
      }
    },
    [
      cancelWire, cancelCloud, cancelRung, setActiveTool, selectedElementIds,
      removeElement, sheetLayouts, clearSelection, activeTool, rotatePendingSymbol,
      updateElement, updateSettings,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Preview helpers (sheet-local → stage coords) ──────────────────────
  const ao = activeOffset;
  const flatPreview = previewPoints.flatMap((p) => [p.x + ao.x, p.y + ao.y]);
  const rungPreviewStage =
    rungPreviewPoints.length === 4
      ? [
          rungPreviewPoints[0] + ao.x, rungPreviewPoints[1] + ao.y,
          rungPreviewPoints[2] + ao.x, rungPreviewPoints[3] + ao.y,
        ]
      : [];
  const cloudPreviewPts =
    cloudPoints.length > 0 && cloudCursor ? [...cloudPoints, cloudCursor] : cloudPoints;
  const flatCloudPreview = cloudPreviewPts.flatMap((p) => [p.x + ao.x, p.y + ao.y]);

  const isRung = activeTool === "rungH" || activeTool === "rungV";

  const cursorStyle =
    activeTool === "wire" || activeTool === "revisionCloud"
      ? "crosshair"
      : activeTool === "symbol"
      ? "copy"
      : activeTool === "pan" || isPanning
      ? "grab"
      : isRung
      ? "crosshair"
      : "default";

  const bandRect =
    bandStart && bandCurrent
      ? {
          x: Math.min(bandStart.x, bandCurrent.x),
          y: Math.min(bandStart.y, bandCurrent.y),
          w: Math.abs(bandCurrent.x - bandStart.x),
          h: Math.abs(bandCurrent.y - bandStart.y),
        }
      : null;

  // ── Render ────────────────────────────────────────────────────────────
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
      {/* Layer 1: Sheet backgrounds (fill only — below the grid) */}
      <Layer listening={false}>
        {sheetLayouts.map(({ sheet, x: sx, widthPx, heightPx }) => (
          <Group key={sheet.id} x={sx}>
            <Rect
              x={0} y={0}
              width={widthPx}
              height={heightPx}
              fill={sheetBgColor}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={6}
              shadowOffset={{ x: 2, y: 2 }}
            />
            <Text
              x={0} y={LABEL_Y}
              text={sheet.name}
              fontSize={10}
              fontStyle={sheet.id === activeSheetId ? "bold" : "normal"}
              fill={sheet.id === activeSheetId ? "#0066cc" : theme === "dark" ? "#888888" : "#666666"}
            />
          </Group>
        ))}
      </Layer>

      {/* Layer 2: Grid — visible on top of backgrounds, below content */}
      <GridLayer width={totalWidthPx} height={maxHeightPx} />

      {/* Layer 3: Content per sheet (transparent hit-test rect + wires/symbols/etc.) */}
      <Layer>
        {sheetLayouts.map(({ sheet, x: sx, widthPx, heightPx }) => {
          const isActive = sheet.id === activeSheetId;
          const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));
          const wires = sheet.elements.filter((e): e is Wire => e.type === "wire");
          const symbols = sheet.elements.filter((e): e is SymbolInstance => e.type === "symbol");
          const clouds = sheet.elements.filter((e): e is RevisionCloud => e.type === "revisionCloud");
          const arrows = sheet.elements.filter((e): e is CrossSheetArrow => e.type === "crossSheetArrow");

          return (
            <Group key={sheet.id} x={sx} y={0}>
              {/* Transparent hit-test rect + border stroke (no fill — background is in layer 1) */}
              <Rect
                name="sheet-bg"
                x={0} y={0}
                width={widthPx}
                height={heightPx}
                fill="transparent"
                stroke={isActive ? "#0066cc" : theme === "dark" ? "#555555" : "#aaaaaa"}
                strokeWidth={isActive ? 2 : 1}
              />

              {/* Wires */}
              {wires.map((wire) => {
                const lyr = layerMap.get(wire.layerId);
                if (lyr && !lyr.visible) return null;
                const isSelected = selectedElementIds.has(wire.id);
                const mid = wireMid(wire);
                const displayColor = resolveWireColor(wire.color, theme);
                return (
                  <Fragment key={wire.id}>
                    <Line
                      points={flatPts(wire.points)}
                      stroke={displayColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      hitStrokeWidth={10}
                      lineCap="round"
                      lineJoin="round"
                      onClick={() => setSelection([wire.id])}
                      draggable={activeTool === "select"}
                      onDragEnd={(e) => {
                        const dx = snapToGrid(e.target.x(), gridSize);
                        const dy = snapToGrid(e.target.y(), gridSize);
                        if (dx === 0 && dy === 0) return;
                        updateElement(sheet.id, wire.id, {
                          points: wire.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                        });
                        e.target.x(0);
                        e.target.y(0);
                      }}
                    />
                    {wire.number && (
                      <Text
                        x={mid.x + 2}
                        y={mid.y - 10}
                        text={wire.number}
                        fontSize={8}
                        fill={theme === "dark" ? "#aaaaaa" : "#444444"}
                        listening={false}
                      />
                    )}
                  </Fragment>
                );
              })}

              {/* Symbols */}
              {symbols.map((sym) => {
                const lyr = layerMap.get(sym.layerId);
                if (lyr && !lyr.visible) return null;
                return (
                  <SymbolNode
                    key={sym.id}
                    instance={sym}
                    isSelected={selectedElementIds.has(sym.id)}
                    onSelect={(id) => setSelection([id])}
                    showConnectionPoints={activeTool === "wire"}
                    gridSize={gridSize}
                    sheetId={sheet.id}
                    symbolColor={symbolColor}
                  />
                );
              })}

              {/* Revision clouds */}
              {clouds.map((cloud) => {
                const lyr = layerMap.get(cloud.layerId);
                if (lyr && !lyr.visible) return null;
                const d = generateRevisionCloudPath(cloud.points, cloud.arcRadius);
                return (
                  <Fragment key={cloud.id}>
                    <Path
                      data={d}
                      stroke="#cc6600"
                      strokeWidth={1.5}
                      fill="rgba(255,160,0,0.08)"
                      listening={false}
                    />
                    {cloud.label && (
                      <Text
                        x={(cloud.points[0]?.x ?? 0)}
                        y={(cloud.points[0]?.y ?? 0) - 14}
                        text={cloud.label}
                        fontSize={9}
                        fontStyle="bold"
                        fill="#cc6600"
                        listening={false}
                      />
                    )}
                  </Fragment>
                );
              })}

              {/* Cross-sheet arrows */}
              {arrows.map((arrow) => {
                const isSource = arrow.arrowType === "source";
                const arrowPath = isSource
                  ? `M0,0 L${ARROW_W - 10},0 L${ARROW_W},${ARROW_H / 2} L${ARROW_W - 10},${ARROW_H} L0,${ARROW_H} Z`
                  : `M10,0 L${ARROW_W},0 L${ARROW_W},${ARROW_H} L10,${ARROW_H} L0,${ARROW_H / 2} Z`;
                return (
                  <Group key={arrow.id} x={arrow.x} y={arrow.y}>
                    <Path
                      data={arrowPath}
                      fill={isSource ? "#0055aa" : "#aa5500"}
                      stroke="white"
                      strokeWidth={0.5}
                      opacity={0.85}
                    />
                    <Text
                      x={isSource ? 4 : 12}
                      y={2}
                      text={arrow.wireNumber}
                      fontSize={7}
                      fontStyle="bold"
                      fill="white"
                      listening={false}
                    />
                    <Text
                      x={isSource ? 4 : 12}
                      y={11}
                      text={arrow.targetSheetName}
                      fontSize={6}
                      fill="rgba(255,255,255,0.85)"
                      listening={false}
                    />
                  </Group>
                );
              })}

              {/* Ghost symbol on active sheet only */}
              {isActive && activeTool === "symbol" && <GhostSymbol />}
            </Group>
          );
        })}
      </Layer>

      {/* Preview layer (on top, not interactive) */}
      <Layer listening={false}>
        {/* Wire drawing preview */}
        {isDrawingWire && flatPreview.length >= 4 && (
          <>
            <Line
              points={flatPreview}
              stroke="#0066cc"
              strokeWidth={1.5}
              dash={[4, 3]}
            />
            <Circle
              x={flatPreview[flatPreview.length - 2]}
              y={flatPreview[flatPreview.length - 1]}
              radius={3}
              fill="#0066cc"
            />
          </>
        )}

        {/* Rung drawing preview */}
        {isRung && isDrawingRung && rungPreviewStage.length === 4 && (
          <>
            <Line points={rungPreviewStage} stroke="#00aadd" strokeWidth={1.5} dash={[6, 3]} />
            <Circle x={rungPreviewStage[0]} y={rungPreviewStage[1]} radius={3} fill="#00aadd" />
            <Circle x={rungPreviewStage[2]} y={rungPreviewStage[3]} radius={3} fill="#00aadd" />
          </>
        )}

        {/* Revision cloud preview */}
        {activeTool === "revisionCloud" && cloudPoints.length > 0 && (
          <>
            <Line points={flatCloudPreview} stroke="#ff6600" strokeWidth={1} dash={[4, 2]} />
            {cloudPoints.map((p, i) => (
              <Circle key={i} x={p.x + ao.x} y={p.y + ao.y} radius={3} fill="#ff6600" opacity={0.7} />
            ))}
          </>
        )}

        {/* Rubber-band selection rect */}
        {bandRect && bandRect.w > BAND_MIN_PX && (
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
        )}
      </Layer>
    </Stage>
  );
}
