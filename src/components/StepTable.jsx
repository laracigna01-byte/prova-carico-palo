import { T } from "../config/theme";
import { fmt } from "../utils/formatters";

const keys = ["c1", "c2", "c3"];

export function StepTable({ step, load, targetLoad, pressure, onPressureChange, value = {}, onChange, color }) {
  const readings = Array.isArray(value) ? Object.fromEntries(keys.map((k, i) => [k, value[i] ?? ""])) : { c1: "", c2: "", c3: "", ...(value || {}) };
  const nums = keys.map((k) => Number(String(readings[k] || "").replace(",", "."))).filter(Number.isFinite);
  const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  const delta = nums.length ? Math.max(...nums) - Math.min(...nums) : null;
  const updateReading = (key, nextValue) => onChange({ ...readings, [key]: nextValue });

  return (
    <div className={`step-table ${step.unload ? "is-unload" : ""}`} style={{ borderColor: step.unload ? T.accentOrange : T.border }}>
      <div className="step-head">
        <div>
          <b style={{ color }}>{fmt(load, 2)} kN calcolati</b>
          <span>{step.cycleLabel} · {step.label}</span>
          <small className="target-load">bar automatici da kN / coeff. taratura · riferimento {fmt(targetLoad, 2)} kN</small>
        </div>
        <div className="step-status"><mark className={nums.length >= 3 ? "ok" : "pending"}>{nums.length >= 3 ? "LETTURE OK" : "COMPILARE"}</mark></div>
      </div>
      <div className="pressure-row auto-pressure">
        <label>Pressione automatica [bar]</label>
        <div className="auto-pressure-value">{pressure === null || pressure === undefined ? "Coeff. taratura mancante" : `${fmt(pressure, 2)} bar`}</div>
      </div>
      <div className="step-grid pile-readings">
        {keys.map((key, index) => (
          <div key={key}>
            <small>Comparatore {index + 1}</small>
            <input type="number" inputMode="decimal" step="0.01" value={readings[key] || ""} onChange={(e) => updateReading(key, e.target.value)} placeholder="0,00" />
          </div>
        ))}
      </div>
      <div className="reading-summary">Cedimento medio: <b>{fmt(mean, 3)} mm</b> · Scarto max-min: <b>{fmt(delta, 3)} mm</b></div>
    </div>
  );
}
