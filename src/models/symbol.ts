import type { Direction } from "./geometry";

export type SymbolStandard = "IEC" | "NEMA" | "ISO1219" | "custom";

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
