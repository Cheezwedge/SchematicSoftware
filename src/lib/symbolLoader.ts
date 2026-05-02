import type { SymbolLibrary } from "../models/project";
import { IEC_SYMBOLS } from "../symbols/iec";
import { PNEUMATIC_SYMBOLS } from "../symbols/pneumatic";
import { NEMA_SYMBOLS } from "../symbols/nema";

export function loadBuiltInLibraries(): SymbolLibrary[] {
  return [
    {
      id: "builtin-iec",
      name: "IEC Symbols",
      symbols: IEC_SYMBOLS,
      isBuiltIn: true,
    },
    {
      id: "builtin-nema",
      name: "NEMA Symbols",
      symbols: NEMA_SYMBOLS,
      isBuiltIn: true,
    },
    {
      id: "builtin-pneumatic",
      name: "Pneumatic (ISO 1219)",
      symbols: PNEUMATIC_SYMBOLS,
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
