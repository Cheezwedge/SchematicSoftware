import { create } from "zustand";
import { produce } from "immer";
import { v4 as uuidv4 } from "uuid";
import type { Project, ProjectSettings } from "../models/project";
import type { Sheet, SchematicElement } from "../models/sheet";
import type { Layer } from "../models/layer";
import type { RungMarker } from "../models/rungMarker";
import { DEFAULT_LAYERS } from "../models/layer";
import { DEFAULT_SHEET_WIDTH, DEFAULT_SHEET_HEIGHT } from "../models/sheet";
import { DEFAULT_PROJECT_SETTINGS } from "../models/project";
import { PIXELS_PER_MM, RUNG_COUNT, RUNG_TOP_MARGIN, RUNG_BOTTOM_MARGIN, RUNG_MARKER_DEFAULT_X } from "../lib/constants";
import {
  DEFAULT_TITLE_BLOCK_TEMPLATE,
  BUILTIN_TEMPLATE_ID,
  makeDefaultTitleBlockData,
} from "../models/titleBlock";
import type { TitleBlockData } from "../models/titleBlock";

const MAX_SNAPSHOTS = 50;

function makeDefaultLayers(): Layer[] {
  return DEFAULT_LAYERS.map((l) => ({ ...l, id: uuidv4() }));
}

function makeRungMarkers(sheet: Sheet, sheetIndex: number): RungMarker[] {
  const layerId = sheet.layers[0]?.id ?? "";
  const sheetHeightPx = sheet.height * PIXELS_PER_MM;
  const available = sheetHeightPx - RUNG_TOP_MARGIN - RUNG_BOTTOM_MARGIN;
  const spacing = available / (RUNG_COUNT - 1);
  const startRung = (sheetIndex + 1) * 100;

  return Array.from({ length: RUNG_COUNT }, (_, i) => ({
    id: uuidv4(),
    type: "rungMarker" as const,
    sheetId: sheet.id,
    layerId,
    x: RUNG_MARKER_DEFAULT_X,
    y: Math.round(RUNG_TOP_MARGIN + i * spacing),
    number: startRung + i,
  }));
}

function makeNewSheet(index: number): Sheet {
  const sheet: Sheet = {
    id: uuidv4(),
    name: `Sheet ${index + 1}`,
    index,
    width: DEFAULT_SHEET_WIDTH,
    height: DEFAULT_SHEET_HEIGHT,
    layers: makeDefaultLayers(),
    elements: [],
    titleBlockData: makeDefaultTitleBlockData(),
  };
  sheet.elements = makeRungMarkers(sheet, index);
  return sheet;
}

function newProject(): Project {
  return {
    id: uuidv4(),
    name: "Untitled Project",
    version: 1,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    sheets: [makeNewSheet(0)],
    symbolLibraries: [],
    titleBlockTemplates: [DEFAULT_TITLE_BLOCK_TEMPLATE],
    activeTitleBlockTemplateId: BUILTIN_TEMPLATE_ID,
  };
}

interface ProjectState {
  project: Project;
  isDirty: boolean;
  filePath: string | null;

