import { v4 as uuidv4 } from "uuid";
import type { SymbolDefinition } from "../models/symbol";

const VIEWBOX = 100;
const PADDING = 10;

interface Pt { x: number; y: number }

function buildNormalize(pts: Pt[]): (x: number, y: number) => Pt {
  if (pts.length === 0) return (x, y) => ({ x, y });
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const range = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = (VIEWBOX - PADDING * 2) / range;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return (x: number, y: number): Pt => ({
    x: Math.round(((x - cx) * scale + VIEWBOX / 2) * 10) / 10,
    y: Math.round((-(y - cy) * scale + VIEWBOX / 2) * 10) / 10, // flip Y axis
  });
}

export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  // Dynamic import — the WASM is embedded as base64 in the 8.8 MB dist bundle.
  // Lazy-loading keeps it out of the main bundle until actually needed.
  const { LibreDwg, Dwg_File_Type } = await import("@mlightcad/libredwg-web");

  const libredwg = await LibreDwg.create();
  const dwgPtr = libredwg.dwg_read_data(fileBuffer, Dwg_File_Type.DWG);
  if (dwgPtr == null) {
    throw new Error("Could not parse DWG file. The file may be corrupted or use an unsupported DWG version.");
  }

  const db = libredwg.convert(dwgPtr);
  libredwg.dwg_free(dwgPtr);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities: any[] = db.entities ?? [];

  const rawPts: Pt[] = [];
  for (const e of entities) {
    if (e.type === "LINE") {
      rawPts.push({ x: e.startPoint.x, y: e.startPoint.y });
      rawPts.push({ x: e.endPoint.x, y: e.endPoint.y });
    } else if (e.type === "LWPOLYLINE" || e.type === "POLYLINE") {
      for (const v of e.vertices ?? []) rawPts.push({ x: v.x, y: v.y });
    } else if (e.type === "CIRCLE" || e.type === "ARC") {
      rawPts.push({ x: e.center.x - e.radius, y: e.center.y - e.radius });
      rawPts.push({ x: e.center.x + e.radius, y: e.center.y + e.radius });
    }
  }

  if (rawPts.length === 0) {
    throw new Error("No drawable geometry found in DWG file (LINE, POLYLINE, CIRCLE, ARC entities).");
  }

  const norm = buildNormalize(rawPts);
  const computedRange = (() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of rawPts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return Math.max(maxX - minX, maxY - minY) || 1;
  })();

  const svgParts: string[] = [];

  for (const e of entities) {
    if (e.type === "LINE") {
      const s = norm(e.startPoint.x, e.startPoint.y);
      const en = norm(e.endPoint.x, e.endPoint.y);
      svgParts.push(`<line x1="${s.x}" y1="${s.y}" x2="${en.x}" y2="${en.y}" stroke="currentColor" stroke-width="2"/>`);

    } else if (e.type === "LWPOLYLINE" || e.type === "POLYLINE") {
      const verts: Pt[] = (e.vertices ?? []).map((v: Pt) => norm(v.x, v.y));
      for (let i = 0; i < verts.length - 1; i++) {
        const a = verts[i], b = verts[i + 1];
        svgParts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="currentColor" stroke-width="2"/>`);
      }
      const closed = e.type === "POLYLINE" ? e.closed : (e.flag & 1);
      if (closed && verts.length > 1) {
        const a = verts[verts.length - 1], b = verts[0];
        svgParts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="currentColor" stroke-width="2"/>`);
      }

    } else if (e.type === "CIRCLE") {
      const c = norm(e.center.x, e.center.y);
      const r = Math.round((e.radius / computedRange) * (VIEWBOX - PADDING * 2) * 10) / 10;
      svgParts.push(`<circle cx="${c.x}" cy="${c.y}" r="${r}" stroke="currentColor" stroke-width="2" fill="none"/>`);

    } else if (e.type === "ARC") {
      const c = norm(e.center.x, e.center.y);
      const r = Math.round((e.radius / computedRange) * (VIEWBOX - PADDING * 2) * 10) / 10;
      // DXF/DWG angles are CCW from +X in world space; SVG Y is flipped so negate
      const startRad = (-e.startAngle * Math.PI) / 180;
      const endRad = (-e.endAngle * Math.PI) / 180;
      const x1 = Math.round((c.x + r * Math.cos(startRad)) * 10) / 10;
      const y1 = Math.round((c.y + r * Math.sin(startRad)) * 10) / 10;
      const x2 = Math.round((c.x + r * Math.cos(endRad)) * 10) / 10;
      const y2 = Math.round((c.y + r * Math.sin(endRad)) * 10) / 10;
      let sweep = e.startAngle - e.endAngle;
      if (sweep < 0) sweep += 360;
      const large = sweep > 180 ? 1 : 0;
      svgParts.push(`<path d="M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}" stroke="currentColor" stroke-width="2" fill="none"/>`);
    }
  }

  if (svgParts.length === 0) {
    throw new Error("No supported geometry found in DWG file.");
  }

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
