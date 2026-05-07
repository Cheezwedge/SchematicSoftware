import type { } from "react";
import { Layer, Text, Path, Group, Rect, Line, Shape } from "react-konva";
import type Konva from "konva";
import { useThemeStore } from "../store/themeStore";
import type { Sheet } from "../models/sheet";
import type { RevisionCloud } from "../models/revision";
import type { CrossSheetArrow } from "../models/crossSheetArrow";
import type { RungMarker } from "../models/rungMarker";
import { useProjectStore } from "../store/projectStore";
import { useCanvasStore } from "../store/canvasStore";
import { generateRevisionCloudPath } from "../lib/revisionCloud";
import { HEX_W, HEX_H, HEX_NOTCH } from "../lib/constants";
import { BUILTIN_TEMPLATE_ID, DEFAULT_TITLE_BLOCK_FIELDS } from "../models/titleBlock";
import { snapToGrid } from "./routing/orthogonalRouter";

interface HexRungBadgeProps {
  x: number;
  y: number;
  label: string;
  isDark: boolean;
  isSelected?: boolean;
  draggable?: boolean;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export function HexRungBadge({ x, y, label, isDark, isSelected, draggable, onClick, onDragEnd }: HexRungBadgeProps) {
  const interactive = !!onClick;
  return (
    <Group
      x={x}
      y={y}
      listening={interactive}
      draggable={draggable}
      onClick={onClick}
      onDragEnd={onDragEnd}
    >
      {isSelected && (
        <Rect
          x={-HEX_W / 2 - 3}
          y={-HEX_H / 2 - 3}
          width={HEX_W + 6}
          height={HEX_H + 6}
          stroke="#0066cc"
          strokeWidth={1.5}
          fill="rgba(0,102,204,0.08)"
          dash={[4, 2]}
          listening={false}
        />
      )}
      <Shape
        sceneFunc={(ctx, shape) => {
          const w = HEX_W / 2;
          const h = HEX_H / 2;
          const n = HEX_NOTCH;
          ctx.beginPath();
          ctx.moveTo(-w + n, -h);
          ctx.lineTo(w - n, -h);
          ctx.lineTo(w, 0);
          ctx.lineTo(w - n, h);
          ctx.lineTo(-w + n, h);
          ctx.lineTo(-w, 0);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        }}
        fill={isDark ? "#1a1a3a" : "#eaeaff"}
        stroke={isSelected ? "#0066cc" : isDark ? "#6666cc" : "#3333aa"}
        strokeWidth={isSelected ? 2 : 1.2}
      />
      <Text
        x={-HEX_W / 2}
        width={HEX_W}
        align="center"
        y={-5}
        text={label}
        fontSize={9}
        fontStyle="bold"
        fill={isDark ? "#aaaaff" : "#111166"}
        listening={false}
      />
    </Group>
  );
}

interface Props {
  sheet: Sheet;
  canvasWidth: number;
  canvasHeight: number;
}

const ARROW_W = 60;
const ARROW_H = 20;

function ArrowShape({ arrow, onClick }: { arrow: CrossSheetArrow; onClick: () => void }) {
  const isSource = arrow.arrowType === "source";
  const color = "#0055aa";

  const path = isSource
    ? `M0,0 L${ARROW_W - 10},0 L${ARROW_W},${ARROW_H / 2} L${ARROW_W - 10},${ARROW_H} L0,${ARROW_H} Z`
    : `M10,0 L${ARROW_W},0 L${ARROW_W},${ARROW_H} L10,${ARROW_H} L0,${ARROW_H / 2} Z`;

  return (
    <Group x={arrow.x} y={arrow.y} onClick={onClick} listening={true}>
      <Path
        data={path}
        fill={isSource ? color : "#aa5500"}
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
        width={ARROW_W - 16}
        listening={false}
      />
      <Text
        x={isSource ? 4 : 12}
        y={11}
        text={arrow.targetSheetName}
        fontSize={6}
        fill="rgba(255,255,255,0.85)"
        width={ARROW_W - 16}
        listening={false}
      />
    </Group>
  );
}

// Title block layout constants (canvas px)
const TB_H = 40;
const ROW0_H = 14; // company row
const ROW1_H = 13; // project / drawn / rev / sheet
// ROW2_H fills remaining

const STROKE = "#444444";
const SW = 0.5;
const LABEL_COLOR = "#777777";
const VALUE_COLOR = "#000000";
const LABEL_FS = 4.5;
const VALUE_FS = 6;
const PAD = 2;

function TitleBlockRenderer({ sheet, W, H }: { sheet: Sheet; W: number; H: number }) {
  const template = useProjectStore((s) =>
    s.project.titleBlockTemplates.find(
      (t) => t.id === (sheet.titleBlockData?.templateId ?? BUILTIN_TEMPLATE_ID)
    )
  );

  const data = sheet.titleBlockData;
  if (!data || !data.visible) return null;

  const fields = template?.fields ?? DEFAULT_TITLE_BLOCK_FIELDS;
  const fieldMap = new Map(fields.map((f) => [f.name, f]));
  const val = (name: string) => data.values[name] ?? fieldMap.get(name)?.defaultValue ?? "";

  const tbY = H - TB_H;

  const c1 = W * 0.50;
  const c2 = W * 0.72;
  const c3 = W * 0.84;

  const row1Y = ROW0_H;
  const row2Y = ROW0_H + ROW1_H;

  return (
    <Group x={0} y={tbY} listening={false}>
      <Rect x={0} y={0} width={W} height={TB_H} fill="white" stroke={STROKE} strokeWidth={SW} />
      <Line points={[0, row1Y, W, row1Y]} stroke={STROKE} strokeWidth={SW} />
      <Text
        x={0} y={PAD}
        width={W} align="center"
        text={val("company") || "Company Name"}
        fontSize={9}
        fontStyle={val("company") ? "bold" : "normal"}
        fill={val("company") ? VALUE_COLOR : "#bbbbbb"}
        listening={false}
      />
      <Line points={[0, row2Y, W, row2Y]} stroke={STROKE} strokeWidth={SW} />
      <Line points={[c1, row1Y, c1, TB_H]} stroke={STROKE} strokeWidth={SW} />
      <Line points={[c2, row1Y, c2, TB_H]} stroke={STROKE} strokeWidth={SW} />
      <Line points={[c3, row1Y, c3, TB_H]} stroke={STROKE} strokeWidth={SW} />
      <Text x={PAD} y={row1Y + PAD} text="Project" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("projectName")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c1 - PAD * 2} ellipsis />
      <Text x={c1 + PAD} y={row1Y + PAD} text="Drawn By" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c1 + PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("drawnBy")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c2 - c1 - PAD * 2} ellipsis />
      <Text x={c2 + PAD} y={row1Y + PAD} text="Rev" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c2 + PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("revision")} fontSize={VALUE_FS} fill={VALUE_COLOR} />
      <Text x={c3 + PAD} y={row1Y + PAD} text="Sheet No." fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c3 + PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("sheetNumber")} fontSize={VALUE_FS + 1} fontStyle="bold" fill={VALUE_COLOR} />
      <Text x={PAD} y={row2Y + PAD} text="Title" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={PAD} y={row2Y + PAD + LABEL_FS + 1} text={val("title")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c1 - PAD * 2} ellipsis />
      <Text x={c1 + PAD} y={row2Y + PAD} text="Checked By" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c1 + PAD} y={row2Y + PAD + LABEL_FS + 1} text={val("checkedBy")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c2 - c1 - PAD * 2} ellipsis />
      <Text x={c2 + PAD} y={row2Y + PAD} text="Date" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c2 + PAD} y={row2Y + PAD + LABEL_FS + 1} text={val("date")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c3 - c2 - PAD * 2} />
    </Group>
  );
}

