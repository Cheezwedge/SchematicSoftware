import { LibreDwg } from "@mlightcad/libredwg-web";

interface DwgInput { buffer: ArrayBuffer }
interface DwgOutput { dxfText?: string; error?: string }

self.onmessage = async (e: MessageEvent<DwgInput>) => {
  try {
    const libredwg = await LibreDwg.create();
    const dxfBytes: Uint8Array | null = libredwg.dwg_write_dxf(e.data.buffer);
    if (!dxfBytes || dxfBytes.length === 0) {
      (self as unknown as Worker).postMessage({
        error: "Could not convert DWG file to DXF. The file may be corrupted or use a DWG version newer than R2013.",
      } as DwgOutput);
      return;
    }
    const dxfText = new TextDecoder("utf-8").decode(dxfBytes);
    (self as unknown as Worker).postMessage({ dxfText } as DwgOutput);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      error: err instanceof Error ? err.message : String(err),
    } as DwgOutput);
  }
};
