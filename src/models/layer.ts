export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  printable: boolean;
  locked: boolean;
  color: string;
  order: number;
}

export const DEFAULT_LAYERS: Omit<Layer, "id">[] = [
  { name: "Wires", visible: true, printable: true, locked: false, color: "#000000", order: 0 },
  { name: "Symbols", visible: true, printable: true, locked: false, color: "#000000", order: 1 },
  { name: "Annotations", visible: true, printable: true, locked: false, color: "#000000", order: 2 },
  { name: "Revision", visible: true, printable: false, locked: false, color: "#ff6600", order: 3 },
];
