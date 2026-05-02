import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import { useCanvasStore } from "../../store/canvasStore";

interface Props {
  arrowType: "source" | "destination";
  onConfirm: (wireNumber: string, targetSheetId: string, targetSheetName: string) => void;
  onCancel: () => void;
}

export function CrossSheetArrowDialog({ arrowType, onConfirm, onCancel }: Props) {
  const sheets = useProjectStore((s) => s.project.sheets);
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const otherSheets = sheets.filter((s) => s.id !== activeSheetId);

  const [wireNumber, setWireNumber] = useState("");
  const [targetSheetId, setTargetSheetId] = useState(otherSheets[0]?.id ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wireNumber.trim() || !targetSheetId) return;
    const target = sheets.find((s) => s.id === targetSheetId);
    onConfirm(wireNumber.trim(), targetSheetId, target?.name ?? "");
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span>{arrowType === "source" ? "→ Source Arrow" : "← Destination Arrow"}</span>
          <button className="icon-btn" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div className="form-row">
              <label className="form-label">Wire / Signal No.<span className="required"> *</span></label>
              <input
                className="form-input"
                value={wireNumber}
                onChange={(e) => setWireNumber(e.target.value)}
                placeholder="e.g. W001 or 24VDC"
                autoFocus
              />
            </div>
            <div className="form-row">
              <label className="form-label">Connects to<span className="required"> *</span></label>
              <select
                className="form-input"
                value={targetSheetId}
                onChange={(e) => setTargetSheetId(e.target.value)}
              >
                {otherSheets.length === 0 && (
                  <option value="">No other sheets</option>
                )}
                {otherSheets.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={!wireNumber.trim() || !targetSheetId}>
              Place Arrow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React from "react";
