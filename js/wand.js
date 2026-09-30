// wand.js — phone side. Turns gyroscope rotation into cursor motion ("air mouse") and streams it
// to the big screen over a WebRTC data channel. Hold the pad = pen down (gestures are recognized
// on the big screen). The pad also works as a touch trackpad when there is no gyroscope.
import { CONFIG } from './config.js';
import { airMouseDelta, ShakeDetector } from './gesture-core.js';

const $ = (s) => document.querySelector(s);
const TR = !(navigator.language || 'tr').toLowerCase().startsWith('en');
const S = TR ? {
  connecting: 'Bağlanıyor…', connected: 'Bağlandı', lost: 'Bağlantı koptu, tekrar deneniyor…', notFound: 'Ekran bulunamadı — kod doğru mu, ekran açık mı?',
  netErr: 'Ağ hatası, tekrar deneniyor…', noLib: 'Eşleştirme kütüphanesi yüklenemedi', badCode: 'Kod 5 karakter olmalı (ekranda yazıyor).',
  needHttps: 'Jiroskop için sayfa https:// ile açılmalı. Şimdilik ortadaki daireyi parmağınla kaydırarak çiz.',
  motionDenied: 'Hareket izni verilmedi. Safari’yi yenileyip tekrar “İzin ver” de; şimdilik parmakla çizebilirsin.',
  noGyro: 'Jiroskop verisi gelmiyor. Ortadaki daireyi parmağınla kaydırarak çizebilirsin.', closed: 'Portal kapalı — basılı tut ve daire çiz',
} : {
  connecting: 'Connecting…', connected: 'Connected', lost: 'Disconnected, retrying…', notFound: 'Screen not found — is the code right and the screen open?',
  netErr: 'Network error, retrying…', noLib: 'Pairing library failed to load', badCode: 'The code has 5 characters (shown on the screen).',
  needHttps: 'The gyroscope needs an https:// page. For now, drag your finger around the circle.',
  motionDenied: 'Motion access was denied. Reload Safari and tap “Allow”; meanwhile drag with your finger.',
  noGyro: 'No gyroscope data. You can drag your finger around the circle instead.', closed: 'Portal closed — hold and draw a circle',
};
const EN_UI = {
  title: 'Portal Wand', hello: 'Your phone is now a wand', intro: 'The code from the screen is filled in. Tap to start.', code: 'Code',
  activate: 'Activate wand', hold: 'HOLD &amp; DRAW<br>A CIRCLE IN THE AIR', prev: 'Previous', random: 'Random', next: 'Next', closeP: 'Close',
  center: 'Center', sound: 'Sound', fullP: 'Full', themeP: 'Theme', settings: 'Settings', speed: 'Cursor speed', invert: 'Invert left/right', free: 'Draw without holding (free mode)',
  tip: 'Tip: hold the phone like a remote and draw a wide, relaxed circle with your wrist. While a portal is open, hold and flick the phone up for full screen, down to go back. You can also drag your finger around the circle.',
};
if (!TR) { document.documentElement.lang = 'en'; document.querySelectorAll('[data-t]').forEach((el) => { if (EN_UI[el.dataset.t]) el.innerHTML = EN_UI[el.dataset.t]; }); }

const BASE_GAIN = 0.012;
const st = {
  peer: null, conn: null, connected: false, code: '', up: [0, 0, 1], flip: 1, calibrated: false, calib: [],
  acc: { x: 0, y: 0 }, lastSend: 0, lastDrawing: false, lastT: null, padDown: false, lastPad: null,
  gainMul: +(localStorage.getItem('fw.wand.gain') || 1), invX: localStorage.getItem('fw.wand.invx') === '1',
  free: localStorage.getItem('fw.wand.free') === '1', motionOK: false, retry: 0, openTimer: 0,
};
const shake = new ShakeDetector();

function status(level, text) { const el = $('#status'); el.className = 'status ' + level; el.querySelector('span').textContent = text; }
function sensorMsg(text) { $('#sensorMsg').textContent = text; }
function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch { /* ignore */ } }
function send(msg) { if (st.conn && st.connected) { try { st.conn.send(msg); } catch { /* ignore */ } } }
const normalize = (v) => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };

// ---- setup
const urlCode = new URLSearchParams(location.search).get('c');
$('#code').value = (urlCode || localStorage.getItem('fw.lastCode') || '').toUpperCase();
$('#gain').value = st.gainMul; $('#invx').checked = st.invX; $('#free').checked = st.free;
$('#gain').addEventListener('input', (e) => { st.gainMul = +e.target.value; localStorage.setItem('fw.wand.gain', st.gainMul); });
$('#invx').addEventListener('change', (e) => { st.invX = e.target.checked; localStorage.setItem('fw.wand.invx', st.invX ? '1' : '0'); });
$('#free').addEventListener('change', (e) => { st.free = e.target.checked; localStorage.setItem('fw.wand.free', st.free ? '1' : '0'); });

$('#go').addEventListener('click', async () => {
  const code = $('#code').value.trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(code)) { $('#setupMsg').textContent = S.badCode; return; }
  st.code = code; localStorage.setItem('fw.lastCode', code);
  let motion = 'granted';
  try { // iOS 13+: must be requested inside this tap
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') motion = await DeviceMotionEvent.requestPermission();
  } catch { motion = 'denied'; }
  if (!window.isSecureContext) sensorMsg(S.needHttps);
  else if (motion !== 'granted') sensorMsg(S.motionDenied);
  window.addEventListener('devicemotion', onMotion);
  wakeLock();
  $('#setup').classList.add('hidden'); $('#wand').classList.remove('hidden');
  $('#now').textContent = S.closed;
  connect();
  setTimeout(() => { if (!st.motionOK && window.isSecureContext && motion === 'granted') sensorMsg(S.noGyro); }, 2500);
});

