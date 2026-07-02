import { v4 as uuidv4 } from "uuid";
import type { SymbolDefinition } from "../models/symbol";

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
 * Extracts the viewBox string from an SVG document.
 * Returns a fallback "0 0 100 100" if not found.
 */
function extractViewBox(svgString: string): string {
  const m = svgString.match(/viewBox="([^"]+)"/);
  return m ? m[1] : "0 0 100 100";
}

/**
 * Post-processes the raw SVG from libredwg's SvgConverter so it works as a
 * theme-aware Konva image:
 * - Strips XML declaration (browser rejects data-URI SVGs with <?xml...?>)
 * - Makes default black strokes follow the theme via currentColor
 * - Bumps stroke-width from the near-invisible 0.1% default to something visible
 */
function processSvg(raw: string): string {
  return raw
    // Strip XML declaration — browsers don't allow it in data-URI SVGs
    .replace(/<\?xml[^?]*\?>\s*/g, "")
    // Replace hardcoded black strokes with currentColor so useSvgImage can theme them
    .replace(/stroke="#000000"/gi, 'stroke="currentColor"')
    .replace(/stroke="black"/gi, 'stroke="currentColor"')
    .replace(/stroke="rgb\(0,\s*0,\s*0\)"/gi, 'stroke="currentColor"')
    // The default stroke-width is 0.1% which renders invisibly thin at symbol size.
    // Use 1.5% — visible across symbol sizes without being too thick.
    .replace(/stroke-width="0\.1%"/g, 'stroke-width="1.5%"');
}

export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  const rawSvg = await convertDwgToSvg(fileBuffer);
  const svgContent = processSvg(rawSvg);
  const viewBox = extractViewBox(svgContent);
  const name = fileName.replace(/\.[^.]+$/, "");

  return {
    id: uuidv4(),
    name,
    category: "Imported",
    standard: "custom",
    svgContent,
    viewBox,
    connectionPoints: [],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: false },
      { name: "description", label: "Description", defaultValue: "", required: false },
    ],
    tags: ["imported", "dwg"],
  };
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
