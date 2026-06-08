import { Dwg_File_Type, LibreDwg } from "@mlightcad/libredwg-web";
import { flattenDwgDatabase } from "../lib/dwgDatabaseToSymbol";

interface DwgInput { buffer: ArrayBuffer }
interface DwgOutput { entities?: unknown[]; error?: string }

self.onmessage = async (e: MessageEvent<DwgInput>) => {
  try {
    const libredwg = await LibreDwg.create();
    const dwgPtr = libredwg.dwg_read_data(e.data.buffer, Dwg_File_Type.DWG);
    if (dwgPtr === undefined) {
      (self as unknown as Worker).postMessage({
        error: "Could not read DWG file. The file may be corrupted or use an unsupported DWG version.",
      } as DwgOutput);
      return;
    }
    const db = libredwg.convert(dwgPtr);
    libredwg.dwg_free(dwgPtr);
    const entities = flattenDwgDatabase(db);
    if (entities.length === 0) {
      (self as unknown as Worker).postMessage({
        error: "No drawable geometry found in the DWG file (LINE, POLYLINE, CIRCLE, ARC).",
      } as DwgOutput);
      return;
    }
    (self as unknown as Worker).postMessage({ entities } as DwgOutput);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      error: err instanceof Error ? err.message : String(err),
    } as DwgOutput);
  }
};
