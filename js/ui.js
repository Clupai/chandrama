// Helpers shared by all the pages.
import { watch, change, now } from './store.js';
import { normalize, clockMs, needsTick, tick, GOLDEN_ROUND } from './match.js';

export const params = new URLSearchParams(location.search);
export const $ = s => document.querySelector(s);
export const code = (params.get('m') || '').toUpperCase();

export function pageUrl(page, query) {
  return new URL(page + '?' + new URLSearchParams(query), location.href).href;
}

export function formatClock(ms, countUp) {
  const s = countUp ? Math.floor(ms / 1000) : Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export const playerName = (m, c) => m[c].name || (c === 'blue' ? 'Blue' : 'Red');

function roundLabel(m) {
  if (m.phase === 'finished') return 'Match over';
  if (m.phase === 'rest') return m.nextRound === GOLDEN_ROUND ? 'Rest · Golden point next' : `Rest · Round ${m.nextRound} next`;
  return m.round === GOLDEN_ROUND ? 'Golden point' : `Round ${m.round}`;
}

const STATUS = { ready: 'Ready', paused: 'Paused', running: '', rest: 'Rest', finished: '' };

// Fills every element that has a data-f="..." attribute.
export function render(m, t) {
  const fields = {
    code,
    'blue-name': playerName(m, 'blue'),
    'red-name': playerName(m, 'red'),
    'blue-score': m.blue.score,
    'red-score': m.red.score,
    'blue-pen': m.blue.pen,
    'red-pen': m.red.pen,
    clock: formatClock(clockMs(m, t), m.round === GOLDEN_ROUND && m.phase !== 'rest'),
    round: roundLabel(m),
    status: STATUS[m.phase],
    winner: m.winner ? `${playerName(m, m.winner)} wins` : '',
    reason: m.reason,
  };
  for (const el of document.querySelectorAll('[data-f]')) {
    const v = String(fields[el.dataset.f] ?? '');
    if (el.textContent !== v) el.textContent = v;
  }
  document.body.dataset.phase = m.phase;
  document.body.dataset.winner = m.winner;
}

// Runs a rule from match.js against the latest data and saves the result.
export function act(rule, ...args) {
  return change(code, raw => {
    const m = normalize(raw);
    return rule(m, ...args, now()) === false ? undefined : m;
  });
}

// Follows the match: calls onData on every change and redraws the clock.
// Pages with advanceClock also move the match on when a clock runs out.
export function follow(onData, { advanceClock = false } = {}) {
  let current = null;
  let ticking = false;
  if (!code) return showMissing();
  watch(code, raw => {
    if (raw == null) return showMissing();
    $('#missing')?.remove();
    current = normalize(raw);
    render(current, now());
    onData?.(current);
  });
  setInterval(() => {
    if (!current) return;
    render(current, now());
    if (advanceClock && !ticking && needsTick(current, now())) {
      ticking = true;
      act(tick).finally(() => { ticking = false; });
    }
  }, 200);
}

function showMissing() {
  if ($('#missing')) return;
  document.body.insertAdjacentHTML('beforeend',
    `<div id="missing" class="overlay"><div><h2>Match not found</h2>
     <p>Check the match code${code ? ` (<b>${code}</b>)` : ''} and try again.</p>
     <a class="btn" href="index.html">Go to start page</a></div></div>`);
}

// Stops the phone or TV screen from going to sleep.
export function keepAwake() {
  const lock = () => navigator.wakeLock?.request('screen').catch(() => {});
  lock();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lock(); });
}

export function drawQr(el, url) {
  const q = window.qrcode(0, 'M');
  q.addData(url);
  q.make();
  el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
