// End-to-end smoke test in headless Chromium.
//   npm i -D playwright   (or set PW_MODULE to a playwright-core entry)   then: node tests/smoke.mjs
// Uses ?offline=1 (procedural portal) so it runs without YouTube; also checks the YouTube-down fallback.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const OUT = process.env.SHOT_DIR || join(root, 'tests', 'screenshots');
mkdirSync(OUT, { recursive: true });
const pw = await import(process.env.PW_MODULE || 'playwright');
const chromium = pw.chromium || (pw.default && pw.default.chromium);
const PORT = 8099, BASE = `http://localhost:${PORT}/`;
const server = spawn(process.execPath, [join(root, 'tools', 'serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const results = []; let failed = 0;
const check = (name, ok, extra = '') => { results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IGNORE = /peerjs|net::ERR|Failed to load resource|youtube|jsdelivr|googleapis|WebSocket|ERR_NAME|ERR_CONNECTION|ERR_TUNNEL|socket|Could not connect|Lost connection/i;

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROME || undefined,
  args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
async function newPage(path, w = 1600, h = 900) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(BASE + path, { waitUntil: 'load' });
  await sleep(400);
  return { page, errors };
}
async function drawCircle(page, cx, cy, r, dur = 900, turns = 1.1) {
  const steps = Math.round(dur / 16);
  await page.mouse.move(cx + r, cy); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { const a = (i / steps) * Math.PI * 2 * turns; await page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a)); await sleep(16); }
  await page.mouse.up();
}
const state = (page) => page.evaluate(() => window.__portal.api.state());

try {
  // 1) Mouse: start screen → draw circle → portal opens → hop → swipe → close
  {
    const { page, errors } = await newPage('index.html?offline=1');
    await page.screenshot({ path: join(OUT, '01-start.png') });
    await page.click('[data-act="start-mouse"]');
    await sleep(3000);
    await page.screenshot({ path: join(OUT, '02-idle-hint.png') });
    await drawCircle(page, 520, 330, 170);
    await sleep(250);
    await page.screenshot({ path: join(OUT, '03-opening.png') });
    let s = await state(page);
    check('mouse circle opens a portal', s.open === true, JSON.stringify(s));
    check('portal opens where the circle was drawn (not centered)', Math.abs(s.cx - 520) < 40 && Math.abs(s.cy - 330) < 40, `${s.cx},${s.cy}`);
    await sleep(2200);
    s = await state(page);
    check('portal reaches open state with offline scene', s.fxState === 'open' && s.status === 'offline', JSON.stringify(s));
    await page.screenshot({ path: join(OUT, '04-open.png') });
    const ev0 = await page.evaluate(() => window.__portal.events.length);
    await page.keyboard.press('ArrowRight'); await sleep(200);
    await page.screenshot({ path: join(OUT, '05-hop.png') });
    await sleep(900);
    // fast horizontal flick = swipe. Injected with exact timestamps: headless Chromium without a GPU
    // delivers real mouse events ~130 ms apart, which is too slow to count as a flick.
    await page.evaluate(() => {
      const { feed } = window.__portal.api, t0 = performance.now() / 1000;
      for (let i = 0; i <= 12; i++) feed('flick', 500 + i * 50, 700 + (i % 2), true, t0 + i * 0.016, 'mouse');
      feed('flick', 1100, 700, false, t0 + 0.25, 'mouse');
    });
    await sleep(300);
    const evs = await page.evaluate((n) => window.__portal.events.slice(n).map((e) => e.e), ev0);
    check('arrow key hops', evs.includes('hop'), evs.join(','));
    check('fast flick is recognized as a swipe', evs.includes('swipe'), evs.join(','));
    await page.mouse.wheel(0, -300); await sleep(200);
    await page.keyboard.press('t'); await sleep(900);
    await page.screenshot({ path: join(OUT, '06-theme-aurora.png') });
    await page.keyboard.press('Enter'); await sleep(1800);
    s = await state(page);
    check('Enter grows the portal to full screen', s.full === true && s.fxR > 900, JSON.stringify(s));
    await page.screenshot({ path: join(OUT, '06b-full.png') });
    await page.keyboard.press('ArrowDown'); await sleep(1800);
    s = await state(page);
    check('ArrowDown returns from full screen', s.full === false && s.fxR < 500, JSON.stringify(s));
    await page.keyboard.press('Escape'); await sleep(250);
    await page.screenshot({ path: join(OUT, '07-closing.png') });
    await sleep(700);
    s = await state(page);
    check('Esc closes the portal', s.open === false && s.fxState === 'closed', JSON.stringify(s));
    await page.keyboard.press('h'); await sleep(200);
    await page.screenshot({ path: join(OUT, '08-help.png') });
    await page.keyboard.press('Escape'); await page.keyboard.press('o'); await sleep(200);
    await page.screenshot({ path: join(OUT, '09-settings.png') });
    await page.keyboard.press('Escape'); await page.keyboard.press('p'); await sleep(500);
    await page.screenshot({ path: join(OUT, '10-phone-panel.png') });
    const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); })(); }));
    check('renders at a usable frame rate (headless, no GPU)', fps >= 20, `${fps} fps`);
    check('no JS errors (mouse page)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 1b) Opening animation frames (ignite → spin-up → tear open → open)
  {
    const { page, errors } = await newPage('index.html?offline=1&auto=mouse');
    await page.evaluate(() => { const { feed } = window.__portal.api, t0 = performance.now() / 1000;
      for (let i = 0; i <= 60; i++) { const a = -Math.PI / 2 + (i / 60) * Math.PI * 2 * 1.1; feed('m2', 700 + 150 * Math.cos(a), 450 + 150 * Math.sin(a), true, t0 + i * 0.016, 'mouse'); }
      feed('m2', 700, 300, false, t0 + 1, 'mouse'); });
    for (const [ms, name] of [[250, '1-ignite'], [650, '2-spin'], [950, '3-tear'], [1300, '4-growing'], [2200, '5-open']]) {
      await page.waitForFunction((t) => performance.now() - window.__openedAt >= t, ms, { timeout: 5000 }).catch(() => {});
      await page.screenshot({ path: join(OUT, `opening-${name}.png`) });
    }
    check('no JS errors (opening sequence)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 2) Scripted hand (?fakehand=1): circle → open, ✌️ → hop, ✊ → close
  {
    const { page, errors } = await newPage('index.html?offline=1&fakehand=1&auto=hand');
    await sleep(3200);
    let s = await state(page);
    check('hand circle opens a portal', s.open === true, JSON.stringify(s));
    await page.screenshot({ path: join(OUT, '11-hand-open.png') });
    await sleep(5000);
    const evs = await page.evaluate(() => window.__portal.events.map((e) => e.e + (e.label ? ':' + e.label : '')));
    s = await state(page);
    check('hand ✌️ pose hops', evs.includes('pose:Victory'), evs.join(','));
    check('hand fist closes the portal', evs.includes('pose:Closed_Fist') && s.open === false, evs.join(','));
    check('no JS errors (hand page)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 3) Phone wand protocol (messages injected as if they came over WebRTC)
  {
    const { page, errors } = await newPage('index.html?offline=1&auto=mouse');
    await page.evaluate(async () => {
      const api = window.__portal.api; api.onWandEvent('phone1', { t: 'hello' });
      const steps = 60; let px = 0, py = 0;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2 * 1.1, x = 0.2 * Math.cos(a), y = 0.2 * Math.sin(a);
        api.onWandMotion('phone1', i ? x - px : 0, i ? y - py : 0, true); px = x; py = y;
        await new Promise((r) => setTimeout(r, 16));
      }
      api.onWandMotion('phone1', 0, 0, false);
    });
    await sleep(1200);
    let s = await state(page);
    check('phone wand circle opens a portal', s.open === true, JSON.stringify(s));
    const n0 = await page.evaluate(() => window.__portal.events.length);
    await page.evaluate(() => window.__portal.api.onWandEvent('phone1', { t: 'shake' }));
    await page.evaluate(() => window.__portal.api.onWandEvent('phone1', { t: 'btn', b: 'close' }));
    await sleep(800);
    const evs = await page.evaluate((n) => window.__portal.events.slice(n).map((e) => e.e), n0);
    s = await state(page);
    check('phone shake hops and close button closes', evs.includes('hop') && s.open === false, evs.join(','));
    check('no JS errors (wand protocol)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 4) YouTube unreachable → graceful offline fallback (this sandbox blocks youtube.com)
  {
    const { page, errors } = await newPage('index.html?auto=mouse');
    await page.keyboard.press(' ');
    await sleep(16000);
    const s = await state(page);
    check('YouTube-down fallback shows the offline portal', s.open === true && s.status === 'offline', JSON.stringify(s));
    await page.screenshot({ path: join(OUT, '12-yt-fallback.png') });
    check('no JS errors (fallback page)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 5) Phone page (mobile viewport)
  {
    const { page, errors } = await newPage('wand.html?c=ABCDE', 390, 844);
    await page.screenshot({ path: join(OUT, '13-wand-setup.png') });
    await page.click('#go'); await sleep(600);
    const visible = await page.isVisible('#pad');
    check('phone page activates and shows the pad', visible);
    await page.screenshot({ path: join(OUT, '14-wand-pad.png') });
    check('no JS errors (phone page)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 6) Source checker page
  {
    const { page, errors } = await newPage('sources.html');
    const rows = await page.evaluate(() => window.__sources.rows);
    check('source checker lists all sources', rows > 150, `${rows} rows`);
    check('no JS errors (sources page)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 7) Small screen (phone as the big screen / narrow window)
  {
    const { page, errors } = await newPage('index.html?offline=1', 390, 844);
    await page.screenshot({ path: join(OUT, '15-mobile-start.png') });
    await page.click('[data-act="start-mouse"]'); await sleep(300);
    await page.evaluate(() => window.__portal.api.open()); await sleep(1400);
    await page.screenshot({ path: join(OUT, '16-mobile-open.png') });
    check('no JS errors (small screen)', errors.length === 0, errors.join(' | '));
    await page.close();
  }
  // 8) Own videos: file (IndexedDB, survives reload), drag & drop, direct link; plays even with YouTube offline
  {
    const { page, errors } = await newPage('index.html?offline=1&auto=mouse');
    const addFile = (name) => page.evaluate(async (n) => {
      const b = await (await fetch('tests/fixtures/sample.webm')).blob();
      return (await window.__portal.api.addFiles([new File([b], n, { type: 'video/webm' })])).map((e) => e.key);
    }, name);
    const keys = await addFile('kapadokya_balon.webm');
    await sleep(2600);
    let s = await state(page);
    check('own video file opens in the portal', s.open === true && s.status === 'own' && s.entry === keys[0], JSON.stringify(s));
    const playing = await page.evaluate(() => [...document.querySelectorAll('video.own-video')].some((v) => !v.paused && v.currentTime > 0.1));
    check('own video is actually playing', playing);
    await page.screenshot({ path: join(OUT, '17-own-video.png') });
    // drag & drop a second file onto the screen
    await page.evaluate(async () => {
      const b = await (await fetch('tests/fixtures/sample.webm')).blob(), dt = new DataTransfer();
      dt.items.add(new File([b], 'drop test.webm', { type: 'video/webm' }));
      dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, cancelable: true }));
      window.__dropShown = !document.querySelector('#dropOverlay').classList.contains('hidden');
      dispatchEvent(new DragEvent('drop', { dataTransfer: dt, cancelable: true }));
    });
    await sleep(2200);
    const dropShown = await page.evaluate(() => window.__dropShown);
    const own = await page.evaluate(() => window.__portal.api.own());
    s = await state(page);
    check('drag & drop shows the overlay and adds the video', dropShown && own.length === 2 && s.status === 'own' && s.entry === own[0], `${dropShown} ${JSON.stringify(own)} ${JSON.stringify(s)}`);
    // direct link
    const linkKey = await page.evaluate(() => { const e = window.__portal.api.addVideoUrl(location.origin + '/tests/fixtures/sample.webm', 'Link test'); return e && e.key; });
    await sleep(2200);
    s = await state(page);
    check('direct video link plays in the portal', s.status === 'own' && s.entry === linkKey, JSON.stringify(s));
    await page.keyboard.press('o'); await sleep(250);
    await page.screenshot({ path: join(OUT, '18-settings-own.png') });
    await page.keyboard.press('Escape');
    // persistence: reload → the two files come back from IndexedDB, the link from localStorage
    await page.reload({ waitUntil: 'load' }); await sleep(900);
    const after = await page.evaluate(() => window.__portal.api.own());
    check('own videos survive a reload', after.length === 3, JSON.stringify(after));
    await page.evaluate(() => window.__portal.api.removeVideo(window.__portal.api.own()[0]));
    await sleep(300);
    const left = await page.evaluate(() => window.__portal.api.own().length);
    check('removing an own video works', left === 2, String(left));
    // with YouTube offline, hops cycle through own videos instead of the offline scene
    await page.evaluate(() => window.__portal.api.open()); await sleep(2600);
    s = await state(page);
    check('offline mode still plays own videos', s.status === 'own', JSON.stringify(s));
    check('no JS errors (own videos)', errors.length === 0, errors.join(' | '));
    await page.close();
  }
  // 9) Recording mode (R), debug overlay (D), number keys
  {
    const { page, errors } = await newPage('index.html?offline=1&auto=mouse');
    await page.keyboard.press('d'); await sleep(700);
    const dbg = await page.evaluate(() => { const el = document.querySelector('#debug'); return !el.classList.contains('hidden') && el.textContent; });
    check('D shows the debug overlay', !!dbg && /fps \d+/.test(dbg) && /standby/.test(dbg), String(dbg).split('\n')[0]);
    await page.keyboard.press('d');
    await page.keyboard.press('2'); await sleep(1600);
    let s = await state(page);
    check('number key opens a portal to a chosen place', s.open === true, JSON.stringify(s));
    await page.keyboard.press('r'); await sleep(300);
    const hudHidden = !(await page.isVisible('#hud')), label = await page.isVisible('#label');
    check('R hides the UI for recording but keeps the place name', hudHidden && label, `hud hidden ${hudHidden}, label ${label}`);
    await page.screenshot({ path: join(OUT, '19-rec-mode.png') });
    await page.keyboard.press('r'); await sleep(200);
    check('R again brings the UI back', await page.isVisible('#hud'));
    check('no JS errors (rec/debug)', errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 10) OBS overlay: transparent page, no start screen, fixed phone code
  {
    const { page, errors } = await newPage('index.html?obs=1&offline=1&code=obs42', 1280, 720);
    await sleep(600);
    const info = await page.evaluate(() => ({
      started: window.__portal.started, startHidden: document.querySelector('#start').offsetParent === null,
      bg: getComputedStyle(document.body).backgroundColor, code: window.__portal.api.wandCode(),
    }));
    check('OBS mode starts without the start screen on a transparent page', info.started && info.startHidden && /rgba\(0, 0, 0, 0\)|transparent/.test(info.bg), JSON.stringify(info));
    check('OBS mode keeps the phone code from ?code=', info.code === 'OBS42', String(info.code));
    await page.evaluate(() => window.__portal.api.open()); await sleep(2400);
    await page.screenshot({ path: join(OUT, '20-obs-overlay.png'), omitBackground: true });
    const corner = await page.evaluate(() => getComputedStyle(document.querySelector('#ambient')).display);
    check('OBS mode has no ambient fill around the portal', corner === 'none', corner);
    check('no JS errors (OBS mode)', errors.length === 0, errors.join(' | '));
    await page.close();
  }
  // 11) Phone wand: an imperfect circle (flattened, 290°, slow) counts when the pad is released;
  //     a half circle gives a "why not" hint instead of silence
  {
    const { page, errors } = await newPage('index.html?offline=1&auto=mouse');
    const stroke = (turns, squash, dur) => page.evaluate(async ([turns, squash, dur]) => {
      const api = window.__portal.api; api.onWandEvent('p2', { t: 'hello' });
      const steps = Math.round(dur * 60); let px = 0, py = 0;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2 * turns, x = 0.22 * Math.cos(a) + 0.01 * Math.sin(i * 1.7), y = 0.22 * squash * Math.sin(a);
        api.onWandMotion('p2', i ? x - px : 0, i ? y - py : 0, true); px = x; py = y;
        await new Promise((r) => setTimeout(r, 16));
      }
      api.onWandMotion('p2', 0, 0, false);
    }, [turns, squash, dur]);
    await stroke(0.5, 1, 0.8); await sleep(300);
    let evs = await page.evaluate(() => window.__portal.events.map((e) => e.e + (e.why ? ':' + e.why : '')));
    let s = await state(page);
    check('wand half circle does not open, explains why', s.open === false && evs.includes('miss:partial'), evs.join(','));
    await sleep(2600);
    await stroke(0.8, 0.5, 2.6); await sleep(1500);
    evs = await page.evaluate(() => window.__portal.events.map((e) => e.e + (e.via ? ':' + e.via : '')));
    s = await state(page);
    check('wand imperfect circle opens the portal (live or on release)', s.open === true && evs.some((e) => e.startsWith('circle')), evs.join(','));
    check('no JS errors (wand strokes)', errors.length === 0, errors.join(' | '));
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(results.join('\n'));
console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
process.exit(failed ? 1 : 0);
