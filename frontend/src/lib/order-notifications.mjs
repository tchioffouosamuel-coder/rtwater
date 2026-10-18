const LAST_SEEN_KEY = 'rtwater_last_seen_order_id';
const READ_IDS_KEY = 'rtwater_read_order_ids';
const READ_EVENT = 'rtwater:orders-read';
const validId = id => Number.isSafeInteger(id) && id > 0;

export function readOrderNotificationState(storage = window.localStorage) {
  let lastSeenId = 0;
  let readIds = [];
  try {
    const saved = Number(storage.getItem(LAST_SEEN_KEY));
    if (Number.isSafeInteger(saved) && saved > 0) lastSeenId = saved;
    const parsed = JSON.parse(storage.getItem(READ_IDS_KEY) || '[]');
    if (Array.isArray(parsed)) readIds = parsed.filter(validId);
  } catch { /* Ignore malformed or unavailable storage. */ }
  return { lastSeenId, readIds };
}

export function isOrderNotificationRead(id, state) {
  return id <= state.lastSeenId || state.readIds.includes(id);
}

export function markOrdersRead(ids, storage = window.localStorage) {
  const state = readOrderNotificationState(storage);
  const readIds = [...new Set([...state.readIds, ...ids.filter(validId)])];
  const next = { ...state, readIds };
  try { storage.setItem(READ_IDS_KEY, JSON.stringify(readIds)); } catch { /* Keep the current UI in sync even without storage. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(READ_EVENT, { detail: next }));
  return next;
}

export function subscribeOrderReadState(listener) {
  const onRead = event => listener(event.detail);
  const onStorage = event => {
    if (event.key === null || event.key === LAST_SEEN_KEY || event.key === READ_IDS_KEY) {
      listener(readOrderNotificationState());
    }
  };
  window.addEventListener(READ_EVENT, onRead);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(READ_EVENT, onRead);
    window.removeEventListener('storage', onStorage);
  };
}
