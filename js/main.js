// main.js — app orchestration: inputs → gesture detectors → portal (effects + live cam).
import { CONFIG } from './config.js';
import { CircleDetector, SwipeDetector, HoldDetector, OneEuro, clamp } from './gesture-core.js';
import { FX, THEME_KEYS } from './portal-fx.js';
import { PortalView } from './portal-view.js';
import { Deck } from './deck.js';
import { CAMS, OFFLINE_CAM, sourcesOf, parseYouTubeId } from './cams.js';
import { Sfx } from './audio.js';
import { settings, saveSettings, store } from './settings.js';
import { t, tx } from './i18n.js';
import { UI } from './ui.js';
import { WandLink } from './wand-link.js';
import { HandInput } from './hand-input.js';

const qs = new URLSearchParams(location.search);
const FORCE_OFFLINE = qs.has('offline');
const FAKE_HAND = qs.has('fakehand');
const $ = (s) => document.querySelector(s);
const now = () => performance.now() / 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fx = new FX($('#fx'), settings.theme);
const view = new PortalView({ root: $('#portalView'), wrap: $('#ytWrap'), host: $('#ytHosts'), offline: $('#offlineScene'), ambient: $('#ambient') });
view.ambientOn = settings.ambient;
const sfx = new Sfx(); sfx.setEnabled(settings.sfx);

const app = {
  W: innerWidth, H: innerHeight, minDim: Math.min(innerWidth, innerHeight),
  started: false, mode: null,
  portal: { open: false, full: false, pendingFull: false, cx: 0, cy: 0, R: 0, entry: null, status: null },
  list: [], pos: -1, loadToken: 0, ytDown: false, history: [],
  inputs: new Map(), filters: new Map(), wands: new Map(),
  hand: null, twoHand: null, wand: null, wandStatus: { state: 'off' },
  lastActivity: 0, videoMuted: true, hudPinned: false, events: [],
  fx, view,
};
window.__portal = app; // for debugging and automated tests

// ---------------------------------------------------------------- destinations
const dead = store.get('fw.dead', {});
const isDead = (key) => !!dead[key] && Date.now() - dead[key] < CONFIG.DEAD_TTL_MS;
function markDead(key, code) {
  const soft = code === 'timeout' || code === 'ended' || code === 'player';
  // store a back-dated timestamp so soft failures expire after 1 h instead of DEAD_TTL (6 h)
  dead[key] = soft ? Date.now() - (CONFIG.DEAD_TTL_MS - 60 * 60 * 1000) : Date.now();
  store.set('fw.dead', dead);
  console.info(`[portal] source failed (${code}) → skipped for ${soft ? '1 h' : '6 h'}:`, key);
}
let userCams = store.get('fw.userCams', []);

const alive = (e) => sourcesOf(e).some((s) => !isDead(s.key));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
function buildList() {
  const ok = (e) => e.user || settings.cats.includes(e.cat);
  const users = userCams.filter(ok), featured = CAMS.slice(0, 12).filter(ok), rest = CAMS.slice(12).filter(ok);
  app.list = [...users, ...shuffle(featured), ...shuffle(rest)]; // user cams first, then a fresh random tour
  app.pos = -1;
}
/** Next destination in the tour that still has a working source (dead ones are skipped silently). */
function nextEntry() {
  const n = app.list.length;
  for (let k = 0; k < n; k++) {
    app.pos = (app.pos + 1) % n;
    const e = app.list[app.pos];
    if (alive(e)) return e;
  }
  return null;
}
function pushHistory(e) { if (app.history[app.history.length - 1] !== e) app.history.push(e); if (app.history.length > 30) app.history.shift(); }
function prevEntry() { if (app.history.length < 2) return null; app.history.pop(); return app.history.pop(); }

const deck = new Deck({ hosts: [$('#ytHostA'), $('#ytHostB')], isDead, markDead, nextEntry });
app.deck = deck;

