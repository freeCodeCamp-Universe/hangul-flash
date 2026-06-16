import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, getMisses, recordMiss, weightedQueue, practiceAnnouncement, quizAnnouncement } from './lib.js';

// ── Minimal localStorage mock ─────────────────────────────────────────────────

function mockStorage() {
  const store = {};
  return {
    getItem:    k       => (k in store ? store[k] : null),
    setItem:    (k, v)  => { store[k] = String(v); },
    removeItem: k       => { delete store[k]; },
  };
}

// ── shuffle ───────────────────────────────────────────────────────────────────

test('shuffle returns array of same length', () => {
  const arr = [1, 2, 3, 4, 5];
  assert.equal(shuffle(arr).length, arr.length);
});

test('shuffle contains all original elements', () => {
  const arr = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'];
  const result = shuffle(arr);
  assert.deepEqual([...result].sort(), [...arr].sort());
});

test('shuffle does not mutate the input', () => {
  const arr = [1, 2, 3];
  const copy = [...arr];
  shuffle(arr);
  assert.deepEqual(arr, copy);
});

// ── getMisses ─────────────────────────────────────────────────────────────────

test('getMisses returns empty object when storage is empty', () => {
  assert.deepEqual(getMisses(mockStorage()), {});
});

test('getMisses returns stored values', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', JSON.stringify({ 'ㄱ': 3, 'ㅏ': 1 }));
  assert.deepEqual(getMisses(s), { 'ㄱ': 3, 'ㅏ': 1 });
});

test('getMisses returns empty object on corrupt JSON', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', 'not-json');
  assert.deepEqual(getMisses(s), {});
});

// ── recordMiss ────────────────────────────────────────────────────────────────

test('recordMiss hard increments score from zero', () => {
  const s = mockStorage();
  recordMiss('ㄱ', 'hard', s);
  assert.equal(getMisses(s)['ㄱ'], 1);
});

test('recordMiss wrong increments score', () => {
  const s = mockStorage();
  recordMiss('ㄴ', 'wrong', s);
  recordMiss('ㄴ', 'wrong', s);
  assert.equal(getMisses(s)['ㄴ'], 2);
});

test('recordMiss easy decrements score', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', JSON.stringify({ 'ㄱ': 3 }));
  recordMiss('ㄱ', 'easy', s);
  assert.equal(getMisses(s)['ㄱ'], 2);
});

test('recordMiss correct decrements score', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', JSON.stringify({ 'ㄱ': 1 }));
  recordMiss('ㄱ', 'correct', s);
  assert.equal(getMisses(s)['ㄱ'], 0);
});

test('recordMiss easy does not go below zero', () => {
  const s = mockStorage();
  recordMiss('ㄱ', 'easy', s);
  assert.equal(getMisses(s)['ㄱ'], 0);
});

test('recordMiss ok leaves score unchanged', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', JSON.stringify({ 'ㄱ': 2 }));
  recordMiss('ㄱ', 'ok', s);
  assert.equal(getMisses(s)['ㄱ'], 2);
});

test('recordMiss persists multiple cards independently', () => {
  const s = mockStorage();
  recordMiss('ㄱ', 'hard', s);
  recordMiss('ㄴ', 'wrong', s);
  recordMiss('ㄷ', 'easy', s);
  const m = getMisses(s);
  assert.equal(m['ㄱ'], 1);
  assert.equal(m['ㄴ'], 1);
  assert.equal(m['ㄷ'], 0);
});

// ── weightedQueue ─────────────────────────────────────────────────────────────

const POOL = [
  { k: 'ㄱ', r: 'g/k' },
  { k: 'ㄴ', r: 'n'   },
  { k: 'ㄷ', r: 'd/t' },
  { k: 'ㄹ', r: 'r/l' },
  { k: 'ㅁ', r: 'm'   },
];

test('weightedQueue respects count cap', () => {
  const s = mockStorage();
  assert.equal(weightedQueue(POOL, 3, s).length, 3);
});

test('weightedQueue returns entire pool when count exceeds pool size', () => {
  const s = mockStorage();
  assert.equal(weightedQueue(POOL, 100, s).length, POOL.length);
});

test('weightedQueue places struggling cards first', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', JSON.stringify({ 'ㄷ': 2, 'ㅁ': 1 }));
  const queue = weightedQueue(POOL, 5, s);
  const firstTwo = queue.slice(0, 2).map(c => c.k);
  assert.ok(firstTwo.includes('ㄷ'), 'ㄷ (score 2) should be in first two');
  assert.ok(firstTwo.includes('ㅁ'), 'ㅁ (score 1) should be in first two');
});

