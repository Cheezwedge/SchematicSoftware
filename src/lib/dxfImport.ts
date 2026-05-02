import DxfParser from "dxf-parser";
import { v4 as uuidv4 } from "uuid";
import type { Wire } from "../models/wire";
import type { Layer } from "../models/layer";
import type { SchematicElement } from "../models/sheet";

// AutoCAD Color Index (ACI) → hex
const ACI_COLORS: Record<number, string> = {
  1: "#ff0000",
  2: "#ffff00",
  3: "#00ff00",
  4: "#00ffff",
  5: "#0000ff",
  6: "#ff00ff",
  7: "#000000",
  8: "#808080",
  9: "#c0c0c0",
};

function aciToHex(aci: number | undefined): string {
  if (aci === undefined || aci === 0 || aci === 256) return "#000000";
  return ACI_COLORS[aci] ?? "#000000";
}

export interface DxfImportResult {
  layers: Layer[];
  elements: SchematicElement[];
  wireCount: number;
  skippedCount: number;
}

// Scale DXF world coordinates into canvas pixel space (sheet = 1631×1056 px)
const SHEET_W_PX = 1631;
const SHEET_H_PX = 1056;
const MARGIN_PX = 40;

interface Point2D { x: number; y: number }

function buildTransform(points: Point2D[]): (x: number, y: number) => Point2D {
  if (points.length === 0) return (x, y) => ({ x, y });
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const dxfW = maxX - minX || 1;
  const dxfH = maxY - minY || 1;
  const scale = Math.min(
    (SHEET_W_PX - MARGIN_PX * 2) / dxfW,
    (SHEET_H_PX - MARGIN_PX * 2) / dxfH
  );
  return (x: number, y: number): Point2D => ({
    x: Math.round((x - minX) * scale + MARGIN_PX),
    y: Math.round((maxY - y) * scale + MARGIN_PX), // flip Y axis
  });
}

export function parseDxf(content: string): DxfImportResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new (DxfParser as any)();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dxf: any = parser.parseSync(content);

  // ── Layers ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dxfLayers: Record<string, any> = dxf?.tables?.layer?.layers ?? { "0": { name: "0", color: 7 } };
  const layerNameToId = new Map<string, string>();

  const layers: Layer[] = Object.values(dxfLayers).map((dl, i) => {
    const id = uuidv4();
    layerNameToId.set(dl.name, id);
    return {
      id,
      name: dl.name,
      visible: true,
      printable: true,
      locked: false,
      color: aciToHex(dl.color),
      order: i,
    } satisfies Layer;
  });

  if (!layerNameToId.has("0")) {
    const id = uuidv4();
    layerNameToId.set("0", id);
    layers.push({ id, name: "0", visible: true, printable: true, locked: false, color: "#000000", order: layers.length });
  }

  const getLayerId = (name: string | undefined) =>
    layerNameToId.get(name ?? "0") ?? layerNameToId.get("0") ?? "";

  // ── Gather raw points for bounding box ──────────────────────────────────
  const rawPoints: Point2D[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const entity of (dxf?.entities ?? []) as any[]) {
    if (entity.type === "LINE") {
      rawPoints.push({ x: entity.start.x, y: entity.start.y });
      rawPoints.push({ x: entity.end.x, y: entity.end.y });
    } else if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") {
      for (const v of entity.vertices ?? []) rawPoints.push({ x: v.x, y: v.y });
    }
  }

  const transform = buildTransform(rawPoints);

  // ── Map entities to wire elements ────────────────────────────────────────
  const elements: SchematicElement[] = [];
  let wireIndex = 1;
  let skippedCount = 0;

  const makeWire = (points: Point2D[], layerName: string | undefined, color: string | undefined): Wire => {
    const layerColor = layers.find((l) => l.name === layerName)?.color ?? "#000000";
    return {
      id: uuidv4(),
      type: "wire" as const,
      layerId: getLayerId(layerName),
      sheetId: "", // placeholder — caller must set sheetId on each element
      points,
      color: color ?? layerColor,
      gauge: "14 AWG",
      number: `W${String(wireIndex++).padStart(3, "0")}`,
      netId: uuidv4(),
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const entity of (dxf?.entities ?? []) as any[]) {
    const layerName: string | undefined = entity.layer;
    const entityColor = entity.color !== undefined && entity.color !== 256
      ? aciToHex(entity.color)
      : undefined;

    if (entity.type === "LINE") {
      const s = transform(entity.start.x, entity.start.y);
      const e = transform(entity.end.x, entity.end.y);
      elements.push(makeWire([s, e], layerName, entityColor));
    } else if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") {
      const verts: Point2D[] = (entity.vertices ?? []).map((v: Point2D) =>
        transform(v.x, v.y)
      );
      for (let i = 0; i < verts.length - 1; i++) {
        elements.push(makeWire([verts[i], verts[i + 1]], layerName, entityColor));
      }
    } else {
      skippedCount++;
    }
  }

  return { layers, elements, wireCount: elements.length, skippedCount };
}

export function loadDxfFile(): Promise<{ content: string; name: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dxf";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = (e) => resolve({ content: e.target?.result as string, name: file.name });
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    };
    input.click();
  });
}
