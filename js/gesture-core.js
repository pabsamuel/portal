// gesture-core.js — pure gesture recognizers. No DOM, no browser APIs: runs in Node for tests.
//
// Coordinate units: 1 unit = min(screenWidth, screenHeight) in pixels, so circles stay
// circles on any screen. Time is in SECONDS.

export const TAU = Math.PI * 2;

export const DEFAULTS = {
  circle: {
    tMin: 0.35,        // fastest acceptable circle (s)
    tMax: 2.2,         // slowest acceptable circle (s) — also the trace buffer length
    rMin: 0.05,        // min radius (units)
    rMax: 0.65,        // max radius (units)
    roundMax: 0.34,    // std(r)/mean(r) — lower = rounder
    angleFrac: 0.85,   // fraction of a full turn required (0.85 = 306°)
    coherenceMin: 0.8, // |ΣΔθ| / Σ|Δθ| — rejects jitter and back-and-forth motion
    aspectMin: 0.5,    // bounding box w/h must be within [aspectMin, 1/aspectMin]
    cooldown: 0.9,     // s after a detection
    minPts: 10,
  },
  swipe: {
    window: 0.5,       // s of history examined
    minDx: 0.3,        // min horizontal travel (units)
    ratio: 2.0,        // |dx| must be >= ratio * |dy|
    straightMin: 0.9,  // displacement / path length
    peakSpeed: 1.8,    // units/s over any >=60 ms sub-window
    cooldown: 0.6,
  },
};

export const wrapAngle = (a) => a - TAU * Math.round(a / TAU);

/** Evaluate whether pts[s..e] form a circle. Returns {cx,cy,r,dir,startAngle,turns} or null. */
export function evalCircle(pts, s, e, o = DEFAULTS.circle) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = s; i <= e; i++) {
    const p = pts[i];
    if (p.x < minx) minx = p.x; if (p.x > maxx) maxx = p.x;
    if (p.y < miny) miny = p.y; if (p.y > maxy) maxy = p.y;
  }
  const bw = maxx - minx, bh = maxy - miny;
  if (Math.min(bw, bh) < 2 * o.rMin) return null;
  const asp = bw / bh;
  if (asp < o.aspectMin || asp > 1 / o.aspectMin) return null;
  const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;

  let sumR = 0, sumR2 = 0, sum = 0, sumAbs = 0, prevA = null, a0 = 0;
  const m = e - s + 1;
  for (let i = s; i <= e; i++) {
    const dx = pts[i].x - cx, dy = pts[i].y - cy;
    const r = Math.hypot(dx, dy);
    sumR += r; sumR2 += r * r;
    const a = Math.atan2(dy, dx);
    if (prevA === null) a0 = a;
    else { const d = wrapAngle(a - prevA); sum += d; sumAbs += Math.abs(d); }
    prevA = a;
  }
  const meanR = sumR / m;
  if (meanR < o.rMin || meanR > o.rMax) return null;
  const std = Math.sqrt(Math.max(0, sumR2 / m - meanR * meanR));
  if (std / meanR > o.roundMax) return null;
  if (Math.abs(sum) < o.angleFrac * TAU) return null;
  if (sumAbs === 0 || Math.abs(sum) / sumAbs < o.coherenceMin) return null;
  // Screen coordinates (y down): positive sum = clockwise on screen.
  return { cx, cy, r: meanR, dir: Math.sign(sum), startAngle: a0, turns: Math.abs(sum) / TAU };
}

/**
 * Shape statistics of pts[s..e] around their bounding-box center (no thresholds).
 * minStep (fraction of the estimated radius) makes the angle sums ignore sample-to-sample jitter:
 * only points at least that far from the last counted point add to the turn.
 */
export function circleStats(pts, s = 0, e = pts.length - 1, minStep = 0) {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = s; i <= e; i++) {
    const p = pts[i];
    if (p.x < minx) minx = p.x; if (p.x > maxx) maxx = p.x;
    if (p.y < miny) miny = p.y; if (p.y > maxy) maxy = p.y;
  }
  const bw = maxx - minx, bh = maxy - miny, cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
  const step = minStep * (bw + bh) / 4;
  let sumR = 0, sumR2 = 0, sum = 0, sumAbs = 0, prevA = null, a0 = 0, lx = 0, ly = 0;
  const m = e - s + 1;
  for (let i = s; i <= e; i++) {
    const px = pts[i].x, py = pts[i].y, dx = px - cx, dy = py - cy, r = Math.hypot(dx, dy);
    sumR += r; sumR2 += r * r;
    if (prevA !== null && i !== e && Math.hypot(px - lx, py - ly) < step) continue;
    const a = Math.atan2(dy, dx);
    if (prevA === null) a0 = a; else { const d = wrapAngle(a - prevA); sum += d; sumAbs += Math.abs(d); }
    prevA = a; lx = px; ly = py;
  }
  const r = sumR / m, std = Math.sqrt(Math.max(0, sumR2 / m - r * r));
  return {
    cx, cy, r, dir: Math.sign(sum) || 1, startAngle: a0,
    turns: Math.abs(sum) / TAU, round: r > 0 ? std / r : 1, coherence: sumAbs ? Math.abs(sum) / sumAbs : 0,
    aspect: bh > 0 && bw > 0 ? Math.min(bw / bh, bh / bw) : 0, size: Math.min(bw, bh),
  };
}

