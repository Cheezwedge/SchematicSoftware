import type { SymbolLibrary } from "../models/project";
import type { SymbolDefinition } from "../models/symbol";
import { IEC_SYMBOLS } from "../symbols/iec";
import { PNEUMATIC_SYMBOLS } from "../symbols/pneumatic";
import { NEMA_SYMBOLS } from "../symbols/nema";
import { svgToGeometry } from "./svgToGeometry";

function withGeometry(syms: SymbolDefinition[]): SymbolDefinition[] {
  return syms.map((sym) => {
    if (sym.geometry) return sym;
    const geometry = svgToGeometry(sym.svgContent, sym.viewBox);
    // If conversion produced nothing (e.g. SVG has <text>), keep SVG image rendering
    return geometry.length > 0 ? { ...sym, geometry } : sym;
  });
}

export function loadBuiltInLibraries(): SymbolLibrary[] {
  return [
    {
      id: "builtin-iec",
      name: "IEC Symbols",
      symbols: withGeometry(IEC_SYMBOLS),
      isBuiltIn: true,
    },
    {
      id: "builtin-nema",
      name: "NEMA Symbols",
      symbols: withGeometry(NEMA_SYMBOLS),
      isBuiltIn: true,
    },
    {
      id: "builtin-pneumatic",
      name: "Pneumatic (ISO 1219)",
      symbols: withGeometry(PNEUMATIC_SYMBOLS),
      isBuiltIn: true,
    },
    {
      id: "user-library",
      name: "My Symbols",
      symbols: [],
      isBuiltIn: false,
    },
  ];
}