/** Show a live cam in the portal. entry = null → the pre-warmed next one (instant, never a dead cam). */
async function showEntry(entry = null) {
  const my = ++app.loadToken;
  app.portal.status = null;
  fx.setLoading(true); ui.hideLabel(); sendState();
  if (FORCE_OFFLINE || app.ytDown || (entry && entry.offline)) {
    deck.stopActive(); view.showOffline(true);
    await sleep(450);
    if (my === app.loadToken) finishLoad(OFFLINE_CAM, 'offline');
    return;
  }
  view.showOffline(false);
  try {
    const r = await deck.present(entry);
    if (my !== app.loadToken) return;
    pushHistory(r.entry);
    finishLoad(r.entry, r.live === false ? 'recorded' : 'live');
  } catch (err) {
    if (my !== app.loadToken || (err && err.code === 'cancel')) return;
    if (err instanceof Error) { app.ytDown = true; ui.toast(t('ytFail'), 4000); } // YouTube API unreachable
    else ui.toast(t('allDead'), 3500);                                               // nothing plays (internet?)
    view.showOffline(true); finishLoad(OFFLINE_CAM, 'offline');
  }
}

function finishLoad(entry, status) {
  app.portal.entry = entry; app.portal.status = status;
  fx.setLoading(false); ui.showLabel(entry, status); placeLabel(); sendState();
  app.events.push({ t: now(), e: 'loaded', key: entry.key, status });
}

// ---------------------------------------------------------------- portal actions
function openPortalAt(cx, cy, r, dir = 1, a0 = -Math.PI / 2, pick = 'next') {
  const { W, H, minDim } = app;
  const from = { cx, cy, r }; // the circle as drawn — the portal ignites exactly there
  let R;
  if (settings.size === 'large' || settings.size === 'full') { R = 0.49 * minDim; cx = W / 2; cy = H / 2; }
  else if (settings.size === 'huge') { R = 0.62 * minDim; cx = W / 2; cy = H / 2; }
  else R = clamp(r * 1.3, 0.36 * minDim, 0.49 * minDim);
  cx = W > 2 * R + 20 ? clamp(cx, R + 10, W - R - 10) : W / 2;
  cy = H > 2 * R + 20 ? clamp(cy, R + 8, H - R - 8) : H / 2;
  Object.assign(app.portal, { open: true, full: false, pendingFull: settings.size === 'full', cx, cy, R });
  view.mode = 'portal'; fx.hidden = false;
  fx.openPortal(cx, cy, R, dir, a0, from);
  sfx.open(); buzz(60); placeLabel();
  app.events.push({ t: now(), e: 'open' }); window.__openedAt = performance.now();
  showEntry(null);
}

function hop(step = 1, random = false) {
  if (!app.portal.open) { openPortalAt(app.W / 2, app.H / 2, 0.4 * app.minDim, 1, -Math.PI / 2, random ? 'random' : 'next'); return; }
  if (fx.portal.state === 'closing') return;
  fx.hop(); sfx.hop(); buzz(30);
  app.events.push({ t: now(), e: 'hop', step, random });
  showEntry(step < 0 && !random ? prevEntry() : null);
}

function closePortal() {
  if (!app.portal.open) return;
  app.portal.open = false; app.portal.full = false; app.portal.pendingFull = false; app.loadToken++;
  fx.closePortal(); sfx.close(); buzz(40); ui.hideLabel();
  view.mode = 'portal'; fx.hidden = false;
  app.events.push({ t: now(), e: 'close' });
  setTimeout(() => { if (!app.portal.open) { deck.stopActive(); view.showOffline(false); } }, 820);
  sendState();
}

function setPortalRadius(R) {
  if (!app.portal.open || app.portal.full) return;
  const p = app.portal;
  p.R = clamp(R, 0.18 * app.minDim, 0.75 * app.minDim);
  fx.setGeometry(p.cx, p.cy, p.R); placeLabel();
}

/** Grow the portal over the whole screen ("step through") or shrink it back. */
function setFull(on) {
  const p = app.portal;
  if (!p.open || fx.portal.state === 'closing' || on === p.full) return;
  p.full = on; p.pendingFull = false;
  fx.setFull(on); sfx.full(); buzz(50); placeLabel(); sendState();
  app.events.push({ t: now(), e: on ? 'full' : 'unfull' });
}
function toggleFull() { if (!app.portal.open) hop(0, true); else setFull(!app.portal.full); }

