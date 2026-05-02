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
import { CrossSheetArrowDialog } from "../dialogs/CrossSheetArrowDialog";
import { TitleBlockEditor } from "../dialogs/TitleBlockEditor";
import { SchematicCanvas } from "../../canvas/SchematicCanvas";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";
import { useLibraryStore } from "../../store/libraryStore";
import { saveProjectToFile, loadProjectFromFile } from "../../lib/projectIO";
import { exportSheetToPDF } from "../../lib/pdfExport";
import { copyElements, pasteElements } from "../../lib/copyPaste";
import type { SymbolInstance } from "../../models/symbol";
import type { CrossSheetArrow } from "../../models/crossSheetArrow";
import type { Point } from "../../models/geometry";

export function AppShell() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [arrowPendingPos, setArrowPendingPos] = useState<Point | null>(null);
  const [showTitleBlockEditor, setShowTitleBlockEditor] = useState(false);

  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const pendingPlacement = useCanvasStore((s) => s.pendingPlacement);
  const setPendingPlacement = useCanvasStore((s) => s.setPendingPlacement);
  const selectedElementIds = useCanvasStore((s) => s.selectedElementIds);
  const clipboard = useCanvasStore((s) => s.clipboard);
  const setClipboard = useCanvasStore((s) => s.setClipboard);
  const clearSelection = useCanvasStore((s) => s.clearSelection);

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

  // Global keyboard shortcuts
  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "s") {
        e.preventDefault();
        saveProjectToFile(project);
      }
      if (ctrl && e.key === "o") {
        e.preventDefault();
        loadProjectFromFile().then(setProject).catch(() => {});
      }
      if (ctrl && e.key === "p") {
        e.preventDefault();
        const sheet = project.sheets.find((s) => s.id === activeSheetId);
        if (sheet) exportSheetToPDF(sheet);
      }

      if (!inInput) {
        // Copy
        if (ctrl && e.key === "c") {
          if (!activeSheetId || selectedElementIds.size === 0) return;
          const sheet = project.sheets.find((s) => s.id === activeSheetId);
          if (!sheet) return;
          const selected = sheet.elements.filter((el) => selectedElementIds.has(el.id));
          setClipboard(copyElements(selected).elements);
        }
        // Paste
        if (ctrl && e.key === "v") {
          if (!clipboard || !activeSheetId) return;
          const sheet = project.sheets.find((s) => s.id === activeSheetId);
          if (!sheet) return;
          const existingNumbers = sheet.elements
            .filter((el) => el.type === "wire")
            .map((el) => (el as { number: string }).number);
          const pasted = pasteElements(
            { elements: clipboard },
            activeSheetId,
            existingNumbers,
            project.settings.wireNumberFormat
          );
          pasted.forEach((el) => addElement(activeSheetId, el));
          clearSelection();
        }
      }
    },
    [project, setProject, activeSheetId, selectedElementIds, clipboard, setClipboard, addElement, clearSelection]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  // Symbol placement confirmation
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
    },
    [pendingPlacement, activeSheetId, getActiveLayer, project, addElement, setPendingPlacement]
  );

  // Cross-sheet arrow placement — canvas click sets pending pos, dialog confirms
  const handleArrowClick = useCallback(
    (pos: Point) => {
      if (activeTool === "sourceArrow" || activeTool === "destArrow") {
        setArrowPendingPos(pos);
      }
    },
    [activeTool]
  );

  const handlePlaceArrow = useCallback(
    (wireNumber: string, targetSheetId: string, targetSheetName: string) => {
      if (!arrowPendingPos || !activeSheetId) return;
      const layer = getActiveLayer(activeSheetId);
      const sheet = project.sheets.find((s) => s.id === activeSheetId);
      const arrow: CrossSheetArrow = {
        id: uuidv4(),
        type: "crossSheetArrow",
        arrowType: activeTool === "sourceArrow" ? "source" : "destination",
        sheetId: activeSheetId,
        layerId: layer?.id ?? sheet?.layers[0]?.id ?? "",
        x: arrowPendingPos.x,
        y: arrowPendingPos.y,
        wireNumber,
        targetSheetId,
        targetSheetName,
      };
      addElement(activeSheetId, arrow);
      setArrowPendingPos(null);
      setActiveTool("select");
    },
    [arrowPendingPos, activeSheetId, activeTool, getActiveLayer, project, addElement, setActiveTool]
  );

  const pendingDef = pendingPlacement
    ? libraries.flatMap((l) => l.symbols).find((s) => s.id === pendingPlacement.definitionId)
    : null;

  return (
    <div className="app-shell">
      <MenuBar
        onExportPDF={() => {
          const sheet = project.sheets.find((s) => s.id === activeSheetId);
          if (sheet) exportSheetToPDF(sheet);
        }}
        onEditTitleBlock={() => setShowTitleBlockEditor(true)}
      />
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
              onArrowClick={handleArrowClick}
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
          onCancel={() => setPendingPlacement(null)}
        />
      )}

      {showTitleBlockEditor && (
        <TitleBlockEditor onClose={() => setShowTitleBlockEditor(false)} />
      )}

      {arrowPendingPos && (activeTool === "sourceArrow" || activeTool === "destArrow") && (
        <CrossSheetArrowDialog
          arrowType={activeTool === "sourceArrow" ? "source" : "destination"}
          onConfirm={handlePlaceArrow}
          onCancel={() => setArrowPendingPos(null)}
        />
      )}
    </div>
  );
}
