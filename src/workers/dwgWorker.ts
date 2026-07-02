import { LibreDwg, Dwg_File_Type } from "@mlightcad/libredwg-web";

interface DwgInput { buffer: ArrayBuffer }
interface DwgOutput { svgString?: string; error?: string }

self.onmessage = async (e: MessageEvent<DwgInput>) => {
  try {
    const libredwg = await LibreDwg.create();
    const ptr = libredwg.dwg_read_data(e.data.buffer, Dwg_File_Type.DWG);
    if (ptr === undefined) {
      (self as unknown as Worker).postMessage({
        error: "Could not read DWG file. The file may be corrupted or use an unsupported DWG version.",
      } as DwgOutput);
      return;
    }
    const db = libredwg.convert(ptr);
    libredwg.dwg_free(ptr);
    const svgString = libredwg.dwg_to_svg(db);
    if (!svgString || svgString.length < 50) {
      (self as unknown as Worker).postMessage({
        error: "DWG file contained no drawable geometry.",
      } as DwgOutput);
      return;
    }
    (self as unknown as Worker).postMessage({ svgString } as DwgOutput);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      error: err instanceof Error ? err.message : String(err),
    } as DwgOutput);
  }
};
