import { Layer, Text, Path } from "react-konva";
import type { Sheet } from "../models/sheet";
import type { RevisionCloud } from "../models/revision";
import { useProjectStore } from "../store/projectStore";
import { generateRevisionCloudPath } from "../lib/revisionCloud";
import { detectRungs } from "../lib/rungNumbering";

interface Props {
  sheet: Sheet;
  canvasWidth: number;
}

export function AnnotationLayer({ sheet, canvasWidth }: Props) {
  const settings = useProjectStore((s) => s.project.settings);
  const rungs = detectRungs(sheet, settings.rungNumberFormat);
  const revClouds = sheet.elements.filter((e): e is RevisionCloud => e.type === "revisionCloud");
  const layerMap = new Map(sheet.layers.map((l) => [l.id, l]));

  const RUNG_X = settings.rungNumberFormat.position === "left" ? 8 : canvasWidth - 30;

  return (
    <Layer listening={false}>
      {/* Rung numbers */}
      {rungs.map((rung) => (
        <Text
          key={rung.label}
          x={RUNG_X}
          y={rung.y - 6}
          text={rung.label}
          fontSize={10}
          fill="#888888"
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
            />
            <Text
              x={cloud.points[0]?.x ?? 0}
              y={(cloud.points[0]?.y ?? 0) - 14}
              text={cloud.label}
              fontSize={9}
              fill="#ff6600"
              fontStyle="bold"
            />
          </Fragment>
        );
      })}
    </Layer>
  );
}

import { Fragment } from "react";