function placeLabel() { const p = app.portal; ui.placeLabel(p.cx, p.cy, p.R, view.mode === 'window' ? view.rect : null, p.full); }

function toggleVideoSound() { app.videoMuted = !app.videoMuted; deck.setMuted(app.videoMuted); ui.toast(app.videoMuted ? t('soundOff') : t('soundOn')); }
function toggleSfx() { settings.sfx = !settings.sfx; saveSettings(); sfx.setEnabled(settings.sfx); ui.toast(settings.sfx ? t('sfxOn') : t('sfxOff')); }
function cycleTheme() {
  settings.theme = THEME_KEYS[(THEME_KEYS.indexOf(settings.theme) + 1) % THEME_KEYS.length];
  saveSettings(); fx.setTheme(settings.theme); ui.renderSettings();
  ui.toast(`${t('themeIs')}: ${t('themes')[settings.theme]}`);
}
function toggleFullscreen() {
  if (!document.fullscreenElement) { const r = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (r && r.catch) r.catch(() => {}); }
  else if (document.exitFullscreen) document.exitFullscreen();
}

// ---------------------------------------------------------------- unified input → gestures
function feed(id, x, y, drawing, tSec, kind) {
  let inp = app.inputs.get(id);
  if (!inp) { inp = { circle: new CircleDetector(), swipe: new SwipeDetector(), kind, wasDrawing: false }; app.inputs.set(id, inp); }
  inp.x = x; inp.y = y; inp.lastT = tSec; inp.kind = kind;
  if (!drawing) {
    fx.setPointer(id, x, y, false, kind, tSec, 0);
    if (inp.wasDrawing) { inp.circle.reset(); inp.swipe.reset(); }
    inp.wasDrawing = false; return;
  }
  inp.wasDrawing = true; app.lastActivity = tSec;
  const ux = x / app.minDim, uy = y / app.minDim;
  const c = inp.circle.push(ux, uy, tSec);
  fx.setPointer(id, x, y, true, kind, tSec, c ? 1 : inp.circle.progress());
  if (c) {
    inp.swipe.reset(); fx.clearTrail(id);
    app.events.push({ t: tSec, e: 'circle', id, r: c.r, dir: c.dir });
    if (!app.portal.open) openPortalAt(c.cx * app.minDim, c.cy * app.minDim, c.r * app.minDim, c.dir, c.startAngle);
    else hop(1, true);
    return;
  }
  const s = inp.swipe.push(ux, uy, tSec);
  if (s && app.portal.open && fx.portal.state === 'open') {
    inp.circle.reset(); fx.clearTrail(id);
    app.events.push({ t: tSec, e: 'swipe', id, axis: s.axis, dir: s.dir });
    if (s.axis === 'x') hop(s.dir);
    else setFull(s.dir < 0); // flick up = step into full screen, flick down = back to the portal
  }
}
function removeInput(id) { fx.removePointer(id); app.inputs.delete(id); }

// ---- mouse / touch
let mouseDown = false;
const isUi = (el) => !!(el && el.closest && el.closest('#hud, .panel, #start, button, input, select, label, a'));
addEventListener('pointerdown', (e) => {
  if (!app.started || isUi(e.target) || e.button === 2) return;
  mouseDown = true; sfx.resume();
  feed('mouse', e.clientX, e.clientY, true, e.timeStamp / 1000, 'mouse');
});
addEventListener('pointermove', (e) => {
  if (!app.started || (!mouseDown && isUi(e.target))) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  // Use each event's own timestamp: coalesced events arrive together, and giving them all "now"
  // squashed the stroke in time (broken circles, fake swipes).
  if (evs.length > 1) for (const ce of evs) feed('mouse', ce.clientX, ce.clientY, mouseDown, ce.timeStamp / 1000, 'mouse');
  else feed('mouse', e.clientX, e.clientY, mouseDown, e.timeStamp / 1000, 'mouse');
}, { passive: true });
const mouseUp = () => { if (!mouseDown) return; mouseDown = false; const i = app.inputs.get('mouse'); if (i) feed('mouse', i.x, i.y, false, now(), 'mouse'); };
addEventListener('pointerup', mouseUp); addEventListener('pointercancel', mouseUp);
addEventListener('contextmenu', (e) => { if (!isUi(e.target)) { e.preventDefault(); closePortal(); } });
addEventListener('wheel', (e) => {
  if (!app.portal.open || isUi(e.target)) return;
  const up = e.deltaY < 0;
  if (app.portal.full) { if (!up) setFull(false); return; }
  if (up && app.portal.R * 1.06 > 0.74 * app.minDim) setFull(true);
  else setPortalRadius(app.portal.R * (up ? 1.06 : 1 / 1.06));
}, { passive: true });
addEventListener('dblclick', (e) => { if (app.started && !isUi(e.target)) toggleFull(); });

