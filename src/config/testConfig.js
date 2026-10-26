export const LOAD_STEPS = [
  { key: "e0", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "0% · 0 min", percent: 0, factor: 0, phase: "carico", waitMinutes: 0 },
  { key: "e25a", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "25% · 5 min", percent: 25, factor: 0.25, phase: "carico", waitMinutes: 5 },
  { key: "e25b", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "25% · 10 min", percent: 25, factor: 0.25, phase: "carico", waitMinutes: 10 },
  { key: "e50a", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "50% · 5 min", percent: 50, factor: 0.5, phase: "carico", waitMinutes: 5 },
  { key: "e50b", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "50% · 10 min", percent: 50, factor: 0.5, phase: "carico", waitMinutes: 10 },
  { key: "e75a", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "75% · 5 min", percent: 75, factor: 0.75, phase: "carico", waitMinutes: 5 },
  { key: "e75b", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "75% · 10 min", percent: 75, factor: 0.75, phase: "carico", waitMinutes: 10 },
  { key: "e100a", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "100% · 5 min", percent: 100, factor: 1, phase: "carico", waitMinutes: 5 },
  { key: "e100b", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "100% · 10 min", percent: 100, factor: 1, phase: "carico", waitMinutes: 10, isExerciseMax: true },
  { key: "se50a", cycle: "scarico_esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 50% · 5 min", percent: 50, factor: 0.5, phase: "scarico", waitMinutes: 5, unload: true },
  { key: "se50b", cycle: "scarico_esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 50% · 5 min", percent: 50, factor: 0.5, phase: "scarico", waitMinutes: 5, unload: true },
  { key: "se0a", cycle: "scarico_esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 0% · 5 min", percent: 0, factor: 0, phase: "scarico", waitMinutes: 5, unload: true },
  { key: "se0b", cycle: "scarico_esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 0% · 5 min", percent: 0, factor: 0, phase: "scarico", waitMinutes: 5, unload: true, isExerciseResidual: true },
  { key: "c25a", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "25% · 5 min", percent: 25, factor: 0.25, phase: "carico", waitMinutes: 5 },
  { key: "c25b", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "25% · 10 min", percent: 25, factor: 0.25, phase: "carico", waitMinutes: 10 },
  { key: "c50a", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "50% · 5 min", percent: 50, factor: 0.5, phase: "carico", waitMinutes: 5 },
  { key: "c50b", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "50% · 10 min", percent: 50, factor: 0.5, phase: "carico", waitMinutes: 10 },
  { key: "c75a", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "75% · 5 min", percent: 75, factor: 0.75, phase: "carico", waitMinutes: 5 },
  { key: "c75b", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "75% · 10 min", percent: 75, factor: 0.75, phase: "carico", waitMinutes: 10 },
  { key: "c100a", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "100% · 5 min", percent: 100, factor: 1, phase: "carico", waitMinutes: 5 },
  { key: "c100b", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "100% · 10 min", percent: 100, factor: 1, phase: "carico", waitMinutes: 10 },
  { key: "c125a", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "125% · 5 min", percent: 125, factor: 1.25, phase: "carico", waitMinutes: 5 },
  { key: "c125b", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "125% · 10 min", percent: 125, factor: 1.25, phase: "carico", waitMinutes: 10 },
  { key: "c150a", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "150% · 10 min", percent: 150, factor: 1.5, phase: "carico", waitMinutes: 10 },
  { key: "c150b", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "150% · 10 min", percent: 150, factor: 1.5, phase: "carico", waitMinutes: 10, isMax: true },
  { key: "sc100a", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 100% · 5 min", percent: 100, factor: 1, phase: "scarico", waitMinutes: 5, unload: true },
  { key: "sc100b", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 100% · 10 min", percent: 100, factor: 1, phase: "scarico", waitMinutes: 10, unload: true },
  { key: "sc50a", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 50% · 5 min", percent: 50, factor: 0.5, phase: "scarico", waitMinutes: 5, unload: true },
  { key: "sc50b", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 50% · 10 min", percent: 50, factor: 0.5, phase: "scarico", waitMinutes: 10, unload: true },
  { key: "sc0a", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 0% · 5 min", percent: 0, factor: 0, phase: "scarico", waitMinutes: 5, unload: true },
  { key: "sc0b", cycle: "scarico_collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 0% · 10 min", percent: 0, factor: 0, phase: "scarico", waitMinutes: 10, unload: true, isResidual: true }
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
