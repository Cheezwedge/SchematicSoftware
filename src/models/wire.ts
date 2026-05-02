import type { Point } from "./geometry";

export interface WireNumberFormat {
  prefix: string;
  suffix: string;
  startNumber: number;
  increment: number;
  padLength: number;
}

export const DEFAULT_WIRE_FORMAT: WireNumberFormat = {
  prefix: "W",
  suffix: "",
  startNumber: 1,
  increment: 1,
  padLength: 3,
};

export interface CrossSheetRef {
  arrowType: "source" | "destination";
  targetSheetId: string;
  targetWireId: string;
  label: string;
}

export interface Wire {
  id: string;
  type: "wire";
  layerId: string;
  sheetId: string;
  points: Point[];
  color: string;
  gauge: string;
  number: string;
  netId: string;
  sourceArrow?: CrossSheetRef;
  destinationArrow?: CrossSheetRef;
}

export const DEFAULT_WIRE_COLOR = "#000000";
export const DEFAULT_WIRE_GAUGE = "14 AWG";
