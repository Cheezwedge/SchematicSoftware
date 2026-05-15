import type { SymbolDefinition } from "../models/symbol";
import { parseDxfContent } from "./dxfToSymbol";

/**
 * Converts a DWG file to a SymbolDefinition.
 *
 * Strategy: use libRedDWG's WASM DWG→DXF converter to produce a standard
 * ASCII DXF file, then parse that with dxf-parser via parseDxfContent.
 * This avoids dealing with the binary DwgDatabase representation directly
 * (where arc angles are in radians rather than the degrees used by DXF text,
 * and where entity field names differ from the DXF convention).
 */
export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  const { LibreDwg } = await import("@mlightcad/libredwg-web");

  const libredwg = await LibreDwg.create();

  // Convert the binary DWG to DXF text inside the WASM virtual filesystem.
  const dxfBytes: Uint8Array | null = libredwg.dwg_write_dxf(fileBuffer);
  if (!dxfBytes || dxfBytes.length === 0) {
    throw new Error(
      "Could not convert DWG file to DXF. " +
      "The file may be corrupted or use a DWG version newer than R2013."
    );
  }

  const dxfText = new TextDecoder("utf-8").decode(dxfBytes);

  try {
    return parseDxfContent(dxfText, fileName, ["imported", "dwg"]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`DWG import failed: ${msg}`);
  }
}

export function loadDwgFile(): Promise<{ buffer: ArrayBuffer; name: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dwg";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = (e) => resolve({ buffer: e.target?.result as ArrayBuffer, name: file.name });
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    };
    input.click();
  });
}
