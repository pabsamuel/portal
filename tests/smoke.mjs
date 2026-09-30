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
    await drawCircle(page, 900, 450, 170);
    await sleep(250);
    await page.screenshot({ path: join(OUT, '03-opening.png') });
    let s = await state(page);
    check('mouse circle opens a portal', s.open === true, JSON.stringify(s));
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
    check('source checker lists all sources', rows > 40, `${rows} rows`);
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
} finally {
  await browser.close();
  server.kill();
}
console.log(results.join('\n'));
console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
process.exit(failed ? 1 : 0);
