import { v4 as uuidv4 } from "uuid";
import { useProjectStore } from "../../store/projectStore";
import { useCanvasStore } from "../../store/canvasStore";
import type { Layer } from "../../models/layer";

export function LayerPanel() {
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const setActiveLayer = useCanvasStore((s) => s.setActiveLayer);
  const sheet = useProjectStore((s) => (activeSheetId ? s.getSheet(activeSheetId) : undefined));
  const addLayer = useProjectStore((s) => s.addLayer);
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);

  if (!sheet || !activeSheetId) return null;

  const handleAdd = () => {
    const layer: Layer = {
      id: uuidv4(),
      name: `Layer ${sheet.layers.length + 1}`,
      visible: true,
      printable: true,
      locked: false,
      color: "#000000",
      order: sheet.layers.length,
    };
    addLayer(activeSheetId, layer);
  };

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <span>Layers</span>
        <button className="icon-btn" title="Add layer" onClick={handleAdd}>+</button>
      </div>
      <ul className="layer-list">
        {[...sheet.layers].sort((a, b) => a.order - b.order).map((layer) => (
          <li
            key={layer.id}
            className={`layer-item ${layer.id === activeLayerId ? "layer-item--active" : ""}`}
            onClick={() => setActiveLayer(layer.id)}
          >
            <input
              className="layer-color"
              type="color"
              value={layer.color}
              onChange={(e) => updateLayer(activeSheetId, layer.id, { color: e.target.value })}
              title="Layer color"
            />
            <span className="layer-name">{layer.name}</span>
            <button
              className={`layer-toggle ${layer.visible ? "active" : ""}`}
              title="Toggle visibility"
              onClick={(e) => { e.stopPropagation(); updateLayer(activeSheetId, layer.id, { visible: !layer.visible }); }}
            >
              👁
            </button>
            <button
              className={`layer-toggle ${layer.printable ? "active" : ""}`}
              title="Toggle printable"
              onClick={(e) => { e.stopPropagation(); updateLayer(activeSheetId, layer.id, { printable: !layer.printable }); }}
            >
              🖨
            </button>
            <button
              className={`layer-toggle ${layer.locked ? "active" : ""}`}
              title="Toggle lock"
              onClick={(e) => { e.stopPropagation(); updateLayer(activeSheetId, layer.id, { locked: !layer.locked }); }}
            >
              🔒
            </button>
            {sheet.layers.length > 1 && (
              <button
                className="icon-btn icon-btn--danger"
                title="Delete layer"
                onClick={(e) => { e.stopPropagation(); removeLayer(activeSheetId, layer.id); }}
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
