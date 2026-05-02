import type { SymbolDefinition } from "../models/symbol";

export const PNEUMATIC_SYMBOLS: SymbolDefinition[] = [
  {
    id: "pneu-5-2-valve",
    name: "5/2 Directional Control Valve (Solenoid)",
    category: "Pneumatic Valves",
    standard: "ISO1219",
    viewBox: "0 0 100 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
      <!-- Valve body: two position boxes -->
      <rect x="10" y="15" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="40" y="15" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Position 1: cross flow arrows -->
      <line x1="15" y1="20" x2="35" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="35,40 28,38 34,32" fill="currentColor"/>
      <line x1="35" y1="20" x2="15" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="15,40 21,38 16,32" fill="currentColor"/>
      <!-- Position 2: straight flow arrows -->
      <line x1="45" y1="20" x2="45" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="45,40 42,33 48,33" fill="currentColor"/>
      <line x1="65" y1="40" x2="65" y2="20" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="65,20 62,27 68,27" fill="currentColor"/>
      <!-- Solenoid left -->
      <rect x="0" y="20" width="10" height="20" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="2" y1="24" x2="8" y2="24" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="28" x2="8" y2="28" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="32" x2="8" y2="32" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="36" x2="8" y2="36" stroke="currentColor" stroke-width="1"/>
      <!-- Spring right -->
      <path d="M70 22 Q73 25 76 22 Q79 25 82 22 Q85 25 88 22" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="88" y1="22" x2="88" y2="38" stroke="currentColor" stroke-width="1.2"/>
      <path d="M70 38 Q73 35 76 38 Q79 35 82 38 Q85 35 88 38" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- Ports -->
      <line x1="25" y1="45" x2="25" y2="55" stroke="currentColor" stroke-width="1.5"/>
      <line x1="55" y1="45" x2="55" y2="55" stroke="currentColor" stroke-width="1.5"/>
      <line x1="25" y1="5" x2="25" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="55" y1="5" x2="55" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="5" x2="40" y2="15" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (Supply)", x: -15, y: 30, direction: "top" },
      { id: "A", label: "A", x: -15, y: -30, direction: "bottom" },
      { id: "B", label: "B", x: 15, y: -30, direction: "bottom" },
      { id: "R", label: "R (Exhaust A)", x: 0, y: 30, direction: "top" },
      { id: "S", label: "S (Exhaust B)", x: 15, y: 30, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "5/2 DCV", required: false },
      { name: "voltage", label: "Solenoid Voltage", defaultValue: "24VDC", required: false },
      { name: "portSize", label: "Port Size", defaultValue: "1/4\"", required: false },
    ],
    tags: ["valve", "5/2", "directional", "solenoid", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-3-2-valve",
    name: "3/2 Directional Control Valve (Solenoid)",
    category: "Pneumatic Valves",
    standard: "ISO1219",
    viewBox: "0 0 80 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60">
      <rect x="10" y="15" width="25" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="35" y="15" width="25" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Position 1 flow arrows -->
      <line x1="15" y1="20" x2="30" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="30,40 24,37 29,31" fill="currentColor"/>
      <line x1="30" y1="20" x2="15" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <!-- Position 2 straight arrow -->
      <line x1="40" y1="20" x2="40" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="40,40 37,33 43,33" fill="currentColor"/>
      <!-- Blocked port indicator -->
      <line x1="55" y1="20" x2="55" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <line x1="50" y1="22" x2="60" y2="22" stroke="currentColor" stroke-width="1.5"/>
      <!-- Solenoid left -->
      <rect x="0" y="20" width="10" height="20" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="2" y1="25" x2="8" y2="25" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="30" x2="8" y2="30" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="35" x2="8" y2="35" stroke="currentColor" stroke-width="1"/>
      <!-- Spring right -->
      <path d="M60 22 Q63 25 66 22 Q69 25 72 22" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="72" y1="22" x2="72" y2="38" stroke="currentColor" stroke-width="1.2"/>
      <path d="M60 38 Q63 35 66 38 Q69 35 72 38" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- Ports -->
      <line x1="22" y1="45" x2="22" y2="55" stroke="currentColor" stroke-width="1.5"/>
      <line x1="47" y1="5" x2="47" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="5" x2="22" y2="15" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (Supply)", x: -3, y: -30, direction: "bottom" },
      { id: "A", label: "A", x: -28, y: -30, direction: "bottom" },
      { id: "R", label: "R (Exhaust)", x: -28, y: 30, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "3/2 DCV", required: false },
      { name: "voltage", label: "Solenoid Voltage", defaultValue: "24VDC", required: false },
    ],
    tags: ["valve", "3/2", "directional", "solenoid", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-cylinder-double",
    name: "Double-Acting Cylinder",
    category: "Pneumatic Actuators",
    standard: "ISO1219",
    viewBox: "0 0 100 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
      <!-- Cylinder body -->
      <rect x="10" y="12" width="60" height="26" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Piston -->
      <line x1="45" y1="12" x2="45" y2="38" stroke="currentColor" stroke-width="2"/>
      <!-- Rod -->
      <line x1="70" y1="25" x2="95" y2="25" stroke="currentColor" stroke-width="2"/>
      <!-- Clevis end cap -->
      <line x1="10" y1="12" x2="10" y2="38" stroke="currentColor" stroke-width="3"/>
      <!-- Port labels -->
      <line x1="25" y1="12" x2="25" y2="5" stroke="currentColor" stroke-width="1.5"/>
      <line x1="55" y1="12" x2="55" y2="5" stroke="currentColor" stroke-width="1.5"/>
      <!-- Rod end cap line -->
      <line x1="70" y1="12" x2="70" y2="38" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "A", label: "A (Extend)", x: -25, y: -25, direction: "top" },
      { id: "B", label: "B (Retract)", x: 5, y: -25, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Double-Acting Cylinder", required: false },
      { name: "bore", label: "Bore (mm)", defaultValue: "", required: false },
      { name: "stroke", label: "Stroke (mm)", defaultValue: "", required: false },
    ],
    tags: ["cylinder", "double-acting", "actuator", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-cylinder-single",
    name: "Single-Acting Cylinder (Spring Return)",
    category: "Pneumatic Actuators",
    standard: "ISO1219",
    viewBox: "0 0 100 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
      <rect x="10" y="12" width="60" height="26" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Spring inside -->
      <path d="M12 25 Q15 20 18 25 Q21 20 24 25 Q27 20 30 25 Q33 20 36 25 Q39 20 42 25" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Piston -->
      <line x1="45" y1="12" x2="45" y2="38" stroke="currentColor" stroke-width="2"/>
      <!-- Rod -->
      <line x1="70" y1="25" x2="95" y2="25" stroke="currentColor" stroke-width="2"/>
      <!-- End cap -->
      <line x1="10" y1="12" x2="10" y2="38" stroke="currentColor" stroke-width="3"/>
      <line x1="70" y1="12" x2="70" y2="38" stroke="currentColor" stroke-width="1.5"/>
      <!-- Port -->
      <line x1="55" y1="12" x2="55" y2="5" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "A", label: "A (Pressure)", x: 5, y: -25, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Single-Acting Cylinder", required: false },
      { name: "bore", label: "Bore (mm)", defaultValue: "", required: false },
      { name: "stroke", label: "Stroke (mm)", defaultValue: "", required: false },
    ],
    tags: ["cylinder", "single-acting", "spring return", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-flow-control",
    name: "Flow Control Valve",
    category: "Pneumatic Controls",
    standard: "ISO1219",
    viewBox: "0 0 60 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50">
      <!-- Arrow through body -->
      <line x1="0" y1="25" x2="60" y2="25" stroke="currentColor" stroke-width="1.5"/>
      <polygon points="35,25 28,21 28,29" fill="currentColor"/>
      <!-- Restriction symbol -->
      <ellipse cx="30" cy="25" rx="10" ry="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Adjustment arrow -->
      <line x1="30" y1="5" x2="30" y2="17" stroke="currentColor" stroke-width="1.5"/>
      <polygon points="30,17 27,11 33,11" fill="currentColor"/>
    </svg>`,
    connectionPoints: [
      { id: "A", label: "In", x: -30, y: 0, direction: "left" },
      { id: "B", label: "Out", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Flow Control", required: false },
    ],
    tags: ["flow control", "restrictor", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-pressure-regulator",
    name: "Pressure Regulator",
    category: "Pneumatic Controls",
    standard: "ISO1219",
    viewBox: "0 0 60 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
      <!-- Body diamond -->
      <polygon points="30,8 50,28 30,48 10,28" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Arrow up -->
      <line x1="30" y1="28" x2="30" y2="18" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="30,18 27,24 33,24" fill="currentColor"/>
      <!-- Adjustment spring -->
      <line x1="30" y1="5" x2="30" y2="8" stroke="currentColor" stroke-width="1.5"/>
      <path d="M26 5 Q30 2 34 5" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- Ports -->
      <line x1="0" y1="28" x2="10" y2="28" stroke="currentColor" stroke-width="1.5"/>
      <line x1="50" y1="28" x2="60" y2="28" stroke="currentColor" stroke-width="1.5"/>
      <!-- Gauge indicator -->
      <circle cx="30" cy="52" r="6" fill="none" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="48" x2="30" y2="46" stroke="currentColor" stroke-width="1"/>
      <line x1="29" y1="52" x2="33" y2="49" stroke="currentColor" stroke-width="1"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (In)", x: -30, y: 0, direction: "left" },
      { id: "A", label: "A (Out)", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Pressure Regulator", required: false },
      { name: "setPoint", label: "Set Point (PSI)", defaultValue: "", required: false },
    ],
    tags: ["regulator", "pressure", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-5-3-spring-center",
    name: "5/3 Directional Control Valve (Spring-Centered)",
    category: "Pneumatic Valves",
    standard: "ISO1219",
    viewBox: "0 0 120 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">
      <!-- Three position boxes -->
      <rect x="10" y="15" width="25" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="35" y="15" width="25" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="60" y="15" width="25" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Left position: cross arrows -->
      <line x1="15" y1="20" x2="30" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="30,40 24,37 29,31" fill="currentColor"/>
      <line x1="30" y1="20" x2="15" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="15,40 20,34 16,28" fill="currentColor"/>
      <!-- Center position: all blocked (T ends) -->
      <line x1="40" y1="15" x2="40" y2="25" stroke="currentColor" stroke-width="1.2"/>
      <line x1="37" y1="25" x2="43" y2="25" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="45" x2="40" y2="35" stroke="currentColor" stroke-width="1.2"/>
      <line x1="37" y1="35" x2="43" y2="35" stroke="currentColor" stroke-width="1.5"/>
      <line x1="55" y1="15" x2="55" y2="25" stroke="currentColor" stroke-width="1.2"/>
      <line x1="52" y1="25" x2="58" y2="25" stroke="currentColor" stroke-width="1.5"/>
      <line x1="55" y1="45" x2="55" y2="35" stroke="currentColor" stroke-width="1.2"/>
      <line x1="52" y1="35" x2="58" y2="35" stroke="currentColor" stroke-width="1.5"/>
      <!-- Right position: straight arrows -->
      <line x1="65" y1="20" x2="65" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="65,40 62,33 68,33" fill="currentColor"/>
      <line x1="80" y1="40" x2="80" y2="20" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="80,20 77,27 83,27" fill="currentColor"/>
      <!-- Springs both sides -->
      <path d="M0 22 Q3 25 6 22 Q9 25 10 22" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="0" y1="22" x2="0" y2="38" stroke="currentColor" stroke-width="1.2"/>
      <path d="M0 38 Q3 35 6 38 Q9 35 10 38" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <path d="M85 22 Q88 25 91 22 Q94 25 97 22 Q100 25 103 22" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="103" y1="22" x2="103" y2="38" stroke="currentColor" stroke-width="1.2"/>
      <path d="M85 38 Q88 35 91 38 Q94 35 97 38 Q100 35 103 38" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- Ports -->
      <line x1="22" y1="45" x2="22" y2="55" stroke="currentColor" stroke-width="1.5"/>
      <line x1="47" y1="45" x2="47" y2="55" stroke="currentColor" stroke-width="1.5"/>
      <line x1="72" y1="45" x2="72" y2="55" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="5" x2="22" y2="15" stroke="currentColor" stroke-width="1.5"/>
      <line x1="72" y1="5" x2="72" y2="15" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (Supply)", x: -25, y: -30, direction: "bottom" },
      { id: "A", label: "A", x: -50, y: -30, direction: "bottom" },
      { id: "B", label: "B", x: 0, y: -30, direction: "bottom" },
      { id: "R", label: "R", x: -50, y: 30, direction: "top" },
      { id: "S", label: "S", x: 0, y: 30, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "5/3 DCV Spring-Centered", required: false },
      { name: "portSize", label: "Port Size", defaultValue: "1/4\"", required: false },
    ],
    tags: ["valve", "5/3", "directional", "spring-centered", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-2-2-nc-valve",
    name: "2/2 Normally-Closed Valve (Solenoid)",
    category: "Pneumatic Valves",
    standard: "ISO1219",
    viewBox: "0 0 70 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 50">
      <!-- Two position boxes -->
      <rect x="10" y="10" width="20" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="30" y="10" width="20" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Left position: blocked both ports -->
      <line x1="15" y1="10" x2="15" y2="22" stroke="currentColor" stroke-width="1.2"/>
      <line x1="11" y1="22" x2="19" y2="22" stroke="currentColor" stroke-width="1.5"/>
      <line x1="25" y1="10" x2="25" y2="22" stroke="currentColor" stroke-width="1.2"/>
      <line x1="21" y1="22" x2="29" y2="22" stroke="currentColor" stroke-width="1.5"/>
      <!-- Right position: through flow -->
      <line x1="35" y1="10" x2="35" y2="40" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="35,40 32,33 38,33" fill="currentColor"/>
      <!-- Solenoid -->
      <rect x="0" y="15" width="10" height="20" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="2" y1="20" x2="8" y2="20" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="25" x2="8" y2="25" stroke="currentColor" stroke-width="1"/>
      <line x1="2" y1="30" x2="8" y2="30" stroke="currentColor" stroke-width="1"/>
      <!-- Spring -->
      <path d="M50 15 Q53 18 56 15 Q59 18 62 15 Q65 18 68 15" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="68" y1="15" x2="68" y2="35" stroke="currentColor" stroke-width="1.2"/>
      <path d="M50 35 Q53 32 56 35 Q59 32 62 35 Q65 32 68 35" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- Ports -->
      <line x1="20" y1="40" x2="20" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <line x1="20" y1="0" x2="20" y2="10" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (In)", x: -20, y: -25, direction: "bottom" },
      { id: "A", label: "A (Out)", x: -20, y: 25, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "2/2 NC Valve", required: false },
      { name: "voltage", label: "Solenoid Voltage", defaultValue: "24VDC", required: false },
    ],
    tags: ["valve", "2/2", "normally-closed", "solenoid", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-shuttle-valve",
    name: "Shuttle Valve (OR)",
    category: "Pneumatic Controls",
    standard: "ISO1219",
    viewBox: "0 0 70 50",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 50">
      <!-- Body circle -->
      <circle cx="35" cy="25" r="18" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Ball shuttle inside -->
      <circle cx="35" cy="25" r="4" fill="currentColor"/>
      <!-- Port lines: two inlets and one outlet -->
      <line x1="0" y1="25" x2="17" y2="25" stroke="currentColor" stroke-width="1.5"/>
      <line x1="53" y1="25" x2="70" y2="25" stroke="currentColor" stroke-width="1.5"/>
      <line x1="35" y1="43" x2="35" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <!-- Left internal passage -->
      <line x1="17" y1="25" x2="31" y2="25" stroke="currentColor" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Right internal passage -->
      <line x1="39" y1="25" x2="53" y2="25" stroke="currentColor" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Outlet passage -->
      <line x1="35" y1="29" x2="35" y2="43" stroke="currentColor" stroke-width="1" stroke-dasharray="3,2"/>
    </svg>`,
    connectionPoints: [
      { id: "X", label: "X (In 1)", x: -35, y: 0, direction: "left" },
      { id: "Y", label: "Y (In 2)", x: 35, y: 0, direction: "right" },
      { id: "A", label: "A (Out)", x: 0, y: 25, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Shuttle Valve", required: false },
    ],
    tags: ["shuttle", "OR", "check", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-quick-exhaust",
    name: "Quick Exhaust Valve",
    category: "Pneumatic Controls",
    standard: "ISO1219",
    viewBox: "0 0 70 60",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 60">
      <!-- Body diamond -->
      <polygon points="35,5 60,30 35,55 10,30" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Internal ball -->
      <circle cx="35" cy="30" r="4" fill="currentColor"/>
      <!-- Supply port top -->
      <line x1="35" y1="0" x2="35" y2="5" stroke="currentColor" stroke-width="1.5"/>
      <!-- Cylinder port right -->
      <line x1="60" y1="30" x2="70" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <!-- Exhaust port bottom (muffler symbol) -->
      <line x1="35" y1="55" x2="35" y2="60" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="60" x2="40" y2="60" stroke="currentColor" stroke-width="1.5"/>
      <line x1="31" y1="63" x2="39" y2="63" stroke="currentColor" stroke-width="1"/>
      <!-- Flow indicators -->
      <polygon points="35,20 32,14 38,14" fill="currentColor"/>
      <polygon points="50,30 44,27 44,33" fill="currentColor"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (Supply)", x: 0, y: -30, direction: "bottom" },
      { id: "A", label: "A (Cylinder)", x: 35, y: 0, direction: "right" },
      { id: "R", label: "R (Exhaust)", x: 0, y: 30, direction: "top" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Quick Exhaust", required: false },
    ],
    tags: ["quick exhaust", "exhaust", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-air-filter",
    name: "Air Filter",
    category: "Pneumatic FRL",
    standard: "ISO1219",
    viewBox: "0 0 60 70",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70">
      <!-- Bowl -->
      <path d="M15 25 Q10 50 15 65 L45 65 Q50 50 45 25 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Body top -->
      <rect x="15" y="10" width="30" height="15" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Filter element inside -->
      <line x1="20" y1="30" x2="40" y2="30" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="20" y1="35" x2="40" y2="35" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2"/>
      <line x1="20" y1="40" x2="40" y2="40" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2"/>
      <!-- Drain at bottom -->
      <line x1="30" y1="65" x2="30" y2="70" stroke="currentColor" stroke-width="1.5"/>
      <line x1="25" y1="70" x2="35" y2="70" stroke="currentColor" stroke-width="1.5"/>
      <!-- Ports -->
      <line x1="0" y1="17" x2="15" y2="17" stroke="currentColor" stroke-width="1.5"/>
      <line x1="45" y1="17" x2="60" y2="17" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (In)", x: -30, y: 0, direction: "left" },
      { id: "A", label: "A (Out)", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Air Filter", required: false },
      { name: "micron", label: "Filter Rating (µm)", defaultValue: "5", required: false },
    ],
    tags: ["filter", "FRL", "ISO1219", "pneumatic"],
  },
  {
    id: "pneu-lubricator",
    name: "Lubricator",
    category: "Pneumatic FRL",
    standard: "ISO1219",
    viewBox: "0 0 60 70",
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70">
      <!-- Bowl -->
      <path d="M15 25 Q10 50 15 65 L45 65 Q50 50 45 25 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Body top -->
      <rect x="15" y="10" width="30" height="15" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- Oil drop inside -->
      <path d="M30 55 Q25 48 25 44 Q25 38 30 38 Q35 38 35 44 Q35 48 30 55 Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- Sight glass -->
      <circle cx="30" cy="43" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Oil fill port top -->
      <line x1="30" y1="10" x2="30" y2="5" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="30" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Ports -->
      <line x1="0" y1="17" x2="15" y2="17" stroke="currentColor" stroke-width="1.5"/>
      <line x1="45" y1="17" x2="60" y2="17" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    connectionPoints: [
      { id: "P", label: "P (In)", x: -30, y: 0, direction: "left" },
      { id: "A", label: "A (Out)", x: 30, y: 0, direction: "right" },
    ],
    attributes: [
      { name: "tag", label: "Tag", defaultValue: "", required: true },
      { name: "description", label: "Description", defaultValue: "Lubricator", required: false },
      { name: "oilType", label: "Oil Type", defaultValue: "ISO VG 32", required: false },
    ],
    tags: ["lubricator", "FRL", "ISO1219", "pneumatic"],
  },
];
