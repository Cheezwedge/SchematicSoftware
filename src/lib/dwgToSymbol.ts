import { v4 as uuidv4 } from "uuid";
import type { SymbolDefinition, SymbolGeomEl } from "../models/symbol";

const VIEWBOX = 100;
const PADDING = 10;
const KONVA_HALF = 30;
const SVG_TO_KONVA = KONVA_HALF / (VIEWBOX / 2); // 0.6

interface Pt { x: number; y: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPt(obj: any): Pt | null {
  if (!obj || typeof obj !== "object") return null;
  const x = typeof obj.x === "number" ? obj.x : NaN;
  const y = typeof obj.y === "number" ? obj.y : NaN;
  if (!isFinite(x) || !isFinite(y)) return null;
  return { x, y };
}

/** IQR-based bounding box — rejects outlier entities (paper space, far-away blocks). */
function buildNormalize(pts: Pt[]): { norm: (x: number, y: number) => Pt; scale: number } {
  if (pts.length === 0) return { norm: (x, y) => ({ x, y }), scale: 1 };

  const xs = pts.map(p => p.x).sort((a, b) => a - b);
  const ys = pts.map(p => p.y).sort((a, b) => a - b);
  const q = (arr: number[], f: number) => arr[Math.min(arr.length - 1, Math.floor(arr.length * f))];

  const q1x = q(xs, 0.25), q3x = q(xs, 0.75);
  const q1y = q(ys, 0.25), q3y = q(ys, 0.75);
  const fenceX = (q3x - q1x) * 3 || (xs[xs.length - 1] - xs[0]) || 1;
  const fenceY = (q3y - q1y) * 3 || (ys[ys.length - 1] - ys[0]) || 1;

  const core = pts.filter(p =>
    p.x >= q1x - fenceX && p.x <= q3x + fenceX &&
    p.y >= q1y - fenceY && p.y <= q3y + fenceY
  );
  const usePts = core.length >= Math.ceil(pts.length * 0.5) ? core : pts;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of usePts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const range = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = (VIEWBOX - PADDING * 2) / range;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return {
    norm: (x, y): Pt => ({
      x: Math.round(((x - cx) * scale + VIEWBOX / 2) * 10) / 10,
      y: Math.round((-(y - cy) * scale + VIEWBOX / 2) * 10) / 10,
    }),
    scale,
  };
}

function svgToKonva(v: number): number {
  return Math.round((v - VIEWBOX / 2) * SVG_TO_KONVA * 10) / 10;
}
function svgRadiusToKonva(r: number): number {
  return Math.round(r * SVG_TO_KONVA * 10) / 10;
}

/**
 * DwgDatabase stores arc angles in RADIANS (Y-up math convention).
 * After Y-flip for SVG/Konva (Y-down), the arc travels CW → sweep-flag=1.
 * large-arc-flag is determined by the CCW angular span in DWG radians.
 */
function arcLargeFlagRad(startRad: number, endRad: number): 0 | 1 {
  const TWO_PI = 2 * Math.PI;
  const ccwSpan = ((endRad - startRad) % TWO_PI + TWO_PI) % TWO_PI || TWO_PI;
  return ccwSpan > Math.PI ? 1 : 0;
}

export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  const { LibreDwg, Dwg_File_Type } = await import("@mlightcad/libredwg-web");

  const libredwg = await LibreDwg.create();
  const dwgPtr = libredwg.dwg_read_data(fileBuffer, Dwg_File_Type.DWG);
  if (dwgPtr == null) {
    throw new Error("Could not parse DWG file. The file may be corrupted or use an unsupported DWG version.");
  }

  const db = libredwg.convert(dwgPtr);
  libredwg.dwg_free(dwgPtr);

  // db.entities = model space + paper space. User symbol geometry lives in named blocks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelEntities: any[] = db.entities ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockRecords: any[] = db.tables?.BLOCK_RECORD?.entries ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userBlockEntities: any[] = blockRecords
    .filter((btr) => btr.name && !btr.name.startsWith("*"))
    .flatMap((btr) => btr.entities ?? []);

  const GEOM_TYPES = new Set(["LINE", "LWPOLYLINE", "POLYLINE", "CIRCLE", "ARC"]);
  const modelHasGeom = modelEntities.some((e) => GEOM_TYPES.has(e.type));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities: any[] = modelHasGeom ? modelEntities
    : userBlockEntities.length > 0 ? userBlockEntities
    : modelEntities;

  // Collect bounding-box seed points (use center±radius for circles/arcs)
  const rawPts: Pt[] = [];
  for (const e of entities) {
    if (e.type === "LINE") {
      const s = extractPt(e.startPoint);
      const en = extractPt(e.endPoint);
      if (s) rawPts.push(s);
      if (en) rawPts.push(en);
    } else if (e.type === "LWPOLYLINE" || e.type === "POLYLINE") {
      for (const v of e.vertices ?? []) {
        const p = extractPt(v);
        if (p) rawPts.push(p);
      }
    } else if (e.type === "CIRCLE" || e.type === "ARC") {
      const c = extractPt(e.center);
      const r = typeof e.radius === "number" ? e.radius : 0;
      if (c && r > 0) {
        rawPts.push({ x: c.x - r, y: c.y - r });
        rawPts.push({ x: c.x + r, y: c.y + r });
      }
    }
  }