/**
 * Lenient whole-stroke circle check for pen-gated inputs (mouse button held, phone pad held).
 * The user marked where the stroke starts and ends, so wobbly, flattened or slightly open circles
 * still count. Returns {ok:true, cx, cy, r, dir, startAngle, turns} or {ok:false, why, stats}.
 * why: 'short' | 'small' | 'partial' | 'flat' | 'wobbly'
 */
export const STROKE_DEFAULTS = { tMin: 0.25, tMax: 6, rMin: 0.03, rMax: 0.9, roundMax: 0.5, angleFrac: 0.7, coherenceMin: 0.65, aspectMin: 0.3, minPts: 8 };
export function evalStroke(pts, o = STROKE_DEFAULTS) {
  let s0 = 0;
  const n = pts.length;
  if (n < o.minPts) return { ok: false, why: 'short', stats: null };
  while (s0 < n - 1 && pts[n - 1].t - pts[s0].t > o.tMax) s0++;
  if (pts[n - 1].t - pts[s0].t < o.tMin || n - s0 < o.minPts) return { ok: false, why: 'short', stats: null };
  let best = null;
  // also try without the first 10–30 % ("approach" before the loop starts)
  for (const f of [0, 0.1, 0.2, 0.3]) {
    const s = s0 + Math.floor((n - s0) * f);
    if (n - s < o.minPts) break;
    const st = circleStats(pts, s, n - 1, 0.25);
    const ok = st.r >= o.rMin && st.r <= o.rMax && st.aspect >= o.aspectMin && st.turns >= o.angleFrac && st.round <= o.roundMax && st.coherence >= o.coherenceMin;
    if (ok) return { ok: true, ...st };
    if (!best || st.turns > best.turns) best = st;
  }
  const why = best.r < o.rMin ? 'small' : best.turns < o.angleFrac ? 'partial' : best.aspect < o.aspectMin ? 'flat' : 'wobbly';
  return { ok: false, why, stats: best };
}

/** Detects a (roughly) circular stroke in a stream of points. */
export class CircleDetector {
  constructor(opts = {}) {
    this.o = { ...DEFAULTS.circle, ...opts };
    this.pts = [];
    this.coolUntil = -Infinity;
  }
  reset() { this.pts.length = 0; }
  push(x, y, t) {
    const o = this.o, pts = this.pts;
    const last = pts[pts.length - 1];
    if (last && t <= last.t) return null;
    pts.push({ x, y, t });
    while (pts.length && t - pts[0].t > o.tMax) pts.shift();
    if (t < this.coolUntil || pts.length < o.minPts) return null;
    const n = pts.length;
    const step = n > 90 ? 3 : n > 45 ? 2 : 1;
    // Try the longest window first; later starts drop the "approach" motion before the circle.
    for (let s = 0; s <= n - o.minPts; s += step) {
      const duration = t - pts[s].t;
      if (duration < o.tMin) break;
      const r = evalCircle(pts, s, n - 1, o);
      if (r) {
        this.coolUntil = t + o.cooldown;
        this.pts.length = 0;
        return { type: 'circle', ...r, duration };
      }
    }
    return null;
  }
  /** 0..1 — how close the current stroke is to a full circle. UI feedback only (never triggers). */
  progress() {
    const pts = this.pts, n = pts.length, o = this.o;
    if (n < 4) return 0;
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const p of pts) { if (p.x < minx) minx = p.x; if (p.x > maxx) maxx = p.x; if (p.y < miny) miny = p.y; if (p.y > maxy) maxy = p.y; }
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    let sum = 0, sumAbs = 0, sumR = 0, prev = null;
    for (const p of pts) {
      const a = Math.atan2(p.y - cy, p.x - cx);
      sumR += Math.hypot(p.x - cx, p.y - cy);
      if (prev !== null) { const d = wrapAngle(a - prev); sum += d; sumAbs += Math.abs(d); }
      prev = a;
    }
    if (sumR / n < o.rMin || sumAbs === 0 || Math.abs(sum) / sumAbs < 0.6) return 0;
    return Math.min(1, Math.abs(sum) / (o.angleFrac * TAU));
  }
}

