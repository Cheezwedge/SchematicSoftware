import type { SymbolDefinition } from "../models/symbol";
import { entitiesToSymbol } from "./dxfToSymbol";

/**
 * Reads and flattens a DWG file inside a Web Worker so the WASM compile/parse work
 * (which can take seconds and would otherwise block the UI thread) never freezes the page.
 * The worker resolves INSERT block references and applies their affine transforms,
 * returning world-space entities in the DXF-like shape entitiesToSymbol() expects.
 */
function convertDwgToEntities(buffer: ArrayBuffer): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    // Vite resolves this worker URL at build time and creates a separate bundle chunk.
    const worker = new Worker(
      new URL("../workers/dwgWorker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent<{ entities?: unknown[]; error?: string }>) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.entities!);
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
  const entities = await convertDwgToEntities(fileBuffer);
  const name = fileName.replace(/\.[^.]+$/, "");
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return entitiesToSymbol(entities as any[], name, ["imported", "dwg"]);
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
