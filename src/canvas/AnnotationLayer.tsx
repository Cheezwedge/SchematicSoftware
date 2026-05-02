import { Fragment } from "react";
import { Layer, Text, Path, Group, Rect, Line } from "react-konva";
import type { Sheet } from "../models/sheet";
import type { RevisionCloud } from "../models/revision";
import type { CrossSheetArrow } from "../models/crossSheetArrow";
import { useProjectStore } from "../store/projectStore";
import { useCanvasStore } from "../store/canvasStore";
import { generateRevisionCloudPath } from "../lib/revisionCloud";
import { detectRungs } from "../lib/rungNumbering";
import { BUILTIN_TEMPLATE_ID, DEFAULT_TITLE_BLOCK_FIELDS } from "../models/titleBlock";

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

  // Column break x-coords (proportions of W)
  const c1 = W * 0.50; // project / title column end
  const c2 = W * 0.72; // drawn/checked column end
  const c3 = W * 0.84; // rev/date column end
  // c3 → W: sheet number

  const row1Y = ROW0_H;
  const row2Y = ROW0_H + ROW1_H;

  return (
    <Group x={0} y={tbY} listening={false}>
      {/* Background */}
      <Rect x={0} y={0} width={W} height={TB_H} fill="white" stroke={STROKE} strokeWidth={SW} />

      {/* Row 0 — Company */}
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

      {/* Row 1 — Project | Drawn By | Rev | Sheet */}
      <Line points={[0, row2Y, W, row2Y]} stroke={STROKE} strokeWidth={SW} />
      <Line points={[c1, row1Y, c1, TB_H]} stroke={STROKE} strokeWidth={SW} />
      <Line points={[c2, row1Y, c2, TB_H]} stroke={STROKE} strokeWidth={SW} />
      <Line points={[c3, row1Y, c3, TB_H]} stroke={STROKE} strokeWidth={SW} />

      {/* Project Name */}
      <Text x={PAD} y={row1Y + PAD} text="Project" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("projectName")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c1 - PAD * 2} ellipsis />

      {/* Drawn By */}
      <Text x={c1 + PAD} y={row1Y + PAD} text="Drawn By" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c1 + PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("drawnBy")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c2 - c1 - PAD * 2} ellipsis />

      {/* Rev */}
      <Text x={c2 + PAD} y={row1Y + PAD} text="Rev" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c2 + PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("revision")} fontSize={VALUE_FS} fill={VALUE_COLOR} />

      {/* Sheet No. — spans both data rows */}
      <Text x={c3 + PAD} y={row1Y + PAD} text="Sheet No." fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c3 + PAD} y={row1Y + PAD + LABEL_FS + 1} text={val("sheetNumber")} fontSize={VALUE_FS + 1} fontStyle="bold" fill={VALUE_COLOR} />

      {/* Row 2 — Title | Checked By | Date */}
      {/* Title */}
      <Text x={PAD} y={row2Y + PAD} text="Title" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={PAD} y={row2Y + PAD + LABEL_FS + 1} text={val("title")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c1 - PAD * 2} ellipsis />

      {/* Checked By */}
      <Text x={c1 + PAD} y={row2Y + PAD} text="Checked By" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c1 + PAD} y={row2Y + PAD + LABEL_FS + 1} text={val("checkedBy")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c2 - c1 - PAD * 2} ellipsis />

      {/* Date */}
      <Text x={c2 + PAD} y={row2Y + PAD} text="Date" fontSize={LABEL_FS} fill={LABEL_COLOR} />
      <Text x={c2 + PAD} y={row2Y + PAD + LABEL_FS + 1} text={val("date")} fontSize={VALUE_FS} fill={VALUE_COLOR} width={c3 - c2 - PAD * 2} />
    </Group>
  );
}

export function AnnotationLayer({ sheet, canvasWidth, canvasHeight }: Props) {
  const settings = useProjectStore((s) => s.project.settings);
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const sheets = useProjectStore((s) => s.project.sheets);

  const rungs = detectRungs(sheet, settings.rungNumberFormat);
  const revClouds = sheet.elements.filter((e): e is RevisionCloud => e.type === "revisionCloud");
  const arrows = sheet.elements.filter((e): e is CrossSheetArrow => e.type === "crossSheetArrow");
  const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));

  const RUNG_X = settings.rungNumberFormat.position === "left" ? 8 : canvasWidth - 30;

  const navigateTo = (targetSheetId: string) => {
    const target = sheets.find((s) => s.id === targetSheetId);
    if (target) setActiveSheet(targetSheetId);
  };

  return (
    <Layer>
      {/* Rung numbers */}
      {rungs.map((rung) => (
        <Text
          key={rung.label}
          x={RUNG_X}
          y={rung.y - 6}
          text={rung.label}
          fontSize={10}
          fill="#888888"
          listening={false}
        />
      ))}

      {/* Revision clouds */}
      {revClouds.map((cloud) => {
        const layer = layerMap.get(cloud.layerId);
        if (layer && !layer.visible) return null;
        const path = generateRevisionCloudPath(cloud.points, cloud.arcRadius);
        return (
          <Fragment key={cloud.id}>
            <Path
              data={path}
              stroke="#ff6600"
              strokeWidth={1.5}
              fill="rgba(255, 102, 0, 0.08)"
              dash={[4, 2]}
              listening={false}
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
          </Fragment>
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