// ---- keyboard
addEventListener('keydown', (e) => {
  if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
  if (!app.started) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start('mouse'); } return; }
  sfx.resume();
  switch (e.key) {
    case ' ': e.preventDefault(); hop(0, true); break;
    case 'ArrowRight': hop(1); break;
    case 'ArrowLeft': hop(-1); break;
    case 'Escape': if (ui.panelOpen()) ui.closePanels(); else if (app.portal.full) setFull(false); else closePortal(); break;
    case 'Enter': toggleFull(); break;
    case 'ArrowUp': if (app.portal.open) setFull(true); break;
    case 'ArrowDown': if (app.portal.full) setFull(false); break;
    case 'Backspace': closePortal(); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'm': case 'M': toggleVideoSound(); break;
    case 's': case 'S': toggleSfx(); break;
    case 't': case 'T': cycleTheme(); break;
    case 'c': case 'C': toggleHand(); break;
    case 'p': case 'P': ensureWand(); ui.togglePanel('Phone'); break;
    case 'o': case 'O': ui.togglePanel('Settings'); break;
    case 'h': case 'H': case '?': ui.togglePanel('Help'); break;
    case '+': case '=': setPortalRadius(app.portal.R * 1.08); break;
    case '-': setPortalRadius(app.portal.R / 1.08); break;
    default: break;
  }
});

// ---- hand (webcam)
async function toggleHand(force) {
  const on = force !== undefined ? force : !(app.hand && app.hand.running);
  if (!on) {
    if (app.hand) app.hand.stop(); app.hand = null;
    ui.setHand(t('handOff'), 'off'); $('#camPreview').classList.add('hidden');
    return;
  }
  if (app.hand && app.hand.running) return;
  const hand = new HandInput({
    video: $('#cam'), preview: $('#camPreview'), fake: FAKE_HAND, onFrame: onHandFrame,
    onStatus: (s) => {
      if (s.state === 'asking') ui.setHand(t('camAsk'), 'busy');
      else if (s.state === 'loading') ui.setHand(t('loadingHand'), 'busy');
      else if (s.state === 'ready') {
        ui.setHand(t('handReady'), 'ok'); ui.toast(t('handReady') + ' ✦');
        $('#camPreview').classList.toggle('hidden', !settings.preview || !!s.fake);
      }
    },
  });
  hand.previewOn = settings.preview;
  app.hand = hand;
  try { await hand.start(); }
  catch (err) {
    console.warn('[hand]', err);
    app.hand = null;
    const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
    ui.setHand(denied ? '✕' : '⚠', 'warn');
    ui.toast(denied ? t('camDenied') : `${t('camFail')}: ${err && (err.message || err.name)}`, 5000);
  }
}

