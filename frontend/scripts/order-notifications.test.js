import assert from 'node:assert/strict';
import test from 'node:test';
import { isOrderNotificationRead, markOrdersRead, readOrderNotificationState } from '../src/lib/order-notifications.mjs';

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('opening a newer order leaves older unopened orders unread', () => {
  const local = storage();
  markOrdersRead([4], local);
  const state = readOrderNotificationState(local);
  assert.equal(isOrderNotificationRead(4, state), true);
  assert.equal(isOrderNotificationRead(3, state), false);
  assert.equal(isOrderNotificationRead(5, state), false);
});

test('marking all visible orders does not mark orders absent from the panel', () => {
  const local = storage();
  markOrdersRead([4, 3], local);
  const state = readOrderNotificationState(local);
  assert.ok(isOrderNotificationRead(3, state) && isOrderNotificationRead(4, state));
  assert.equal(isOrderNotificationRead(2, state), false);
});

test('previous all-seen state is preserved for existing installations', () => {
  const state = readOrderNotificationState(storage({ rtwater_last_seen_order_id: '3' }));
  assert.equal(isOrderNotificationRead(2, state), true);
  assert.equal(isOrderNotificationRead(3, state), true);
  assert.equal(isOrderNotificationRead(4, state), false);
});

test('reopening a sheet persists its read state without duplicate entries', () => {
  const local = storage();
  markOrdersRead([3], local);
  markOrdersRead([3, 4], local);
  assert.deepEqual(readOrderNotificationState(local).readIds, [3, 4]);
});

test('invalid saved data and invalid IDs do not hide valid notifications', () => {
  const local = storage({ rtwater_last_seen_order_id: 'invalid', rtwater_read_order_ids: '{broken' });
  assert.deepEqual(readOrderNotificationState(local), { lastSeenId: 0, readIds: [] });
  markOrdersRead([-1, 0, 1.5, '4', 4], local);
  assert.deepEqual(readOrderNotificationState(local).readIds, [4]);
});
