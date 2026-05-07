import { useRef, useEffect, useState } from "react";
import { useThemeStore } from "../../store/themeStore";
import { useProjectStore } from "../../store/projectStore";
import { useCanvasStore } from "../../store/canvasStore";
import { saveProjectToFile, loadProjectFromFile } from "../../lib/projectIO";

interface Props {
  onNew: () => void;
  onExportPDF: () => void;
  onEditTitleBlock: () => void;
  onImportDxf: () => void;
  onOpenSettings: () => void;
}

export function MenuBar({ onNew, onExportPDF, onEditTitleBlock, onImportDxf, onOpenSettings }: Props) {
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);
  const { project, isDirty, canUndo, canRedo, undo, redo } = useProjectStore();
  const setProject = useProjectStore((s) => s.setProject);
  const selectedIds = useCanvasStore((s) => s.selectedElementIds);
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const clipboard = useCanvasStore((s) => s.clipboard);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLElement>(null);

  const handleSave = () => { saveProjectToFile(project); setOpenMenu(null); };
  const handleOpen = () => {
    setOpenMenu(null);
    loadProjectFromFile().then(setProject).catch(() => {});
  };

  const close = () => setOpenMenu(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (name: string) => setOpenMenu((prev) => (prev === name ? null : name));

  return (
    <header className="menu-bar" ref={menuBarRef}>
      <div className="menu-bar__left">
        <span className="menu-bar__app-name">SchematicSoftware</span>

        {/* File menu */}
        <div className="menu-entry">
          <button
            className={`menu-entry__btn ${openMenu === "file" ? "menu-entry__btn--open" : ""}`}
            onClick={() => toggle("file")}
          >
            File
          </button>
          {openMenu === "file" && (
            <div className="menu-dropdown">
              <MenuItem label="New Project" shortcut="Ctrl+N" onClick={() => { close(); onNew(); }} />
              <MenuItem label="Open…" shortcut="Ctrl+O" onClick={handleOpen} />
              <MenuItem label="Save" shortcut="Ctrl+S" onClick={handleSave} />
              <MenuItem label="Save As…" onClick={() => { close(); saveProjectToFile(project); }} />
              <MenuSep />
              <MenuItem label="Import DXF into Sheet…" onClick={() => { close(); onImportDxf(); }} />
              <MenuSep />
              <MenuItem label="Export to PDF" shortcut="Ctrl+P" onClick={() => { close(); onExportPDF(); }} />
            </div>
          )}
        </div>

        {/* Edit menu */}
        <div className="menu-entry">
          <button
            className={`menu-entry__btn ${openMenu === "edit" ? "menu-entry__btn--open" : ""}`}
            onClick={() => toggle("edit")}
          >
            Edit
          </button>
          {openMenu === "edit" && (
            <div className="menu-dropdown">
              <MenuItem label="Undo" shortcut="Ctrl+Z" disabled={!canUndo} onClick={() => { close(); undo(); }} />
              <MenuItem label="Redo" shortcut="Ctrl+Y" disabled={!canRedo} onClick={() => { close(); redo(); }} />
              <MenuSep />
              <MenuItem
                label="Copy"
                shortcut="Ctrl+C"
                disabled={!activeSheetId || selectedIds.size === 0}
                onClick={() => {
                  close();
                  // Trigger copy via keyboard event so AppShell handles it
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "c", ctrlKey: true, bubbles: true }));
                }}
              />
              <MenuItem
                label="Paste"
                shortcut="Ctrl+V"
                disabled={!clipboard || !activeSheetId}
                onClick={() => {
                  close();
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "v", ctrlKey: true, bubbles: true }));
                }}
              />
            </div>
          )}
        </div>

        {/* View menu */}
        <div className="menu-entry">
          <button
            className={`menu-entry__btn ${openMenu === "view" ? "menu-entry__btn--open" : ""}`}
            onClick={() => toggle("view")}
          >
            View
          </button>
          {openMenu === "view" && (
            <div className="menu-dropdown">
              <MenuItem label="Edit Title Block" onClick={() => { close(); onEditTitleBlock(); }} />
              <MenuItem label="Settings…" onClick={() => { close(); onOpenSettings(); }} />
              <MenuSep />
              <MenuItem
                label={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                onClick={() => { close(); toggleTheme(); }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="menu-bar__center">
        <span className="menu-bar__project-name">
          {project.name}{isDirty && " *"}
        </span>
      </div>

      <div className="menu-bar__right">
        <button className="menu-btn" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>↩</button>
        <button className="menu-btn" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo}>↪</button>
        <div className="menu-separator" />
        <button className="menu-btn" title="Toggle theme" onClick={toggleTheme}>
          {theme === "light" ? "☽" : "☀"}
        </button>
      </div>
    </header>
  );
}

function MenuItem({
  label, shortcut, disabled, onClick,
}: {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className="menu-dropdown__item" disabled={disabled} onClick={onClick}>
      <span>{label}</span>
      {shortcut && <kbd className="menu-dropdown__kbd">{shortcut}</kbd>}
    </button>
  );
}

function MenuSep() {
  return <div className="menu-dropdown__sep" />;
}
