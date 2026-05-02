import { useRef, useEffect, useState } from "react";
import { MenuBar } from "./MenuBar";
import { StatusBar } from "./StatusBar";
import { SheetNavigator } from "../panels/SheetNavigator";
import { LayerPanel } from "../panels/LayerPanel";
import { LibraryPanel } from "../panels/LibraryPanel";
import { DrawingToolbar } from "../toolbar/DrawingToolbar";
import { SchematicCanvas } from "../../canvas/SchematicCanvas";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";

export function AppShell() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const project = useProjectStore((s) => s.project);

  // Initialize active sheet on first load
  useEffect(() => {
    if (!activeSheetId && project.sheets.length > 0) {
      const first = project.sheets[0];
      setActiveSheet(first.id);
      if (first.layers[0]) setActiveLayer(first.layers[0].id);
    }
  }, []);

  // Track canvas container size
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    });
    obs.observe(el);
    setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="app-shell">
      <MenuBar />
      <div className="app-body">
        {/* Left sidebar */}
        <aside className="sidebar sidebar--left">
          <DrawingToolbar />
          <LibraryPanel />
        </aside>

        {/* Canvas area */}
        <main className="canvas-container" ref={canvasContainerRef}>
          {activeSheetId && (
            <SchematicCanvas
              sheetId={activeSheetId}
              containerWidth={canvasSize.width}
              containerHeight={canvasSize.height}
            />
          )}
        </main>

        {/* Right sidebar */}
        <aside className="sidebar sidebar--right">
          <SheetNavigator />
          <LayerPanel />
        </aside>
      </div>
      <StatusBar />
    </div>
  );
}
