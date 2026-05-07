import { useState, useEffect } from "react";
import { Layer, Group, Image as KonvaImage, Text, Circle, Line, Path, Rect } from "react-konva";
import type Konva from "konva";
import type { SymbolInstance, SymbolGeomEl } from "../models/symbol";
import type { Sheet } from "../models/sheet";
import { useCanvasStore } from "../store/canvasStore";
import { useLibraryStore } from "../store/libraryStore";
import { useProjectStore } from "../store/projectStore";
import { useThemeStore } from "../store/themeStore";
import { getEffectiveConnectionPoints } from "../lib/connectionPointUtils";
import { snapToGrid } from "./routing/orthogonalRouter";

const SYMBOL_SIZE = 60;

// Replace `currentColor` in SVG so Konva's rasterised image has the correct color.
function useSvgImage(svgContent: string, color: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!svgContent) return;
    const resolved = svgContent.replace(/currentColor/g, color);
    const blob = new Blob([resolved], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { setImg(image); URL.revokeObjectURL(url); };
    image.src = url;
  }, [svgContent, color]);

  return img;
}

/** Renders imported symbols as Konva vector primitives with zoom-independent strokeWidth. */
function VectorSymbolNode({
  geometry,
  strokeColor,
  viewportScale,
  instanceScale,
}: {
  geometry: SymbolGeomEl[];
  strokeColor: string;
  viewportScale: number;
  instanceScale: number;
}) {
  const sw = 1.5 / (viewportScale * instanceScale);
  return (
    <>
      {geometry.map((el, i) => {
        if (el.t === "L") {
          return (
            <Line
              key={i}
              points={[el.x1, el.y1, el.x2, el.y2]}
              stroke={strokeColor}
              strokeWidth={sw}
              lineCap="round"
              listening={false}
            />
          );
        }
        if (el.t === "C") {
          return (
            <Circle
              key={i}
              x={el.cx}
              y={el.cy}
              radius={el.r}
              stroke={strokeColor}
              strokeWidth={sw}
              fill="transparent"
              listening={false}
            />
          );
        }
        if (el.t === "A") {
          const d = `M${el.x1},${el.y1} A${el.r},${el.r} 0 ${el.large},1 ${el.x2},${el.y2}`;
          return (
            <Path
              key={i}
              data={d}
              stroke={strokeColor}
              strokeWidth={sw}
              fill="transparent"
              listening={false}
            />
          );
        }
        if (el.t === "P") {
          return (
            <Line
              key={i}
              points={el.pts}
              stroke={strokeColor}
              strokeWidth={sw}
              closed={el.closed}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          );
        }
        return null;
      })}
    </>
  );
}

interface SymbolNodeProps {
  instance: SymbolInstance;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showConnectionPoints: boolean;
  gridSize: number;
  sheetId: string;
  /** Overrides the resolved SVG stroke/fill color (for theme support). */
  symbolColor?: string;
}

