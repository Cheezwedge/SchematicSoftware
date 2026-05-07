import type { ConnectionPoint, SymbolDefinition } from "../models/symbol";

const SYMBOL_HALF = 30; // half of SYMBOL_SIZE (60px)

export const AUTO_CONNECTION_POINTS: ConnectionPoint[] = [
  { id: "auto-left",   label: "L", x: -SYMBOL_HALF, y: 0,            direction: "left"   },
  { id: "auto-right",  label: "R", x:  SYMBOL_HALF, y: 0,            direction: "right"  },
  { id: "auto-top",    label: "T", x: 0,             y: -SYMBOL_HALF, direction: "top"    },
  { id: "auto-bottom", label: "B", x: 0,             y:  SYMBOL_HALF, direction: "bottom" },
];

export function getEffectiveConnectionPoints(def: SymbolDefinition): ConnectionPoint[] {
  return def.connectionPoints.length > 0 ? def.connectionPoints : AUTO_CONNECTION_POINTS;
}
