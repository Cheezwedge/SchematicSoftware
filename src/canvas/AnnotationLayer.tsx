import { Fragment } from "react";
import { Layer, Text, Path, Group } from "react-konva";
import type { Sheet } from "../models/sheet";
import type { RevisionCloud } from "../models/revision";
import type { CrossSheetArrow } from "../models/crossSheetArrow";
import { useProjectStore } from "../store/projectStore";
import { useCanvasStore } from "../store/canvasStore";
import { generateRevisionCloudPath } from "../lib/revisionCloud";
import { detectRungs } from "../lib/rungNumbering";

interface Props {
  sheet: Sheet;
  canvasWidth: number;
}

const ARROW_W = 60;
const ARROW_H = 20;

function ArrowShape({ arrow, onClick }: { arrow: CrossSheetArrow; onClick: () => void }) {
  const isSource = arrow.arrowType === "source";
  const color = "#0055aa";

  // Source: box with right-pointing arrowhead
  // Destination: left-pointing arrowhead with box
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

export function AnnotationLayer({ sheet, canvasWidth }: Props) {
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
    </Layer>
  );
}
