import type { SymbolGeomEl } from "../models/symbol";

const KONVA_SIZE = 60;
const KONVA_HALF = 30;
const BEZIER_SEGMENTS = 8;

function makeTransform(w: number, h: number) {
  const scale = Math.min(KONVA_SIZE / w, KONVA_SIZE / h);
  const xOff = (KONVA_SIZE - w * scale) / 2;
  const yOff = (KONVA_SIZE - h * scale) / 2;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    tx: (x: number) => r2(x * scale + xOff - KONVA_HALF),
    ty: (y: number) => r2(y * scale + yOff - KONVA_HALF),
    tr: (rad: number) => r2(rad * scale),
  };
}

function parsePointPairs(s: string): number[] {
  return s.trim().split(/[\s,]+/).map(Number).filter(isFinite);
}

function quadBezier(
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number
): number[] {
  const pts: number[] = [];
  for (let i = 1; i <= BEZIER_SEGMENTS; i++) {
    const t = i / BEZIER_SEGMENTS;
    const u = 1 - t;
    pts.push(
      Math.round((u * u * p0x + 2 * u * t * p1x + t * t * p2x) * 100) / 100,
      Math.round((u * u * p0y + 2 * u * t * p1y + t * t * p2y) * 100) / 100
    );
  }
  return pts;
}

function parsePath(d: string): { pts: number[]; closed: boolean }[] {
  const tokens = d.trim()
    .replace(/([MLHVQZmlhvqz])/g, " $1 ")
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const subpaths: { pts: number[]; closed: boolean }[] = [];
  let cur: number[] = [];
  let cx = 0, cy = 0;
  let i = 0;
  const n = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case "M": {
        if (cur.length >= 4) subpaths.push({ pts: cur, closed: false });
        cx = n(); cy = n();
        cur = [cx, cy];
        break;
      }
      case "m": {
        if (cur.length >= 4) subpaths.push({ pts: cur, closed: false });
        cx += n(); cy += n();
        cur = [cx, cy];
        break;
      }
      case "L": { cx = n(); cy = n(); cur.push(cx, cy); break; }
      case "l": { cx += n(); cy += n(); cur.push(cx, cy); break; }
      case "H": { cx = n(); cur.push(cx, cy); break; }
      case "h": { cx += n(); cur.push(cx, cy); break; }
      case "V": { cy = n(); cur.push(cx, cy); break; }
      case "v": { cy += n(); cur.push(cx, cy); break; }
      case "Q": {
        const p1x = n(), p1y = n(), p2x = n(), p2y = n();
        cur.push(...quadBezier(cx, cy, p1x, p1y, p2x, p2y));
        cx = p2x; cy = p2y;
        break;
      }
      case "q": {
        const dx1 = n(), dy1 = n(), dx2 = n(), dy2 = n();
        const p1x = cx + dx1, p1y = cy + dy1, p2x = cx + dx2, p2y = cy + dy2;
        cur.push(...quadBezier(cx, cy, p1x, p1y, p2x, p2y));
        cx = p2x; cy = p2y;
        break;
      }
      case "Z":
      case "z": {
        if (cur.length >= 4) {
          subpaths.push({ pts: cur, closed: true });
          cur = [cur[0], cur[1]];
        }
        break;
      }
    }
  }
  if (cur.length >= 4) subpaths.push({ pts: cur, closed: false });
  return subpaths;
}

/**
 * Converts SVG content string to a SymbolGeomEl array for zoom-independent vector rendering.
 * Handles line, circle, rect, polyline, polygon, and path elements (M/L/H/V/Q/Z commands).
 * Returns an empty array for SVGs containing <text> elements (text can't be vectorized).
 */
export function svgToGeometry(svgContent: string, viewBox: string): SymbolGeomEl[] {
  if (svgContent.includes("<text")) return [];

  const vbParts = viewBox.trim().split(/[\s,]+/);
  const w = parseFloat(vbParts[2]);
  const h = parseFloat(vbParts[3]);
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return [];

  const { tx, ty, tr } = makeTransform(w, h);

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
  } catch { return []; }

  const result: SymbolGeomEl[] = [];

  doc.querySelectorAll("line, circle, rect, polyline, polygon, path").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const fill = el.getAttribute("fill") ?? "";
    const isFilled = fill === "currentColor";

    if (tag === "line") {
      result.push({
        t: "L",
        x1: tx(parseFloat(el.getAttribute("x1") ?? "0")),
        y1: ty(parseFloat(el.getAttribute("y1") ?? "0")),
        x2: tx(parseFloat(el.getAttribute("x2") ?? "0")),
        y2: ty(parseFloat(el.getAttribute("y2") ?? "0")),
      });

    } else if (tag === "circle") {
      result.push({
        t: "C",
        cx: tx(parseFloat(el.getAttribute("cx") ?? "0")),
        cy: ty(parseFloat(el.getAttribute("cy") ?? "0")),
        r: tr(parseFloat(el.getAttribute("r") ?? "0")),
      });

    } else if (tag === "rect") {
      const x = parseFloat(el.getAttribute("x") ?? "0");
      const y = parseFloat(el.getAttribute("y") ?? "0");
      const rw = parseFloat(el.getAttribute("width") ?? "0");
      const rh = parseFloat(el.getAttribute("height") ?? "0");
      const pts = [tx(x), ty(y), tx(x + rw), ty(y), tx(x + rw), ty(y + rh), tx(x), ty(y + rh)];
      result.push({ t: "P", pts, closed: true, ...(isFilled ? { filled: true } : {}) });

    } else if (tag === "polyline") {
      const raw = parsePointPairs(el.getAttribute("points") ?? "");
      const pts: number[] = [];
      for (let i = 0; i + 1 < raw.length; i += 2) pts.push(tx(raw[i]), ty(raw[i + 1]));
      if (pts.length >= 4) result.push({ t: "P", pts, closed: false });

    } else if (tag === "polygon") {
      const raw = parsePointPairs(el.getAttribute("points") ?? "");
      const pts: number[] = [];
      for (let i = 0; i + 1 < raw.length; i += 2) pts.push(tx(raw[i]), ty(raw[i + 1]));
      if (pts.length >= 4) result.push({ t: "P", pts, closed: true, ...(isFilled ? { filled: true } : {}) });

    } else if (tag === "path") {
      const d = el.getAttribute("d") ?? "";
      if (!d) return;
      const subpaths = parsePath(d);
      for (const sp of subpaths) {
        if (sp.pts.length < 4) continue;
        const pts: number[] = [];
        for (let i = 0; i + 1 < sp.pts.length; i += 2) pts.push(tx(sp.pts[i]), ty(sp.pts[i + 1]));
        result.push({ t: "P", pts, closed: sp.closed, ...(isFilled ? { filled: true } : {}) });
      }
    }
  });

  return result;
}
