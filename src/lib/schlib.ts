import { z } from "zod";
import type { SymbolLibrary } from "../models/project";
import type { SymbolDefinition } from "../models/symbol";

const ConnectionPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  direction: z.enum(["top", "bottom", "left", "right"]),
});

const AttributeDefSchema = z.object({
  name: z.string(),
  label: z.string(),
  defaultValue: z.string(),
  required: z.boolean(),
});

const SymbolSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  standard: z.enum(["IEC", "NEMA", "ISO1219", "custom"]),
  svgContent: z.string(),
  viewBox: z.string(),
  connectionPoints: z.array(ConnectionPointSchema),
  attributes: z.array(AttributeDefSchema),
  tags: z.array(z.string()),
});

const SchlibSchema = z.object({
  version: z.literal(1),
  name: z.string(),
  symbols: z.array(SymbolSchema),
});

export function exportLibrary(library: SymbolLibrary): void {
  const data = { version: 1 as const, name: library.name, symbols: library.symbols };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${library.name.replace(/\s+/g, "_")}.schlib`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importLibraryFile(): Promise<SymbolDefinition[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".schlib,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const raw = JSON.parse(e.target?.result as string);
          const parsed = SchlibSchema.parse(raw);
          resolve(parsed.symbols as SymbolDefinition[]);
        } catch {
          reject(new Error("Invalid .schlib file — check the format and try again."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    };
    input.click();
  });
}
