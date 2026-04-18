// Generic Firestore key/value helper.
// Each "key" maps to one document under collection `oe_kv`.
// Value is stored in field `data` (Firestore supports nested objects/arrays).

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'oe_kv';

export async function cloudLoad(key, fallback = null) {
  const ref = doc(db, COLLECTION, key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return fallback;
  const body = snap.data();
  return body?.data ?? fallback;
}

export async function cloudSave(key, data) {
  const ref = doc(db, COLLECTION, key);
  await setDoc(ref, { data, updatedAt: Date.now() });
}
