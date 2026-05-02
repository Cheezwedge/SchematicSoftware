import { create } from "zustand";
import { produce } from "immer";
import { v4 as uuidv4 } from "uuid";
import type { Project, ProjectSettings } from "../models/project";
import type { Sheet, SchematicElement } from "../models/sheet";
import type { Layer } from "../models/layer";
import { DEFAULT_LAYERS } from "../models/layer";
import { DEFAULT_SHEET_WIDTH, DEFAULT_SHEET_HEIGHT } from "../models/sheet";
import { DEFAULT_PROJECT_SETTINGS } from "../models/project";
import {
  DEFAULT_TITLE_BLOCK_TEMPLATE,
  BUILTIN_TEMPLATE_ID,
  makeDefaultTitleBlockData,
} from "../models/titleBlock";
import type { TitleBlockData } from "../models/titleBlock";

function makeDefaultLayers(): Layer[] {
  return DEFAULT_LAYERS.map((l) => ({ ...l, id: uuidv4() }));
}

function makeNewSheet(index: number): Sheet {
  return {
    id: uuidv4(),
    name: `Sheet ${index + 1}`,
    index,
    width: DEFAULT_SHEET_WIDTH,
    height: DEFAULT_SHEET_HEIGHT,
    layers: makeDefaultLayers(),
    elements: [],
    titleBlockData: makeDefaultTitleBlockData(),
  };
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

  addLayer: (sheetId: string, layer: Layer) => void;
  updateLayer: (sheetId: string, layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (sheetId: string, layerId: string) => void;

  updateSettings: (updates: Partial<ProjectSettings>) => void;
  updateTitleBlockData: (sheetId: string, data: TitleBlockData | null) => void;

  getSheet: (sheetId: string) => Sheet | undefined;
  getActiveLayer: (sheetId: string) => Layer | undefined;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  project: newProject(),
  isDirty: false,
  filePath: null,

  setProject: (project) => set({ project, isDirty: false }),
  setFilePath: (filePath) => set({ filePath }),
  markDirty: () => set({ isDirty: true }),
  markSaved: () => set({ isDirty: false }),

  addSheet: () => {
    const id = uuidv4();
    set(
      produce<ProjectState>((state) => {
        const idx = state.project.sheets.length;
        state.project.sheets.push({ ...makeNewSheet(idx), id });
        state.project.modifiedAt = new Date().toISOString();
        state.isDirty = true;
      })
    );
    return id;
  },

  removeSheet: (sheetId) => {
    set(
      produce<ProjectState>((state) => {
        if (state.project.sheets.length <= 1) return;
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
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) { sheet.elements.push(element); state.isDirty = true; }
      })
    );
  },

  removeElement: (sheetId, elementId) => {
    set(
      produce<ProjectState>((state) => {
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

  addLayer: (sheetId, layer) => {
    set(
      produce<ProjectState>((state) => {
        const sheet = state.project.sheets.find((s) => s.id === sheetId);
        if (sheet) { sheet.layers.push(layer); state.isDirty = true; }
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
}));
