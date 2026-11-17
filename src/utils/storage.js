const KEY = "pali_archive_v2";
const LEGACY_KEY = "pali_archive_v1";
const COUNTER = "pali_counter_v1";
const DB_NAME = "prova_carico_pali_db";
const DB_VERSION = 1;
const STORE = "tests";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function stripOutcomeFields(record) {
  if (!record || typeof record !== "object") return record;
  const data = { ...(record.data || {}) };
  delete data.outcome;
  delete data.outcomeNotes;
  return { ...record, data };
}

function stripOutcomeFromList(list) {
  return (list || []).map(stripOutcomeFields);
}

function sortTests(list) {
  return stripOutcomeFromList(list).sort((a, b) => {
    const da = new Date(a?.savedAt || 0).getTime();
    const db = new Date(b?.savedAt || 0).getTime();
    return db - da;
  });
}

function canUseIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDb() {
  if (!canUseIndexedDb()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function idbGetAll() {
  const db = await openDb();
  if (!db) return [];

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(sortTests(request.result || []));
    request.onerror = () => resolve([]);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

async function idbPut(record) {
  const db = await openDb();
  if (!db) return false;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      resolve(false);
    };
  });
}

async function idbDelete(id) {
  const db = await openDb();
  if (!db) return false;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      resolve(false);
    };
  });
}

async function idbWriteAll(list) {
  const db = await openDb();
  if (!db) return false;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    (list || []).forEach((record) => store.put(record));
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      resolve(false);
    };
    tx.onabort = () => resolve(false);
  });
}

function writeLocalSnapshot(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sortTests(list)));
    return true;
  } catch {
    // IndexedDB è la memoria principale quando le foto superano il limite di localStorage.
    return false;
  }
}

export function nextReportId() {
  const year = new Date().getFullYear();
  const raw = localStorage.getItem(COUNTER);
  const state = safeJsonParse(raw, { year, n: 0 });
  const used = new Set(listTests().map((record) => record.id));
  let n = state.year === year ? state.n + 1 : 1;
  while (used.has(`PAL-${year}-${String(n).padStart(3, "0")}`)) n += 1;
  localStorage.setItem(COUNTER, JSON.stringify({ year, n }));
  return `PAL-${year}-${String(n).padStart(3, "0")}`;
}

export function updateReportCounter(records) {
  const year = new Date().getFullYear();
  const state = safeJsonParse(localStorage.getItem(COUNTER), { year, n: 0 });
  let highest = state.year === year ? Number(state.n) || 0 : 0;
  for (const record of records) {
    const match = /^PAL-(\d{4})-(\d+)$/.exec(record.id || "");
    if (match && Number(match[1]) === year) {
      highest = Math.max(highest, Number(match[2]));
    }
  }
  localStorage.setItem(COUNTER, JSON.stringify({ year, n: highest }));
}

export function listTests() {
  const current = safeJsonParse(localStorage.getItem(KEY), null);
  if (Array.isArray(current)) return sortTests(current);

  const legacy = safeJsonParse(localStorage.getItem(LEGACY_KEY), []);
  if (Array.isArray(legacy) && legacy.length) {
    writeLocalSnapshot(legacy);
    idbWriteAll(legacy);
    return sortTests(legacy);
  }

  return [];
}

export async function loadServerTests() {
  const indexed = await idbGetAll();
  if (indexed.length) {
    writeLocalSnapshot(indexed);
    return indexed;
  }

  const local = listTests();
  if (local.length) await idbWriteAll(local);
  return local;
}

export async function syncServerTests(list) {
  const sorted = sortTests(list);
  const savedToDb = await idbWriteAll(sorted);
  const savedLocally = writeLocalSnapshot(sorted);
  if (!savedToDb && !savedLocally) {
    throw new Error("Spazio di archiviazione insufficiente: il backup non è stato salvato.");
  }
  return sorted;
}

export function writeTests(list) {
  const sorted = sortTests(list);
  writeLocalSnapshot(sorted);
  idbWriteAll(sorted);
  return sorted;
}

export function saveTest(record) {
  record = stripOutcomeFields(record);
  const list = listTests();
  const idx = list.findIndex((x) => x.id === record.id);
  const next = idx >= 0 ? list.map((x) => (x.id === record.id ? record : x)) : [record, ...list];
  const sorted = sortTests(next);

  writeLocalSnapshot(sorted);
  idbPut(record);

  return sorted;
}

export function deleteTest(id) {
  const next = listTests().filter((x) => x.id !== id);
  writeLocalSnapshot(next);
  idbDelete(id);
  return next;
}
