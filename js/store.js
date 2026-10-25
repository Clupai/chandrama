// Keeps every phone and screen looking at the same match.
// With Firebase settings in config.js it syncs over the internet;
// without them it runs in demo mode using this browser's storage.
import { FIREBASE_CONFIG } from '../config.js';

export const DEMO = !FIREBASE_CONFIG?.databaseURL;
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

let fb = null;
let offset = 0; // difference between this device's clock and the server's

const ready = (async () => {
  if (DEMO) return;
  const [{ initializeApp }, dbm] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-database.js'),
  ]);
  const db = dbm.getDatabase(initializeApp(FIREBASE_CONFIG));
  dbm.onValue(dbm.ref(db, '.info/serverTimeOffset'), s => { offset = s.val() || 0; });
  fb = { db, ...dbm };
})();

export const now = () => Date.now() + offset;
const matchRef = code => fb.ref(fb.db, 'matches/' + code);

const localKey = code => 'tkd-match-' + code;
const localListeners = new Map();
function localRead(code) {
  try { return JSON.parse(localStorage.getItem(localKey(code))); } catch { return null; }
}
function localWrite(code, data) {
  localStorage.setItem(localKey(code), JSON.stringify(data));
  const value = localRead(code);
  for (const cb of localListeners.get(code) || []) cb(value);
}
addEventListener('storage', e => {
  if (!e.key?.startsWith('tkd-match-')) return;
  const code = e.key.slice('tkd-match-'.length);
  const value = localRead(code);
  for (const cb of localListeners.get(code) || []) cb(value);
});

export async function watch(code, cb) {
  await ready;
  if (DEMO) {
    if (!localListeners.has(code)) localListeners.set(code, new Set());
    localListeners.get(code).add(cb);
    cb(localRead(code));
    return () => localListeners.get(code).delete(cb);
  }
  return fb.onValue(matchRef(code), s => cb(s.val()));
}

// Creates a match only if the code is free. Resolves true on success.
export async function create(code, data) {
  await ready;
  if (DEMO) {
    if (localRead(code)) return false;
    localWrite(code, data);
    return true;
  }
  const res = await fb.runTransaction(matchRef(code), cur => (cur == null ? data : undefined));
  return res.committed;
}

// Changes the match safely even when several phones press at once.
// fn gets the latest data and returns the new data, or undefined to cancel.
export async function change(code, fn) {
  await ready;
  if (DEMO) {
    const cur = localRead(code);
    if (cur == null) return false;
    const next = fn(cur);
    if (next === undefined) return false;
    localWrite(code, next);
    return true;
  }
  // Firebase may first call fn with null before it has the real data; it then retries.
  const res = await fb.runTransaction(matchRef(code), cur => (cur == null ? cur : fn(cur)));
  return res.committed;
}
