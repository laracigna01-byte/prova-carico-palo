const KEY = "pali_archive_v1";
const COUNTER = "pali_counter_v1";

export function nextReportId() {
  const year = new Date().getFullYear();
  const raw = localStorage.getItem(COUNTER);
  const state = raw ? JSON.parse(raw) : { year, n: 0 };
  const n = state.year === year ? state.n + 1 : 1;
  localStorage.setItem(COUNTER, JSON.stringify({ year, n }));
  return `PAL-${year}-${String(n).padStart(3, "0")}`;
}

export function listTests() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveTest(record) {
  const list = listTests();
  const idx = list.findIndex((x) => x.id === record.id);
  const next = idx >= 0 ? list.map((x) => x.id === record.id ? record : x) : [record, ...list];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteTest(id) {
  const next = listTests().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
