import type { Direction } from "./geometry";

export type SymbolStandard = "IEC" | "NEMA" | "ISO1219" | "custom";

/** Structured geometry stored in Konva local coordinates (±30 px, centered at 0,0). */
export type SymbolGeomEl =
  | { t: "L"; x1: number; y1: number; x2: number; y2: number }
  | { t: "C"; cx: number; cy: number; r: number }
  | { t: "A"; x1: number; y1: number; x2: number; y2: number; r: number; large: 0 | 1 }
  | { t: "P"; pts: number[]; closed: boolean; filled?: boolean };

export interface SymbolAttributeDef {
  name: string;
  label: string;
  defaultValue: string;
  required: boolean;
}

export interface ConnectionPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  direction: Direction;
}

export interface ResolvedConnectionPoint extends ConnectionPoint {
  worldX: number;
  worldY: number;
}

export interface SymbolDefinition {
  id: string;
  name: string;
  category: string;
  standard: SymbolStandard;
  svgContent: string;
  viewBox: string;
  connectionPoints: ConnectionPoint[];
  attributes: SymbolAttributeDef[];
  tags: string[];
  /** Present on imported symbols; enables zoom-independent vector rendering. */
  geometry?: SymbolGeomEl[];
  /**
   * Default instance scale applied when this symbol is first placed (default 1).
   * Imported symbols (DWG/DXF) set this larger so detailed drawings don't come in
   * tiny — the user can still rescale afterwards.
   */
  defaultScale?: number;
}

export interface SymbolInstance {
  id: string;
  type: "symbol";
  definitionId: string;
  sheetId: string;
  layerId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  attributes: Record<string, string>;
}
