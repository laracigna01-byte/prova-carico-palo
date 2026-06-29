export function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

export function fmt(value, digits = 2, dash = "—") {
  if (value === null || value === undefined || value === "" || Number.isNaN(value)) return dash;
  if (typeof value === "number") return value.toLocaleString("it-IT", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return String(value);
}

export function safeText(value, dash = "—") {
  return value === null || value === undefined || value === "" ? dash : String(value);
}

export function cleanFileName(value) {
  return String(value || "report").replace(/[^a-z0-9_.-]/gi, "_");
}
