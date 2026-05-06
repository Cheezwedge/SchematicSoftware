import { useState } from "react";
import { useProjectStore } from "../../store/projectStore";
import type { ProjectSettings } from "../../models/project";

interface Props {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: Props) {
  const settings = useProjectStore((s) => s.project.settings);
  const updateSettings = useProjectStore((s) => s.updateSettings);

  const [local, setLocal] = useState<ProjectSettings>({ ...settings });

  function set<K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  function setNested<
    K extends "wireNumberFormat" | "rungNumberFormat",
    F extends keyof ProjectSettings[K]
  >(outer: K, field: F, value: ProjectSettings[K][F]) {
    setLocal((prev) => ({
      ...prev,
      [outer]: { ...prev[outer], [field]: value },
    }));
  }

  function handleApply() {
    updateSettings(local);
    onClose();
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog settings-dialog">
        <div className="dialog-header">
          <span>Settings</span>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="dialog-body settings-body">
          {/* ── Canvas ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Canvas</h3>
            <label className="settings-row">
              <span>Reverse scroll-wheel zoom</span>
              <input
                type="checkbox"
                checked={local.invertZoom ?? false}
                onChange={(e) => set("invertZoom", e.target.checked)}
              />
            </label>
          </section>

          {/* ── Grid ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Grid</h3>
            <label className="settings-row">
              <span>Show grid</span>
              <input
                type="checkbox"
                checked={local.showGrid}
                onChange={(e) => set("showGrid", e.target.checked)}
              />
            </label>
            <label className="settings-row">
              <span>Grid size (px)</span>
              <input
                type="number"
                className="settings-input"
                min={1}
                max={100}
                value={local.gridSize}
                onChange={(e) => set("gridSize", Number(e.target.value))}
              />
            </label>
          </section>

          {/* ── Snap ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Snap</h3>
            <label className="settings-row">
              <span>Snap to grid</span>
              <input
                type="checkbox"
                checked={local.snapEnabled}
                onChange={(e) => set("snapEnabled", e.target.checked)}
              />
            </label>
            <label className="settings-row">
              <span>Snap increment (px)</span>
              <input
                type="number"
                className="settings-input"
                min={1}
                max={100}
                value={local.snapIncrement}
                onChange={(e) => set("snapIncrement", Number(e.target.value))}
              />
            </label>
          </section>

          {/* ── Wire defaults ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Wire Defaults</h3>
            <label className="settings-row">
              <span>Default wire color</span>
              <input
                type="color"
                value={local.defaultWireColor}
                onChange={(e) => set("defaultWireColor", e.target.value)}
              />
            </label>
            <label className="settings-row">
              <span>Default wire gauge</span>
              <input
                type="text"
                className="settings-input"
                value={local.defaultWireGauge}
                onChange={(e) => set("defaultWireGauge", e.target.value)}
              />
            </label>
          </section>

          {/* ── Wire numbering ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Wire Numbering</h3>
            <label className="settings-row">
              <span>Prefix</span>
              <input
                type="text"
                className="settings-input settings-input--sm"
                value={local.wireNumberFormat.prefix}
                onChange={(e) => setNested("wireNumberFormat", "prefix", e.target.value)}
              />
            </label>
            <label className="settings-row">
              <span>Suffix</span>
              <input
                type="text"
                className="settings-input settings-input--sm"
                value={local.wireNumberFormat.suffix}
                onChange={(e) => setNested("wireNumberFormat", "suffix", e.target.value)}
              />
            </label>
            <label className="settings-row">
              <span>Start number</span>
              <input
                type="number"
                className="settings-input settings-input--sm"
                min={0}
                value={local.wireNumberFormat.startNumber}
                onChange={(e) => setNested("wireNumberFormat", "startNumber", Number(e.target.value))}
              />
            </label>
            <label className="settings-row">
              <span>Increment</span>
              <input
                type="number"
                className="settings-input settings-input--sm"
                min={1}
                value={local.wireNumberFormat.increment}
                onChange={(e) => setNested("wireNumberFormat", "increment", Number(e.target.value))}
              />
            </label>
            <label className="settings-row">
              <span>Pad length</span>
              <input
                type="number"
                className="settings-input settings-input--sm"
                min={0}
                max={10}
                value={local.wireNumberFormat.padLength}
                onChange={(e) => setNested("wireNumberFormat", "padLength", Number(e.target.value))}
              />
            </label>
          </section>

          {/* ── Rung numbering ── */}
          <section className="settings-section">
            <h3 className="settings-section-title">Rung Numbering</h3>
            <label className="settings-row">
              <span>Start number</span>
              <input
                type="number"
                className="settings-input settings-input--sm"
                min={0}
                value={local.rungNumberFormat.startNumber}
                onChange={(e) => setNested("rungNumberFormat", "startNumber", Number(e.target.value))}
              />
            </label>
            <label className="settings-row">
              <span>Increment</span>
              <input
                type="number"
                className="settings-input settings-input--sm"
                min={1}
                value={local.rungNumberFormat.increment}
                onChange={(e) => setNested("rungNumberFormat", "increment", Number(e.target.value))}
              />
            </label>
            <label className="settings-row">
              <span>Reset per sheet</span>
              <input
                type="checkbox"
                checked={local.rungNumberFormat.perSheet}
                onChange={(e) => setNested("rungNumberFormat", "perSheet", e.target.checked)}
              />
            </label>
            <label className="settings-row">
              <span>Position</span>
              <select
                className="settings-input settings-input--sm"
                value={local.rungNumberFormat.position}
                onChange={(e) => setNested("rungNumberFormat", "position", e.target.value as "left" | "right")}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
          </section>
        </div>

        <div className="dialog-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}
