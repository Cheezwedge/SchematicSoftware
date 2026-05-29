import type { SymbolDefinition } from "../models/symbol";
import { parseDxfContent } from "./dxfToSymbol";

/** Run DWG→DXF conversion inside a Web Worker so the main thread never freezes. */
function convertDwgToDxf(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // Vite resolves this worker URL at build time and creates a separate bundle chunk.
    const worker = new Worker(
      new URL("../workers/dwgWorker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent<{ dxfText?: string; error?: string }>) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.dxfText!);
    };
    worker.onerror = (e: ErrorEvent) => {
      worker.terminate();
      reject(new Error(`DWG worker error: ${e.message}`));
    };
    // Transfer ownership of the buffer to avoid a large structured-clone copy.
    worker.postMessage({ buffer }, [buffer]);
  });
}

export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  const dxfText = await convertDwgToDxf(fileBuffer);
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
