export const LOAD_STEPS = [
  { key: "es0", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "0%", percent: 0, factor: 0, phase: "carico" },
  { key: "es25", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "25%", percent: 25, factor: 0.25, phase: "carico" },
  { key: "es50", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "50%", percent: 50, factor: 0.50, phase: "carico" },
  { key: "es75", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "75%", percent: 75, factor: 0.75, phase: "carico" },
  { key: "es100", cycle: "esercizio", cycleLabel: "Carico di esercizio", label: "100%", percent: 100, factor: 1.00, phase: "carico", isExerciseMax: true },
  { key: "esu50", cycle: "esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 50%", percent: 50, factor: 0.50, phase: "scarico", unload: true },
  { key: "esu0", cycle: "esercizio", cycleLabel: "Scarico esercizio", label: "Scarico 0%", percent: 0, factor: 0, phase: "scarico", unload: true, isExerciseResidual: true },

  { key: "co0", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "0%", percent: 0, factor: 0, phase: "carico" },
  { key: "co25", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "25%", percent: 25, factor: 0.25, phase: "carico" },
  { key: "co50", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "50%", percent: 50, factor: 0.50, phase: "carico" },
  { key: "co75", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "75%", percent: 75, factor: 0.75, phase: "carico" },
  { key: "co100", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "100%", percent: 100, factor: 1.00, phase: "carico" },
  { key: "co125", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "125%", percent: 125, factor: 1.25, phase: "carico" },
  { key: "co150", cycle: "collaudo", cycleLabel: "Carico di collaudo", label: "150%", percent: 150, factor: 1.50, phase: "carico", isMax: true },
  { key: "cou100", cycle: "collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 100%", percent: 100, factor: 1.00, phase: "scarico", unload: true },
  { key: "cou50", cycle: "collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 50%", percent: 50, factor: 0.50, phase: "scarico", unload: true },
  { key: "cou0", cycle: "collaudo", cycleLabel: "Scarico collaudo", label: "Scarico 0%", percent: 0, factor: 0, phase: "scarico", unload: true, isResidual: true }
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
  pileType: "Trivellato",
  diameter: "",
  length: "",
  quotaTestaPalo: "",
  concreteClass: "",
  reinforcement: "",
  designLoadSLE: "",
  testFactor: 1.50,
  testLoad: "",
  jackId: "",
  manometerId: "",
  loadCellId: "",
  comparatorId: "",
  jackMaxLoad: 30,
  jackMaxLoadUnit: "ton",
  tonToKn: 9.81,
  pressureReferenceLoad: 294.3,
  pressureReferenceBar: 700,
  calibrationCoeff: "",
  reactionSystem: "Trave di contrasto / zavorra",
  comparatorCount: 3,
  note: "",
  photoCaption: "Foto della prova di carico statica assiale su palo",
  outcome: "Positivo",
  outcomeNotes: "",
  signature: ""
};

const emptyComparators = () => ({ c1: "", c2: "", c3: "" });
export const initialReadings = () => Object.fromEntries(LOAD_STEPS.map((s) => [s.key, emptyComparators()]));
export const initialPressures = () => Object.fromEntries(LOAD_STEPS.map((s) => [s.key, ""]));
