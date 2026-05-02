import { useRef, useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { MenuBar } from "./MenuBar";
import { StatusBar } from "./StatusBar";
import { SheetNavigator } from "../panels/SheetNavigator";
import { LayerPanel } from "../panels/LayerPanel";
import { LibraryPanel } from "../panels/LibraryPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel";
import { DrawingToolbar } from "../toolbar/DrawingToolbar";
import { DeviceInfoDialog } from "../dialogs/DeviceInfoDialog";
import { SchematicCanvas } from "../../canvas/SchematicCanvas";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";
import { useLibraryStore } from "../../store/libraryStore";
import { saveProjectToFile, loadProjectFromFile } from "../../lib/projectIO";
import type { SymbolInstance } from "../../models/symbol";

export function AppShell() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const pendingPlacement = useCanvasStore((s) => s.pendingPlacement);
  const setPendingPlacement = useCanvasStore((s) => s.setPendingPlacement);

  const project = useProjectStore((s) => s.project);
  const addElement = useProjectStore((s) => s.addElement);
  const setProject = useProjectStore((s) => s.setProject);
  const getActiveLayer = useProjectStore((s) => s.getActiveLayer);

  const libraries = useLibraryStore((s) => s.libraries);

  // Initialize active sheet
  useEffect(() => {
    if (!activeSheetId && project.sheets.length > 0) {
      const first = project.sheets[0];
      setActiveSheet(first.id);
      if (first.layers[0]) setActiveLayer(first.layers[0].id);
    }
  }, []);

  // Canvas resize observer
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() =>
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight })
    );
    obs.observe(el);
    setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  // Global keyboard: Ctrl+S / Ctrl+O
  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveProjectToFile(project);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        loadProjectFromFile()
          .then((loaded) => setProject(loaded))
          .catch(() => {});
      }
    },
    [project, setProject]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  // Confirm symbol placement from DeviceInfoDialog
  const handlePlaceSymbol = useCallback(
    (attributes: Record<string, string>) => {
      if (!pendingPlacement || !activeSheetId) return;
      const layer = getActiveLayer(activeSheetId);
      const sheet = project.sheets.find((s) => s.id === activeSheetId);

      const instance: SymbolInstance = {
        id: uuidv4(),
        type: "symbol",
        definitionId: pendingPlacement.definitionId,
        sheetId: activeSheetId,
        layerId: layer?.id ?? sheet?.layers[0]?.id ?? "",
        x: pendingPlacement.pos.x,
        y: pendingPlacement.pos.y,
        rotation: pendingPlacement.rotation,
        scale: 1,
        attributes,
      };

      addElement(activeSheetId, instance);
      setPendingPlacement(null);
      // Stay in symbol tool so user can keep placing
    },
    [pendingPlacement, activeSheetId, getActiveLayer, project, addElement, setPendingPlacement]
  );

  const handleCancelPlacement = useCallback(() => {
    setPendingPlacement(null);
  }, [setPendingPlacement]);

  const pendingDef = pendingPlacement
    ? libraries.flatMap((l) => l.symbols).find((s) => s.id === pendingPlacement.definitionId)
    : null;

  return (
    <div className="app-shell">
      <MenuBar />
      <div className="app-body">
        <aside className="sidebar sidebar--left">
          <DrawingToolbar />
          <LibraryPanel />
        </aside>

        <main className="canvas-container" ref={canvasContainerRef}>
          {activeSheetId && (
            <SchematicCanvas
              sheetId={activeSheetId}
              containerWidth={canvasSize.width}
              containerHeight={canvasSize.height}
            />
          )}
        </main>

        <aside className="sidebar sidebar--right">
          <SheetNavigator />
          <LayerPanel />
          <PropertiesPanel />
        </aside>
      </div>
      <StatusBar />

      {pendingPlacement && pendingDef && (
        <DeviceInfoDialog
          definition={pendingDef}
          onConfirm={handlePlaceSymbol}
          onCancel={handleCancelPlacement}
        />
      )}
    </div>
  );
}
