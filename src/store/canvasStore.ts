import { create } from "zustand";
import type { Point } from "../models/geometry";

export type Tool = "select" | "wire" | "symbol" | "revisionCloud" | "pan";

interface CanvasState {
  activeSheetId: string | null;
  activeLayerId: string | null;
  activeTool: Tool;
  selectedElementIds: Set<string>;
  viewport: { x: number; y: number; scale: number };
  pendingSymbolDefinitionId: string | null;
  cursorPosition: Point | null;

  setActiveSheet: (sheetId: string) => void;
  setActiveLayer: (layerId: string | null) => void;
  setActiveTool: (tool: Tool) => void;
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setViewport: (viewport: Partial<CanvasState["viewport"]>) => void;
  setPendingSymbol: (definitionId: string | null) => void;
  setCursorPosition: (pos: Point | null) => void;
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  activeSheetId: null,
  activeLayerId: null,
  activeTool: "select",
  selectedElementIds: new Set(),
  viewport: { x: 0, y: 0, scale: 1 },
  pendingSymbolDefinitionId: null,
  cursorPosition: null,

  setActiveSheet: (activeSheetId) => set({ activeSheetId, selectedElementIds: new Set() }),
  setActiveLayer: (activeLayerId) => set({ activeLayerId }),
  setActiveTool: (activeTool) => set({ activeTool, selectedElementIds: new Set() }),
  setSelection: (ids) => set({ selectedElementIds: new Set(ids) }),
  addToSelection: (id) =>
    set((s) => ({ selectedElementIds: new Set([...s.selectedElementIds, id]) })),
  removeFromSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedElementIds);
      next.delete(id);
      return { selectedElementIds: next };
    }),
  clearSelection: () => set({ selectedElementIds: new Set() }),
  setViewport: (vp) => set((s) => ({ viewport: { ...s.viewport, ...vp } })),
  setPendingSymbol: (pendingSymbolDefinitionId) => set({ pendingSymbolDefinitionId }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
}));
