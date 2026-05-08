import { v4 as uuidv4 } from "uuid";
import type { SymbolDefinition } from "../models/symbol";

function extractViewBox(svg: string): string {
  const m = svg.match(/viewBox="([^"]*)"/);
  return m ? m[1] : "0 0 100 100";
}

/**
 * Normalise the raw SVG from dwg_to_svg for use as a schematic symbol:
 *  - strip the XML declaration
 *  - replace all explicit stroke colours with currentColor for theme support
 *  - remove TEXT / MTEXT elements (they are device tags, not geometry)
 *  - remove fixed width/height so the container controls size
 */
function normaliseSvg(raw: string): string {
  return raw
    .replace(/<\?xml[^>]*\?>\s*/g, "")
    .replace(/\bstroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"')
    .replace(/\bstroke='#[0-9a-fA-F]{3,8}'/g, "stroke='currentColor'")
    .replace(/\bstroke="black"/gi, 'stroke="currentColor"')
    .replace(/\bstroke="white"/gi, 'stroke="currentColor"')
    .replace(/<text[\s\S]*?<\/text>/g, "")
    .replace(/\s*width="100%"\s*/, " ")
    .replace(/\s*height="100%"\s*/, " ");
}

function hasGeometry(svg: string): boolean {
  return /<(line|path|circle|ellipse|polyline|polygon|rect|use)\b/i.test(svg);
}

export async function dwgToSymbol(fileBuffer: ArrayBuffer, fileName: string): Promise<SymbolDefinition> {
  const { LibreDwg, Dwg_File_Type } = await import("@mlightcad/libredwg-web");

  const libredwg = await LibreDwg.create();
  const dwgPtr = libredwg.dwg_read_data(fileBuffer, Dwg_File_Type.DWG);
  if (dwgPtr == null) {
    throw new Error("Could not parse DWG file. The file may be corrupted or use an unsupported DWG version.");
  }

  const db = libredwg.convert(dwgPtr);
  libredwg.dwg_free(dwgPtr);

  // Use the library's own SVG converter — it correctly handles all entity types,
  // block references (INSERT/USE), arc angles in radians, Y-axis flip, etc.
  const rawSvg: string = libredwg.dwg_to_svg(db);

  if (!rawSvg || !hasGeometry(rawSvg)) {
    throw new Error("No drawable geometry found in DWG file (LINE, ARC, CIRCLE, POLYLINE entities).");
  }

  const viewBox = extractViewBox(rawSvg);
  const svgContent = normaliseSvg(rawSvg);
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
