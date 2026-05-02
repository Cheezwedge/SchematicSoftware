import type { SymbolDefinition } from "../models/symbol";

export const NEMA_SYMBOLS: SymbolDefinition[] = [
  {
    id: "nema-no-contact",
    name: "Normally Open Contact",
    category: "NEMA Contacts",
    standard: "NEMA",
    viewBox: "0 0 60 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
      <line x1="0" y1="20" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="13" x2="38" y2="13" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="10" x2="40" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="20" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "L1", label: "L1", x: -30, y: 0, direction: "left" },
      { id: "T1", label: "T1", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "", required: false },
    ],
    tags: ["contact", "NO", "NEMA"],
  },
  {
    id: "nema-nc-contact",
    name: "Normally Closed Contact",
    category: "NEMA Contacts",
    standard: "NEMA",
    viewBox: "0 0 60 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
      <line x1="0" y1="20" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="13" x2="38" y2="13" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="10" x2="40" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="20" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="12" x2="30" y2="26" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "L1", label: "L1", x: -30, y: 0, direction: "left" },
      { id: "T1", label: "T1", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "", required: false },
    ],
    tags: ["contact", "NC", "NEMA"],
  },
  {
    id: "nema-coil",
    name: "Coil",
    category: "NEMA Coils",
    standard: "NEMA",
    viewBox: "0 0 60 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
      <line x1="0" y1="20" x2="15" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="21" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="30" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="39" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="45" y1="20" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "A1", label: "A1", x: -30, y: 0, direction: "left" },
      { id: "A2", label: "A2", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "", required: false },
      { name: "voltage", label: "Coil Voltage", defaultValue: "120VAC", required: false },
    ],
    tags: ["coil", "relay", "NEMA"],
  },
];