  if (rawPts.length === 0) {
    throw new Error("No drawable geometry found in DWG file (LINE, POLYLINE, CIRCLE, ARC entities).");
  }

  const { norm, scale: normScale } = buildNormalize(rawPts);
  const svgParts: string[] = [];
  const geometry: SymbolGeomEl[] = [];

  for (const e of entities) {
    if (e.type === "LINE") {
      const rawS = extractPt(e.startPoint);
      const rawE = extractPt(e.endPoint);
      if (!rawS || !rawE) continue;
      const s = norm(rawS.x, rawS.y);
      const en = norm(rawE.x, rawE.y);
      svgParts.push(`<line x1="${s.x}" y1="${s.y}" x2="${en.x}" y2="${en.y}" stroke="currentColor" stroke-width="1"/>`);
      geometry.push({ t: "L", x1: svgToKonva(s.x), y1: svgToKonva(s.y), x2: svgToKonva(en.x), y2: svgToKonva(en.y) });

    } else if (e.type === "LWPOLYLINE" || e.type === "POLYLINE") {
      const rawVerts = (e.vertices ?? []).map((v: unknown) => extractPt(v)).filter(Boolean) as Pt[];
      if (rawVerts.length < 2) continue;
      const verts = rawVerts.map(v => norm(v.x, v.y));
      const closed: boolean = !!(e.type === "POLYLINE" ? e.closed : (e.flag & 1));
      const ptsStr = verts.map(v => `${v.x},${v.y}`).join(" ");
      svgParts.push(closed
        ? `<polygon points="${ptsStr}" stroke="currentColor" stroke-width="1" fill="none"/>`
        : `<polyline points="${ptsStr}" stroke="currentColor" stroke-width="1" fill="none"/>`
      );
      geometry.push({
        t: "P",
        pts: verts.flatMap(v => [svgToKonva(v.x), svgToKonva(v.y)]),
        closed,
      });

    } else if (e.type === "CIRCLE") {
      const rawC = extractPt(e.center);
      if (!rawC) continue;
      const c = norm(rawC.x, rawC.y);
      const r_svg = Math.round(e.radius * normScale * 10) / 10;
      svgParts.push(`<circle cx="${c.x}" cy="${c.y}" r="${r_svg}" stroke="currentColor" stroke-width="1" fill="none"/>`);
      geometry.push({ t: "C", cx: svgToKonva(c.x), cy: svgToKonva(c.y), r: svgRadiusToKonva(r_svg) });

    } else if (e.type === "ARC") {
      const rawC = extractPt(e.center);
      if (!rawC) continue;
      const c = norm(rawC.x, rawC.y);
      const r_svg = Math.round(e.radius * normScale * 10) / 10;

      // DwgDatabase angles are in RADIANS (not degrees like DXF text format).
      // Y-flip for SVG: negate the sin component so CCW DWG arcs become CW SVG arcs.
      const startRad: number = e.startAngle ?? 0;
      const endRad: number = e.endAngle ?? (2 * Math.PI);
      const x1 = Math.round((c.x + r_svg * Math.cos(startRad)) * 10) / 10;
      const y1 = Math.round((c.y - r_svg * Math.sin(startRad)) * 10) / 10;
      const x2 = Math.round((c.x + r_svg * Math.cos(endRad)) * 10) / 10;
      const y2 = Math.round((c.y - r_svg * Math.sin(endRad)) * 10) / 10;
      const large = arcLargeFlagRad(startRad, endRad);
      svgParts.push(`<path d="M${x1},${y1} A${r_svg},${r_svg} 0 ${large},1 ${x2},${y2}" stroke="currentColor" stroke-width="1" fill="none"/>`);
      geometry.push({
        t: "A",
        x1: svgToKonva(x1), y1: svgToKonva(y1),
        x2: svgToKonva(x2), y2: svgToKonva(y2),
        r: svgRadiusToKonva(r_svg),
        large,
      });
    }
  }

  if (svgParts.length === 0) throw new Error("No supported geometry found in DWG file.");

  const name = fileName.replace(/\.[^.]+$/, "");
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}">${svgParts.join("")}</svg>`;

  return {
    id: uuidv4(),
    name,
    category: "Imported",
    standard: "custom",
    svgContent,
    viewBox: `0 0 ${VIEWBOX} ${VIEWBOX}`,
    connectionPoints: [],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: false },
      { name: "description", label: "Description", defaultValue: "", required: false },
    ],
    tags: ["imported", "dwg"],
    geometry,
  };
}

export function loadDwgFile(): Promise<{ buffer: ArrayBuffer; name: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dwg";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = (e) => resolve({ buffer: e.target?.result as ArrayBuffer, name: file.name });
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    };
    input.click();
  });
}
