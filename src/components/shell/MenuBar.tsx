import { useThemeStore } from "../../store/themeStore";
import { useHistoryStore } from "../../store/historyStore";
import { useProjectStore } from "../../store/projectStore";

export function MenuBar() {
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const theme = useThemeStore((s) => s.theme);
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { project, isDirty } = useProjectStore();

  return (
    <header className="menu-bar">
      <div className="menu-bar__title">
        <span className="menu-bar__app-name">SchematicSoftware</span>
        <span className="menu-bar__project-name">
          {project.name}
          {isDirty && " *"}
        </span>
      </div>

      <nav className="menu-bar__actions">
        <button className="menu-btn" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          ↩
        </button>
        <button className="menu-btn" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo}>
          ↪
        </button>
        <div className="menu-separator" />
        <button className="menu-btn" title="Toggle theme" onClick={toggleTheme}>
          {theme === "light" ? "☽" : "☀"}
        </button>
      </nav>
    </header>
  );
}
