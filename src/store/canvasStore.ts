import { create } from "zustand";
import type { Point } from "../models/geometry";
import type { SchematicElement } from "../models/sheet";

export type Tool = "select" | "wire" | "symbol" | "sourceArrow" | "destArrow" | "revisionCloud" | "pan" | "rungH" | "rungV";

export interface PendingPlacement {
  pos: Point;
  definitionId: string;
  rotation: number;
}

interface CanvasState {
  activeSheetId: string | null;
  activeLayerId: string | null;
  activeTool: Tool;
  selectedElementIds: Set<string>;
  viewport: { x: number; y: number; scale: number };
  pendingSymbolDefinitionId: string | null;
  pendingSymbolRotation: number;
  pendingPlacement: PendingPlacement | null;
  ghostPosition: Point | null;
  cursorPosition: Point | null;
  clipboard: SchematicElement[] | null;

  setActiveSheet: (sheetId: string) => void;
  setActiveLayer: (layerId: string | null) => void;
  setActiveTool: (tool: Tool) => void;
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setViewport: (viewport: Partial<CanvasState["viewport"]>) => void;
  setPendingSymbol: (definitionId: string | null) => void;
  setPendingSymbolRotation: (rotation: number) => void;
  rotatePendingSymbol: () => void;
  setPendingPlacement: (placement: PendingPlacement | null) => void;
  setGhostPosition: (pos: Point | null) => void;
  setCursorPosition: (pos: Point | null) => void;
  setClipboard: (elements: SchematicElement[]) => void;
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  activeSheetId: null,
  activeLayerId: null,
  activeTool: "select",
  selectedElementIds: new Set(),
  viewport: { x: 0, y: 0, scale: 1 },
  pendingSymbolDefinitionId: null,
  pendingSymbolRotation: 0,
  pendingPlacement: null,
  ghostPosition: null,
  cursorPosition: null,
  clipboard: null,

  setActiveSheet: (activeSheetId) => set({ activeSheetId, selectedElementIds: new Set() }),
  setActiveLayer: (activeLayerId) => set({ activeLayerId }),
  setActiveTool: (activeTool) =>
    set({ activeTool, selectedElementIds: new Set(), pendingPlacement: null }),
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
  setPendingSymbol: (pendingSymbolDefinitionId) =>
    set({ pendingSymbolDefinitionId, pendingSymbolRotation: 0 }),
  setPendingSymbolRotation: (pendingSymbolRotation) => set({ pendingSymbolRotation }),
  rotatePendingSymbol: () =>
    set((s) => ({ pendingSymbolRotation: (s.pendingSymbolRotation + 90) % 360 })),
  setPendingPlacement: (pendingPlacement) => set({ pendingPlacement }),
  setGhostPosition: (ghostPosition) => set({ ghostPosition }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
  setClipboard: (clipboard) => set({ clipboard }),
}));
