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

function ToolGroup({ tools }: { tools: typeof TOOLS }) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  return (
    <>
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
    </>
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
      {/* View mode toggle */}
      <button
        className={`tool-btn ${viewMode === "single" ? "tool-btn--active" : ""}`}
        title="Single-sheet view (one sheet at a time)"
        onClick={() => setViewMode("single")}
      >
        □
      </button>
      <button
        className={`tool-btn ${viewMode === "multi" ? "tool-btn--active" : ""}`}
        title="Multi-sheet view (all sheets side by side)"
        onClick={() => setViewMode("multi")}
      >
        ⊟
      </button>
      <div className="toolbar-divider" />
      <ToolGroup tools={TOOLS} />
      <div className="toolbar-divider" />
      <ToolGroup tools={RUNG_TOOLS} />
      <div className="toolbar-divider" />
      <ToolGroup tools={ARROW_TOOLS} />
      <div className="toolbar-divider" />
      <ToolGroup tools={ANNOTATION_TOOLS} />
      <div className="toolbar-divider" />
      <button
        className={`tool-btn ${showGrid ? "tool-btn--active" : ""}`}
        title="Toggle grid (G)"
        onClick={() => updateSettings({ showGrid: !showGrid })}
      >
        ⊞
      </button>
      <button
        className={`tool-btn ${snapEnabled ? "tool-btn--active" : ""}`}
        title="Toggle snap to grid (Q)"
        onClick={() => updateSettings({ snapEnabled: !snapEnabled })}
      >
        ✦
      </button>
    </div>
  );
}
