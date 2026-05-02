import { useState, useEffect } from "react";
import { Layer, Group, Image as KonvaImage, Text, Circle } from "react-konva";
import type { SymbolInstance } from "../models/symbol";
import type { Sheet } from "../models/sheet";
import { useCanvasStore } from "../store/canvasStore";
import { useLibraryStore } from "../store/libraryStore";
import { resolveConnectionPoints } from "../lib/transforms";

const SYMBOL_SIZE = 60;

function useSvgImage(svgContent: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { setImg(image); URL.revokeObjectURL(url); };
    image.src = url;
  }, [svgContent]);

  return img;
}

interface SymbolNodeProps {
  instance: SymbolInstance;
  isSelected: boolean;
  onSelect: (id: string) => void;
  showConnectionPoints: boolean;
}

function SymbolNode({ instance, isSelected, onSelect, showConnectionPoints }: SymbolNodeProps) {
  const def = useLibraryStore((s) =>
    s.libraries.flatMap((l) => l.symbols).find((sym) => sym.id === instance.definitionId)
  );
  const img = useSvgImage(def?.svgContent ?? "");

  if (!def || !img) return null;

  const half = SYMBOL_SIZE / 2;
  const resolved = resolveConnectionPoints(def.connectionPoints, 0, 0, instance.rotation);

  return (
    <Group
      x={instance.x}
      y={instance.y}
      rotation={instance.rotation}
      scaleX={instance.scale}
      scaleY={instance.scale}
      onClick={() => onSelect(instance.id)}
      listening={true}
    >
      <KonvaImage
        image={img}
        x={-half}
        y={-half}
        width={SYMBOL_SIZE}
        height={SYMBOL_SIZE}
        stroke={isSelected ? "#0066cc" : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />
      {instance.attributes.tag && (
        <Text
          x={-half}
          y={half + 2}
          text={instance.attributes.tag}
          fontSize={8}
          fill="#222222"
          listening={false}
        />
      )}
      {showConnectionPoints &&
        resolved.map((cp) => (
          <Circle
            key={cp.id}
            x={cp.worldX - instance.x}
            y={cp.worldY - instance.y}
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

function GhostSymbol() {
  const ghostPos = useCanvasStore((s) => s.ghostPosition);
  const defId = useCanvasStore((s) => s.pendingSymbolDefinitionId);
  const rotation = useCanvasStore((s) => s.pendingSymbolRotation);
  const def = useLibraryStore((s) =>
    defId ? s.libraries.flatMap((l) => l.symbols).find((sym) => sym.id === defId) : undefined
  );
  const img = useSvgImage(def?.svgContent ?? "");

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
          />
        );
      })}
      {activeTool === "symbol" && <GhostSymbol />}
    </Layer>
  );
}
