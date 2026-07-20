/**
 * Flattens an SVG document (as produced by libredwg's SvgConverter) into world-space
 * entities in the DXF-like shape that entitiesToSymbol() consumes.
 *
 * The library's SVG uses <defs><g id="blockName">…</g></defs> plus <use href="#blockName"
 * transform="…"> for INSERT references, and wraps model space in a Y-flip matrix. This
 * module resolves those references itself, composing the full transform chain per shape,
 * so the output is plain lines/circles/polylines that render as native vector geometry
 * with zoom-independent stroke widths.
 */

interface Pt { x: number; y: number }

export type FlatEntity =
  | { type: "LINE"; start: Pt; end: Pt }
  | { type: "CIRCLE"; center: Pt; radius: number }
  | { type: "POLYLINE"; vertices: Pt[]; closed: boolean };

/** 2D affine matrix [a, b, c, d, e, f]: x' = a·x + c·y + e; y' = b·x + d·y + f */
type Mat = [number, number, number, number, number, number];

const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

/** Composes matrices: the returned matrix applies `n` first, then `m`. */
function mul(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function apply(m: Mat, x: number, y: number): Pt {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

function translation(tx: number, ty: number): Mat {
  return [1, 0, 0, 1, tx, ty];
}

/** Parses an SVG transform attribute (translate/scale/rotate/matrix lists). */
function parseTransform(s: string | null): Mat {
  let m = IDENTITY;
  if (!s) return m;
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s))) {
    const args = match[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let t: Mat | null = null;
    switch (match[1]) {
      case "translate":
        t = translation(args[0] || 0, args[1] || 0);
        break;
      case "scale": {
        const sx = args[0] ?? 1;
        const sy = args[1] ?? sx;
        t = [sx, 0, 0, sy, 0, 0];
        break;
      }
      case "rotate": {
        const a = ((args[0] || 0) * Math.PI) / 180;
        const cos = Math.cos(a), sin = Math.sin(a);
        t = [cos, sin, -sin, cos, 0, 0];
        if (args.length >= 3) {
          t = mul(mul(translation(args[1], args[2]), t), translation(-args[1], -args[2]));
        }
        break;
      }
      case "matrix":
        if (args.length === 6) t = args as Mat;
        break;
    }
    if (t) m = mul(m, t);
  }
  return m;
}

/** True if the matrix is a similarity (uniform scale + rotation) — circles stay circles. */
function isUniform(m: Mat): boolean {
  const len1 = Math.hypot(m[0], m[1]);
  const len2 = Math.hypot(m[2], m[3]);
  const dot = m[0] * m[2] + m[1] * m[3];
  const tol = Math.max(len1, len2, 1e-9) * 1e-6;
  return Math.abs(len1 - len2) < tol && Math.abs(dot) < tol * Math.max(len1, 1);
}

// ---------------------------------------------------------------------------
// Path sampling
// ---------------------------------------------------------------------------

const CUBIC_SEGMENTS = 16;
const QUAD_SEGMENTS = 12;

function sampleCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, out: Pt[]): void {
  for (let k = 1; k <= CUBIC_SEGMENTS; k++) {
    const t = k / CUBIC_SEGMENTS;
    const u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
}

function sampleQuad(p0: Pt, p1: Pt, p2: Pt, out: Pt[]): void {
  for (let k = 1; k <= QUAD_SEGMENTS; k++) {
    const t = k / QUAD_SEGMENTS;
    const u = 1 - t;
    out.push({
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    });
  }
}

/** Samples an SVG elliptical-arc segment (endpoint parameterization, W3C spec F.6.5). */
function sampleArcSeg(
  x1: number, y1: number,
  rx: number, ry: number,
  phiDeg: number, largeArc: number, sweep: number,
  x2: number, y2: number,
  out: Pt[]
): void {
  rx = Math.abs(rx); ry = Math.abs(ry);
  if (rx < 1e-12 || ry < 1e-12) {
    out.push({ x: x2, y: y2 });
    return;
  }
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) {
    const s = Math.sqrt(lam);
    rx *= s; ry *= s;
  }
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const num = rx * rx * ry * ry - den;
  let coef = den > 0 ? Math.sqrt(Math.max(0, num / den)) : 0;
  if (largeArc === sweep) coef = -coef;
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const ccx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const ccy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    let a = Math.acos(Math.min(1, Math.max(-1, dot / (len || 1))));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const th1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dth > 0) dth -= 2 * Math.PI;
  if (sweep && dth < 0) dth += 2 * Math.PI;

  const n = Math.max(4, Math.ceil(Math.abs(dth) / (Math.PI / 16)));
  for (let k = 1; k <= n; k++) {
    const th = th1 + (dth * k) / n;
    const px = rx * Math.cos(th), py = ry * Math.sin(th);
    out.push({ x: cosP * px - sinP * py + ccx, y: sinP * px + cosP * py + ccy });
  }
}

