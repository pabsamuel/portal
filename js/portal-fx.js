// portal-fx.js — Canvas 2D effects: spark-ring portal (ignite → spin-up → tear open), loading vortex,
// hop/close/full-screen transitions, gesture trails, cursor sparks, ambient embers.
// Everything is drawn in CSS pixels on one full-screen canvas that sits ABOVE the video layer.
import { TAU, clamp } from './gesture-core.js';

export const THEMES = {
  ember:  { heat: ['#fffbe8', '#ffd875', '#ffa334', '#ff6418', '#b83000'], glow: '255,150,40',  core: '255,242,205', deep: '46,12,0',  trail: '255,176,70' },
  aurora: { heat: ['#f4ffff', '#aef5ff', '#3fdcff', '#8c62ff', '#4320a0'], glow: '70,205,255',  core: '232,255,255', deep: '6,12,44',  trail: '120,222,255' },
  plasma: { heat: ['#fff2ff', '#ffb8f1', '#ff52d9', '#b52cff', '#50107f'], glow: '255,80,220',  core: '255,232,255', deep: '34,0,44',  trail: '255,125,232' },
  frost:  { heat: ['#ffffff', '#e2f7ff', '#a2ddff', '#4ea6ff', '#1d4ea0'], glow: '150,210,255', core: '242,250,255', deep: '6,16,38',  trail: '172,222,255' },
};
export const THEME_KEYS = Object.keys(THEMES);

// Opening timeline (seconds): ignite the drawn circle → spin-up → tear open to full size
export const OPEN_T = { ignite: 0.5, spin: 0.78, open: 1.5 };

