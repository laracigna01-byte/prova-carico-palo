import { jsPDF } from "jspdf";
import { fmt, safeText, cleanFileName } from "../utils/formatters";
import { NORME } from "../config/testConfig";

async function imageToDataUrl(src) {
  const res = await fetch(src);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function imageType(dataUrl) {
  return dataUrl?.startsWith("data:image/png") ? "PNG" : "JPEG";
}

function addWrapped(pdf, text, x, y, maxWidth, lineHeight = 2.7) {
  const lines = pdf.splitTextToSize(safeText(text, ""), maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function isIos() {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  if (isIos()) {
    window.open(url, "_blank");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawSection(pdf, x, y, w, title) {
  pdf.setFillColor(232, 235, 239);
  pdf.rect(x, y, w, 4.6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  pdf.setTextColor(20, 20, 20);
  pdf.text(title, x + 1.4, y + 3.1);
  return y + 5.5;
}

function drawCompactCell(pdf, x, y, w, h, label, value) {
  pdf.setDrawColor(185, 185, 185);
  pdf.rect(x, y, w, h);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(4.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(label, x + 0.8, y + 1.8, { maxWidth: w - 1.6 });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.8);
  pdf.setTextColor(10, 10, 10);
  pdf.text(safeText(value, "—"), x + 0.8, y + 4.4, { maxWidth: w - 1.6 });
}

function pdfLoadKn(value) {
  const n = Number(String(value ?? "").replace(",", "."));
  return value !== "" && value != null && Number.isFinite(n)
    ? n.toFixed(2).replace(".", ",") + " kN"
    : "—";
}

function addContainedImage(pdf, dataUrl, type, boxX, boxY, boxW, boxH) {
  const props = pdf.getImageProperties(dataUrl);
  const imgRatio = props.width / props.height;
  const boxRatio = boxW / boxH;

  let imgW;
  let imgH;

  if (imgRatio > boxRatio) {
    imgW = boxW;
    imgH = boxW / imgRatio;
  } else {
    imgH = boxH;
    imgW = boxH * imgRatio;
  }

  const imgX = boxX + (boxW - imgW) / 2;
  const imgY = boxY + (boxH - imgH) / 2;

  pdf.addImage(dataUrl, type, imgX, imgY, imgW, imgH);
}

function drawFooter(pdf, ML, PW, PH) {
  pdf.setDrawColor(130, 130, 130);
  pdf.line(ML, PH - 8, PW - ML, PH - 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Minuta di prova - ${NORME.uni} - ${NORME.dm}`, ML, PH - 4);
  pdf.text(`Pagina ${pdf.getCurrentPageInfo().pageNumber}/${pdf.getNumberOfPages()}`, PW - ML, PH - 4, { align: "right" });
}

function drawPdfChart(pdf, rows, x, y, w, h) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, w, h, "F");
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(x, y, w, h);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Curva carico applicato - cedimento", x + 2, y + 4);

  const validPoints = rows
    .filter((r) => Number.isFinite(Number(r.reading)) && Number.isFinite(Number(r.load)))
    .map((r) => ({
      x: Number(r.reading),
      y: Number(r.load),
      label: `${r.cycleLabel || ""} ${r.label || ""}`.trim(),
      isUnload: Boolean(r.unload),
    }));

  const loadPoints = validPoints.filter((p) => !p.isUnload);
  const unloadPoints = validPoints.filter((p) => p.isUnload);
  const allPoints = [...loadPoints, ...unloadPoints];

  if (!allPoints.length) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.text("Grafico disponibile dopo inserimento letture.", x + w / 2, y + h / 2, {
      align: "center",
    });
    return;
  }

  const plotX = x + 13;
  const plotY = y + 11;
  const plotW = w - 22;
  const plotH = h - 20;

  const maxX = Math.max(...allPoints.map((p) => p.x), 1);
  const maxY = Math.max(...allPoints.map((p) => p.y), 1);

  pdf.setDrawColor(80, 80, 80);
  pdf.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
  pdf.line(plotX, plotY, plotX, plotY + plotH);

  pdf.setDrawColor(220, 220, 220);
  for (let i = 1; i <= 4; i++) {
    const gy = plotY + (plotH / 5) * i;
    const gx = plotX + (plotW / 5) * i;
    pdf.line(plotX, gy, plotX + plotW, gy);
    pdf.line(gx, plotY, gx, plotY + plotH);
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.7);
  pdf.setTextColor(70, 70, 70);
  pdf.text("Cedimento [mm]", plotX + plotW / 2, y + h - 3.2, { align: "center" });
  pdf.text("Carico calcolato [kN]", x + 4.4, plotY + plotH / 2, { angle: 90 });

  pdf.setDrawColor(52, 107, 180);
  pdf.setFillColor(52, 107, 180);

  let prev = null;

  loadPoints.forEach((p) => {
    const px = plotX + (p.x / maxX) * plotW;
    const py = plotY + plotH - (p.y / maxY) * plotH;

    if (prev) pdf.line(prev.x, prev.y, px, py);

    pdf.circle(px, py, 1, "F");
    pdf.setFontSize(3.7);
    pdf.text(String(p.label), px + 1.2, py - 1.5);

    prev = { x: px, y: py };
  });

  pdf.setDrawColor(150, 80, 80);
  pdf.setFillColor(150, 80, 80);

  prev = null;
  unloadPoints.forEach((p) => {
    const px = plotX + (p.x / maxX) * plotW;
    const py = plotY + plotH - (p.y / maxY) * plotH;

    if (prev) pdf.line(prev.x, prev.y, px, py);

    pdf.circle(px, py, 1, "F");
    pdf.setFontSize(3.7);
    pdf.text(String(p.label).replace("Scarico ", "S"), px + 1.2, py - 1.5);

    prev = { x: px, y: py };
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.6);
  pdf.setTextColor(52, 107, 180);
  pdf.text("Carico", plotX + plotW - 18, plotY + 4);
  pdf.setTextColor(150, 80, 80);
  pdf.text("Scarico", plotX + plotW - 18, plotY + 8);

  pdf.setFontSize(4.4);
  pdf.setTextColor(80, 80, 80);
  pdf.text("0", plotX - 1.2, plotY + plotH + 2.8, { align: "right" });
  pdf.text(fmt(maxX, 2), plotX + plotW, plotY + plotH + 2.8, { align: "right" });
  pdf.text(fmt(maxY, 1), plotX - 1.2, plotY + 1.2, { align: "right" });
}

function drawPdfChartComparators(pdf, result, x, y, w, h) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, w, h, "F");
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(x, y, w, h);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Curve carico - spostamento medio", x + 2, y + 4);

  const series = [
    { name: "Esercizio", points: result.chartExercise || [], color: [52, 107, 180] },
    { name: "Collaudo", points: result.chartTest || [], color: [46, 160, 67] },
  ];

  const allPoints = series.flatMap((s) => s.points || []).filter(
    (p) => p.x !== null && p.y !== null && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
  );

  if (!allPoints.length) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.text("Grafico disponibile dopo inserimento letture.", x + w / 2, y + h / 2, { align: "center" });
    return;
  }

  const plotX = x + 14;
  const plotY = y + 16;
  const plotW = w - 19;
  const plotH = h - 23;
  const dataMaxX = Math.max(...allPoints.map((p) => Number(p.x)), 1);
  const xStep = dataMaxX <= 5000 ? 1000 : dataMaxX <= 10000 ? 2000 : 5000;
  const maxX = Math.ceil(dataMaxX / xStep) * xStep;
  const maxY = Math.max(...allPoints.map((p) => Number(p.y)), 1);

  pdf.setDrawColor(80, 80, 80);
  pdf.line(plotX, plotY, plotX + plotW, plotY);
  pdf.line(plotX, plotY, plotX, plotY + plotH);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.3);
  for (let i = 0; i <= 5; i++) {
    const gy = plotY + (plotH / 5) * i;
    pdf.setDrawColor(220, 220, 220);
    if (i > 0) {
      pdf.line(plotX, gy, plotX + plotW, gy);
    }
    pdf.setTextColor(70, 70, 70);
    pdf.text(fmt((maxY / 5) * i, 2), plotX - 1.5, gy + 0.8, { align: "right" });
  }

  for (let i = 0; i <= Math.round(maxX / xStep); i++) {
    const gx = plotX + (i * xStep / maxX) * plotW;
    if (i > 0) {
      pdf.setDrawColor(220, 220, 220);
      pdf.line(gx, plotY, gx, plotY + plotH);
    }
    pdf.setTextColor(70, 70, 70);
    pdf.text(fmt(i * xStep, 0), gx, plotY - 1.2, { align: "center" });
  }

  pdf.setFontSize(4.7);
  pdf.text("Carico [daN]", plotX + plotW / 2, y + 8.4, { align: "center" });
  pdf.text("Spostamento [mm]", x + 3.8, plotY + plotH / 2, { angle: 90 });

  function px(p) { return plotX + (Number(p.x) / maxX) * plotW; }
  function py(p) { return plotY + (Number(p.y) / maxY) * plotH; }

  series.forEach((serie, index) => {
    const points = (serie.points || []).filter((p) => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
    pdf.setDrawColor(...serie.color);
    pdf.setFillColor(...serie.color);
    let prev = null;
    points.forEach((p) => {
      const cx = px(p);
      const cy = py(p);
      if (prev) pdf.line(prev.x, prev.y, cx, cy);
      pdf.circle(cx, cy, p.phase === "origine" ? 0.7 : 1, "F");
      prev = { x: cx, y: cy };
    });
    pdf.setFontSize(4.6);
    pdf.setTextColor(...serie.color);
    pdf.text(serie.name, plotX + plotW - 1, plotY + 4 + index * 4, { align: "right" });
  });

}

export async function exportReport({ data, result, photo = null, preview = false }) {
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  const PW = 210;
  const PH = 297;
  const ML = 7;
  const CW = PW - ML * 2;

  const logo = await imageToDataUrl("/logo-dismat.jpg").catch(() => null);

  let y = 7;

  if (logo) pdf.addImage(logo, "JPEG", ML, y, 15, 15);

  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.8);
  pdf.text("L A B O R A T O R I O   D I S M A T", ML + 18, y + 3.7);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  pdf.text("Sperimentazione sulle Strutture e sui Materiali da Costruzione", ML + 18, y + 7);
  pdf.text(`Autorizzato ai sensi dell'art. 20 Legge 1086/71 con ${NORME.dm}`, ML + 18, y + 9.8);
  pdf.text(
    "c/da Andolina S.S. 122 Km 28 92024 CANICATTI' (AG) - info.dismat@gmail.com - www.dismat.it",
    ML + 18,
    y + 12.6
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("MINUTA DI PROVA", PW - ML, y + 4, { align: "right" });

  pdf.setFontSize(7.7);
  pdf.text("PROVA DI CARICO STATICA ASSIALE SU PALO", PW - ML, y + 8.5, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5);
  pdf.text(`${NORME.uni} - ${NORME.dm}`, PW - ML, y + 12.2, { align: "right" });

  pdf.setDrawColor(50, 50, 50);
  pdf.line(ML, y + 17.5, PW - ML, y + 17.5);

  y += 20.5;


  // Pagina 1: dati e tabella a tutta larghezza, senza grafico/fotografie.
  const leftX = ML;
  const leftW = CW;
  let ly = y;
  const h = 8;
  const w3 = leftW / 3;
  const w4 = leftW / 4;

  ly = drawSection(pdf, leftX, ly, leftW, "DATI GENERALI");
  drawCompactCell(pdf, leftX, ly, w4, h, "Data inizio", data.dataInizio);
  drawCompactCell(pdf, leftX + w4, ly, w4, h, "Ora inizio", data.oraInizio);
  drawCompactCell(pdf, leftX + 2 * w4, ly, w4, h, "Data fine", data.dataFine);
  drawCompactCell(pdf, leftX + 3 * w4, ly, w4, h, "Ora fine", data.oraFine);
  ly += h;
  drawCompactCell(pdf, leftX, ly, w3, h, "Committente", data.committente);
  drawCompactCell(pdf, leftX + w3, ly, w3, h, "Cantiere", data.cantiere);
  drawCompactCell(pdf, leftX + 2 * w3, ly, w3, h, "Località", data.localita);
  ly += h;
  drawCompactCell(pdf, leftX, ly, w3, h, "Direzione lavori", data.direzioneLavori);
  drawCompactCell(pdf, leftX + w3, ly, w3, h, "Impresa", data.impresa);
  drawCompactCell(pdf, leftX + 2 * w3, ly, w3, h, "Riferimento prova", data.reportId || data.pileId);
  ly += h + 2;

  ly = drawSection(pdf, leftX, ly, leftW, "DATI DEL PALO");
  drawCompactCell(pdf, leftX, ly, w4, h, "Identificativo palo", data.pileId);
  drawCompactCell(pdf, leftX + w4, ly, w4, h, "Lunghezza", safeText(data.length, "—") + " m");
  drawCompactCell(pdf, leftX + 2 * w4, ly, w4, h, "Carico esercizio", pdfLoadKn(data.exerciseLoad || result.baseLoad));
  drawCompactCell(pdf, leftX + 3 * w4, ly, w4, h, "Collaudo 150%", pdfLoadKn(data.testLoad || result.maxTestLoad));
  ly += h;
  drawCompactCell(pdf, leftX, ly, w4, h, "Diametro", safeText(data.diameter, "—") + " mm");
  drawCompactCell(pdf, leftX + w4, ly, w4, h, "ID martinetto", data.jackId);
  drawCompactCell(pdf, leftX + 2 * w4, ly, w4, h, "Portata martinetto", safeText(data.jackCapacityTon, "—") + " t");
  drawCompactCell(pdf, leftX + 3 * w4, ly, w4, h, "Manometro/cella", data.manometerId);
  ly += h;
  drawCompactCell(pdf, leftX, ly, w3, h, "Comparatori", data.comparatorId);
  drawCompactCell(pdf, leftX + w3, ly, w3, h, "Rif. calcolo", safeText(result.pressureReferenceLoadKn, "—") + " kN / 700 bar");
  drawCompactCell(pdf, leftX + 2 * w3, ly, w3, h, "Conversione", "1 t = " + safeText(data.tonToKn, "9,81") + " kN");
  ly += h + 2;

  ly = drawSection(pdf, leftX, ly, leftW, "TABELLA DI PROVA - LETTURE DEI TRE COMPARATORI");
  const colW = [8, 31, 23, 22, 21, 19, 19, 19, 34];
  const headers = ["N", "Ciclo", "% / attesa", "Press. bar", "Carico kN", "C1 mm", "C2 mm", "C3 mm", "Ced. medio mm"];
  const headerH = 7;
  const rowH = 5;
  const rows = result.rows || [];

  pdf.setFillColor(239, 242, 245);
  pdf.rect(leftX, ly, leftW, headerH, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.3);
  pdf.setTextColor(20, 20, 20);
  let tx = leftX;
  headers.forEach((head, i) => {
    pdf.text(head, tx + 1, ly + 4.5, { maxWidth: colW[i] - 2 });
    tx += colW[i];
  });
  ly += headerH;

  const val = (v, digits) => v == null || v === "" ? "—" : fmt(v, digits);
  rows.forEach((r, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(249, 249, 249);
      pdf.rect(leftX, ly, leftW, rowH, "F");
    }
    pdf.setDrawColor(222, 222, 222);
    pdf.line(leftX, ly + rowH, leftX + leftW, ly + rowH);
    const items = [
      r.stepNo,
      r.cycleLabel,
      (r.unload ? "S" : "") + r.percent + "% " + (r.waitMinutes === 0 ? "iniz." : r.waitMinutes + " min"),
      val(r.pressure, 2),
      val(r.load, 2),
      val(r.comparatorValues?.c1, 3),
      val(r.comparatorValues?.c2, 3),
      val(r.comparatorValues?.c3, 3),
      val(r.reading, 3)
    ];
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.25);
    pdf.setTextColor(20, 20, 20);
    tx = leftX;
    items.forEach((item, i) => {
      pdf.text(String(item), tx + 1, ly + 3.45, { maxWidth: colW[i] - 2 });
      tx += colW[i];
    });
    ly += rowH;
  });

  // Pagina 2: grafico grande, note, firma e prime fotografie.
  pdf.addPage();
  let sy = 11;
  sy = drawSection(pdf, ML, sy, CW, "CURVA CARICO - SPOSTAMENTO MEDIO | " + safeText(data.pileId, "Prova palo"));
  drawPdfChartComparators(pdf, result, ML + 2, sy + 1, CW - 4, 113);
  sy += 117;
  sy = drawSection(pdf, ML, sy, CW, "NOTE TECNICHE");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.2);
  pdf.setTextColor(20, 20, 20);
  sy = addWrapped(pdf, data.note || "Nessuna nota inserita.", ML + 2, sy + 1, CW - 4, 4.1) + 4;
  sy = drawSection(pdf, ML, sy, CW, "DOCUMENTAZIONE FOTOGRAFICA");

  const photos = (Array.isArray(photo) ? photo : photo?.dataUrl ? [photo] : []).filter((p) => p?.dataUrl).slice(0, 10);
  const drawPhotoBox = (item, index, x, top, width, height) => {
    pdf.setDrawColor(185, 185, 185);
    pdf.rect(x, top, width, height);
    if (item) {
      try {
        addContainedImage(pdf, item.dataUrl, imageType(item.dataUrl), x + 2, top + 2, width - 4, height - 12);
      } catch {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.text("Fotografia non leggibile", x + 3, top + 10);
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("Foto " + (index + 1), x + 3, top + height - 4);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("Nessuna fotografia inserita", x + 3, top + 10);
    }
  };

  const margin = 10;
  const gap = 6;
  const boxW = (PW - margin * 2 - gap) / 2;
  const initialHeight = Math.max(42, Math.min(66, 278 - sy));
  drawPhotoBox(photos[0] || null, 0, margin, sy, boxW, initialHeight);
  if (photos.length > 1) drawPhotoBox(photos[1], 1, margin + boxW + gap, sy, boxW, initialHeight);
  const rest = photos.slice(2);
  for (let offset = 0; offset < rest.length; offset += 6) {
    pdf.addPage();
    let top = drawSection(pdf, ML, 11, CW, "DOCUMENTAZIONE FOTOGRAFICA - " + safeText(data.pileId, "Prova palo"));
    rest.slice(offset, offset + 6).forEach((item, j) => {
      const x = margin + (j % 2) * (boxW + gap);
      const py = top + Math.floor(j / 2) * 83;
      drawPhotoBox(item, offset + j + 2, x, py, boxW, 76);
    });
  }
  pdf.addPage();
  let fy = drawSection(pdf, ML, 13, CW, "FIRMA TECNICO INCARICATO");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Tecnico incaricato: " + safeText(data.tecnico, "—"), ML + 2, fy + 6);
  if (data.signature) {
    pdf.addImage(data.signature, "PNG", ML + 2, fy + 9, 65, 24);
  } else {
    pdf.line(ML + 2, fy + 28, ML + 91, fy + 28);
  }
  pdf.text("Firma", ML + 2, fy + 36);

  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page);
    drawFooter(pdf, ML, PW, PH);
  }

  const name = cleanFileName(`Minuta_prova_palo_${data.pileId || data.reportId || "report"}.pdf`);
  const blob = pdf.output("blob");

  if (preview) {
    window.open(URL.createObjectURL(blob), "_blank");
  } else {
    downloadBlob(blob, name);
  }
}