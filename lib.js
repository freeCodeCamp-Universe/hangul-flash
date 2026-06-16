// Pure, DOM-free helpers — importable by both app.js and test.js

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getMisses(storage = globalThis.localStorage) {
  try { return JSON.parse(storage.getItem('hangul-misses') || '{}'); }
  catch { return {}; }
}

export function recordMiss(cardKey, outcome, storage = globalThis.localStorage) {
  const misses = getMisses(storage);
  if (outcome === 'hard' || outcome === 'wrong') {
    misses[cardKey] = (misses[cardKey] || 0) + 1;
  } else if (outcome === 'easy' || outcome === 'correct') {
    misses[cardKey] = Math.max(0, (misses[cardKey] || 0) - 1);
  }
  storage.setItem('hangul-misses', JSON.stringify(misses));
}

export function weightedQueue(pool, count, storage = globalThis.localStorage) {
  const misses = getMisses(storage);
  const struggling = shuffle(pool.filter(c => (misses[c.k] || 0) > 0));
  const fresh      = shuffle(pool.filter(c => !(misses[c.k] || 0)));
  return [...struggling, ...fresh].slice(0, Math.min(count, pool.length));
}

export function practiceAnnouncement(pct, counts) {
  const n = counts.hard;
  const review = n > 0 ? ` Review ${n} card${n !== 1 ? 's' : ''} below.` : '';
  return `Round complete. Score ${pct}%. ${counts.easy} easy, ${counts.ok} OK, ${n} hard.${review}`;
}

export function quizAnnouncement(correct, total, missed) {
  const review = missed > 0 ? ` Review ${missed} card${missed !== 1 ? 's' : ''} below.` : '';
  return `Quiz complete. ${correct} of ${total} correct.${review}`;
}
