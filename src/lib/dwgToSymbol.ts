import type { SymbolDefinition } from "../models/symbol";
import { entitiesToSymbol } from "./dxfToSymbol";
import { flattenSvgToEntities } from "./svgFlatten";

/** Run DWG→SVG conversion inside a Web Worker so WASM never blocks the main thread. */
function convertDwgToSvg(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/dwgWorker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent<{ svgString?: string; error?: string }>) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.svgString!);
    };
    worker.onerror = (e: ErrorEvent) => {
      worker.terminate();
      reject(new Error(`DWG worker error: ${e.message}`));
    };
    worker.postMessage({ buffer }, [buffer]);
  });
}

/**
 * Imports a DWG file as native vector geometry.
 *
 * The worker converts the DWG with the library's own SvgConverter (which correctly
 * resolves INSERT/block references), then flattenSvgToEntities() resolves the SVG's
 * <use>/<defs> structure and transform chains into plain world-space lines, circles,
 * and polylines. entitiesToSymbol() normalizes those into the app's standard symbol
 * format with a geometry array, so imported symbols render exactly like built-in
 * ones — stroke width stays constant on screen regardless of zoom or symbol scale.
 */
export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  const rawSvg = await convertDwgToSvg(fileBuffer);
  const name = fileName.replace(/\.[^.]+$/, "");
  try {
    const entities = flattenSvgToEntities(rawSvg);
    return entitiesToSymbol(entities, name, ["imported", "dwg"]);
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
