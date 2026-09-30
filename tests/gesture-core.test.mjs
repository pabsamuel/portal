// Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircleDetector, SwipeDetector, HoldDetector, ShakeDetector, OneEuro, airMouseDelta, TAU,
} from '../js/gesture-core.js';

// Deterministic pseudo-random for reproducible noise.
function rng(seed = 7) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function feed(det, pts) {
  let ev = null;
  for (const p of pts) { const e = det.push(p.x, p.y, p.t); if (e && !ev) ev = e; }
  return ev;
}
function circlePts({ cx = 0.9, cy = 0.5, r = 0.2, dur = 1.0, turns = 1.0, dir = 1, hz = 60, t0 = 0, noise = 0, a0 = 0, squash = 1 }) {
  const out = []; const R = rng(11); const n = Math.round(dur * hz);
  for (let i = 0; i <= n; i++) {
    const a = a0 + dir * TAU * turns * (i / n);
    out.push({
      x: cx + r * Math.cos(a) + (R() - 0.5) * noise,
      y: cy + r * squash * Math.sin(a) + (R() - 0.5) * noise,
      t: t0 + (i / n) * dur,
    });
  }
  return out;
}
function linePts({ x0, y0, x1, y1, dur, hz = 60, t0 = 0 }) {
  const out = []; const n = Math.round(dur * hz);
  for (let i = 0; i <= n; i++) out.push({ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n, t: t0 + i / n * dur });
  return out;
}

test('clean clockwise circle triggers with correct center, radius and direction', () => {
  const ev = feed(new CircleDetector(), circlePts({ r: 0.2, dur: 1.0, turns: 1.0 }));
  assert.ok(ev, 'expected a circle');
  assert.equal(ev.dir, 1);
  assert.ok(Math.abs(ev.cx - 0.9) < 0.03 && Math.abs(ev.cy - 0.5) < 0.03);
  assert.ok(Math.abs(ev.r - 0.2) < 0.03);
});

test('counter-clockwise circle triggers with dir -1', () => {
  const ev = feed(new CircleDetector(), circlePts({ dir: -1 }));
  assert.ok(ev); assert.equal(ev.dir, -1);
});

test('noisy hand-like circle (jitter ±1.5% of screen) still triggers', () => {
  assert.ok(feed(new CircleDetector(), circlePts({ noise: 0.03, r: 0.18, dur: 1.2 })));
});

test('slightly elliptical circle (aspect 0.75) triggers', () => {
  assert.ok(feed(new CircleDetector(), circlePts({ squash: 0.75 })));
});

test('fast (0.45 s) and slow (2.0 s) circles trigger', () => {
  assert.ok(feed(new CircleDetector(), circlePts({ dur: 0.45 })));
  assert.ok(feed(new CircleDetector(), circlePts({ dur: 2.0 })));
});

test('partial arc (70%) does NOT trigger', () => {
  assert.equal(feed(new CircleDetector(), circlePts({ turns: 0.7 })), null);
});

test('tiny circle below rMin does NOT trigger', () => {
  assert.equal(feed(new CircleDetector(), circlePts({ r: 0.03 })), null);
});

test('still hand with sensor jitter does NOT trigger', () => {
  const R = rng(3); const pts = [];
  for (let i = 0; i < 240; i++) pts.push({ x: 0.9 + (R() - 0.5) * 0.02, y: 0.5 + (R() - 0.5) * 0.02, t: i / 60 });
  assert.equal(feed(new CircleDetector(), pts), null);
});

test('straight lines and zig-zags do NOT trigger a circle', () => {
  assert.equal(feed(new CircleDetector(), linePts({ x0: 0.2, y0: 0.5, x1: 1.5, y1: 0.5, dur: 0.6 })), null);
  const zig = []; for (let i = 0; i < 180; i++) zig.push({ x: 0.5 + 0.3 * Math.sign(Math.sin(i / 8)), y: 0.5 + (i % 16) / 80, t: i / 60 });
  assert.equal(feed(new CircleDetector(), zig), null);
});

test('approach motion before the circle does not prevent detection', () => {
  const approach = linePts({ x0: 0.2, y0: 0.9, x1: 1.1, y1: 0.5, dur: 0.5 });
  const circ = circlePts({ cx: 0.9, cy: 0.5, r: 0.2, t0: 0.52, a0: 0 });
  assert.ok(feed(new CircleDetector(), [...approach, ...circ]));
});

test('cooldown prevents double trigger from 1.5 turns', () => {
  const det = new CircleDetector(); let count = 0;
  for (const p of circlePts({ turns: 1.5, dur: 1.4 })) if (det.push(p.x, p.y, p.t)) count++;
  assert.equal(count, 1);
});

