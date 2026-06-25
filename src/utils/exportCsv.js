import { fmt, safeText } from "./formatters";
import { NORME } from "../config/testConfig";

function csvCell(value) {
  const text = safeText(value, "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportCsv({ data, result }) {
  const rows = [
    ["PROVA DI CARICO STATICA ASSIALE SU PALO"],
    ["Norma", NORME.uni, "D.M.", NORME.dm],
    ["Rapporto", data.reportId, "Palo", data.pileId],
    ["Data inizio", data.dataInizio, "Ora inizio", data.oraInizio, "Data fine", data.dataFine, "Ora fine", data.oraFine],
    ["Committente", data.committente, "Cantiere", data.cantiere, "Localita", data.localita],
    ["Ne kN", data.designLoadSLE, "Nc kN", data.testLoad, "Lunghezza m", data.length, "Coeff. taratura kN/bar", data.calibrationCoeff],
    [],
    ["N", "Ciclo", "Percentuale", "Pressione bar", "Carico calcolato kN", "Carico teorico riferimento kN", "Cedimento medio mm", "Comparatore 1", "Comparatore 2", "Comparatore 3"],
    ...result.rows.map((r) => [r.stepNo, r.cycleLabel, r.label, fmt(r.pressure, 2), fmt(r.load, 2), fmt(r.targetLoad, 2), fmt(r.reading, 3), fmt(r.readings?.c1, 3), fmt(r.readings?.c2, 3), fmt(r.readings?.c3, 3)]),
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
