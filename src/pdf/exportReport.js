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
  pdf.text(label, x + 1, y + 2.3);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.4);
  pdf.setTextColor(10, 10, 10);
  pdf.text(safeText(value, "—"), x + 1, y + 5.1, { maxWidth: w - 2 });
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
  pdf.text("Pagina 1/1", PW - ML, PH - 4, { align: "right" });
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

  const leftX = ML;
  const leftW = 116;
  const rightX = ML + leftW + 5;
  const rightW = CW - leftW - 5;

  let ly = y;
  let ry = y;

  const h = 6.2;
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
  drawCompactCell(pdf, leftX + w4, ly, w4, h, "Lunghezza", `${safeText(data.length, "—")} m`);
  drawCompactCell(pdf, leftX + 2 * w4, ly, w4, h, "Carico esercizio Ne", `${safeText(data.designLoadSLE, "—")} kN`);
  drawCompactCell(pdf, leftX + 3 * w4, ly, w4, h, "Coeff. prova", `${safeText(data.testFactor || "1.20", "—")}`);
  ly += h;

  drawCompactCell(pdf, leftX, ly, w4, h, "Carico massimo prova", `${safeText(data.testLoad, "—")} kN`);
  drawCompactCell(pdf, leftX + w4, ly, w4, h, "Martinetto", data.jackId);
  drawCompactCell(pdf, leftX + 2 * w4, ly, w4, h, "Manometro/cella", data.manometerId);
  drawCompactCell(pdf, leftX + 3 * w4, ly, w4, h, "Comparatori", data.comparatorId);
  ly += h;

  drawCompactCell(pdf, leftX, ly, w3, h, "Coeff. taratura", `${safeText(data.calibrationCoeff, "—")} kN/bar`);
  drawCompactCell(pdf, leftX + w3, ly, w3 * 2, h, "Formula carico applicato", "kN = bar x coeff. taratura");
  ly += h + 2;

  ly = drawSection(pdf, leftX, ly, leftW, "TABELLA DI PROVA");

  const colW = [8, 20, 13, 18, 19, 20, 18];
  const headerH = 5.4;
  const rows = result.rows || [];
  const rowH = 5.2;

  pdf.setFillColor(245, 245, 245);
  pdf.rect(leftX, ly, leftW, headerH, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.3);
  pdf.setTextColor(20, 20, 20);

  let tx = leftX;
  ["N", "Ciclo", "%", "Press. [bar]", "Calc. [kN]", "Teor. rif. [kN]", "Ced. medio"].forEach((head, i) => {
    pdf.text(head, tx + 1.1, ly + 3.7);
    tx += colW[i];
  });

  ly += headerH;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.4);

  rows.forEach((r) => {
    pdf.setDrawColor(215, 215, 215);
    pdf.rect(leftX, ly, leftW, rowH);

    tx = leftX;
    [r.stepNo, r.cycleLabel, r.label, fmt(r.pressure, 2), fmt(r.load, 2), fmt(r.targetLoad, 2), fmt(r.reading, 3)].forEach((value, i) => {
      pdf.text(String(value), tx + 1.1, ly + 3.5, { maxWidth: colW[i] - 2.2 });
      tx += colW[i];
    });

    ly += rowH;
  });

  ry = drawSection(pdf, rightX, ry, rightW, "DOCUMENTAZIONE FOTOGRAFICA");

  const photoH = 72;
  pdf.setDrawColor(185, 185, 185);
  pdf.rect(rightX, ry, rightW, photoH);

  if (photo?.dataUrl) {
    try {
      addContainedImage(
        pdf,
        photo.dataUrl,
        imageType(photo.dataUrl),
        rightX + 2,
        ry + 2,
        rightW - 4,
        photoH - 9
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.3);
      pdf.setTextColor(70, 70, 70);
      pdf.text(safeText(data.photoCaption || "Foto prova"), rightX + 2, ry + photoH - 3, {
        maxWidth: rightW - 4,
      });
    } catch {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text("Foto non leggibile", rightX + rightW / 2, ry + photoH / 2, { align: "center" });
    }
  } else {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.text("Box foto prova", rightX + rightW / 2, ry + photoH / 2, { align: "center" });
  }

  ry += photoH + 3;

  const chartY = Math.max(ly, ry) + 4;

  drawSection(pdf, ML, chartY, CW, "CURVA CARICO CALCOLATO - SPOSTAMENTO");

  const chartH = 66;
  drawPdfChart(pdf, rows, ML, chartY + 5.5, CW, chartH);

  const bottomY = chartY + 5.5 + chartH + 4;

  const esitoW = 66;
  const firmaW = CW - esitoW - 5;
  const firmaX = ML + esitoW + 5;

  let ey = drawSection(pdf, ML, bottomY, esitoW, "ESITO DELLA PROVA");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);

  const outcome = safeText(data.outcome, "Non dichiarato").toUpperCase();

  if (outcome.includes("POSITIVO")) {
    pdf.setTextColor(0, 120, 0);
  } else if (outcome.includes("NEGATIVO")) {
    pdf.setTextColor(180, 0, 0);
  } else {
    pdf.setTextColor(0, 0, 0);
  }

  pdf.text(outcome, ML + 2, ey + 5);

  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  addWrapped(
    pdf,
    data.outcomeNotes || "Nessuna osservazione sull'esito.",
    ML + 2,
    ey + 9.5,
    esitoW - 4,
    2.5
  );

  let fy = drawSection(pdf, firmaX, bottomY, firmaW, "FIRMA TECNICO INCARICATO");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  pdf.text(`Tecnico incaricato: ${safeText(data.tecnico, "—")}`, firmaX + 2, fy + 4.2);

  if (data.signature) {
    pdf.addImage(data.signature, "PNG", firmaX + 2, fy + 5.8, Math.min(62, firmaW - 4), 16);
    pdf.text("Firma", firmaX + 2, fy + 24.5);
  } else {
    pdf.line(firmaX + 2, fy + 19, firmaX + firmaW - 4, fy + 19);
    pdf.text("Firma", firmaX + 2, fy + 23);
  }

  const noteY = bottomY + 32;

  const noteStartY = drawSection(pdf, ML, noteY, CW, "NOTE TECNICHE E RIFERIMENTI");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.2);
  pdf.setTextColor(0, 0, 0);

  let ny = addWrapped(pdf, data.note || "Nessuna nota inserita.", ML + 2, noteStartY, CW - 4, 2.4);
  ny = addWrapped(pdf, "Pressione bar inserita dal tecnico dalla lettura del manometro. Carico applicato [kN] = pressione [bar] x coefficiente di taratura [kN/bar] del martinetto.", ML + 2, ny + 1.2, CW - 4, 2.4);
  ny += 1.2;

  pdf.setFont("helvetica", "bold");
  pdf.text("Riferimenti normativi:", ML + 2, ny);
  ny += 2.7;

  pdf.setFont("helvetica", "normal");
  pdf.text(`${NORME.uni}`, ML + 2, ny, { maxWidth: CW - 4 });
  ny += 2.7;

  pdf.text(`${NORME.dm}`, ML + 2, ny, { maxWidth: CW - 4 });
  ny += 2.7;

  pdf.text("D.M. 17/01/2018 (NTC 2018)", ML + 2, ny, { maxWidth: CW - 4 });
  ny += 2.7;

  pdf.text("Circolare C.S.LL.PP. n. 7/2019", ML + 2, ny, { maxWidth: CW - 4 });
  ny += 3.2;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(4.8);
  addWrapped(pdf, NORME.dichiarazione, ML + 2, ny, CW - 4, 2.2);

  drawFooter(pdf, ML, PW, PH);

  const name = cleanFileName(`Minuta_prova_palo_${data.pileId || data.reportId || "report"}.pdf`);
  const blob = pdf.output("blob");

  if (preview) {
    window.open(URL.createObjectURL(blob), "_blank");
  } else {
    downloadBlob(blob, name);
  }
}