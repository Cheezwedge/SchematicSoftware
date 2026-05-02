import { useState } from "react";
import type { SymbolDefinition } from "../../models/symbol";

interface Props {
  definition: SymbolDefinition;
  onConfirm: (attributes: Record<string, string>) => void;
  onCancel: () => void;
}

export function DeviceInfoDialog({ definition, onConfirm, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(definition.attributes.map((a) => [a.name, a.defaultValue]))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(values);
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span>Insert: {definition.name}</span>
          <button className="icon-btn" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {definition.attributes.map((attr) => (
              <div className="form-row" key={attr.name}>
                <label className="form-label">
                  {attr.label}
                  {attr.required && <span className="required"> *</span>}
                </label>
                <input
                  className="form-input"
                  value={values[attr.name] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [attr.name]: e.target.value }))
                  }
                  autoFocus={attr.name === "tag"}
                />
              </div>
            ))}
            {definition.attributes.length === 0 && (
              <p className="dialog-hint">No attributes for this symbol.</p>
            )}
          </div>
          <div className="dialog-footer">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Place Symbol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

