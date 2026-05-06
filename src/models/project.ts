import type { Sheet } from "./sheet";
import type { WireNumberFormat } from "./wire";
import type { TitleBlockTemplate } from "./titleBlock";
import type { SymbolDefinition } from "./symbol";

export interface RungNumberFormat {
  startNumber: number;
  increment: number;
  perSheet: boolean;
  position: "left" | "right";
}

export interface ProjectSettings {
  defaultWireColor: string;
  defaultWireGauge: string;
  wireNumberFormat: WireNumberFormat;
  rungNumberFormat: RungNumberFormat;
  gridSize: number;
  showGrid: boolean;
  snapEnabled: boolean;
  snapIncrement: number;
  invertZoom: boolean;
  wireLabelSize: number;
  deviceLabelSize: number;
}

export interface SymbolLibrary {
  id: string;
  name: string;
  symbols: SymbolDefinition[];
  isBuiltIn: boolean;
}

export interface Project {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  modifiedAt: string;
  settings: ProjectSettings;
  sheets: Sheet[];
  symbolLibraries: SymbolLibrary[];
  titleBlockTemplates: TitleBlockTemplate[];
  activeTitleBlockTemplateId: string | null;
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  defaultWireColor: "#000000",
  defaultWireGauge: "14 AWG",
  wireNumberFormat: {
    prefix: "W",
    suffix: "",
    startNumber: 1,
    increment: 1,
    padLength: 3,
  },
  rungNumberFormat: {
    startNumber: 1,
    increment: 1,
    perSheet: false,
    position: "left",
  },
  gridSize: 5,
  showGrid: true,
  snapEnabled: true,
  snapIncrement: 5,
  invertZoom: false,
  wireLabelSize: 8,
  deviceLabelSize: 8,
};
