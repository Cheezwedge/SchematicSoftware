import { useThemeStore } from "../../store/themeStore";
import { useProjectStore } from "../../store/projectStore";
import { saveProjectToFile, loadProjectFromFile } from "../../lib/projectIO";

interface Props {
  onExportPDF: () => void;
  onEditTitleBlock: () => void;
  onImportDxf: () => void;
}

export function MenuBar({ onExportPDF, onEditTitleBlock, onImportDxf }: Props) {
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);
  const { project, isDirty, canUndo, canRedo, undo, redo } = useProjectStore();
  const setProject = useProjectStore((s) => s.setProject);

  const handleSave = () => saveProjectToFile(project);
  const handleLoad = () => {
    loadProjectFromFile()
      .then((loaded) => setProject(loaded))
      .catch(() => {});
  };

  return (
    <header className="menu-bar">
      <div className="menu-bar__title">
        <span className="menu-bar__app-name">SchematicSoftware</span>
        <span className="menu-bar__project-name">
          {project.name}{isDirty && " *"}
        </span>
      </div>

      <nav className="menu-bar__actions">
        <button className="menu-btn" title="Save project (Ctrl+S)" onClick={handleSave}>
          💾
        </button>
        <button className="menu-btn" title="Open project (Ctrl+O)" onClick={handleLoad}>
          📂
        </button>
        <button className="menu-btn" title="Import DXF" onClick={onImportDxf}>
          DXF
        </button>
        <div className="menu-separator" />
        <button className="menu-btn" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          ↩
        </button>
        <button className="menu-btn" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
          ↪
        </button>
        <div className="menu-separator" />
        <button className="menu-btn" title="Export to PDF (Ctrl+P)" onClick={onExportPDF}>
          PDF
        </button>
        <button className="menu-btn" title="Edit title block for current sheet" onClick={onEditTitleBlock}>
          TB
        </button>
        <div className="menu-separator" />
        <button className="menu-btn" title="Toggle theme" onClick={toggleTheme}>
          {theme === "light" ? "☽" : "☀"}
        </button>
      </nav>
    </header>
  );
}
