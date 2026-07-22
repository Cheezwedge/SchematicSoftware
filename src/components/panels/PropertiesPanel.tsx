import { useMemo } from "react";
import { useCanvasStore } from "../../store/canvasStore";
import { useProjectStore } from "../../store/projectStore";
import { useLibraryStore } from "../../store/libraryStore";
import type { Wire } from "../../models/wire";
import type { SymbolInstance } from "../../models/symbol";

export function PropertiesPanel() {
  const selectedIds = useCanvasStore((s) => s.selectedElementIds);
  const activeSheetId = useCanvasStore((s) => s.activeSheetId);
  const sheet = useProjectStore((s) => (activeSheetId ? s.getSheet(activeSheetId) : undefined));
  const updateElement = useProjectStore((s) => s.updateElement);
  const libraries = useLibraryStore((s) => s.libraries);

  const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;

  const element = useMemo(() => {
    if (!selectedId || !sheet) return null;
    return sheet.elements.find((e) => e.id === selectedId) ?? null;
  }, [selectedId, sheet]);

  const symbolDef = useMemo(() => {
    if (element?.type !== "symbol") return null;
    return libraries.flatMap((l) => l.symbols).find((s) => s.id === (element as SymbolInstance).definitionId) ?? null;
  }, [element, libraries]);

  if (!activeSheetId) return null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <span>Properties</span>
      </div>

      <div className="properties-body">
        {!element && (
          <p className="properties-empty">
            {selectedIds.size > 1 ? `${selectedIds.size} items selected` : "No selection"}
          </p>
        )}

        {element?.type === "wire" && (
          <WireProperties
            wire={element as Wire}
            sheetId={activeSheetId}
            onUpdate={(updates) => updateElement(activeSheetId, element.id, updates as Partial<Wire>)}
          />
        )}

        {element?.type === "symbol" && symbolDef && (
          <SymbolProperties
            instance={element as SymbolInstance}
            attrDefs={symbolDef.attributes}
            sheetId={activeSheetId}
            onUpdate={(updates) => updateElement(activeSheetId, element.id, updates as Partial<SymbolInstance>)}
          />
        )}
      </div>
    </div>
  );
}

function WireProperties({
  wire,
  onUpdate,
}: {
  wire: Wire;
  sheetId: string;
  onUpdate: (u: Partial<Wire>) => void;
}) {
  return (
    <>
      <div className="prop-section-title">Wire</div>
      <PropRow label="Number">
        <input
          className="prop-input"
          value={wire.number}
          onChange={(e) => onUpdate({ number: e.target.value })}
        />
      </PropRow>
      <PropRow label="Color">
        <input
          type="color"
          className="prop-color"
          value={wire.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
        />
        <span className="prop-color-value">{wire.color}</span>
      </PropRow>
      <PropRow label="Gauge">
        <input
          className="prop-input"
          value={wire.gauge}
          onChange={(e) => onUpdate({ gauge: e.target.value })}
          list="wire-gauges"
        />
        <datalist id="wire-gauges">
          {["22 AWG","20 AWG","18 AWG","16 AWG","14 AWG","12 AWG","10 AWG",
            "0.5mm²","0.75mm²","1mm²","1.5mm²","2.5mm²","4mm²","6mm²"].map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </PropRow>
    </>
  );
}

function SymbolProperties({
  instance,
  attrDefs,
  onUpdate,
}: {
  instance: SymbolInstance;
  attrDefs: { name: string; label: string }[];
  sheetId: string;
  onUpdate: (u: Partial<SymbolInstance>) => void;
}) {
  return (
    <>
      <div className="prop-section-title">Symbol</div>
      <PropRow label="Rotation">
        <div className="prop-rotation">
          {[0, 90, 180, 270].map((r) => (
            <button
              key={r}
              className={`rotation-btn ${instance.rotation === r ? "rotation-btn--active" : ""}`}
              onClick={() => onUpdate({ rotation: r })}
            >
              {r}°
            </button>
          ))}
        </div>
      </PropRow>
      <PropRow label="Scale">
        <input
          type="range"
          className="prop-slider"
          min={0.25}
          max={10}
          step={0.05}
          value={Math.min(instance.scale, 10)}
          onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
        />
        <input
          type="number"
          className="prop-scale-input"
          min={5}
          max={5000}
          step={5}
          value={Math.round(instance.scale * 100)}
          onChange={(e) => {
            const pct = Number(e.target.value);
            if (!Number.isFinite(pct)) return;
            onUpdate({ scale: Math.min(50, Math.max(0.05, pct / 100)) });
          }}
        />
        <span className="prop-scale-value">%</span>
      </PropRow>
      {attrDefs.map((attr) => (
        <PropRow key={attr.name} label={attr.label}>
          <input
            className="prop-input"
            value={instance.attributes[attr.name] ?? ""}
            onChange={(e) =>
              onUpdate({ attributes: { ...instance.attributes, [attr.name]: e.target.value } })
            }
          />
        </PropRow>
      ))}
    </>
  );
}

function PropRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="prop-row">
      <span className="prop-label">{label}</span>
      <div className="prop-value">{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";