test('weightedQueue with no misses returns all fresh cards', () => {
  const s = mockStorage();
  const queue = weightedQueue(POOL, 5, s);
  assert.equal(queue.length, 5);
  const keys = queue.map(c => c.k).sort();
  assert.deepEqual(keys, POOL.map(c => c.k).sort());
});

test('weightedQueue returns unique cards', () => {
  const s = mockStorage();
  s.setItem('hangul-misses', JSON.stringify({ 'ㄱ': 3, 'ㄴ': 1 }));
  const queue = weightedQueue(POOL, 5, s);
  const keys = queue.map(c => c.k);
  assert.equal(new Set(keys).size, keys.length, 'no duplicate cards');
});

// ── Re-queue logic ────────────────────────────────────────────────────────────

test('hard card is re-inserted into remaining deck', () => {
  const queue = [
    { k: 'ㄱ', r: 'g/k' },
    { k: 'ㄴ', r: 'n'   },
    { k: 'ㄷ', r: 'd/t' },
    { k: 'ㄹ', r: 'r/l' },
  ];
  const requeued = new Set();
  const idx = 0;
  const card = queue[idx];

  if (!requeued.has(card.k)) {
    requeued.add(card.k);
    const remaining = queue.length - idx - 1;
    const insertAt = idx + 1 + (remaining > 0 ? Math.floor(Math.random() * Math.min(remaining, 3)) : 0);
    queue.splice(insertAt, 0, card);
  }

  assert.equal(queue.length, 5, 'queue grows by one after re-queue');
  assert.equal(queue.filter(c => c.k === 'ㄱ').length, 2, 'hard card appears twice');
  // indexOf finds the original slot (0); lastIndexOf finds the re-inserted copy
  assert.ok(queue.lastIndexOf(card) > idx, 'hard card re-inserted after current position');
});

test('hard card is not re-queued twice in the same session', () => {
  const queue = [{ k: 'ㄱ', r: 'g/k' }, { k: 'ㄴ', r: 'n' }];
  const requeued = new Set();

  function gradeHard(i) {
    const card = queue[i];
    if (!requeued.has(card.k)) {
      requeued.add(card.k);
      queue.splice(i + 1, 0, card);
    }
  }

  gradeHard(0); // first time — should re-queue
  assert.equal(queue.length, 3);

  gradeHard(1); // same card again — should NOT re-queue
  assert.equal(queue.length, 3, 'queue length unchanged on second hard grade');
});

// ── Announcement strings ──────────────────────────────────────────────────────

test('practiceAnnouncement includes score and counts', () => {
  const msg = practiceAnnouncement(80, { hard: 2, ok: 3, easy: 5 });
  assert.ok(msg.includes('80%'));
  assert.ok(msg.includes('5 easy'));
  assert.ok(msg.includes('3 OK'));
  assert.ok(msg.includes('2 hard'));
});

test('practiceAnnouncement includes review prompt when there are hard cards', () => {
  const msg = practiceAnnouncement(60, { hard: 3, ok: 2, easy: 1 });
  assert.ok(msg.includes('Review 3 cards below'));
});

test('practiceAnnouncement uses singular "card" for one miss', () => {
  const msg = practiceAnnouncement(90, { hard: 1, ok: 4, easy: 5 });
  assert.ok(msg.includes('Review 1 card below'));
  assert.ok(!msg.includes('Review 1 cards below'));
});

test('practiceAnnouncement omits review prompt on perfect round', () => {
  const msg = practiceAnnouncement(100, { hard: 0, ok: 0, easy: 10 });
  assert.ok(!msg.includes('Review'));
});

test('quizAnnouncement includes correct count and total', () => {
  const msg = quizAnnouncement(8, 10, 2);
  assert.ok(msg.includes('8 of 10 correct'));
});

test('quizAnnouncement includes review prompt when there are misses', () => {
  const msg = quizAnnouncement(7, 10, 3);
  assert.ok(msg.includes('Review 3 cards below'));
});

test('quizAnnouncement uses singular "card" for one miss', () => {
  const msg = quizAnnouncement(9, 10, 1);
  assert.ok(msg.includes('Review 1 card below'));
  assert.ok(!msg.includes('Review 1 cards below'));
});

test('quizAnnouncement omits review prompt on perfect quiz', () => {
  const msg = quizAnnouncement(10, 10, 0);
  assert.ok(!msg.includes('Review'));
});
