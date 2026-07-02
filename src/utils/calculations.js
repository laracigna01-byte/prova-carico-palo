import { toNumber, round } from "./formatters";

const COMPARATORS = ["c1", "c2", "c3"];
const READINGS_PER_COMPARATOR = 9;
const DEFAULT_TON_TO_KN = 9.81;
const DEFAULT_PRESSURE_BAR = 700;

const emptyReadings = () => Array(READINGS_PER_COMPARATOR).fill("");

function normalizeComparatorList(value) {
  if (Array.isArray(value)) {
    return Array.from({ length: READINGS_PER_COMPARATOR }, (_, i) => value[i] ?? "");
  }

  if (value === null || value === undefined || value === "") {
    return emptyReadings();
  }

  return [value, ...Array(READINGS_PER_COMPARATOR - 1).fill("")];
}

function normalizeReadings(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      COMPARATORS.map((key) => [key, normalizeComparatorList(value[key])])
    );
  }

  return {
    c1: normalizeComparatorList(value),
    c2: emptyReadings(),
    c3: emptyReadings(),
  };
}

function calcComparator(values) {
  const list = normalizeComparatorList(values);

  const nums = list
    .map((v) => toNumber(v, null))
    .filter((v) => v !== null);

  const firstThree = nums.slice(0, 3);

  const stable =
    firstThree.length === 3 &&
    Math.max(...firstThree) - Math.min(...firstThree) <= 0.02;

  return {
  values: list,
  count: nums.length,
  stable,
  value: stable
    ? round(firstThree.reduce((sum, v) => sum + v, 0) / 3, 3)
    : null,
};
}

function calcStepStats(readings) {
  const comparatorStats = Object.fromEntries(
    COMPARATORS.map((key) => [key, calcComparator(readings[key])])
  );

  const comparatorValues = Object.fromEntries(
    COMPARATORS.map((key) => [key, comparatorStats[key].value])
  );

  const validValues = COMPARATORS
    .map((key) => comparatorStats[key].value)
    .filter((v) => v !== null);

  const mean = validValues.length
    ? round(validValues.reduce((sum, v) => sum + v, 0) / validValues.length, 3)
    : null;

  const max = validValues.length ? round(Math.max(...validValues), 3) : null;
  const min = validValues.length ? round(Math.min(...validValues), 3) : null;

  return {
    comparatorStats,
    comparatorValues,
    mean,
    max,
    min,
    delta: max !== null && min !== null ? round(max - min, 3) : null,
    measuredCount: COMPARATORS.reduce((sum, key) => sum + comparatorStats[key].count, 0),
    stableComparators: COMPARATORS.filter((key) => comparatorStats[key].stable).length,
  };
}

function resolveBaseLoad(exerciseLoad, testLoad) {
  const ne = toNumber(exerciseLoad, 0);
  const nc = toNumber(testLoad, 0);

  if (ne > 0) return ne;
  if (nc > 0) return round(nc / 1.5, 2);
  return 0;
}

export function buildRows({
  readings,
  loadSteps,
  exerciseLoad,
  testLoad,
  jackCapacityTon,
  pressureReferenceBar = DEFAULT_PRESSURE_BAR,
  tonToKn = DEFAULT_TON_TO_KN,
}) {
  const baseLoad = resolveBaseLoad(exerciseLoad, testLoad);
  const jackCapacityKn = round(toNumber(jackCapacityTon, 30) * toNumber(tonToKn, DEFAULT_TON_TO_KN), 2);
  const referenceBar = toNumber(pressureReferenceBar, DEFAULT_PRESSURE_BAR);

  return loadSteps.map((step, index) => {
    const stepReadings = normalizeReadings(readings?.[step.key]);
    const s = calcStepStats(stepReadings);

    const targetLoad = round(baseLoad * step.factor, 2);
    const pressure =
      jackCapacityKn > 0
        ? round((targetLoad * referenceBar) / jackCapacityKn, 2)
        : null;

    return {
      ...step,
      stepNo: index + 1,
      readings: stepReadings,
      comparatorStats: s.comparatorStats,
      comparatorValues: s.comparatorValues,
      reading: s.mean,
      meanSettlement: s.mean,
      maxSettlement: s.max,
      minSettlement: s.min,
      comparatorDelta: s.delta,
      measuredCount: s.measuredCount,
      stableComparators: s.stableComparators,
      targetLoad,
      pressure,
      measuredLoad: targetLoad,
      load: targetLoad,
    };
  });
}

