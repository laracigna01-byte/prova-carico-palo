export const LOAD_STEPS = [
  { key: "e0", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "0%", percent: 0, factor: 0, phase: "carico" },
  { key: "e25", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "25%", percent: 25, factor: 0.25, phase: "carico" },
  { key: "e50", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "50%", percent: 50, factor: 0.50, phase: "carico" },
  { key: "e75", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "75%", percent: 75, factor: 0.75, phase: "carico" },
  { key: "e100", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "100%", percent: 100, factor: 1.00, phase: "carico", isExerciseMax: true },
  { key: "se50", cycle: "scarico_esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 50%", percent: 50, factor: 0.50, phase: "scarico", unload: true },
  { key: "se0", cycle: "scarico_esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 0%", percent: 0, factor: 0, phase: "scarico", unload: true, isExerciseResidual: true },
  { key: "c0", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "0%", percent: 0, factor: 0, phase: "carico" },
  { key: "c25", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "25%", percent: 25, factor: 0.25, phase: "carico" },
  { key: "c50", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "50%", percent: 50, factor: 0.50, phase: "carico" },
  { key: "c75", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "75%", percent: 75, factor: 0.75, phase: "carico" },
  { key: "c100", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "100%", percent: 100, factor: 1.00, phase: "carico" },
  { key: "c125", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "125%", percent: 125, factor: 1.25, phase: "carico" },
  { key: "c150", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "150%", percent: 150, factor: 1.50, phase: "carico", isMax: true },
  { key: "sc150", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 150%", percent: 150, factor: 1.50, phase: "scarico", unload: true },
  { key: "sc100", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 100%", percent: 100, factor: 1.00, phase: "scarico", unload: true },
  { key: "sc50", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 50%", percent: 50, factor: 0.50, phase: "scarico", unload: true },
  { key: "sc0", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 0%", percent: 0, factor: 0, phase: "scarico", unload: true, isResidual: true }
];

export const NORME = {
  uni: "UNI EN ISO 22477-1 - Prove di carico statico assiale su pali singoli",
  dm: "D.M. 17/01/2018 (NTC 2018) - § 6.4.3.7",
  circolare: "Circolare C.S.LL.PP. n. 7/2019",
  dichiarazione:
    "La prova di carico statica assiale su palo è stata impostata secondo UNI EN ISO 22477-1, D.M. 17/01/2018 (NTC 2018) § 6.4.3.7, Circolare C.S.LL.PP. n. 7/2019 e prescrizioni progettuali/DL. Il software non sostituisce la valutazione del tecnico abilitato."
};

export const DEFAULT_PROJECT = {
  reportId: "",
  dataProva: new Date().toLocaleDateString("it-IT"),
  dataInizio: new Date().toISOString().slice(0, 10),
  oraInizio: "",
  dataFine: new Date().toISOString().slice(0, 10),
  oraFine: "",
  cantiere: "",
  localita: "",
  committente: "",
  direzioneLavori: "",
  impresa: "",
  progettista: "",
  tecnico: "",
  presenti: "",
  pileId: "P-01",
  diameter: "",
  length: "",
  concreteClass: "",
  reinforcement: "",
  exerciseLoad: "",
  testLoad: "",
  jackId: "30",
  jackCapacityTon: 30,
  manometerId: "700",
  loadCellId: "",
  comparatorId: "",
  tonToKn: 9.81,
  pressureReferenceBar: 700,
  reactionSystem: "Trave di contrasto / zavorra",
  comparatorCount: 3,
  note: "",
  photoCaption: "Foto della prova di carico statica assiale su palo",
  outcome: "Positivo",
  outcomeNotes: "",
  signature: ""
};

const emptyComparatorReadings = () => Array(9).fill("");
const emptyComparators = () => ({
  c1: emptyComparatorReadings(),
  c2: emptyComparatorReadings(),
  c3: emptyComparatorReadings(),
});

export const initialReadings = () => Object.fromEntries(LOAD_STEPS.map((s) => [s.key, emptyComparators()]));
export const initialPressures = () => Object.fromEntries(LOAD_STEPS.map((s) => [s.key, ""]));
