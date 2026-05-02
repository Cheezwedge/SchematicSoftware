import type { Point } from "./geometry";

export interface RevisionCloud {
  id: string;
  type: "revisionCloud";
  sheetId: string;
  layerId: string;
  points: Point[];
  arcRadius: number;
  label: string;
  printable: false;
}
