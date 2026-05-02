import { useCanvasStore, type Tool } from "../../store/canvasStore";

const TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "select", label: "↖", title: "Select (S)" },
  { id: "wire", label: "⌇", title: "Draw Wire (W)" },
  { id: "pan", label: "✋", title: "Pan (Space)" },
];

export function DrawingToolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  return (
    <div className="drawing-toolbar">
      {TOOLS.map((tool) => (
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
