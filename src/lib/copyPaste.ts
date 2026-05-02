import { v4 as uuidv4 } from "uuid";
import type { SchematicElement } from "../models/sheet";
import type { Wire, WireNumberFormat } from "../models/wire";
import type { SymbolInstance } from "../models/symbol";
import type { RevisionCloud } from "../models/revision";
import { nextWireNumber } from "./wireNumbering";

const PASTE_OFFSET = 20;

export interface ClipboardData {
  elements: SchematicElement[];
}

export function copyElements(elements: SchematicElement[]): ClipboardData {
  return { elements: JSON.parse(JSON.stringify(elements)) };
}

export function pasteElements(
  clipboard: ClipboardData,
  targetSheetId: string,
  existingWireNumbers: string[],
  wireFormat: WireNumberFormat
): SchematicElement[] {
  const idMap = new Map<string, string>();
  const usedNumbers = [...existingWireNumbers];

  return clipboard.elements.map((el) => {
    const newId = uuidv4();
    idMap.set(el.id, newId);

    if (el.type === "wire") {
      const wire = el as Wire;
      const newNumber = nextWireNumber(usedNumbers, wireFormat);
      usedNumbers.push(newNumber);
      return {
        ...wire,
        id: newId,
        sheetId: targetSheetId,
        number: newNumber,
        netId: newId,
        points: wire.points.map((p) => ({ x: p.x + PASTE_OFFSET, y: p.y + PASTE_OFFSET })),
        sourceArrow: undefined,
        destinationArrow: undefined,
      } as Wire;
    }

    if (el.type === "symbol") {
      const sym = el as SymbolInstance;
      return {
        ...sym,
        id: newId,
        sheetId: targetSheetId,
        x: sym.x + PASTE_OFFSET,
        y: sym.y + PASTE_OFFSET,
        attributes: { ...sym.attributes, tag: sym.attributes.tag ? `${sym.attributes.tag}_COPY` : "" },
      } as SymbolInstance;
    }

    if (el.type === "revisionCloud") {
      const rc = el as RevisionCloud;
      return {
        ...rc,
        id: newId,
        sheetId: targetSheetId,
        points: rc.points.map((p) => ({ x: p.x + PASTE_OFFSET, y: p.y + PASTE_OFFSET })),
      } as RevisionCloud;
    }

    return { ...(el as object), id: newId } as SchematicElement;
  });
}