/** Parses a path `d` attribute into sampled subpaths (all commands incl. C/S/Q/T/A). */
function parsePathD(d: string): { pts: Pt[]; closed: boolean }[] {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  const subs: { pts: Pt[]; closed: boolean }[] = [];
  let cur: Pt[] = [];
  let cx = 0, cy = 0;      // current point
  let sx = 0, sy = 0;      // subpath start
  let pcx = 0, pcy = 0;    // previous control point (for S/T reflection)
  let prevCmd = "";
  let cmd = "";
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  const flush = (closed: boolean) => {
    if (cur.length >= 2) subs.push({ pts: cur, closed });
    cur = [];
  };

  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) {
      cmd = tokens[i++];
    } else if (cmd === "M") cmd = "L";
    else if (cmd === "m") cmd = "l";

    switch (cmd) {
      case "M": case "m": {
        flush(false);
        const x = num(), y = num();
        if (cmd === "m") { cx += x; cy += y; } else { cx = x; cy = y; }
        sx = cx; sy = cy;
        cur.push({ x: cx, y: cy });
        break;
      }
      case "L": case "l": {
        const x = num(), y = num();
        if (cmd === "l") { cx += x; cy += y; } else { cx = x; cy = y; }
        cur.push({ x: cx, y: cy });
        break;
      }
      case "H": case "h": {
        const x = num();
        cx = cmd === "h" ? cx + x : x;
        cur.push({ x: cx, y: cy });
        break;
      }
      case "V": case "v": {
        const y = num();
        cy = cmd === "v" ? cy + y : y;
        cur.push({ x: cx, y: cy });
        break;
      }
      case "C": case "c": {
        let x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
        if (cmd === "c") { x1 += cx; y1 += cy; x2 += cx; y2 += cy; x += cx; y += cy; }
        sampleCubic({ x: cx, y: cy }, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }, cur);
        pcx = x2; pcy = y2;
        cx = x; cy = y;
        break;
      }
      case "S": case "s": {
        let x2 = num(), y2 = num(), x = num(), y = num();
        if (cmd === "s") { x2 += cx; y2 += cy; x += cx; y += cy; }
        const reflect = /^[CcSs]$/.test(prevCmd);
        const x1 = reflect ? 2 * cx - pcx : cx;
        const y1 = reflect ? 2 * cy - pcy : cy;
        sampleCubic({ x: cx, y: cy }, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }, cur);
        pcx = x2; pcy = y2;
        cx = x; cy = y;
        break;
      }
      case "Q": case "q": {
        let x1 = num(), y1 = num(), x = num(), y = num();
        if (cmd === "q") { x1 += cx; y1 += cy; x += cx; y += cy; }
        sampleQuad({ x: cx, y: cy }, { x: x1, y: y1 }, { x, y }, cur);
        pcx = x1; pcy = y1;
        cx = x; cy = y;
        break;
      }
      case "T": case "t": {
        let x = num(), y = num();
        if (cmd === "t") { x += cx; y += cy; }
        const reflect = /^[QqTt]$/.test(prevCmd);
        const x1 = reflect ? 2 * cx - pcx : cx;
        const y1 = reflect ? 2 * cy - pcy : cy;
        sampleQuad({ x: cx, y: cy }, { x: x1, y: y1 }, { x, y }, cur);
        pcx = x1; pcy = y1;
        cx = x; cy = y;
        break;
      }
      case "A": case "a": {
        const rx = num(), ry = num(), phi = num(), fa = num(), fs = num();
        let x = num(), y = num();
        if (cmd === "a") { x += cx; y += cy; }
        sampleArcSeg(cx, cy, rx, ry, phi, fa, fs, x, y, cur);
        cx = x; cy = y;
        break;
      }
      case "Z": case "z": {
        flush(true);
        cx = sx; cy = sy;
        cur = [{ x: cx, y: cy }];
        break;
      }
      default:
        i++; // unknown token — skip
    }
    prevCmd = cmd;
  }
  flush(false);
  // Drop degenerate leftover single-point subpaths introduced after Z
  return subs.filter((s) => s.pts.length >= 2);
}

// ---------------------------------------------------------------------------
// Element walking
// ---------------------------------------------------------------------------

const MAX_DEPTH = 24;
const ELLIPSE_SEGMENTS = 48;
const CIRCLE_FALLBACK_SEGMENTS = 32;

function parsePointsAttr(s: string): Pt[] {
  const nums = s.trim().split(/[\s,]+/).map(Number).filter(isFinite);
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  return pts;
}