const MAX = 7000;
const K_ORBIT = 0, K_FLUNG = 1, K_EMBER = 2, K_BURST = 3, K_VORTEX = 4;
const TRAIL_LIFE = 2.2; // s — as long as the slowest accepted circle
const lerp = (a, b, k) => a + (b - a) * k;
const easeOutBack = (k, c1 = 1.3) => { const c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
const easeInBack = (k, c1 = 1.4) => (c1 + 1) * k * k * k - c1 * k * k;
const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const easeOutCubic = (k) => 1 - (1 - k) ** 3;

function makeGlowSprite(th) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, `rgba(${th.core},0.95)`);
  grd.addColorStop(0.45, `rgba(${th.glow},0.35)`);
  grd.addColorStop(1, `rgba(${th.glow},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return c;
}

export class FX {
  constructor(canvas, themeName = 'ember') {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.x = new Float32Array(MAX); this.y = new Float32Array(MAX);
    this.vx = new Float32Array(MAX); this.vy = new Float32Array(MAX);
    this.life = new Float32Array(MAX); this.max = new Float32Array(MAX);
    this.heat = new Float32Array(MAX); this.kind = new Uint8Array(MAX); this.bucket = new Uint8Array(MAX);
    this.n = 0; this.carry = 0; this.vCarry = 0; this.ambCarry = 0;
    this.pointers = new Map();
    this.portal = {
      state: 'closed', cx: 0, cy: 0, tcx: 0, tcy: 0, R: 0, curR: 0, renderR: 0, clipR: 0, videoR: 0, zoom: 1,
      dir: 1, t: 0, a0: 0, head: 0, traceK: 1, from: null, charge: 0, torn: false,
      overlay: 0, loading: false, flare: 0, flash: 0, dip: 0, shock: [], closeFrom: 0, closeDur: 0.55,
      full: false, home: null, fullK: 0,
    };
    this.time = 0; this.ambient = true; this.hidden = false; this.suppressPortal = false;
    this.setTheme(themeName);
    this.resize();
  }

  setTheme(name) { this.themeName = THEMES[name] ? name : 'ember'; this.theme = THEMES[this.themeName]; this.sprite = makeGlowSprite(this.theme); }

  resize() {
    const W = window.innerWidth, H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (W * H * dpr * dpr > 3.2e6) dpr = Math.sqrt(3.2e6 / (W * H)); // keep 4K TVs fast
    this.dpr = dpr; this.W = W; this.H = H;
    this.c.width = Math.round(W * dpr); this.c.height = Math.round(H * dpr);
    this.s = clamp(Math.min(W, H) / 800, 0.75, 2.4);
    if (this.portal.full) this.setFull(true);
  }
  coverR() { return Math.hypot(this.W, this.H) / 2 + 40 * this.s; }

  // ---------- particles ----------
  _spawn(x, y, vx, vy, life, heat, kind) {
    const i = this.n < MAX ? this.n++ : (Math.random() * MAX) | 0;
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life; this.max[i] = life; this.heat[i] = heat; this.kind[i] = kind;
  }
  _kill(i) {
    const j = --this.n;
    this.x[i] = this.x[j]; this.y[i] = this.y[j]; this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j];
    this.life[i] = this.life[j]; this.max[i] = this.max[j]; this.heat[i] = this.heat[j]; this.kind[i] = this.kind[j];
  }
  _sparkAt(theta, r, speedMul = 1, flungP = 0.16) {
    const p = this.portal, s = this.s, cos = Math.cos(theta), sin = Math.sin(theta);
    const rr = r + (Math.random() - 0.5) * 9 * s; // spark band thickness
    const x = p.cx + rr * cos, y = p.cy + rr * sin;
    const tx = -sin * p.dir, ty = cos * p.dir; // tangent in the direction the user drew
    const speed = (420 + Math.random() * 640) * s * Math.pow(Math.max(r, 40) / 300, 0.35) * speedMul;
    if (Math.random() < flungP) { // flung off the rim like grinder sparks
      const out = (90 + Math.random() * 300) * s;
      this._spawn(x, y, tx * speed * 0.75 + cos * out, ty * speed * 0.75 + sin * out, 0.35 + Math.random() * 0.55, 0.75 + Math.random() * 0.25, K_FLUNG);
    } else { // racing around the rim
      const out = (Math.random() * 40 - 10) * s;
      this._spawn(x, y, tx * speed + cos * out, ty * speed + sin * out, 0.1 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, K_ORBIT);
    }
  }
  _emitRing(dt, mult, speedMul = 1) {
    const p = this.portal; if (this.suppressPortal || mult <= 0) return;
    this.carry += TAU * p.renderR * 1.25 * mult * dt / Math.max(0.8, this.s * 0.9);
    while (this.carry >= 1) { this.carry -= 1; this._sparkAt(Math.random() * TAU, p.renderR, speedMul); }
  }
  _emitTrace(dt) { // ignition: burning arc behind a hot head racing around the drawn circle
    const p = this.portal, span = p.head - p.a0;
    this.carry += Math.abs(span) * p.renderR * 1.6 * dt / Math.max(0.8, this.s * 0.9);
    while (this.carry >= 1) { this.carry -= 1; this._sparkAt(p.a0 + span * Math.random(), p.renderR, 0.7, 0.08); }
    for (let i = 0; i < 18; i++) this._sparkAt(p.head - p.dir * Math.random() * 0.3, p.renderR, 1.1, 0.35);
  }
  _emitVortex(dt) { // loading: sparks spiral inward through the portal
    const p = this.portal, s = this.s, r = p.clipR;
    if (r < 20 * s || this.suppressPortal) return;
    this.vCarry += 520 * dt * clamp(r / 300, 0.5, 2.5) * p.overlay;
    while (this.vCarry >= 1) {
      this.vCarry -= 1;
      const a = Math.random() * TAU, rr = r * (0.82 + Math.random() * 0.15), cos = Math.cos(a), sin = Math.sin(a);
      const tang = (240 + Math.random() * 320) * s, inward = (60 + Math.random() * 120) * s;
      this._spawn(p.cx + rr * cos, p.cy + rr * sin, -sin * p.dir * tang - cos * inward, cos * p.dir * tang - sin * inward, 1.6, 0.8 + Math.random() * 0.2, K_VORTEX);
    }
  }
  _burst(x, y, n, speed = 1) {
    const s = this.s;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (200 + Math.random() * 800) * s * speed;
      this._spawn(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * sp, Math.sin(a) * sp, 0.3 + Math.random() * 0.6, 1, K_BURST);
    }
  }
  _ringBurst(n) { // sparks exploding outward from the whole rim (tear-open moment)
    const p = this.portal, s = this.s;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, cos = Math.cos(a), sin = Math.sin(a), out = (250 + Math.random() * 700) * s, tang = (200 + Math.random() * 400) * s;
      this._spawn(p.cx + p.renderR * cos, p.cy + p.renderR * sin, cos * out - sin * p.dir * tang, sin * out + cos * p.dir * tang, 0.4 + Math.random() * 0.6, 1, K_BURST);
    }
  }
  _emitAmbient(dt) {
    this.ambCarry += 7 * dt;
    while (this.ambCarry >= 1) {
      this.ambCarry -= 1;
      this._spawn(Math.random() * this.W, this.H + 10, (Math.random() - 0.5) * 40 * this.s, -(30 + Math.random() * 60) * this.s, 4 + Math.random() * 3, 0.5 + Math.random() * 0.3, K_EMBER);
    }
  }

  // ---------- portal API ----------
  /** from = the circle the user actually drew {cx, cy, r}; the portal ignites there, then grows into place. */
  openPortal(cx, cy, R, dir = 1, a0 = -Math.PI / 2, from = null) {
    const p = this.portal;
    const f = from || { cx, cy, r: R * 0.45 };
    const r0 = clamp(f.r, R * 0.25, R * 0.95);
    Object.assign(p, {
      state: 'opening', cx: f.cx, cy: f.cy, tcx: cx, tcy: cy, R, curR: r0, renderR: r0, clipR: 0, videoR: r0,
      dir: dir || 1, t: 0, a0, head: a0, traceK: 0, from: { cx: f.cx, cy: f.cy, r: r0 }, charge: 0, torn: false,
      overlay: 1, loading: true, flare: 0, flash: 0, dip: 0, full: false, home: null, fullK: 0,
    });
  }
  closePortal() {
    const p = this.portal;
    if (p.state === 'closed' || p.state === 'closing') return;
    p.closeFrom = p.renderR || p.curR; p.closeDur = p.full ? 0.8 : 0.55; p.state = 'closing'; p.t = 0;
  }
  hop() {
    const p = this.portal; if (p.state === 'closed') return;
    p.flare = 1; p.flash = Math.max(p.flash, 0.55); p.dip = 1;
    p.shock.push({ r: p.renderR, v: 700 * this.s, a: 1 });
    if (!this.suppressPortal && !p.full) for (let i = 0; i < 260; i++) this._sparkAt(Math.random() * TAU, p.renderR, 1.3);
  }
  setLoading(v) { this.portal.loading = !!v; }
  /** Move/resize the portal (it eases there). Ignored for the center while in full-screen mode. */
  setGeometry(cx, cy, R) {
    const p = this.portal;
    if (p.full) { if (p.home) Object.assign(p.home, { cx, cy, R }); return; }
    p.tcx = cx; p.tcy = cy; p.R = R;
  }
  /** Grow the portal until it covers the whole screen (on) or shrink back to where it was (off). */
  setFull(on) {
    const p = this.portal; if (p.state === 'closed' || p.state === 'closing') return;
    if (on) {
      if (!p.full) p.home = { cx: p.tcx, cy: p.tcy, R: p.R };
      p.full = true; p.tcx = this.W / 2; p.tcy = this.H / 2; p.R = this.coverR();
      p.shock.push({ r: p.renderR, v: 1100 * this.s, a: 1 }); p.flare = 1;
    } else if (p.full) {
      p.full = false;
      if (p.home) { p.tcx = p.home.cx; p.tcy = p.home.cy; p.R = p.home.R; }
      p.flare = 1;
    }
  }

  _updatePortal(dt) {
    const p = this.portal; if (p.state === 'closed') return;
    p.t += dt;
    const edge = 3 * this.s;
    if (p.state === 'opening') {
      const { ignite: T1, spin: T2, open: T3 } = OPEN_T, f = p.from;
      if (p.t < T1) { // 1) ignite: a hot head burns around the drawn circle
        const k = p.t / T1;
        p.cx = f.cx; p.cy = f.cy; p.curR = p.renderR = p.videoR = f.r;
        p.head = p.a0 + p.dir * TAU * easeInOut(k); p.traceK = k; p.clipR = 0;
        this._emitTrace(dt);
      } else if (p.t < T2) { // 2) spin-up: the ring gathers energy and tightens slightly
        const k = (p.t - T1) / (T2 - T1);
        p.traceK = 1; p.charge = k; p.flare = Math.max(p.flare, k);
        p.curR = p.renderR = p.videoR = f.r * (1 - 0.07 * Math.sin(k * Math.PI));
        p.clipR = 0;
        this._emitRing(dt, 2.5 + 3 * k, 1 + 0.8 * k);
      } else { // 3) tear open: flash, shockwave, ring flies out to its final size and place
        if (!p.torn) {
          p.torn = true; p.flash = 1; p.charge = 0;
          p.shock.push({ r: p.renderR, v: 900 * this.s, a: 1 }, { r: p.renderR * 0.6, v: 520 * this.s, a: 0.8 });
          if (!this.suppressPortal) this._ringBurst(320);
        }
        const k = clamp((p.t - T2) / (T3 - T2), 0, 1), e = easeOutCubic(k);
        p.cx = lerp(f.cx, p.tcx, e); p.cy = lerp(f.cy, p.tcy, e);
        p.curR = p.renderR = lerp(f.r, p.R, easeOutBack(k));
        p.videoR = p.curR; p.zoom = 1 + 0.35 * (1 - e); // view starts zoomed in and settles
        p.clipR = Math.max(0, p.renderR - edge);
        this._emitRing(dt, 2.2 - k, 1.2);
        if (k >= 1) { p.state = 'open'; p.t = 0; p.zoom = 1; }
      }
    } else if (p.state === 'open') {
      const k = Math.min(1, dt * 4.5);
      p.cx += (p.tcx - p.cx) * k; p.cy += (p.tcy - p.cy) * k; p.curR += (p.R - p.curR) * k;
      const home = p.home ? p.home.R : p.R, cover = this.coverR();
      p.fullK = cover > home ? clamp((p.curR - home) / (cover - home), 0, 1) : 0;
      let mult = 1 + 0.006 * Math.sin(this.time * 6.3) + 0.004 * Math.sin(this.time * 11.7);
      if (p.dip > 0) { p.dip = Math.max(0, p.dip - dt / 0.55); mult *= 1 - 0.16 * Math.sin(Math.PI * (1 - p.dip)); }
      p.renderR = p.curR * mult; p.videoR = p.curR * mult; p.clipR = Math.max(0, p.renderR - edge);
      this._emitRing(dt, (1 + p.flare * 3) * (1 - p.fullK));
    } else if (p.state === 'closing') {
      const k = clamp(p.t / p.closeDur, 0, 1);
      p.curR = p.renderR = p.videoR = Math.max(0, p.closeFrom * (1 - easeInBack(k)));
      p.clipR = Math.max(0, p.curR - edge);
      if (p.curR < this.coverR()) this._emitRing(dt, 2.2 * (1 - k) + 0.3, 1.3);
      if (k >= 1) {
        if (!this.suppressPortal) this._burst(p.cx, p.cy, 300, 1.2);
        p.flash = 0.6; p.state = 'closed'; p.clipR = 0; p.curR = p.renderR = p.videoR = 0; p.full = false; p.home = null; p.fullK = 0;
      }
    }
    p.flare = Math.max(0, p.flare - dt * 1.4);
    p.overlay += ((p.loading ? 1 : 0) - p.overlay) * Math.min(1, dt * (p.loading ? 8 : 2.2));
    if (p.loading && p.state !== 'closing') this._emitVortex(dt);
    for (const w of p.shock) { w.r += w.v * dt; w.a -= dt * 1.5; }
    p.shock = p.shock.filter((w) => w.a > 0);
  }

  // ---------- pointers (hand / phone wand / mouse cursors) ----------
  setPointer(id, x, y, drawing, kind, t, progress = 0) {
    let q = this.pointers.get(id);
    if (!q) { q = { x, y, rx: x, ry: y, trail: [], drawing: false, kind, seen: t, alpha: 0, progress: 0 }; this.pointers.set(id, q); }
    q.x = x; q.y = y; q.drawing = drawing; q.seen = t; q.kind = kind; q.progress = drawing ? progress : 0;
    if (drawing) q.trail.push({ x, y, t });
  }
  removePointer(id) { this.pointers.delete(id); }
  clearTrail(id) { const q = this.pointers.get(id); if (q) q.trail.length = 0; }

  _updatePointers(dt, now) {
    for (const q of this.pointers.values()) {
      while (q.trail.length && now - q.trail[0].t > TRAIL_LIFE) q.trail.shift();
      const visible = q.kind === 'mouse' ? now - q.seen < 2.5 : now - q.seen < 0.6;
      q.alpha += ((visible ? 1 : 0) - q.alpha) * Math.min(1, dt * 8);
      const dx = q.x - q.rx, dy = q.y - q.ry, dist = Math.hypot(dx, dy);
      if (q.alpha > 0.2) {
        const n = Math.min(16, Math.floor(dist / (7 * this.s)) + (q.drawing ? 1 + Math.round(q.progress * 3) : Math.random() < 0.3 ? 1 : 0));
        for (let k = 0; k < n; k++) {
          const f = Math.random(), a = Math.random() * TAU, sp = (40 + Math.random() * 170) * this.s * (1 + q.progress);
          this._spawn(q.rx + dx * f, q.ry + dy * f, Math.cos(a) * sp + (dx / Math.max(dt, 1e-3)) * 0.12, Math.sin(a) * sp + (dy / Math.max(dt, 1e-3)) * 0.12 - 60 * this.s,
            0.25 + Math.random() * 0.45, q.drawing ? 1 : 0.72, K_FLUNG);
        }
      }
      q.rx = q.x; q.ry = q.y;
    }
  }

  // ---------- frame ----------
  update(dt, now) {
    this.time = now;
    this._updatePortal(dt);
    if (this.ambient && this.portal.state === 'closed') this._emitAmbient(dt);
    this._updatePointers(dt, now);
    const p = this.portal, g = 900 * this.s;
    for (let i = 0; i < this.n; i++) {
      this.life[i] -= dt;
      const k = this.kind[i];
      if (k === K_VORTEX) {
        const dx = this.x[i] - p.cx, dy = this.y[i] - p.cy, d = Math.hypot(dx, dy) || 1;
        if (d < 10 * this.s || p.state === 'closed') this.life[i] = 0;
        else {
          const a = (this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]) / d + 260 * this.s; // orbit + inward pull = spiral
          this.vx[i] -= (dx / d) * a * dt; this.vy[i] -= (dy / d) * a * dt;
          if (!p.loading) this.life[i] -= dt * 3; // dissolve once the stream is visible
        }
      }
      if (this.life[i] <= 0) { this._kill(i); i--; continue; }
      if (k === K_ORBIT && p.state !== 'closed') { // centripetal pull keeps rim sparks on the circle
        const dx = this.x[i] - p.cx, dy = this.y[i] - p.cy, d = Math.hypot(dx, dy) || 1;
        const a = (this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]) / d;
        this.vx[i] -= (dx / d) * a * dt; this.vy[i] -= (dy / d) * a * dt;
      } else if (k === K_FLUNG || k === K_BURST || k === K_ORBIT) {
        this.vy[i] += g * dt; const drag = 1 - 1.2 * dt; this.vx[i] *= drag; this.vy[i] *= drag;
      } else if (k === K_EMBER) { // slow float upwards with sway
        this.vy[i] -= 25 * this.s * dt; this.vx[i] += (Math.random() - 0.5) * 60 * this.s * dt;
        this.vx[i] *= 1 - 0.8 * dt; this.vy[i] *= 1 - 0.5 * dt;
      }
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt;
    }
    p.flash = Math.max(0, p.flash - dt * 2.2);
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    if (this.hidden) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const p = this.portal, open = p.state !== 'closed' && !this.suppressPortal;
    if (open) { this._drawInner(ctx); this._drawCharge(ctx); }
    ctx.globalCompositeOperation = 'lighter';
    if (open) this._drawRim(ctx);
    for (const w of p.shock) {
      ctx.beginPath(); ctx.arc(p.cx, p.cy, w.r, 0, TAU);
      ctx.strokeStyle = `rgba(${this.theme.glow},${w.a * 0.45})`; ctx.lineWidth = 7 * this.s * w.a; ctx.stroke();
    }
    this._drawParticles(ctx);
    this._drawPointers(ctx);
    if (p.flash > 0.01 && !this.suppressPortal) this._drawFlash(ctx);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  _drawInner(ctx) {
    const p = this.portal, th = this.theme, s = this.s, r = p.clipR;
    if (r < 2) return;
    ctx.save();
    ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, TAU); ctx.clip();
    const x0 = Math.max(0, p.cx - r), y0 = Math.max(0, p.cy - r), x1 = Math.min(this.W, p.cx + r), y1 = Math.min(this.H, p.cy + r);
    if (p.overlay > 0.01) { // dark energy well behind the loading vortex
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, r);
      g.addColorStop(0, `rgba(${th.deep},${p.overlay})`); g.addColorStop(1, `rgba(0,0,0,${p.overlay})`);
      ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.8 + 0.2 * Math.sin(this.time * 5);
      const cg = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, r * 0.45);
      cg.addColorStop(0, `rgba(${th.core},${0.35 * p.overlay * pulse})`); cg.addColorStop(0.35, `rgba(${th.glow},${0.18 * p.overlay})`); cg.addColorStop(1, `rgba(${th.glow},0)`);
      ctx.fillStyle = cg; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    ctx.globalCompositeOperation = 'source-over'; // depth: dark vignette at the rim
    const v = ctx.createRadialGradient(p.cx, p.cy, r * 0.7, p.cx, p.cy, r);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${0.55 * (1 - 0.6 * p.fullK)})`);
    ctx.fillStyle = v; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (p.fullK < 0.98) { // warm light spilling in from the rim
      ctx.globalCompositeOperation = 'lighter';
      const w = ctx.createRadialGradient(p.cx, p.cy, r * 0.86, p.cx, p.cy, r);
      w.addColorStop(0, `rgba(${th.glow},0)`); w.addColorStop(1, `rgba(${th.glow},${(0.3 + 0.25 * p.flare) * (1 - p.fullK)})`);
      ctx.fillStyle = w; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    ctx.restore();
  }

  _drawCharge(ctx) { // spin-up: the closed ring fills with gathering light
    const p = this.portal; if (p.charge <= 0.01 || p.torn) return;
    const th = this.theme, r = p.renderR;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, r);
    g.addColorStop(0, `rgba(${th.core},${0.25 * p.charge})`); g.addColorStop(0.6, `rgba(${th.glow},${0.12 * p.charge})`); g.addColorStop(1, `rgba(${th.glow},${0.3 * p.charge})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, TAU); ctx.fill();
  }

  _drawFlash(ctx) {
    const p = this.portal, th = this.theme, r = Math.max(p.renderR, 40 * this.s);
    const g = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, r);
    g.addColorStop(0, `rgba(255,255,255,${0.9 * p.flash})`); g.addColorStop(0.5, `rgba(${th.core},${0.55 * p.flash})`); g.addColorStop(1, `rgba(${th.glow},${0.15 * p.flash})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(${th.core},${0.1 * p.flash})`; ctx.fillRect(0, 0, this.W, this.H);
  }

  _drawRim(ctx) {
    const p = this.portal, th = this.theme, s = this.s, r = p.renderR;
    const vis = 1 - p.fullK;
    if (r < 1 || vis <= 0.01) return;
    let a0 = 0, a1 = TAU;
    if (p.state === 'opening' && p.traceK < 1) { a0 = p.a0; a1 = p.head; if (p.dir < 0) [a0, a1] = [a1, a0]; }
    const flick = 0.75 + 0.25 * Math.sin(this.time * 37) * Math.sin(this.time * 23);
    const boost = 1 + p.flare * 0.8 + p.charge;
    ctx.beginPath(); ctx.arc(p.cx, p.cy, r, a0, a1);
    ctx.strokeStyle = `rgba(${th.glow},${0.16 * boost * vis})`; ctx.lineWidth = 22 * s * (1 + 0.4 * p.charge); ctx.stroke();
    ctx.strokeStyle = `rgba(${th.glow},${0.32 * vis})`; ctx.lineWidth = 8 * s; ctx.stroke();
    ctx.strokeStyle = `rgba(${th.core},${Math.min(1, 0.7 * flick * boost) * vis})`; ctx.lineWidth = 2.4 * s; ctx.stroke();
  }

  _drawParticles(ctx) {
    const n = this.n, b = this.bucket, X = this.x, Y = this.y, VX = this.vx, VY = this.vy, K = this.kind, th = this.theme, s = this.s;
    for (let i = 0; i < n; i++) {
      const h = this.heat[i] * Math.pow(this.life[i] / this.max[i], 0.6);
      b[i] = h > 0.85 ? 0 : h > 0.65 ? 1 : h > 0.45 ? 2 : h > 0.25 ? 3 : 4;
    }
    const LW = [2.3, 2.0, 1.7, 1.4, 1.1];
    for (let k = 0; k < 5; k++) { // one path per colour bucket = few draw calls for thousands of sparks
      ctx.beginPath(); let any = false;
      for (let i = 0; i < n; i++) {
        if (b[i] !== k || K[i] === K_EMBER) continue;
        any = true; const st = K[i] === K_ORBIT ? 0.034 : K[i] === K_VORTEX ? 0.03 : 0.022; // orbiting sparks leave longer arcs
        ctx.moveTo(X[i] - VX[i] * st, Y[i] - VY[i] * st); ctx.lineTo(X[i], Y[i]);
      }
      if (any) { ctx.strokeStyle = th.heat[k]; ctx.lineWidth = LW[k] * s; ctx.globalAlpha = k === 4 ? 0.6 : 1; ctx.stroke(); }
    }
    let budget = 450; const spr = this.sprite;
    for (let i = 0; i < n; i++) {
      if (K[i] === K_EMBER) {
        ctx.globalAlpha = Math.min(1, this.life[i] / 1.2) * 0.8;
        const sz = (5 + this.heat[i] * 6) * s; ctx.drawImage(spr, X[i] - sz / 2, Y[i] - sz / 2, sz, sz);
      } else if (b[i] === 0 && budget-- > 0) {
        ctx.globalAlpha = 0.35; const sz = 14 * s; ctx.drawImage(spr, X[i] - sz / 2, Y[i] - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawPointers(ctx) {
    const th = this.theme, s = this.s;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const q of this.pointers.values()) {
      if (q.alpha < 0.02) continue;
      const tr = q.trail, pg = q.progress, boost = 0.7 + 0.9 * pg; // the stroke heats up as the circle nears completion
      if (tr.length > 1) {
        for (const [w, a, col] of [[16, 0.07, th.trail], [7, 0.18, th.trail], [2.4, 0.85, th.core]]) {
          ctx.lineWidth = w * s * (0.8 + 0.6 * pg);
          for (let i = 1; i < tr.length; i++) {
            const fa = Math.max(0, 1 - (this.time - tr[i].t) / TRAIL_LIFE);
            if (fa <= 0) continue;
            ctx.strokeStyle = `rgba(${col},${Math.min(1, a * fa * q.alpha * boost)})`;
            ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
          }
        }
      }
      const sz = (q.drawing ? 54 + 30 * pg : 34) * s;
      ctx.globalAlpha = q.alpha; ctx.drawImage(this.sprite, q.x - sz / 2, q.y - sz / 2, sz, sz);
      const c2 = sz * 0.3; ctx.drawImage(this.sprite, q.x - c2 / 2, q.y - c2 / 2, c2, c2);
      ctx.globalAlpha = 1;
    }
  }
}