/** Detects a fast, straight flick — horizontal (axis 'x') or vertical (axis 'y'). */
export class SwipeDetector {
  constructor(opts = {}) {
    this.o = { ...DEFAULTS.swipe, ...opts };
    this.pts = [];
    this.coolUntil = -Infinity;
  }
  reset() { this.pts.length = 0; }
  push(x, y, t) {
    const o = this.o, pts = this.pts;
    const last = pts[pts.length - 1];
    if (last && t <= last.t) return null;
    pts.push({ x, y, t });
    while (pts.length && t - pts[0].t > o.window) pts.shift();
    if (t < this.coolUntil || pts.length < 4) return null;
    const a = pts[0], b = pts[pts.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    let axis;
    if (ax >= o.minDx && ax >= o.ratio * ay) axis = 'x';
    else if (ay >= o.minDx && ay >= o.ratio * ax) axis = 'y';
    else return null;
    let path = 0, peak = 0, j = 0;
    for (let i = 1; i < pts.length; i++) {
      path += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      while (j < i && pts[i].t - pts[j + 1].t >= 0.06) j++;
      const dt = pts[i].t - pts[j].t;
      if (dt >= 0.06) peak = Math.max(peak, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) / dt);
    }
    if (path === 0 || Math.hypot(dx, dy) / path < o.straightMin) return null;
    if (peak < o.peakSpeed) return null;
    this.coolUntil = t + o.cooldown;
    this.pts.length = 0;
    // x: +1 = right, -1 = left · y: +1 = down, -1 = up (screen coordinates)
    return { type: 'swipe', axis, dir: axis === 'x' ? (dx > 0 ? 1 : -1) : (dy > 0 ? 1 : -1), speed: peak };
  }
}

/** Fires once when the same label has been held continuously for `hold` seconds. */
export class HoldDetector {
  constructor(hold = 0.45) { this.hold = hold; this.label = null; this.since = 0; this.fired = false; }
  update(label, t) {
    if (label !== this.label) { this.label = label; this.since = t; this.fired = false; return null; }
    if (label && label !== 'None' && !this.fired && t - this.since >= this.hold) { this.fired = true; return label; }
    return null;
  }
}

/** Counts acceleration peaks (m/s², gravity removed) to detect a shake. */
export class ShakeDetector {
  constructor(opts = {}) {
    this.o = { threshold: 16, peaks: 3, window: 0.8, gap: 0.08, cooldown: 1.2, ...opts };
    this.times = []; this.last = -Infinity; this.coolUntil = -Infinity;
  }
  push(mag, t) {
    const o = this.o;
    if (t < this.coolUntil) return false;
    if (mag > o.threshold && t - this.last > o.gap) { this.times.push(t); this.last = t; }
    while (this.times.length && t - this.times[0] > o.window) this.times.shift();
    if (this.times.length >= o.peaks) { this.times.length = 0; this.coolUntil = t + o.cooldown; return true; }
    return false;
  }
}

/** One Euro filter (Casiez et al. 2012): smooth when still, responsive when fast. */
export class OneEuro {
  constructor(minCutoff = 1.2, beta = 6, dCutoff = 1.0) {
    this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff; this.reset();
  }
  reset() { this.xPrev = null; this.dxPrev = 0; this.tPrev = null; }
  filter(x, t) {
    if (this.tPrev === null) { this.tPrev = t; this.xPrev = x; return x; }
    const dt = Math.max(1e-3, t - this.tPrev);
    this.tPrev = t;
    const ad = alpha(dt, this.dCutoff);
    const dx = (x - this.xPrev) / dt;
    const dxHat = ad * dx + (1 - ad) * this.dxPrev;
    const a = alpha(dt, this.minCutoff + this.beta * Math.abs(dxHat));
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat; this.dxPrev = dxHat;
    return xHat;
  }
}
function alpha(dt, cutoff) { const tau = 1 / (TAU * cutoff); return 1 / (1 + tau / dt); }

/**
 * Phone "air mouse": converts gyroscope rotation rates into a 2D cursor delta,
 * independent of how the phone is held (flat like a remote, or upright).
 *  rot: DeviceMotionEvent.rotationRate {alpha (z), beta (x), gamma (y)} in deg/s
 *  up:  unit "up" vector in the device frame (from accelerationIncludingGravity)
 * yaw   = rotation about world-vertical  → horizontal cursor motion
 * pitch = rotation about horizontal-right → vertical cursor motion
 * Roll (twisting around the pointing axis) is ignored.
 */
export function airMouseDelta(rot, up, dt, gain, deadzone = 1.5) {
  const w = [rot.beta || 0, rot.gamma || 0, rot.alpha || 0]; // x, y, z
  let yaw = w[0] * up[0] + w[1] * up[1] + w[2] * up[2];
  let rx = 1 - up[0] * up[0], ry = -up[0] * up[1], rz = -up[0] * up[2];
  let rl = Math.hypot(rx, ry, rz);
  if (rl < 0.2) { // phone held sideways: fall back to the device y axis
    rx = -up[1] * up[0]; ry = 1 - up[1] * up[1]; rz = -up[1] * up[2]; rl = Math.hypot(rx, ry, rz) || 1;
  }
  rx /= rl; ry /= rl; rz /= rl;
  let pitch = w[0] * rx + w[1] * ry + w[2] * rz;
  if (Math.abs(yaw) < deadzone) yaw = 0;
  if (Math.abs(pitch) < deadzone) pitch = 0;
  return { dx: -yaw * dt * gain || 0, dy: -pitch * dt * gain || 0 };
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
