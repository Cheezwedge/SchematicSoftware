import { useCanvasStore, type Tool } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";

const TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "select",  label: "↖", title: "Select (S)" },
  { id: "wire",    label: "⌇", title: "Draw Wire (W)" },
  { id: "pan",     label: "✋", title: "Pan (Space)" },
];

const RUNG_TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "rungH",      label: "═",  title: "Horizontal Rung / Rail (H)" },
  { id: "rungV",      label: "‖",  title: "Vertical Bus / Rail (V)" },
  { id: "rungColumn", label: "⬡",  title: "Insert Rung Column — click canvas to place a column of hex badges continuing from the last rung number on this sheet" },
];

const ARROW_TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "sourceArrow", label: "→", title: "Source Arrow — wire continues to another sheet" },
  { id: "destArrow",   label: "←", title: "Destination Arrow — wire comes from another sheet" },
];

const ANNOTATION_TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "revisionCloud", label: "☁", title: "Revision Cloud (click vertices, double-click to close)" },
];

function ToolGrid({ tools }: { tools: typeof TOOLS }) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  return (
    <div className="tb-grid">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-btn ${activeTool === tool.id ? "tool-btn--active" : ""}`}
          title={tool.title}
          onClick={() => setActiveTool(tool.id)}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}

function TbSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tb-section">
      <span className="tb-label">{label}</span>
      {children}
    </div>
  );
}

export function DrawingToolbar() {
  const showGrid = useProjectStore((s) => s.project.settings.showGrid);
  const snapEnabled = useProjectStore((s) => s.project.settings.snapEnabled);
  const updateSettings = useProjectStore((s) => s.updateSettings);
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);

  return (
    <div className="drawing-toolbar">
      <TbSection label="View">
        <div className="tb-grid">
          <button
            className={`tool-btn ${viewMode === "single" ? "tool-btn--active" : ""}`}
            title="Single-sheet view (one sheet at a time)"
            onClick={() => setViewMode("single")}
          >□</button>
          <button
            className={`tool-btn ${viewMode === "multi" ? "tool-btn--active" : ""}`}
            title="Multi-sheet view (all sheets side by side)"
            onClick={() => setViewMode("multi")}
          >⊟</button>
        </div>
      </TbSection>

      <TbSection label="Tools">
        <ToolGrid tools={TOOLS} />
      </TbSection>

      <TbSection label="Rungs">
        <ToolGrid tools={RUNG_TOOLS} />
      </TbSection>

      <TbSection label="Arrows">
        <ToolGrid tools={ARROW_TOOLS} />
      </TbSection>

      <TbSection label="Annotation">
        <ToolGrid tools={ANNOTATION_TOOLS} />
      </TbSection>

      <TbSection label="Display">
        <div className="tb-grid">
          <button
            className={`tool-btn ${showGrid ? "tool-btn--active" : ""}`}
            title="Toggle grid (G)"
            onClick={() => updateSettings({ showGrid: !showGrid })}
          >⊞</button>
          <button
            className={`tool-btn ${snapEnabled ? "tool-btn--active" : ""}`}
            title="Toggle snap to grid (Q)"
            onClick={() => updateSettings({ snapEnabled: !snapEnabled })}
          >✦</button>
        </div>
      </TbSection>
    </div>
  );
}
