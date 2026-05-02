import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { useCanvasStore } from "../../store/canvasStore";
import { DEFAULT_TITLE_BLOCK_FIELDS, makeDefaultTitleBlockData } from "../../models/titleBlock";
import type { TitleBlockData } from "../../models/titleBlock";

interface Props {
  onClose: () => void;
}

export function TitleBlockEditor({ onClose }: Props) {
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const sheet = useProjectStore((s) =>
    s.project.sheets.find((sh) => sh.id === activeSheetId)
  );
  const updateTitleBlockData = useProjectStore((s) => s.updateTitleBlockData);
  const template = useProjectStore((s) =>
    s.project.titleBlockTemplates[0]
  );

  const fields = template?.fields ?? DEFAULT_TITLE_BLOCK_FIELDS;

  const existing = sheet?.titleBlockData;
  const [visible, setVisible] = useState(existing?.visible ?? true);
  const [values, setValues] = useState<Record<string, string>>(
    () => existing?.values ?? Object.fromEntries(fields.map((f) => [f.name, f.defaultValue]))
  );

  if (!activeSheetId || !sheet) return null;

  const handleSave = () => {
    if (!visible) {
      updateTitleBlockData(activeSheetId, null);
    } else {
      const data: TitleBlockData = {
        templateId: template?.id ?? "builtin-default",
        values,
        visible: true,
      };
      updateTitleBlockData(activeSheetId, data);
    }
    onClose();
  };

  const handleApplyToAll = () => {
    // Propagate company + project fields to all sheets (sheet-specific fields left per-sheet)
    const sharedKeys = ["company", "projectName", "drawnBy", "checkedBy"];
    const allSheets = useProjectStore.getState().project.sheets;
    allSheets.forEach((s) => {
      if (s.id === activeSheetId) return;
      const existing = s.titleBlockData ?? makeDefaultTitleBlockData();
      const merged = { ...existing.values };
      sharedKeys.forEach((k) => { merged[k] = values[k] ?? ""; });
      updateTitleBlockData(s.id, { ...existing, values: merged });
    });
    handleSave();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog--wide" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span>Title Block — {sheet.name}</span>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          <div className="form-row">
            <label className="form-label">Show title block</label>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
          </div>

          {visible && (
            <div className="tb-editor-grid">
              {fields.map((field) => (
                <div key={field.name} className="form-row">
                  <label className="form-label">{field.label}</label>
                  <input
                    className="form-input"
                    value={values[field.name] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.name]: e.target.value }))
                    }
                    placeholder={field.defaultValue || `Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button type="button" className="btn btn--secondary" onClick={handleApplyToAll} title="Save and copy company/project/drawn-by fields to all sheets">
            Apply Shared Fields to All Sheets
          </button>
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