export function SymbolNode({ instance, isSelected, onSelect, showConnectionPoints, gridSize, sheetId, symbolColor }: SymbolNodeProps) {
  const def = useLibraryStore((s) =>
    s.libraries.flatMap((l) => l.symbols).find((sym) => sym.id === instance.definitionId)
  );
  const theme = useThemeStore((s) => s.theme);
  const effectiveColor = symbolColor ?? (theme === "dark" ? "#cccccc" : "#000000");
  const img = useSvgImage(def?.geometry ? "" : (def?.svgContent ?? ""), effectiveColor);
  const viewportScale = useCanvasStore((s) => s.viewport.scale);
  const updateElement = useProjectStore((s) => s.updateElement);
  const deviceLabelSize = useProjectStore((s) => s.project.settings.deviceLabelSize);

  if (!def) return null;
  // For vector symbols, skip the rasterized image. For SVG symbols, wait for image load.
  if (!def.geometry && !img) return null;

  const half = SYMBOL_SIZE / 2;
  const effectiveCPs = getEffectiveConnectionPoints(def);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const x = snapToGrid(e.target.x(), gridSize);
    const y = snapToGrid(e.target.y(), gridSize);
    e.target.x(x);
    e.target.y(y);
    updateElement(sheetId, instance.id, { x, y });
  };

  return (
    <Group
      x={instance.x}
      y={instance.y}
      rotation={instance.rotation}
      scaleX={instance.scale}
      scaleY={instance.scale}
      draggable
      onClick={() => onSelect(instance.id)}
      onDragEnd={handleDragEnd}
      listening={true}
    >
      {def.geometry ? (
        <>
          {/* Transparent hit rect so click/drag still works */}
          <Rect x={-half} y={-half} width={SYMBOL_SIZE} height={SYMBOL_SIZE} opacity={0} />
          {isSelected && (
            <Rect
              x={-half}
              y={-half}
              width={SYMBOL_SIZE}
              height={SYMBOL_SIZE}
              stroke="#0066cc"
              strokeWidth={1.5 / (viewportScale * instance.scale)}
              fill="transparent"
              listening={false}
              dash={[4 / (viewportScale * instance.scale), 3 / (viewportScale * instance.scale)]}
            />
          )}
          <VectorSymbolNode
            geometry={def.geometry}
            strokeColor={effectiveColor}
            viewportScale={viewportScale}
            instanceScale={instance.scale}
          />
        </>
      ) : (
        <KonvaImage
          image={img!}
          x={-half}
          y={-half}
          width={SYMBOL_SIZE}
          height={SYMBOL_SIZE}
          stroke={isSelected ? "#0066cc" : undefined}
          strokeWidth={isSelected ? 2 : 0}
        />
      )}
      {instance.attributes.tag && (
        <Text
          x={-half}
          y={half + 2}
          text={instance.attributes.tag}
          fontSize={deviceLabelSize}
          fill={theme === "dark" ? "#cccccc" : "#222222"}
          listening={false}
        />
      )}
      {showConnectionPoints &&
        effectiveCPs.map((cp) => (
          <Circle
            key={cp.id}
            x={cp.x}
            y={cp.y}
            radius={3}
            fill="#00aa44"
            stroke="#007733"
            strokeWidth={1}
            listening={false}
          />
        ))}
    </Group>
  );
}

export function GhostSymbol() {
  const ghostPos = useCanvasStore((s) => s.ghostPosition);
  const defId = useCanvasStore((s) => s.pendingSymbolDefinitionId);
  const rotation = useCanvasStore((s) => s.pendingSymbolRotation);
  const theme = useThemeStore((s) => s.theme);
  const def = useLibraryStore((s) =>
    defId ? s.libraries.flatMap((l) => l.symbols).find((sym) => sym.id === defId) : undefined
  );
  const color = theme === "dark" ? "#cccccc" : "#000000";
  const img = useSvgImage(def?.svgContent ?? "", color);

  if (!ghostPos || !def || !img) return null;

  const half = SYMBOL_SIZE / 2;
  return (
    <Group x={ghostPos.x} y={ghostPos.y} rotation={rotation} opacity={0.5} listening={false}>
      <KonvaImage image={img} x={-half} y={-half} width={SYMBOL_SIZE} height={SYMBOL_SIZE} />
    </Group>
  );
}

interface Props {
  sheet: Sheet;
}

export function SymbolLayer({ sheet }: Props) {
  const selectedIds = useCanvasStore((s) => s.selectedElementIds);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);
  const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));

  const symbols = sheet.elements.filter((e): e is SymbolInstance => e.type === "symbol");

  return (
    <Layer>
      {symbols.map((sym) => {
        const layer = layerMap.get(sym.layerId);
        if (layer && !layer.visible) return null;
        return (
          <SymbolNode
            key={sym.id}
            instance={sym}
            isSelected={selectedIds.has(sym.id)}
            onSelect={(id) => setSelection([id])}
            showConnectionPoints={activeTool === "wire"}
            gridSize={gridSize}
            sheetId={sheet.id}
          />
        );
      })}
      {activeTool === "symbol" && <GhostSymbol />}
    </Layer>
  );
}