function onHandFrame(hands, tSec, vw, vh) {
  const present = new Set();
  const k = (app.H / (0.72 * vh)) * settings.sens; // uniform scale keeps circles round
  for (const h of hands) {
    present.add(h.id);
    let f = app.filters.get(h.id);
    if (!f) { f = { fx: new OneEuro(1.2, 6), fy: new OneEuro(1.2, 6), hold: new HoldDetector(0.5) }; app.filters.set(h.id, f); }
    const X = (h.tipX - 0.5) * vw * k + app.W / 2, Y = (h.tipY - 0.5) * vh * k + app.H / 2;
    const px = clamp(f.fx.filter(X / app.minDim, tSec) * app.minDim, 0, app.W);
    const py = clamp(f.fy.filter(Y / app.minDim, tSec) * app.minDim, 0, app.H);
    const drawing = h.gesture !== 'Closed_Fist' && !app.twoHand;
    feed(h.id, px, py, drawing, tSec, 'hand');
    const held = f.hold.update(h.gesture, tSec);
    if (held) onPose(held);
  }
  twoHandResize(hands);
  for (const [id, inp] of app.inputs) {
    if (inp.kind === 'hand' && !present.has(id) && tSec - inp.lastT > 0.35) { removeInput(id); app.filters.delete(id); }
  }
}

function onPose(label) {
  app.events.push({ t: now(), e: 'pose', label });
  switch (label) {
    case 'Closed_Fist': case 'Thumb_Down': closePortal(); break;
    case 'Victory': hop(0, true); break;
    case 'Thumb_Up': toggleVideoSound(); break;
    case 'ILoveYou': cycleTheme(); break;
    default: break;
  }
}

function twoHandResize(hands) {
  const palms = hands.filter((h) => h.gesture === 'Open_Palm');
  if (app.portal.open && fx.portal.state === 'open' && palms.length === 2) {
    const d = Math.hypot(palms[0].wristX - palms[1].wristX, palms[0].wristY - palms[1].wristY);
    if (!app.twoHand) { app.twoHand = { d0: Math.max(0.05, d), R0: app.portal.R }; return; }
    const ratio = d / app.twoHand.d0;
    if (app.portal.full) { // hands brought together → back to the portal
      if (ratio < 0.65) { setFull(false); app.twoHand = { d0: Math.max(0.05, d), R0: app.portal.R }; }
      return;
    }
    const R = app.twoHand.R0 * ratio;
    if (R > 0.9 * app.minDim) { setFull(true); app.twoHand = { d0: Math.max(0.05, d), R0: app.portal.R }; } // stretched wide → full screen
    else if (Math.abs(R - app.portal.R) > app.minDim * 0.01) setPortalRadius(R);
  } else app.twoHand = null;
}

// ---- phone wand
function ensureWand() {
  if (app.wand) return;
  app.wand = new WandLink({ onMotion: onWandMotion, onEvent: onWandEvent, onStatus: onWandStatus });
  app.wand.start();
}
function getWand(id) {
  let w = app.wands.get(id);
  if (!w) { w = { x: app.W / 2, y: app.H / 2 }; app.wands.set(id, w); }
  return w;
}
function onWandMotion(id, dx, dy, drawing) {
  const w = getWand(id);
  w.x = clamp(w.x + dx * app.minDim, 0, app.W); w.y = clamp(w.y + dy * app.minDim, 0, app.H);
  feed('wand-' + id, w.x, w.y, drawing, now(), 'wand');
}
function onWandEvent(id, msg) {
  switch (msg.t) {
    case 'hello':
      ui.toast(t('wandConnected'));
      if (!app.started) start('phone');
      if (!$('#panelPhone').classList.contains('hidden')) ui.closePanels();
      sendState(); break;
    case 'bye': removeInput('wand-' + id); app.wands.delete(id); break;
    case 'shake': hop(0, true); break;
    case 'recenter': { const w = getWand(id); w.x = app.W / 2; w.y = app.H / 2; break; }
    case 'btn':
      switch (msg.b) {
        case 'next': hop(1); break;
        case 'prev': hop(-1); break;
        case 'random': hop(0, true); break;
        case 'close': closePortal(); break;
        case 'mute': toggleVideoSound(); break;
        case 'theme': cycleTheme(); break;
        case 'full': toggleFull(); break;
        default: break;
      }
      break;
    default: break;
  }
}
function onWandStatus(s) {
  app.wandStatus = s;
  const url = app.wand && app.wand.code ? app.wand.wandUrl() : null;
  const level = s.state === 'connected' ? 'ok' : ['error', 'nolib', 'lost'].includes(s.state) ? 'warn' : 'busy';
  const chip = s.state === 'connected' ? `${s.n} ${t('wandCount')}` : s.state === 'ready' ? `${s.code} · ${t('wandWaiting')}` : s.state === 'lost' ? t('wandLost') : s.state === 'error' ? '⚠' : s.state === 'nolib' ? '✕' : '…';
  ui.setWand({ ...s, url, chip, level });
  if (s.state === 'lost') ui.toast(t('wandLost'));
}
function sendState() {
  if (!app.wand) return;
  const e = app.portal.entry;
  app.wand.broadcast({ t: 'state', open: app.portal.open, status: app.portal.status, name: app.portal.open && e ? `${e.flag || ''} ${tx(e.name)}` : '' });
}
function buzz(ms) { if (app.wand) app.wand.broadcast({ t: 'buzz', ms }); }

