export interface CrossSheetArrow {
  id: string;
  type: "crossSheetArrow";
  arrowType: "source" | "destination";
  sheetId: string;
  layerId: string;
  x: number;
  y: number;
  wireNumber: string;
  targetSheetName: string;
  targetSheetId: string;
}
