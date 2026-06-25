import { T } from "../config/theme";

export function TextInput({ label, value, onChange, placeholder, type = "text", min, max, step }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={type} value={value} min={min} max={max} step={step} placeholder={placeholder || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function NumberInput(props) {
  return <TextInput {...props} type="number" step={props.step || "any"} />;
}

export function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div className="field wide">
      <label>{label}</label>
      <textarea value={value} placeholder={placeholder || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function SectionHeader({ label, step, color = T.accentBlue }) {
  return (
    <div className="section-header">
      <div style={{ background: color }}>{step}</div>
      <span>{label}</span>
      <i />
    </div>
  );
}

export function ResultCard({ label, value, unit, color, sub, highlight }) {
  return (
    <div className="result-card" style={{ borderColor: highlight || T.border }}>
      <span>{label}</span>
      <strong style={{ color }}>{value}<em>{unit}</em></strong>
      {sub && <small style={{ color: highlight || T.textDim }}>{sub}</small>}
    </div>
  );
}