// ---- connection
function connect() {
  const Peer = window.Peer || (window.peerjs && window.peerjs.Peer);
  if (!Peer) { status('warn', S.noLib); return; }
  status('busy', S.connecting);
  if (!st.peer || st.peer.destroyed) {
    st.peer = new Peer({ debug: 1 });
    st.peer.on('open', openConn);
    st.peer.on('disconnected', () => { try { st.peer.reconnect(); } catch { /* ignore */ } });
    st.peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') { status('warn', S.notFound); retry(3000); }
      else if (['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected'].includes(err.type)) { status('warn', S.netErr); retry(3000); }
      else console.warn('[wand]', err.type, err);
    });
  } else if (st.peer.open) openConn();
}
function openConn() {
  if (st.conn) { try { st.conn.close(); } catch { /* ignore */ } }
  const conn = st.peer.connect(CONFIG.PEER_PREFIX + st.code.toLowerCase(), { serialization: 'json', reliable: false });
  st.conn = conn;
  clearTimeout(st.openTimer);
  st.openTimer = setTimeout(() => { if (!st.connected) retry(0); }, 9000);
  conn.on('open', () => { clearTimeout(st.openTimer); st.connected = true; status('ok', S.connected); vibrate(30); });
  conn.on('data', (msg) => {
    if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch { return; } }
    if (!msg) return;
    if (msg.t === 'state') $('#now').textContent = msg.open ? `🌀 ${msg.name || '…'}` : S.closed;
    else if (msg.t === 'buzz') vibrate(Math.min(200, msg.ms || 30));
  });
  conn.on('close', () => { if (st.conn !== conn) return; st.connected = false; status('warn', S.lost); retry(2000); });
  conn.on('error', () => { if (st.conn !== conn) return; st.connected = false; retry(2500); });
}
function retry(ms) {
  clearTimeout(st.retry);
  st.retry = setTimeout(() => { if (st.connected) return; if (st.peer && st.peer.open) openConn(); else connect(); }, ms);
}

// ---- motion → cursor
function onMotion(e) {
  const t = performance.now() / 1000;
  const dt = st.lastT == null ? 0.016 : Math.min(0.05, Math.max(0, t - st.lastT));
  st.lastT = t;
  const g = e.accelerationIncludingGravity;
  if (g && g.x != null) {
    if (!st.calibrated) { // platforms disagree on the sign of gravity; the user holds the phone screen-up/facing them
      st.calib.push((g.y || 0) + (g.z || 0));
      if (st.calib.length >= 6) { st.flip = st.calib.reduce((a, b) => a + b, 0) < 0 ? -1 : 1; st.calibrated = true; }
    }
    const v = normalize([g.x * st.flip, g.y * st.flip, g.z * st.flip]);
    st.up = normalize(st.up.map((u, i) => u * 0.85 + v[i] * 0.15));
  }
  const r = e.rotationRate;
  if (r && (r.alpha != null || r.beta != null || r.gamma != null)) {
    st.motionOK = true;
    const d = airMouseDelta(r, st.up, dt, BASE_GAIN * st.gainMul);
    st.acc.x += st.invX ? -d.dx : d.dx; st.acc.y += d.dy;
  }
  const a = e.acceleration;
  if (a && a.x != null && shake.push(Math.hypot(a.x, a.y || 0, a.z || 0), t)) { send({ t: 'shake' }); vibrate(80); }
  flush(t);
}

function flush(t, force = false) {
  if (!st.connected) { st.acc.x = st.acc.y = 0; return; }
  const drawing = st.padDown || st.free;
  const changed = drawing !== st.lastDrawing;
  if (!force && !changed && t - st.lastSend < 1 / 60) return;
  if (!force && !changed && st.acc.x === 0 && st.acc.y === 0 && t - st.lastSend < 0.25) return;
  send({ t: 'm', x: +st.acc.x.toFixed(5), y: +st.acc.y.toFixed(5), d: drawing ? 1 : 0 });
  st.acc.x = st.acc.y = 0; st.lastSend = t; st.lastDrawing = drawing;
}

// ---- pad: hold = pen down; drag = trackpad
const pad = $('#pad');
pad.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  try { pad.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  st.padDown = true; st.lastPad = { x: e.clientX, y: e.clientY };
  pad.classList.add('active'); vibrate(15); flush(performance.now() / 1000, true);
});
pad.addEventListener('pointermove', (e) => {
  if (!st.padDown || !st.lastPad) return;
  const w = pad.clientWidth || 300;
  st.acc.x += ((e.clientX - st.lastPad.x) / w) * 1.1 * st.gainMul;
  st.acc.y += ((e.clientY - st.lastPad.y) / w) * 1.1 * st.gainMul;
  st.lastPad = { x: e.clientX, y: e.clientY };
  flush(performance.now() / 1000);
});
const padUp = () => { if (!st.padDown) return; st.padDown = false; st.lastPad = null; pad.classList.remove('active'); flush(performance.now() / 1000, true); };
pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp); pad.addEventListener('lostpointercapture', padUp);
pad.addEventListener('contextmenu', (e) => e.preventDefault());

document.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => { send({ t: 'btn', b: b.dataset.b }); vibrate(15); }));
$('#recenter').addEventListener('click', () => { send({ t: 'recenter' }); vibrate(15); });

// ---- keep the screen awake and reconnect after the phone sleeps
async function wakeLock() { try { if (navigator.wakeLock) st.wl = await navigator.wakeLock.request('screen'); } catch { /* ignore */ } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.code) { wakeLock(); if (!st.connected) connect(); } });