// ---------------------------------------------------------------- UI wiring
const ui = new UI({
  action(act, data) {
    sfx.resume();
    switch (act) {
      case 'start-hand': start('hand'); break;
      case 'start-phone': start('phone'); break;
      case 'start-mouse': start('mouse'); break;
      case 'hand': toggleHand(); break;
      case 'phone': ensureWand(); ui.togglePanel('Phone'); break;
      case 'settings': ui.togglePanel('Settings'); break;
      case 'help': ui.togglePanel('Help'); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'close-panel': ui.closePanels(); break;
      case 'set': {
        const v = data.val; settings[data.key] = v; saveSettings(); settingChanged(data.key); ui.renderSettings(); break;
      }
      case 'add-cam': {
        const url = $('#ucUrl').value, name = $('#ucName').value.trim(), id = parseYouTubeId(url);
        if (!id) { ui.toast(t('badUrl')); break; }
        let tz = 'UTC'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { /* ignore */ }
        userCams = [{ key: 'user-' + id, user: true, yt: [id], ch: null, name: { tr: name || 'Benim kameram', en: name || 'My camera' }, place: { tr: 'Senin eklediğin yayın', en: 'Added by you' }, flag: '📍', tz, cat: 'user' }, ...userCams.filter((c) => c.key !== 'user-' + id)];
        store.set('fw.userCams', userCams); delete dead['yt:' + id]; store.set('fw.dead', dead);
        ui.setUserCams(userCams); ui.renderSettings(); buildList(); app.pos = -1; ui.toast(t('added') + ' ✓');
        break;
      }
      case 'remove-cam':
        userCams = userCams.filter((c) => c.key !== data.key); store.set('fw.userCams', userCams);
        ui.setUserCams(userCams); ui.renderSettings(); buildList(); break;
      case 'clear-dead':
        for (const k of Object.keys(dead)) delete dead[k];
        store.set('fw.dead', dead); app.ytDown = false; buildList(); deck.cancelStandby(); deck.prepare(200); ui.toast(t('cleared') + ' ✓'); break;
      default: break;
    }
  },
  settingChanged,
});
ui.setUserCams(userCams); ui.renderSettings();

function settingChanged(key) {
  switch (key) {
    case 'theme': fx.setTheme(settings.theme); break;
    case 'lang': ui.renderAll(); onWandStatus(app.wandStatus); ui.setHand(app.hand && app.hand.running ? t('handReady') : t('handOff'), app.hand && app.hand.running ? 'ok' : 'off'); break;
    case 'sfx': sfx.setEnabled(settings.sfx); break;
    case 'preview':
      if (app.hand) app.hand.previewOn = settings.preview;
      $('#camPreview').classList.toggle('hidden', !(settings.preview && app.hand && app.hand.running && !FAKE_HAND)); break;
    case 'cats': buildList(); deck.cancelStandby(); deck.prepare(200); break;
    case 'ambient': view.ambientOn = settings.ambient; break;
    case 'size':
      if (!app.portal.open) break;
      if (settings.size === 'full') { setFull(true); break; }
      if (app.portal.full) setFull(false);
      if (settings.size !== 'gesture') {
        const p = app.portal; p.cx = app.W / 2; p.cy = app.H / 2;
        setPortalRadius((settings.size === 'huge' ? 0.62 : 0.49) * app.minDim);
      }
      break;
    default: break;
  }
}

