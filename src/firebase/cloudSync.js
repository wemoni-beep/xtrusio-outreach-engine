// Firestore sync layer for localStorage-backed stores.
//
// Design (single user, multi device):
//   - Each store already reads/writes a JSON blob to localStorage under a fixed key.
//   - We mirror each blob as a single Firestore document in the `oe_kv` collection
//     (doc id == localStorage key).
//   - Boot sync strategy: cloud wins if cloud has data; otherwise push local to seed the cloud.
//   - Writes after boot: every save* also fires a debounced push to Firestore.
//
// Why cloud-wins on boot:
//   The user's pain point is "data on localhost didn't appear on the live site".
//   Pulling cloud overwrites local blank/stale data so the same view shows up on every device.
//   Single-user trade-off: if the user makes offline changes on device A while device B is
//   also open with a newer cloud value, device A's local will be replaced by cloud on next boot.
//   Every save pushes immediately, so in practice the two stay in lockstep.

import { cloudLoad, cloudSave } from './cloudStore';

// List of localStorage keys to sync. Order doesn't matter.
export const SYNC_KEYS = [
  'xtrusio_outreach_data', // leadStore (campaigns + leads)
  'xtrusio_news_data',     // newsStore (news radar events + runs)
  'xtrusio_prompts',       // promptStore (user-edited prompts)
];

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[cloudSync] localStorage write failed', key, e);
  }
}

function isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') {
    // Empty object, or object whose array/object fields are all empty
    const keys = Object.keys(v);
    if (keys.length === 0) return true;
    // Heuristic: if every value is an empty array or null, treat as empty
    return keys.every(k => {
      const val = v[k];
      if (val === null || val === undefined) return true;
      if (Array.isArray(val)) return val.length === 0;
      return false;
    });
  }
  return false;
}

/**
 * Pull all synced keys from Firestore into localStorage, or push local → cloud
 * when the cloud slot is empty/missing. Call once after auth succeeds.
 */
export async function bootSync() {
  const results = [];
  for (const key of SYNC_KEYS) {
    try {
      const cloud = await cloudLoad(key, null);
      const local = readLocal(key);

      if (cloud && !isEmptyValue(cloud)) {
        // Cloud wins — replace local with cloud.
        writeLocal(key, cloud);
        results.push({ key, action: 'pulled' });
      } else if (local && !isEmptyValue(local)) {
        // Cloud is empty/missing but local has data — seed the cloud.
        await cloudSave(key, local);
        results.push({ key, action: 'seeded' });
      } else {
        results.push({ key, action: 'skipped' });
      }
    } catch (e) {
      console.error('[cloudSync] bootSync failed for', key, e);
      results.push({ key, action: 'error', error: e?.message || String(e) });
    }
  }
  return results;
}

// Debounced writes: batch rapid-fire save*() calls (e.g. during typing) into
// one cloud round-trip per key.
const pushTimers = new Map();
const PUSH_DEBOUNCE_MS = 600;

export function pushToCloud(key) {
  if (!SYNC_KEYS.includes(key)) return;
  if (pushTimers.has(key)) clearTimeout(pushTimers.get(key));
  const timer = setTimeout(async () => {
    pushTimers.delete(key);
    const value = readLocal(key);
    if (value === null) return;
    try {
      await cloudSave(key, value);
    } catch (e) {
      console.error('[cloudSync] pushToCloud failed for', key, e);
    }
  }, PUSH_DEBOUNCE_MS);
  pushTimers.set(key, timer);
}
