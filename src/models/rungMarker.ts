export interface RungMarker {
  id: string;
  type: "rungMarker";
  sheetId: string;
  layerId: string;
  x: number; // badge center x in canvas px
  y: number; // badge center y in canvas px
  number: number;
}