function walk(el: Element, m: Mat, idMap: Map<string, Element>, out: FlatEntity[], depth: number): void {
  if (depth > MAX_DEPTH) return;
  const tag = el.tagName.toLowerCase();
  if (tag === "defs" || tag === "text" || tag === "title" || tag === "desc" || tag === "style") return;

  const local = mul(m, parseTransform(el.getAttribute("transform")));
  const attr = (name: string, dflt = "0") => parseFloat(el.getAttribute(name) ?? dflt) || 0;

  switch (tag) {
    case "svg":
    case "g": {
      for (const child of Array.from(el.children)) walk(child, local, idMap, out, depth + 1);
      return;
    }
    case "use": {
      const href = el.getAttribute("href") ?? el.getAttribute("xlink:href");
      if (!href || !href.startsWith("#")) return;
      const ref = idMap.get(href.slice(1));
      if (!ref) return;
      walk(ref, mul(local, translation(attr("x"), attr("y"))), idMap, out, depth + 1);
      return;
    }
    case "line": {
      out.push({
        type: "LINE",
        start: apply(local, attr("x1"), attr("y1")),
        end: apply(local, attr("x2"), attr("y2")),
      });
      return;
    }
    case "polyline":
    case "polygon": {
      const pts = parsePointsAttr(el.getAttribute("points") ?? "");
      if (pts.length < 2) return;
      out.push({
        type: "POLYLINE",
        vertices: pts.map((p) => apply(local, p.x, p.y)),
        closed: tag === "polygon",
      });
      return;
    }
    case "rect": {
      const x = attr("x"), y = attr("y"), w = attr("width"), h = attr("height");
      if (w <= 0 || h <= 0) return;
      out.push({
        type: "POLYLINE",
        vertices: [
          apply(local, x, y), apply(local, x + w, y),
          apply(local, x + w, y + h), apply(local, x, y + h),
        ],
        closed: true,
      });
      return;
    }
    case "circle": {
      const cx = attr("cx"), cy = attr("cy"), r = attr("r");
      if (r <= 0) return;
      if (isUniform(local)) {
        out.push({
          type: "CIRCLE",
          center: apply(local, cx, cy),
          radius: r * Math.hypot(local[0], local[1]),
        });
      } else {
        // Non-uniform scale turns the circle into an ellipse — sample it.
        const vertices: Pt[] = [];
        for (let k = 0; k < CIRCLE_FALLBACK_SEGMENTS; k++) {
          const th = (2 * Math.PI * k) / CIRCLE_FALLBACK_SEGMENTS;
          vertices.push(apply(local, cx + r * Math.cos(th), cy + r * Math.sin(th)));
        }
        out.push({ type: "POLYLINE", vertices, closed: true });
      }
      return;
    }
    case "ellipse": {
      const cx = attr("cx"), cy = attr("cy"), rx = attr("rx"), ry = attr("ry");
      if (rx <= 0 || ry <= 0) return;
      const vertices: Pt[] = [];
      for (let k = 0; k < ELLIPSE_SEGMENTS; k++) {
        const th = (2 * Math.PI * k) / ELLIPSE_SEGMENTS;
        vertices.push(apply(local, cx + rx * Math.cos(th), cy + ry * Math.sin(th)));
      }
      out.push({ type: "POLYLINE", vertices, closed: true });
      return;
    }
    case "path": {
      const d = el.getAttribute("d");
      if (!d) return;
      for (const sub of parsePathD(d)) {
        if (sub.pts.length === 2) {
          out.push({
            type: "LINE",
            start: apply(local, sub.pts[0].x, sub.pts[0].y),
            end: apply(local, sub.pts[1].x, sub.pts[1].y),
          });
        } else {
          out.push({
            type: "POLYLINE",
            vertices: sub.pts.map((p) => apply(local, p.x, p.y)),
            closed: sub.closed,
          });
        }
      }
      return;
    }
    default: {
      // Unknown container-ish element: recurse in case geometry is nested inside.
      for (const child of Array.from(el.children)) walk(child, local, idMap, out, depth + 1);
    }
  }
}

/**
 * Flattens an SVG string into world-space entities. Output Y-axis is flipped to Y-up
 * (math/DXF convention) because entitiesToSymbol() flips it back for screen rendering.
 */
export function flattenSvgToEntities(svgString: string): FlatEntity[] {
  const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== "svg") {
    throw new Error("Could not parse SVG produced from the DWG file.");
  }

  const idMap = new Map<string, Element>();
  doc.querySelectorAll("[id]").forEach((el) => idMap.set(el.id, el));

  const out: FlatEntity[] = [];
  walk(root, IDENTITY, idMap, out, 0);

  // SVG coordinates are Y-down; entitiesToSymbol expects Y-up and flips during render.
  const flip = (p: Pt): Pt => ({ x: p.x, y: -p.y });
  return out.map((e) => {
    if (e.type === "LINE") return { ...e, start: flip(e.start), end: flip(e.end) };
    if (e.type === "CIRCLE") return { ...e, center: flip(e.center) };
    return { ...e, vertices: e.vertices.map(flip) };
  });
}
