import { toNumber, round } from "./formatters";

export const FIXED_JACK_TON = 30;
export const FIXED_TON_TO_KN = 9.81;
export const FIXED_JACK_KN = round(FIXED_JACK_TON * FIXED_TON_TO_KN, 2);
export const FIXED_PRESSURE_BAR = 700;

const COMPARATORS = ["c1", "c2", "c3"];

function normalizeReadings(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(COMPARATORS.map((k) => [k, value[k] ?? ""]));
  }
  if (Array.isArray(value)) {
    return Object.fromEntries(COMPARATORS.map((k, i) => [k, value[i] ?? ""]));
  }
  return { c1: value ?? "", c2: "", c3: "" };
}

export function loadToKn(value, unit = "kN", tonToKn = 9.81) {
  const n = toNumber(value, null);
  if (n === null) return null;
  return unit === "ton" ? round(n * toNumber(tonToKn, 9.81), 2) : round(n, 2);
}

function stats(readings) {
  const values = COMPARATORS.map((k) => toNumber(readings[k], null)).filter((v) => v !== null);
  if (!values.length) return { mean: null, max: null, min: null, count: 0, delta: null };
  const mean = round(values.reduce((a, b) => a + b, 0) / values.length, 3);
  const max = round(Math.max(...values), 3);
  const min = round(Math.min(...values), 3);
  return { mean, max, min, count: values.length, delta: round(max - min, 3) };
}

export function buildRows({ readings, loadSteps, designLoadSLE }) {
  const exerciseLoad = toNumber(designLoadSLE, 0);
  const referenceLoad = FIXED_JACK_KN;
  const referenceBar = FIXED_PRESSURE_BAR;

  return loadSteps.map((step, index) => {
    const stepReadings = normalizeReadings(readings?.[step.key]);
    const s = stats(stepReadings);
    const targetLoad = round(exerciseLoad * step.factor, 2);
    const pressure = referenceLoad && referenceLoad > 0 && referenceBar !== null ? round((targetLoad * referenceBar) / referenceLoad, 2) : null;

    return {
      ...step,
      stepNo: index + 1,
      readings: stepReadings,
      reading: s.mean,
      meanSettlement: s.mean,
      maxSettlement: s.max,
      minSettlement: s.min,
      comparatorDelta: s.delta,
      measuredCount: s.count,
      targetLoad,
      pressure,
      measuredLoad: targetLoad,
      load: targetLoad,
    };
  });
}

export function calcPalo({ readings, loadSteps, designLoadSLE }) {
  const referenceLoadKn = FIXED_JACK_KN;
  const rows = buildRows({ readings, loadSteps, designLoadSLE });
  const max = rows.find((r) => r.isMax) || rows.find((r) => r.key === "co150") || null;
  const exerciseMax = rows.find((r) => r.isExerciseMax) || rows.find((r) => r.key === "es100") || null;
  const unload = rows.find((r) => r.isResidual) || rows.filter((r) => r.unload).at(-1) || null;
  const exerciseResidual = rows.find((r) => r.isExerciseResidual) || null;
  const measuredCount = rows.filter((r) => r.measuredCount > 0).length;
  const maxDisplacement = max?.meanSettlement ?? null;
  const exerciseDisplacement = exerciseMax?.meanSettlement ?? null;
  const residual = unload?.meanSettlement ?? null;
  const elasticRecovery = maxDisplacement !== null && residual !== null ? round(maxDisplacement - residual, 3) : null;

  const chartPoint = (r) => ({
    x: r.meanSettlement,
    y: r.load,
    pressure: r.pressure,
    targetLoad: r.targetLoad,
    name: `${r.cycleLabel} ${r.label}`,
    phase: r.phase,
    unload: r.unload,
    cycle: r.cycle,
  });

  const chartExercise = rows.filter((r) => r.cycle === "esercizio" && r.meanSettlement !== null).map(chartPoint);
  const chartCollaudo = rows.filter((r) => r.cycle === "collaudo" && !r.unload && r.meanSettlement !== null).map(chartPoint);
  const chartUnload = rows.filter((r) => r.cycle === "collaudo" && r.unload && r.meanSettlement !== null).map(chartPoint);
  const chartLoad = rows.filter((r) => !r.unload && r.meanSettlement !== null).map(chartPoint);

  return {
    rows,
    max,
    exerciseMax,
    unload,
    exerciseResidual,
    measuredCount,
    maxDisplacement,
    exerciseDisplacement,
    residual,
    elasticRecovery,
    chartExercise,
    chartCollaudo,
    chartLoad,
    chartUnload,
    chartAll: [...chartExercise, ...chartCollaudo, ...chartUnload],
    pressureReferenceLoadKn: referenceLoadKn,
    fixedJackTon: FIXED_JACK_TON,
    fixedPressureBar: FIXED_PRESSURE_BAR,
    formula: "Pressione [bar] = carico del gradino [kN] × 700 bar / 294,30 kN. Il martinetto è fisso a 30 tonnellate e il manometro è fisso a 700 bar.",
  };
}

export function validateTest({ data, result, photo }) {
  const errors = [];
  if (!data.pileId) errors.push("Identificativo palo mancante");
  if (!data.designLoadSLE) errors.push("Carico di esercizio/SLE mancante");
  if (result.measuredCount === 0) errors.push("Inserire almeno una lettura dei comparatori");
  if (!photo) errors.push("Foto/schema della prova mancante");
  if (!data.tecnico) errors.push("Tecnico esecutore mancante");
  return errors;
}
