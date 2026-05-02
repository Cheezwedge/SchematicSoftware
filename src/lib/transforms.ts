import type { ConnectionPoint, ResolvedConnectionPoint } from "../models/symbol";
import { rotateDirection } from "../models/geometry";

export function resolveConnectionPoints(
  connectionPoints: ConnectionPoint[],
  instanceX: number,
  instanceY: number,
  rotation: number
): ResolvedConnectionPoint[] {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return connectionPoints.map((cp) => ({
    ...cp,
    direction: rotateDirection(cp.direction, rotation),
    worldX: instanceX + cp.x * cos - cp.y * sin,
    worldY: instanceY + cp.x * sin + cp.y * cos,
  }));
}
