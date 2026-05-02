import { useState } from "react";
import type { DxfImportResult } from "../../lib/dxfImport";

interface Props {
  fileName: string;
  result: DxfImportResult;
  onImport: (selectedLayerIds: Set<string>) => void;
  onCancel: () => void;
}

export function ImportDxfDialog({ fileName, result, onImport, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(result.layers.map((l) => l.id))
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(selected.size === result.layers.length ? new Set() : new Set(result.layers.map((l) => l.id)));

  const visibleWires = result.elements.filter(
    (e) => e.type === "wire" && selected.has(e.layerId)
  ).length;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog dialog--wide" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span>Import DXF — {fileName}</span>
          <button className="icon-btn" onClick={onCancel}>×</button>
        </div>

        <div className="dialog-body">
          <p className="import-summary">
            Parsed <strong>{result.wireCount}</strong> wire segments across{" "}
            <strong>{result.layers.length}</strong> layer{result.layers.length !== 1 ? "s" : ""}.
            {result.skippedCount > 0 && ` (${result.skippedCount} non-wire entities skipped)`}
          </p>

          <div className="import-layer-header">
            <span className="form-label">Select layers to import</span>
            <button className="btn btn--secondary btn--xs" onClick={toggleAll}>
              {selected.size === result.layers.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="import-layer-list">
            {result.layers.map((layer) => {
              const count = result.elements.filter((e) => e.layerId === layer.id).length;
              return (
                <label key={layer.id} className="import-layer-row">
                  <input
                    type="checkbox"
                    checked={selected.has(layer.id)}
                    onChange={() => toggle(layer.id)}
                  />
                  <span className="layer-color-dot" style={{ background: layer.color }} />
                  <span className="import-layer-name">{layer.name}</span>
                  <span className="import-layer-count">{count} wire{count !== 1 ? "s" : ""}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn--secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn--primary"
            disabled={visibleWires === 0}
            onClick={() => onImport(selected)}
          >
            Import {visibleWires} wire{visibleWires !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
