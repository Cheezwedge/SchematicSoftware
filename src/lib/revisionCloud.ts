import type { Point } from "../models/geometry";

export interface CloudArc {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export function generateRevisionCloudPath(points: Point[], arcRadius = 12): string {
  if (points.length < 3) return "";

  const segments: string[] = [];
  const closed = [...points, points[0]];

  segments.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 0; i < closed.length - 1; i++) {
    const p1 = closed[i];
    const p2 = closed[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) continue;

    const numArcs = Math.max(1, Math.round(len / (arcRadius * 2)));
    const arcLen = len / numArcs;

    for (let j = 0; j < numArcs; j++) {
      const t = (j + 1) / numArcs;
      const ex = p1.x + dx * t;
      const ey = p1.y + dy * t;
      const r = arcLen / 2;
      segments.push(`A ${r} ${r} 0 0 0 ${ex} ${ey}`);
    }
  }

  segments.push("Z");
  return segments.join(" ");
}