  // Undo/redo via snapshots
  _snapshots: Project[];
  _future: Project[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  setProject: (project: Project) => void;
  setFilePath: (path: string | null) => void;
  markDirty: () => void;
  markSaved: () => void;

  addSheet: () => string;
  removeSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  reorderSheet: (sheetId: string, newIndex: number) => void;

  addElement: (sheetId: string, element: SchematicElement) => void;
  removeElement: (sheetId: string, elementId: string) => void;
  updateElement: (sheetId: string, elementId: string, updates: Partial<SchematicElement>) => void;
  addElements: (sheetId: string, elements: SchematicElement[]) => void;

  addLayer: (sheetId: string, layer: Layer) => void;
  addLayers: (sheetId: string, layers: Layer[]) => void;
  updateLayer: (sheetId: string, layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (sheetId: string, layerId: string) => void;

  updateSettings: (updates: Partial<ProjectSettings>) => void;
  updateTitleBlockData: (sheetId: string, data: TitleBlockData | null) => void;

  getSheet: (sheetId: string) => Sheet | undefined;
  getActiveLayer: (sheetId: string) => Layer | undefined;
  resetProject: () => string;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  project: newProject(),
  isDirty: false,
  filePath: null,
  _snapshots: [],
  _future: [],
  canUndo: false,
  canRedo: false,

  undo: () => {
    const { _snapshots, project } = get();
    if (!_snapshots.length) return;
    const prev = _snapshots[_snapshots.length - 1];
    set(
      produce<ProjectState>((state) => {
        state._future = [project, ...state._future].slice(0, MAX_SNAPSHOTS);
        state._snapshots = state._snapshots.slice(0, -1);
        state.project = prev as Project;
        state.isDirty = true;
        state.canUndo = state._snapshots.length > 0;
        state.canRedo = true;
      })
    );
  },

  redo: () => {
    const { _future, project } = get();
    if (!_future.length) return;
    const next = _future[0];
    set(
      produce<ProjectState>((state) => {
        state._snapshots = [...state._snapshots, project].slice(-MAX_SNAPSHOTS);
        state._future = state._future.slice(1);
        state.project = next as Project;
        state.isDirty = true;
        state.canUndo = true;
        state.canRedo = state._future.length > 0;
      })
    );
  },

  setProject: (project) => set({ project, isDirty: false, _snapshots: [], _future: [], canUndo: false, canRedo: false }),
  setFilePath: (filePath) => set({ filePath }),
  markDirty: () => set({ isDirty: true }),
  markSaved: () => set({ isDirty: false }),

  addSheet: () => {
    const id = uuidv4();
    const snapshot = get().project;
    set(
      produce<ProjectState>((state) => {
        state._snapshots = [...state._snapshots, snapshot].slice(-MAX_SNAPSHOTS);
        state._future = [];
        state.canUndo = true;
        state.canRedo = false;
        const idx = state.project.sheets.length;
        state.project.sheets.push({ ...makeNewSheet(idx), id });
        state.project.modifiedAt = new Date().toISOString();
        state.isDirty = true;
      })
    );
    return id;
  },

  removeSheet: (sheetId) => {
    const snapshot = get().project;
    set(
      produce<ProjectState>((state) => {
        if (state.project.sheets.length <= 1) return;
        state._snapshots = [...state._snapshots, snapshot].slice(-MAX_SNAPSHOTS);
        state._future = [];
        state.canUndo = true;
        state.canRedo = false;
        state.project.sheets = state.project.sheets.filter((s) => s.id !== sheetId);
        state.project.sheets.forEach((s, i) => (s.index = i));
        state.isDirty = true;
      })
    );
  },

  renameSheet: (sheetId, name) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) { sheet.name = name; state.isDirty = true; }
      })
    );
  },

  reorderSheet: (sheetId, newIndex) => {
    set(
      produce<ProjectState>((state) => {
        const sheets = state.project.sheets;
        const oldIdx = sheets.findIndex((s) => s.id === sheetId);
        if (oldIdx === -1) return;
        const [sheet] = sheets.splice(oldIdx, 1);
        sheets.splice(newIndex, 0, sheet);
        sheets.forEach((s, i) => (s.index = i));
        state.isDirty = true;
      })
    );
  },

  addElement: (sheetId, element) => {
    const snapshot = get().project;
    set(
      produce<ProjectState>((state) => {
        state._snapshots = [...state._snapshots, snapshot].slice(-MAX_SNAPSHOTS);
        state._future = [];
        state.canUndo = true;
        state.canRedo = false;
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) { sheet.elements.push(element); state.isDirty = true; }
      })
    );
  },

  removeElement: (sheetId, elementId) => {
    const snapshot = get().project;
    set(
      produce<ProjectState>((state) => {
        state._snapshots = [...state._snapshots, snapshot].slice(-MAX_SNAPSHOTS);
        state._future = [];
        state.canUndo = true;
        state.canRedo = false;
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) {
          sheet.elements = sheet.elements.filter((e) => e.id !== elementId);
          state.isDirty = true;
        }
      })
    );
  },

  updateElement: (sheetId, elementId, updates) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;
        const idx = sheet.elements.findIndex((e) => e.id === elementId);
        if (idx !== -1) {
          Object.assign(sheet.elements[idx], updates);
          state.isDirty = true;
        }
      })
    );
  },

  // Batch add for DXF import (one undo step for the entire import)
  addElements: (sheetId, elements) => {
    const snapshot = get().project;
    set(
      produce<ProjectState>((state) => {
        state._snapshots = [...state._snapshots, snapshot].slice(-MAX_SNAPSHOTS);
        state._future = [];
        state.canUndo = true;
        state.canRedo = false;
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) {
          for (const el of elements) sheet.elements.push(el);
          state.isDirty = true;
        }
      })
    );
  },

  addLayer: (sheetId, layer) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) { sheet.layers.push(layer); state.isDirty = true; }
      })
    );
  },

  // Batch add layers for DXF import
  addLayers: (sheetId, layers) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) {
          for (const l of layers) sheet.layers.push(l);
          state.isDirty = true;
        }
      })
    );
  },

  updateLayer: (sheetId, layerId, updates) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;
        const layer = sheet.layers.find((l) => l.id === layerId);
        if (layer) { Object.assign(layer, updates); state.isDirty = true; }
      })
    );
  },

  removeLayer: (sheetId, layerId) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet && sheet.layers.length > 1) {
          sheet.layers = sheet.layers.filter((l) => l.id !== layerId);
          state.isDirty = true;
        }
      })
    );
  },

  updateSettings: (updates) => {
    set(
      produce<ProjectState>((state) => {
        Object.assign(state.project.settings, updates);
        state.isDirty = true;
      })
    );
  },

  updateTitleBlockData: (sheetId, data) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) { sheet.titleBlockData = data; state.isDirty = true; }
      })
    );
  },

  getSheet: (sheetId) => get().project.sheets.find((s) => s.id === sheetId),

  getActiveLayer: (sheetId) => {
    const sheet = get().project.sheets.find((s) => s.id === sheetId);
    return sheet?.layers.find((l) => l.visible && !l.locked);
  },

  resetProject: () => {
    const p = newProject();
    set({ project: p, isDirty: false, _snapshots: [], _future: [], canUndo: false, canRedo: false, filePath: null });
    return p.sheets[0].id;
  },
}));
