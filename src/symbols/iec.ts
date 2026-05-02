import type { SymbolDefinition } from "../models/symbol";

export const IEC_SYMBOLS: SymbolDefinition[] = [
  {
    id: "iec-no-contact",
    name: "Normally Open Contact",
    category: "IEC Contacts",
    standard: "IEC",
    viewBox: "0 0 60 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
      <line x1="0" y1="20" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="12" x2="20" y2="28" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="12" x2="40" y2="28" stroke="currentColor" stroke-width="1.5"/>
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
    tags: ["contact", "NO", "normally open", "IEC"],
  },
  {
    id: "iec-nc-contact",
    name: "Normally Closed Contact",
    category: "IEC Contacts",
    standard: "IEC",
    viewBox: "0 0 60 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
      <line x1="0" y1="20" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="12" x2="20" y2="28" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="12" x2="40" y2="28" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="20" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="10" x2="38" y2="30" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "L1", label: "L1", x: -30, y: 0, direction: "left" },
      { id: "T1", label: "T1", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "", required: false },
    ],
    tags: ["contact", "NC", "normally closed", "IEC"],
  },
  {
    id: "iec-coil",
    name: "Relay Coil",
    category: "IEC Coils",
    standard: "IEC",
    viewBox: "0 0 60 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40">
      <line x1="0" y1="20" x2="15" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <rect x="15" y="12" width="30" height="16" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="45" y1="20" x2="60" y2="20" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "A1", label: "A1", x: -30, y: 0, direction: "left" },
      { id: "A2", label: "A2", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "", required: false },
      { name: "voltage", label: "Coil Voltage", defaultValue: "24VDC", required: false },
    ],
    tags: ["coil", "relay", "IEC"],
  },
  {
    id: "iec-pushbutton-no",
    name: "Push Button NO",
    category: "IEC Pushbuttons",
    standard: "IEC",
    viewBox: "0 0 60 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50">
      <line x1="0" y1="30" x2="20" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="22" x2="20" y2="38" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="22" x2="40" y2="38" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="30" x2="60" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="10" x2="30" y2="22" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2"/>
      <line x1="24" y1="8" x2="36" y2="8" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    connectionPoints: [
      { id: "L1", label: "L1", x: -30, y: 10, direction: "left" },
      { id: "T1", label: "T1", x: 30, y: 10, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Push Button", required: false },
      { name: "color", label: "Button Color", defaultValue: "Green", required: false },
    ],
    tags: ["pushbutton", "PB", "NO", "IEC"],
  },
  {
    id: "iec-pushbutton-nc",
    name: "Push Button NC",
    category: "IEC Pushbuttons",
    standard: "IEC",
    viewBox: "0 0 60 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50">
      <line x1="0" y1="30" x2="20" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="22" x2="20" y2="38" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="22" x2="40" y2="38" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="30" x2="60" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="20" x2="38" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="10" x2="30" y2="22" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2"/>
      <line x1="24" y1="8" x2="36" y2="8" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    connectionPoints: [
      { id: "L1", label: "L1", x: -30, y: 10, direction: "left" },
      { id: "T1", label: "T1", x: 30, y: 10, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Push Button", required: false },
      { name: "color", label: "Button Color", defaultValue: "Red", required: false },
    ],
    tags: ["pushbutton", "PB", "NC", "IEC"],
  },
  {
    id: "iec-motor",
    name: "Motor (3-Phase)",
    category: "IEC Motors",
    standard: "IEC",
    viewBox: "0 0 60 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <text x="30" y="35" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor">M</text>
      <line x1="10" y1="15" x2="0" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="10" y1="30" x2="0" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="10" y1="45" x2="0" y2="45" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "U", label: "U", x: -30, y: -15, direction: "left" },
      { id: "V", label: "V", x: -30, y: 0, direction: "left" },
      { id: "W", label: "W", x: -30, y: 15, direction: "left" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Motor", required: false },
      { name: "hp", label: "Horsepower", defaultValue: "", required: false },
      { name: "voltage", label: "Voltage", defaultValue: "460V", required: false },
    ],
    tags: ["motor", "M", "3-phase", "IEC"],
  },
  {
    id: "iec-contactor",
    name: "Contactor",
    category: "IEC Contactors",
    standard: "IEC",
    viewBox: "0 0 80 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60">
      <rect x="20" y="10" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <text x="40" y="33" text-anchor="middle" font-size="10" fill="currentColor">KM</text>
      <line x1="0" y1="20" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="0" y1="30" x2="20" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="0" y1="40" x2="20" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="60" y1="20" x2="80" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="60" y1="30" x2="80" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="60" y1="40" x2="80" y2="40" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "1", label: "1", x: -40, y: -10, direction: "left" },
      { id: "3", label: "3", x: -40, y: 0, direction: "left" },
      { id: "5", label: "5", x: -40, y: 10, direction: "left" },
      { id: "2", label: "2", x: 40, y: -10, direction: "right" },
      { id: "4", label: "4", x: 40, y: 0, direction: "right" },
      { id: "6", label: "6", x: 40, y: 10, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Contactor", required: false },
      { name: "ampRating", label: "Amp Rating", defaultValue: "", required: false },
      { name: "voltage", label: "Coil Voltage", defaultValue: "24VDC", required: false },
    ],
    tags: ["contactor", "KM", "IEC"],
  },
  {
    id: "iec-overload",
    name: "Overload Relay",
    category: "IEC Protection",
    standard: "IEC",
    viewBox: "0 0 60 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50">
      <line x1="0" y1="25" x2="12" y2="25" stroke="currentColor" stroke-width="1.5"/>
      <rect x="12" y="10" width="36" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M18 35 Q22 20 26 35 Q30 20 34 35 Q38 20 42 35" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="48" y1="25" x2="60" y2="25" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "1", label: "1", x: -30, y: 0, direction: "left" },
      { id: "2", label: "2", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Overload Relay", required: false },
      { name: "setting", label: "Setting (A)", defaultValue: "", required: false },
    ],
    tags: ["overload", "OL", "thermal", "IEC"],
  },
  {
    id: "iec-terminal",
    name: "Terminal Block",
    category: "IEC Terminals",
    standard: "IEC",
    viewBox: "0 0 30 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 50">
      <rect x="5" y="5" width="20" height="40" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="5" y1="25" x2="25" y2="25" stroke="currentColor" stroke-width="1"/>
      <line x1="0" y1="15" x2="5" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="0" y1="35" x2="5" y2="35" stroke="currentColor" stroke-width="1.5"/>
      <line x1="25" y1="15" x2="30" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="25" y1="35" x2="30" y2="35" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "top", label: "Top", x: 0, y: -25, direction: "top" },
      { id: "bottom", label: "Bottom", x: 0, y: 25, direction: "bottom" },
    ],
    attributes: [
      { name: "tag", label: "Tag/Number", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "", required: false },
      { name: "gauge", label: "Wire Gauge", defaultValue: "14 AWG", required: false },
    ],
    tags: ["terminal", "TB", "terminal block", "IEC"],
  },
  {
    id: "iec-fuse",
    name: "Fuse",
    category: "IEC Protection",
    standard: "IEC",
    viewBox: "0 0 60 30",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30">
      <line x1="0" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <rect x="15" y="8" width="30" height="14" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="15" y1="15" x2="45" y2="15" stroke="currentColor" stroke-width="1"/>
      <line x1="45" y1="15" x2="60" y2="15" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "1", label: "1", x: -30, y: 0, direction: "left" },
      { id: "2", label: "2", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Fuse", required: false },
      { name: "rating", label: "Rating (A)", defaultValue: "", required: false },
    ],
    tags: ["fuse", "FU", "protection", "IEC"],
  },
  {
    id: "iec-lamp",
    name: "Pilot Light",
    category: "IEC Indicators",
    standard: "IEC",
    viewBox: "0 0 40 40",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="13" y1="13" x2="27" y2="27" stroke="currentColor" stroke-width="1.5"/>
      <line x1="27" y1="13" x2="13" y2="27" stroke="currentColor" stroke-width="1.5"/>
      <line x1="0" y1="20" x2="8" y2="20" stroke="currentColor" stroke-width="1.5"/>
      <line x1="32" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "A1", label: "A1", x: -20, y: 0, direction: "left" },
      { id: "A2", label: "A2", x: 20, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Pilot Light", required: false },
      { name: "color", label: "Color", defaultValue: "Green", required: false },
      { name: "voltage", label: "Voltage", defaultValue: "24VDC", required: false },
    ],
    tags: ["lamp", "light", "PL", "indicator", "IEC"],
  },
];
