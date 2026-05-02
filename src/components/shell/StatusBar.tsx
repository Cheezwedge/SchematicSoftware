import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";

export function StatusBar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const cursorPos = useCanvasStore((s) => s.cursorPosition);
  const scale = useCanvasStore((s) => s.viewport.scale);
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const sheet = useProjectStore((s) => (activeSheetId ? s.getSheet(activeSheetId) : undefined));

  return (
    <footer className="status-bar">
      <span className="status-item">Tool: {activeTool}</span>
      {cursorPos && (
        <span className="status-item">
          X: {cursorPos.x.toFixed(1)} Y: {cursorPos.y.toFixed(1)}
        </span>
      )}
      <span className="status-item">Zoom: {Math.round(scale * 100)}%</span>
      {sheet && <span className="status-item">{sheet.name}</span>}
    </footer>
  );
}