test('fast straight horizontal flick triggers a swipe (both directions)', () => {
  const right = feed(new SwipeDetector(), linePts({ x0: 0.4, y0: 0.5, x1: 0.9, y1: 0.52, dur: 0.25 }));
  assert.ok(right); assert.equal(right.dir, 1);
  const left = feed(new SwipeDetector(), linePts({ x0: 1.2, y0: 0.5, x1: 0.7, y1: 0.48, dur: 0.25 }));
  assert.ok(left); assert.equal(left.dir, -1);
});

test('slow drift and vertical flick do NOT trigger a swipe', () => {
  assert.equal(feed(new SwipeDetector(), linePts({ x0: 0.4, y0: 0.5, x1: 0.9, y1: 0.5, dur: 1.5 })), null);
  assert.equal(feed(new SwipeDetector(), linePts({ x0: 0.8, y0: 0.2, x1: 0.8, y1: 0.8, dur: 0.25 })), null);
});

test('drawing circles (normal speeds) does NOT trigger swipes', () => {
  for (const [r, dur] of [[0.2, 1.0], [0.35, 1.5], [0.3, 0.8], [0.15, 0.6], [0.4, 2.0]]) {
    assert.equal(feed(new SwipeDetector(), circlePts({ r, dur, turns: 1.2 })), null, `r=${r} dur=${dur}`);
  }
});

test('hold detector fires once after the hold time, re-arms on label change', () => {
  const h = new HoldDetector(0.4);
  assert.equal(h.update('Closed_Fist', 0), null);
  assert.equal(h.update('Closed_Fist', 0.3), null);
  assert.equal(h.update('Closed_Fist', 0.45), 'Closed_Fist');
  assert.equal(h.update('Closed_Fist', 0.9), null);
  h.update('Open_Palm', 1.0);
  h.update('Closed_Fist', 1.1);
  assert.equal(h.update('Closed_Fist', 1.6), 'Closed_Fist');
  assert.equal(new HoldDetector(0.1).update('None', 5), null);
});

test('shake detector needs 3 strong peaks within the window', () => {
  const s = new ShakeDetector();
  assert.equal(s.push(20, 0.0), false);
  assert.equal(s.push(20, 0.2), false);
  assert.equal(s.push(20, 0.4), true);
  const s2 = new ShakeDetector();
  s2.push(20, 0); s2.push(20, 1.0); assert.equal(s2.push(20, 2.0), false);
});

test('one-euro filter reduces jitter while tracking movement', () => {
  const f = new OneEuro(1.2, 6); const R = rng(5); let maxDev = 0;
  for (let i = 0; i < 120; i++) { const v = f.filter(0.5 + (R() - 0.5) * 0.02, i / 60); if (i > 30) maxDev = Math.max(maxDev, Math.abs(v - 0.5)); }
  assert.ok(maxDev < 0.006, `jitter not reduced enough: ${maxDev}`);
  const g = new OneEuro(1.2, 6); let v = 0;
  for (let i = 0; i < 30; i++) v = g.filter(i / 30, i / 60);
  assert.ok(v > 0.85, `lags too much: ${v}`);
});

test('air mouse: phone flat (remote grip) — turning left moves cursor left, tilting up moves it up', () => {
  const up = [0, 0, 1];
  const left = airMouseDelta({ alpha: 100, beta: 0, gamma: 0 }, up, 0.1, 0.012);
  assert.ok(left.dx < 0 && left.dy === 0);
  const tiltUp = airMouseDelta({ alpha: 0, beta: 100, gamma: 0 }, up, 0.1, 0.012);
  assert.ok(tiltUp.dy < 0 && tiltUp.dx === 0);
});

test('air mouse: phone upright (camera grip) — same directions, roll ignored', () => {
  const up = [0, 1, 0];
  assert.ok(airMouseDelta({ alpha: 0, beta: 0, gamma: 100 }, up, 0.1, 0.012).dx < 0);
  assert.ok(airMouseDelta({ alpha: 0, beta: 100, gamma: 0 }, up, 0.1, 0.012).dy < 0);
  const roll = airMouseDelta({ alpha: 100, beta: 0, gamma: 0 }, up, 0.1, 0.012);
  assert.equal(roll.dx, 0); assert.equal(roll.dy, 0);
});

test('air mouse: deadzone removes gyro drift', () => {
  const d = airMouseDelta({ alpha: 0.8, beta: -1.0, gamma: 0.5 }, [0, 0, 1], 0.1, 0.012);
  assert.equal(d.dx, 0); assert.equal(d.dy, 0);
});