export function calcPalo({
  readings,
  loadSteps,
  exerciseLoad,
  testLoad,
  jackCapacityTon,
  pressureReferenceBar,
  tonToKn,
}) {
  const baseLoad = resolveBaseLoad(exerciseLoad, testLoad);
  const maxTestLoad = round(baseLoad * 1.5, 2);
  const jackCapacityKn = round(toNumber(jackCapacityTon, 30) * toNumber(tonToKn, DEFAULT_TON_TO_KN), 2);
  const referenceBar = toNumber(pressureReferenceBar, DEFAULT_PRESSURE_BAR);

  const rows = buildRows({
    readings,
    loadSteps,
    exerciseLoad,
    testLoad,
    jackCapacityTon,
    pressureReferenceBar: referenceBar,
    tonToKn,
  });

  const max = rows.find((r) => r.isMax) || null;
  const exerciseMax = rows.find((r) => r.isExerciseMax) || null;
  const unload = rows.find((r) => r.isResidual) || rows.filter((r) => r.unload).at(-1) || null;
  const exerciseResidual = rows.find((r) => r.isExerciseResidual) || null;

  const measuredCount = rows.filter((r) => r.reading !== null).length;
  const maxDisplacement = max?.meanSettlement ?? null;
  const exerciseDisplacement = exerciseMax?.meanSettlement ?? null;
  const residual = unload?.meanSettlement ?? null;
  const elasticRecovery =
    maxDisplacement !== null && residual !== null
      ? round(maxDisplacement - residual, 3)
      : null;

  const chartPoint = (r, comparatorKey, comparatorLabel) => ({
    x: r.comparatorValues?.[comparatorKey],
    y: r.load,
    pressure: r.pressure,
    targetLoad: r.targetLoad,
    name: `${comparatorLabel} - ${r.cycleLabel} ${r.label}`,
    phase: r.phase,
    unload: r.unload,
    cycle: r.cycle,
    comparator: comparatorKey,
  });

  const buildComparatorSeries = (comparatorKey, comparatorLabel) => {
    const points = rows
      .filter((r) => r.comparatorValues?.[comparatorKey] !== null && Number.isFinite(Number(r.load)))
      .map((r) => chartPoint(r, comparatorKey, comparatorLabel));

    return points.length
      ? [
          {
            x: 0,
            y: 0,
            pressure: 0,
            targetLoad: 0,
            name: `${comparatorLabel} - Origine`,
            phase: "origine",
            unload: false,
            cycle: "origine",
            comparator: comparatorKey,
          },
          ...points,
        ]
      : [];
  };

  const chartC1 = buildComparatorSeries("c1", "Comparatore 1");
  const chartC2 = buildComparatorSeries("c2", "Comparatore 2");
  const chartC3 = buildComparatorSeries("c3", "Comparatore 3");

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
    chartC1,
    chartC2,
    chartC3,
    chartAll: [...chartC1, ...chartC2, ...chartC3],
    pressureReferenceLoadKn: jackCapacityKn,
    jackCapacityTon: toNumber(jackCapacityTon, 30),
    fixedPressureBar: referenceBar,
    formula:
      "Pressione [bar] = carico del gradino [kN] × 700 bar / portata del martinetto [kN].",
    baseLoad,
    maxTestLoad,
    exceedsJackCapacity: maxTestLoad > jackCapacityKn,
  };
}

export function validateTest({ data, result, photo }) {
  const errors = [];

  if (!data.pileId) errors.push("Identificativo palo mancante");
  if (!data.exerciseLoad && !data.testLoad) errors.push("Carico di esercizio o carico massimo di collaudo mancante");
  if (!data.jackCapacityTon || Number(data.jackCapacityTon) <= 0) errors.push("Portata martinetto mancante");
  if (result.exceedsJackCapacity) errors.push("Il carico massimo supera la portata nominale del martinetto");
  if (result.measuredCount === 0) errors.push("Inserire almeno una lettura dei comparatori");
  if (!photo) errors.push("Foto/schema della prova mancante");
  if (!data.tecnico) errors.push("Tecnico esecutore mancante");

  return errors;
}