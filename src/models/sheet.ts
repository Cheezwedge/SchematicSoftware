import type { Layer } from "./layer";
import type { Wire } from "./wire";
import type { SymbolInstance } from "./symbol";
import type { RevisionCloud } from "./revision";
import type { TitleBlockData } from "./titleBlock";
import type { CrossSheetArrow } from "./crossSheetArrow";

export type SchematicElement = Wire | SymbolInstance | RevisionCloud | CrossSheetArrow;

export interface Sheet {
  id: string;
  name: string;
  index: number;
  width: number;
  height: number;
  layers: Layer[];
  elements: SchematicElement[];
  titleBlockData: TitleBlockData | null;
}

export const DEFAULT_SHEET_WIDTH = 431.8;
export const DEFAULT_SHEET_HEIGHT = 279.4;