function start(mode) {
  if (!app.started) {
    app.started = true; ui.hideStart(); sfx.init(); ensureWand();
    if (!FORCE_OFFLINE) deck.prepare(200); // warm up the first live cam before any portal is drawn
  }
  app.mode = mode;
  if (mode === 'hand') toggleHand(true);
  if (mode === 'phone') ui.openPanel('Phone');
  app.lastActivity = now() - 10; // show the hint right away
}

addEventListener('resize', () => {
  app.W = innerWidth; app.H = innerHeight; app.minDim = Math.min(app.W, app.H);
  fx.resize(); view.layout();
  if (app.portal.open) {
    const p = app.portal, R = Math.min(p.R, 0.49 * app.minDim);
    p.cx = clamp(p.cx, R, app.W - R); p.cy = clamp(p.cy, R, app.H - R);
    if (p.full) { p.R = R; fx.setGeometry(p.cx, p.cy, R); placeLabel(); } else setPortalRadius(R);
  }
});

// ---------------------------------------------------------------- frame loop
let last = performance.now(), secT = 0;
function frame(nowMs) {
  const dt = Math.min(0.05, Math.max(0, (nowMs - last) / 1000)); last = nowMs;
  const tSec = nowMs / 1000;
  if (app.hand) app.hand.tick(nowMs);
  fx.update(dt, tSec);

  // Compliant ("window") mode: once a live stream plays, show it unframed with nothing drawn over it.
  const wantWin = settings.compliant && app.portal.open && (app.portal.status === 'live' || app.portal.status === 'recorded') && fx.portal.state === 'open';
  if (wantWin !== (view.mode === 'window')) {
    view.mode = wantWin ? 'window' : 'portal'; fx.hidden = wantWin;
    app.relabel = true;
  }
  const fp = fx.portal;
  // ambient light fades in as the portal opens and while the stream is visible (not during the loading vortex)
  const amb = 0.9 * clamp(fp.clipR / Math.max(1, 0.8 * app.portal.R), 0, 1) * (1 - 0.85 * fp.overlay);
  view.frame(fp.cx, fp.cy, fp.clipR, fp.videoR, fp.zoom || 1, amb);
  if (app.relabel) { app.relabel = false; placeLabel(); }
  if (app.portal.pendingFull && fx.portal.state === 'open') setFull(true); // "Full screen" size setting
  view.renderOffline(tSec, dt);
  fx.render();
  sfx.tick(dt);
  ui.tick(tSec, app);

  const idle = tSec - app.lastActivity;
  if (app.started && !app.portal.open && fx.portal.state === 'closed' && idle > 2.5 && !ui.panelOpen()) {
    ui.hint(app.hand && app.hand.running ? t('hintHand') : app.wands.size ? t('hintPhone') : t('hintMouse'));
  } else ui.hint(null);

  if (tSec - secT > 1) {
    secT = tSec;
    if (app.hand && app.hand.running) ui.setHand(`${Math.round(app.hand.fps)} fps`, 'ok');
  }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- boot
ui.setHand(t('handOff'), 'off');
ui.setWand({ state: 'off', chip: '—', level: 'off' });
buildList();
requestAnimationFrame(frame);
if (qs.get('auto')) start(qs.get('auto'));

// test/debug API
Object.assign(app, {
  api: {
    open: (pick) => openPortalAt(app.W / 2, app.H / 2, 0.4 * app.minDim, 1, -Math.PI / 2, pick),
    close: closePortal, hop, feed, toggleHand, start, onWandEvent, onWandMotion, setPortalRadius, setFull,
    state: () => ({ open: app.portal.open, full: app.portal.full, fxState: fx.portal.state, status: app.portal.status, entry: app.portal.entry && app.portal.entry.key, particles: fx.n, R: app.portal.R, fxR: Math.round(fx.portal.curR), mode: view.mode }),
  },
});
