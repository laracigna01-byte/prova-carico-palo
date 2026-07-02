import { T } from "../config/theme";
import { fmt } from "../utils/formatters";

const keys = ["c1", "c2", "c3"];
const labels = { c1: "Comparatore 1", c2: "Comparatore 2", c3: "Comparatore 3" };

function normalizeList(value) {
  if (Array.isArray(value)) return Array.from({ length: 9 }, (_, i) => value[i] ?? "");
  if (value === null || value === undefined || value === "") return Array(9).fill("");
  return [value, ...Array(8).fill("")];
}

function normalize(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(keys.map((key) => [key, normalizeList(value[key])]));
  }

  return {
    c1: normalizeList(value),
    c2: Array(9).fill(""),
    c3: Array(9).fill(""),
  };
}

function getNums(values) {
  return values
    .filter((v) => String(v).trim() !== "")
    .map((v) => Number(String(v).replace(",", ".")))
    .filter((v) => Number.isFinite(v));
}

function isStable(values) {
  const nums = getNums(values);
  const firstThree = nums.slice(0, 3);

  return (
    firstThree.length === 3 &&
    Math.max(...firstThree) - Math.min(...firstThree) <= 0.02
  );
}

export function StepTable({ step, load, targetLoad, pressure, value = {}, onChange, color }) {
  const readings = normalize(value);

  const counts = Object.fromEntries(
    keys.map((key) => [key, getNums(readings[key]).length])
  );

  const stableMap = Object.fromEntries(
    keys.map((key) => [key, isStable(readings[key])])
  );

  const stableCount = keys.filter((key) => stableMap[key]).length;
  const allStable = stableCount === 3;
  const overLimit = Number(pressure) > 700;

  const updateReading = (compKey, index, nextValue) => {
    const nextComp = [...readings[compKey]];
    nextComp[index] = nextValue;
    onChange({ ...readings, [compKey]: nextComp });
  };

  return (
    <div
      className={`step-table ${step.unload ? "is-unload" : ""}`}
      style={{ borderColor: step.unload ? T.accentOrange : T.border }}
    >
      <div className="step-head">
        <div>
          <b style={{ color }}>{fmt(load, 2)} kN</b>
          <span>{step.cycleLabel} · {step.label}</span>
          <small className="target-load">
            carico automatico da {step.label} del carico massimo di prova
          </small>
        </div>

        <div className="step-status">
          <mark className={allStable ? "ok" : "pending"}>
            {allStable ? "STABILE" : "DA VERIFICARE"}
          </mark>
        </div>
      </div>

      <div className="pressure-row auto-pressure">
        <label>Pressione automatica [bar]</label>
        <output
          style={{
            color: overLimit ? "#f85149" : undefined,
            fontWeight: overLimit ? 900 : undefined,
          }}
        >
          {pressure === null ? "—" : `${fmt(pressure, 2)} bar`}
        </output>
      </div>

      {overLimit && (
        <div className="step-warning">
          ⚠ Pressione superiore a 700 bar: verificare la portata del martinetto.
        </div>
      )}

      <div className="multi-comparator-grid">
        {keys.map((key) => (
          <div className="comparator-block" key={key}>
            <div className="comparator-title">
              <b>{labels[key]}</b>
              <span className={stableMap[key] ? "ok" : "pending"}>
              {stableMap[key] ? "STABILE" : "In attesa di stabilizzazione"}
              </span>
            </div>

            <div className="reading-nine-grid">
              {readings[key].map((reading, index) => (
                <label key={`${key}-${index}`}>
                  <small>{index + 1}</small>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={reading ?? ""}
                    onChange={(e) => updateReading(key, index, e.target.value)}
                    placeholder="0,00"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="step-summary">
        Cedimento medio: <b>{fmt(step.reading, 3)} mm</b> · Scarto max-min:{" "}
        <b>{fmt(step.comparatorDelta, 3)} mm</b>
      </div>
    </div>
  );
}