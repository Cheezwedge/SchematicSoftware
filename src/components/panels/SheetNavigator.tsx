import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { useCanvasStore } from "../../store/canvasStore";

export function SheetNavigator() {
  const sheets = useProjectStore((s) => s.project.sheets);
  const addSheet = useProjectStore((s) => s.addSheet);
  const removeSheet = useProjectStore((s) => s.removeSheet);
  const renameSheet = useProjectStore((s) => s.renameSheet);
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const setActiveSheet = useCanvasStore((s) => s.setActiveSheet);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const id = addSheet();
    setActiveSheet(id);
  };

  const handleSelect = (id: string) => {
    setActiveSheet(id);
    const sheet = sheets.find((s) => s.id === id);
    if (sheet?.layers[0]) setActiveLayer(sheet.layers[0].id);
  };

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) renameSheet(editingId, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="sheet-navigator">
      <div className="panel-header">
        <span>Sheets</span>
        <button className="icon-btn" title="Add sheet" onClick={handleAdd}>+</button>
      </div>
      <ul className="sheet-list">
        {[...sheets].sort((a, b) => a.index - b.index).map((sheet) => (
          <li
            key={sheet.id}
            className={`sheet-item ${sheet.id === activeSheetId ? "sheet-item--active" : ""}`}
          >
            {editingId === sheet.id ? (
              <input
                className="sheet-rename-input"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingId(null); }}
              />
            ) : (
              <button
                className="sheet-btn"
                onClick={() => handleSelect(sheet.id)}
                onDoubleClick={() => startRename(sheet.id, sheet.name)}
              >
                {sheet.name}
              </button>
            )}
            {sheets.length > 1 && (
              <button
                className="icon-btn icon-btn--danger"
                title="Delete sheet"
                onClick={() => { if (sheet.id === activeSheetId) setActiveSheet(sheets.find(s=>s.id!==sheet.id)!.id); removeSheet(sheet.id); }}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
