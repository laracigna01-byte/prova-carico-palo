import { fmt, safeText } from "./formatters";
import { NORME } from "../config/testConfig";

function csvCell(value) {
  const text = safeText(value, "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function joinReadings(values = []) {
  return Array.isArray(values) ? values.map((v) => safeText(v, "")).join(" | ") : safeText(values, "");
}

export function exportCsv({ data, result }) {
  const rows = [
    ["PROVA DI CARICO STATICA ASSIALE SU PALO"],
    ["Norma", NORME.uni, "D.M.", NORME.dm],
    ["Rapporto", data.reportId, "Palo", data.pileId],
    ["Data inizio", data.dataInizio, "Ora inizio", data.oraInizio, "Data fine", data.dataFine, "Ora fine", data.oraFine],
    ["Committente", data.committente, "Cantiere", data.cantiere, "Localita", data.localita],
    ["Carico esercizio kN", data.exerciseLoad || result.baseLoad, "Carico collaudo 150% kN", data.testLoad || result.maxTestLoad, "Portata martinetto t", data.jackCapacityTon, "Rif. kN", fmt(result.pressureReferenceLoadKn, 2), "Manometro", "700 bar"],
    [],
    ["N", "Ciclo", "Percentuale", "Pressione bar", "Carico step kN", "Rif. martinetto kN", "C1 mm", "C2 mm", "C3 mm", "Cedimento medio mm", "Letture C1", "Letture C2", "Letture C3"],
    ...result.rows.map((r) => [
      r.stepNo,
      r.cycleLabel,
      r.label,
      fmt(r.pressure, 2),
      fmt(r.load, 2),
      fmt(result.pressureReferenceLoadKn, 2),
      fmt(r.comparatorValues?.c1, 3),
      fmt(r.comparatorValues?.c2, 3),
      fmt(r.comparatorValues?.c3, 3),
      fmt(r.reading, 3),
      joinReadings(r.readings?.c1),
      joinReadings(r.readings?.c2),
      joinReadings(r.readings?.c3),
    ]),
    [],
    ["Esito", data.outcome],
    ["Osservazioni", data.outcomeNotes],
    ["Note tecniche", data.note]
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Prova_carico_su_palo_${data.pileId || data.reportId || "report"}.csv`.replace(/[^a-z0-9_.-]/gi, "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
