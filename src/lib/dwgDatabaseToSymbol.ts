import type {
  DwgArcEntity,
  DwgCircleEntity,
  DwgDatabase,
  DwgEntity,
  DwgInsertEntity,
  DwgLineEntity,
  DwgLWPolylineEntity,
  DwgPolyline2dEntity,
  DwgPolyline3dEntity,
} from "@mlightcad/libredwg-web";

interface Pt2 { x: number; y: number }

/** Affine transform from block-local coordinates to world coordinates. */
type PtTransform = (p: Pt2) => Pt2;

const IDENTITY: PtTransform = (p) => p;

function makeInsertTransform(insert: DwgInsertEntity, blockBasePoint: Pt2): PtTransform {
  const cos = Math.cos(insert.rotation);
  const sin = Math.sin(insert.rotation);
  const xScale = insert.xScale || 1;
  const yScale = insert.yScale || 1;
  return (p) => {
    const x = (p.x - blockBasePoint.x) * xScale;
    const y = (p.y - blockBasePoint.y) * yScale;
    return {
      x: x * cos - y * sin + insert.insertionPoint.x,
      y: x * sin + y * cos + insert.insertionPoint.y,
    };
  };
}

function compose(outer: PtTransform, inner: PtTransform): PtTransform {
  return (p) => outer(inner(p));
}

/** Composed scale factor for radii (geometric mean of |xScale| and |yScale|). */
function composeRadiusScale(outer: number, insert: DwgInsertEntity): number {
  const local = Math.sqrt(Math.abs((insert.xScale || 1) * (insert.yScale || 1)));
  return outer * local;
}

/** Composed rotation in radians, used to rotate arc start/end angles. */
function composeRotation(outer: number, insert: DwgInsertEntity): number {
  return outer + insert.rotation;
}

const RAD_TO_DEG = 180 / Math.PI;

/** DXF-like flat entity shapes that entitiesToSymbol() already understands (angles in degrees). */
type FlatEntity =
  | { type: "LINE"; start: Pt2; end: Pt2 }
  | { type: "CIRCLE"; center: Pt2; radius: number }
  | { type: "ARC"; center: Pt2; radius: number; startAngle: number; endAngle: number }
  | { type: "LWPOLYLINE" | "POLYLINE"; vertices: Pt2[]; closed: boolean };

const MAX_INSERT_DEPTH = 12;

function findBlock(db: DwgDatabase, name: string) {
  return db.tables.BLOCK_RECORD.entries.find((b) => b.name === name);
}

/**
 * Recursively walks model-space (or block) entities, resolving INSERT references against
 * BLOCK_RECORD entries and applying the full affine transform (translate by -basePoint,
 * scale, rotate, translate by insertion point) so all geometry ends up in world coordinates.
 */
function flattenEntities(
  db: DwgDatabase,
  entities: DwgEntity[],
  transform: PtTransform,
  radiusScale: number,
  rotation: number,
  depth: number,
  out: FlatEntity[]
): void {
  if (depth > MAX_INSERT_DEPTH) return;

  for (const e of entities) {
    switch (e.type) {
      case "LINE": {
        const line = e as DwgLineEntity;
        out.push({
          type: "LINE",
          start: transform({ x: line.startPoint.x, y: line.startPoint.y }),
          end: transform({ x: line.endPoint.x, y: line.endPoint.y }),
        });
        break;
      }
      case "CIRCLE": {
        const circle = e as DwgCircleEntity;
        out.push({
          type: "CIRCLE",
          center: transform({ x: circle.center.x, y: circle.center.y }),
          radius: circle.radius * radiusScale,
        });
        break;
      }
      case "ARC": {
        const arc = e as DwgArcEntity;
        out.push({
          type: "ARC",
          center: transform({ x: arc.center.x, y: arc.center.y }),
          radius: arc.radius * radiusScale,
          startAngle: (arc.startAngle + rotation) * RAD_TO_DEG,
          endAngle: (arc.endAngle + rotation) * RAD_TO_DEG,
        });
        break;
      }
      case "LWPOLYLINE": {
        const poly = e as DwgLWPolylineEntity;
        out.push({
          type: "LWPOLYLINE",
          vertices: poly.vertices.map((v) => transform({ x: v.x, y: v.y })),
          closed: !!(poly.flag & 1),
        });
        break;
      }
      case "POLYLINE2D":
      case "POLYLINE3D": {
        const poly = e as DwgPolyline2dEntity | DwgPolyline3dEntity;
        out.push({
          type: "POLYLINE",
          vertices: poly.vertices.map((v) => transform({ x: v.x, y: v.y })),
          closed: !!(poly.flag & 1),
        });
        break;
      }
      case "INSERT": {
        const insert = e as DwgInsertEntity;
        const block = findBlock(db, insert.name);
        if (!block) break;
        const basePoint = { x: block.basePoint.x, y: block.basePoint.y };
        const insertTransform = makeInsertTransform(insert, basePoint);
        flattenEntities(
          db,
          block.entities,
          compose(transform, insertTransform),
          composeRadiusScale(radiusScale, insert),
          composeRotation(rotation, insert),
          depth + 1,
          out
        );
        break;
      }
      default:
        break;
    }
  }
}

/**
 * Flattens a parsed DwgDatabase into world-space entities in the same shape that
 * entitiesToSymbol() (in dxfToSymbol.ts) expects, applying INSERT transforms so
 * block geometry lands in the correct place/scale/rotation instead of overlapping
 * at the origin (the cause of "jumbled" DWG imports).
 */
export function flattenDwgDatabase(db: DwgDatabase): FlatEntity[] {
  const out: FlatEntity[] = [];
  flattenEntities(db, db.entities, IDENTITY, 1, 0, 0, out);
  return out;
}