export function AnnotationLayer({ sheet, canvasWidth, canvasHeight }: Props) {
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const addToSelection = useCanvasStore((s) => s.addToSelection);
  const sheets = useProjectStore((s) => s.project.sheets);
  const updateElement = useProjectStore((s) => s.updateElement);
  const gridSize = useProjectStore((s) => s.project.settings.gridSize);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  const rungMarkers = sheet.elements
    .filter((e): e is RungMarker => e.type === "rungMarker")
    .sort((a, b) => a.number - b.number);
  const revClouds = sheet.elements.filter((e): e is RevisionCloud => e.type === "revisionCloud");
  const arrows = sheet.elements.filter((e): e is CrossSheetArrow => e.type === "crossSheetArrow");
  const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));

  const navigateTo = (targetSheetId: string) => {
    const target = sheets.find((s) => s.id === targetSheetId);
    if (target) setActiveSheet(targetSheetId);
  };

  return (
    <Layer>
      {/* Rung hexagonal badges — selectable and draggable */}
      {rungMarkers.map((rm) => (
        <HexRungBadge
          key={rm.id}
          x={rm.x}
          y={rm.y}
          label={String(rm.number)}
          isDark={isDark}
          isSelected={selectedElementIds.has(rm.id)}
          draggable
          onClick={(e) => {
            if (e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey) {
              addToSelection(rm.id);
            } else {
              setSelection([rm.id]);
            }
          }}
          onDragEnd={(e) => {
            const x = snapToGrid(e.target.x(), gridSize);
            const y = snapToGrid(e.target.y(), gridSize);
            e.target.x(x);
            e.target.y(y);
            updateElement(sheet.id, rm.id, { x, y });
          }}
        />
      ))}

      {/* Revision clouds — selectable and draggable */}
      {revClouds.map((cloud) => {
        const layer = layerMap.get(cloud.layerId);
        if (layer && !layer.visible) return null;
        const path = generateRevisionCloudPath(cloud.points, cloud.arcRadius);
        const isSelected = selectedElementIds.has(cloud.id);

        const xs = cloud.points.map((p) => p.x);
        const ys = cloud.points.map((p) => p.y);
        const bMinX = Math.min(...xs);
        const bMinY = Math.min(...ys);
        const bMaxX = Math.max(...xs);
        const bMaxY = Math.max(...ys);

        return (
          <Group
            key={cloud.id}
            x={0}
            y={0}
            draggable
            onClick={(e) => {
              e.cancelBubble = true;
              if (e.evt.ctrlKey || e.evt.metaKey || e.evt.shiftKey) {
                addToSelection(cloud.id);
              } else {
                setSelection([cloud.id]);
              }
            }}
            onDragEnd={(e) => {
              const dx = snapToGrid(e.target.x(), gridSize);
              const dy = snapToGrid(e.target.y(), gridSize);
              e.target.x(0);
              e.target.y(0);
              if (dx === 0 && dy === 0) return;
              updateElement(sheet.id, cloud.id, {
                points: cloud.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              });
            }}
          >
            {isSelected && (
              <Rect
                x={bMinX - 4}
                y={bMinY - 4}
                width={bMaxX - bMinX + 8}
                height={bMaxY - bMinY + 8}
                stroke="#0066cc"
                strokeWidth={1.5}
                fill="rgba(0,102,204,0.05)"
                dash={[5, 3]}
                listening={false}
              />
            )}
            <Path
              data={path}
              stroke="#ff6600"
              strokeWidth={1.5}
              fill="rgba(255, 102, 0, 0.08)"
              dash={[4, 2]}
              hitStrokeWidth={8}
            />
            <Text
              x={cloud.points[0]?.x ?? 0}
              y={(cloud.points[0]?.y ?? 0) - 14}
              text={cloud.label}
              fontSize={9}
              fill="#ff6600"
              fontStyle="bold"
              listening={false}
            />
          </Group>
        );
      })}

      {/* Cross-sheet arrows */}
      {arrows.map((arrow) => {
        const layer = layerMap.get(arrow.layerId);
        if (layer && !layer.visible) return null;
        return (
          <ArrowShape
            key={arrow.id}
            arrow={arrow}
            onClick={() => navigateTo(arrow.targetSheetId)}
          />
        );
      })}

      {/* Title block */}
      <TitleBlockRenderer sheet={sheet} W={canvasWidth} H={canvasHeight} />
    </Layer>
  );
}
