// Match rules. Every function here takes the match data, changes it in place,
// and returns false when nothing should be saved.

export const ROUND_MS = 90_000;
export const REST_MS = 15_000;
export const GOLDEN_ROUND = 4;
export const POINT_GAP = 12;
export const MAX_PENALTIES = 5;
export const AGREE_WINDOW_MS = 1000;

export const TECHNIQUES = [
  { id: 'punch', points: 1, label: 'Punch' },
  { id: 'body', points: 2, label: 'Body kick' },
  { id: 'head', points: 3, label: 'Head kick' },
  { id: 'spinBody', points: 4, label: 'Spinning body' },
  { id: 'spinHead', points: 5, label: 'Spinning head' },
];

export const COLORS = ['blue', 'red'];
export const other = color => (color === 'blue' ? 'red' : 'blue');
const isGolden = m => m.round === GOLDEN_ROUND;

export function newMatch({ blueName, redName, judges }) {
  return normalize({ blue: { name: blueName }, red: { name: redName }, judges });
}

// Fills in anything missing (the database drops empty values).
export function normalize(raw) {
  const m = {
    judges: 1, round: 1, phase: 'ready', remainingMs: ROUND_MS, endsAt: 0,
    elapsedMs: 0, startedAt: 0, nextRound: 0, winner: '', reason: '',
    ...structuredClone(raw || {}),
  };
  for (const c of COLORS) m[c] = { name: '', score: 0, pen: 0, ...m[c] };
  m.pending = Object.values(m.pending || {});
  m.last = { color: '', points: 0, label: '', at: 0, ...m.last };
  return m;
}

export function leader(m) {
  if (m.blue.score > m.red.score) return 'blue';
  if (m.red.score > m.blue.score) return 'red';
  return '';
}

export function clockMs(m, now) {
  if (m.phase === 'rest') return Math.max(0, m.endsAt - now);
  if (isGolden(m)) return m.elapsedMs + (m.phase === 'running' ? now - m.startedAt : 0);
  return m.phase === 'running' ? Math.max(0, m.endsAt - now) : m.remainingMs;
}

export function start(m, now) {
  if (m.phase !== 'ready' && m.phase !== 'paused') return false;
  if (isGolden(m)) m.startedAt = now;
  else m.endsAt = now + m.remainingMs;
  m.phase = 'running';
}

export function pause(m, now) {
  if (m.phase !== 'running') return false;
  if (isGolden(m)) m.elapsedMs += now - m.startedAt;
  else m.remainingMs = Math.max(0, m.endsAt - now);
  m.phase = 'paused';
  m.pending = [];
}

export function needsTick(m, now) {
  const timed = (m.phase === 'running' && !isGolden(m)) || m.phase === 'rest';
  return timed && now >= m.endsAt;
}

// Moves on when the round clock or the rest clock reaches zero.
export function tick(m, now) {
  if (!needsTick(m, now)) return false;
  if (m.phase === 'rest') {
    m.round = m.nextRound;
    m.phase = 'ready';
    m.remainingMs = ROUND_MS;
    m.elapsedMs = 0;
    return;
  }
  m.remainingMs = 0;
  m.pending = [];
  const lead = leader(m);
  if (m.round >= 2 && lead) return finish(m, lead, 'Points', now);
  // Round 1 always rests; a draw after round 2 goes to round 3, after round 3 to golden point.
  m.phase = 'rest';
  m.nextRound = m.round + 1;
  m.endsAt = now + REST_MS;
}

function award(m, color, points, label, now) {
  m[color].score = Math.max(0, m[color].score + points);
  if (points > 0) m.last = { color, points, label, at: now };
  checkEnd(m, now);
}

function checkEnd(m, now) {
  for (const c of COLORS) {
    if (m[c].pen >= MAX_PENALTIES) return finish(m, other(c), 'Too many penalties', now);
  }
  const lead = leader(m);
  if (Math.abs(m.blue.score - m.red.score) >= POINT_GAP) return finish(m, lead, 'Point gap', now);
  if (isGolden(m) && lead) return finish(m, lead, 'Golden point', now);
}

function finish(m, winner, reason, now) {
  if (m.phase === 'running') pause(m, now);
  m.phase = 'finished';
  m.winner = winner;
  m.reason = reason;
  m.pending = [];
}

// Referee +1 / -1 correction.
export function adjust(m, color, delta, now) {
  if (m.phase === 'finished') return false;
  if (delta < 0 && m[color].score === 0) return false;
  award(m, color, delta, 'Point', now);
}

// Referee gives (+1) or takes back (-1) a gam-jeom. Each one is a point for the opponent.
export function penalty(m, color, delta, now) {
  if (m.phase === 'finished') return false;
  if (delta < 0 && m[color].pen === 0) return false;
  m[color].pen += delta;
  award(m, other(color), delta, 'Penalty', now);
}

export function stopMatch(m, winner, now) {
  if (m.phase === 'finished') return false;
  finish(m, winner, 'Referee decision', now);
}

export function reopen(m) {
  if (m.phase !== 'finished') return false;
  m.phase = 'paused';
  m.winner = '';
  m.reason = '';
}

// A judge pressed a technique button. The points count once most judges
// press the same button for the same player within AGREE_WINDOW_MS.
export function judgePress(m, judge, color, techId, now) {
  const tech = TECHNIQUES.find(t => t.id === techId);
  if (m.phase !== 'running' || !tech) return false;
  const same = p => p.color === color && p.tech === techId;
  m.pending = m.pending.filter(p => now - p.at < AGREE_WINDOW_MS);
  if (m.pending.some(p => same(p) && p.judge === judge)) return false;
  m.pending.push({ judge, color, tech: techId, at: now });
  const needed = Math.floor(m.judges / 2) + 1;
  if (m.pending.filter(same).length >= needed) {
    m.pending = m.pending.filter(p => !same(p));
    award(m, color, tech.points, tech.label, now);
  }
}
