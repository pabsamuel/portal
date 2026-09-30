// portal-fx.js — Canvas 2D effects: spark ring portal, gesture trails, cursor sparks, ambient embers.
// Everything is drawn in CSS pixels on one full-screen canvas that sits ABOVE the video layer.
import { TAU, clamp } from './gesture-core.js';

export const THEMES = {
  ember:  { heat: ['#fffbe8', '#ffd875', '#ffa334', '#ff6418', '#b83000'], glow: '255,150,40',  core: '255,242,205', deep: '46,12,0',  trail: '255,176,70' },
  aurora: { heat: ['#f4ffff', '#aef5ff', '#3fdcff', '#8c62ff', '#4320a0'], glow: '70,205,255',  core: '232,255,255', deep: '6,12,44',  trail: '120,222,255' },
  plasma: { heat: ['#fff2ff', '#ffb8f1', '#ff52d9', '#b52cff', '#50107f'], glow: '255,80,220',  core: '255,232,255', deep: '34,0,44',  trail: '255,125,232' },
  frost:  { heat: ['#ffffff', '#e2f7ff', '#a2ddff', '#4ea6ff', '#1d4ea0'], glow: '150,210,255', core: '242,250,255', deep: '6,16,38',  trail: '172,222,255' },
};
export const THEME_KEYS = Object.keys(THEMES);

const MAX = 7000;
const K_ORBIT = 0, K_FLUNG = 1, K_EMBER = 2, K_BURST = 3;
const easeOutBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const easeInCubic = (k) => k * k * k;

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
    this.n = 0; this.carry = 0; this.ambCarry = 0;
    this.pointers = new Map();
    this.portal = { state: 'closed', cx: 0, cy: 0, R: 0, curR: 0, renderR: 0, clipR: 0, dir: 1, t: 0, a0: 0, head: 0, traceK: 1, overlay: 0, loading: false, flare: 0, shock: [], closeFrom: 0 };
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
  }

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
  _sparkAt(theta, r) {
    const p = this.portal, s = this.s, cos = Math.cos(theta), sin = Math.sin(theta);
    const rr = r + (Math.random() - 0.5) * 9 * s; // spark band thickness
    const x = p.cx + rr * cos, y = p.cy + rr * sin;
    const tx = -sin * p.dir, ty = cos * p.dir; // tangent in the gesture's direction
    const speed = (420 + Math.random() * 640) * s * Math.pow(Math.max(r, 40) / 300, 0.35);
    if (Math.random() < 0.16) { // flung off the rim like grinder sparks
      const out = (90 + Math.random() * 300) * s;
      this._spawn(x, y, tx * speed * 0.75 + cos * out, ty * speed * 0.75 + sin * out, 0.35 + Math.random() * 0.55, 0.75 + Math.random() * 0.25, K_FLUNG);
    } else { // racing around the rim
      const out = (Math.random() * 40 - 10) * s;
      this._spawn(x, y, tx * speed + cos * out, ty * speed + sin * out, 0.1 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, K_ORBIT);
    }
  }
  _emitRing(dt, mult) {
    const p = this.portal; if (this.suppressPortal) return;
    this.carry += TAU * p.renderR * 1.25 * mult * dt / Math.max(0.8, this.s * 0.9);
    while (this.carry >= 1) { this.carry -= 1; this._sparkAt(Math.random() * TAU, p.renderR); }
  }
  _emitTrace(dt) {
    const p = this.portal, span = p.head - p.a0;
    this.carry += Math.abs(span) * p.renderR * 1.4 * dt / Math.max(0.8, this.s * 0.9);
    while (this.carry >= 1) { this.carry -= 1; this._sparkAt(p.a0 + span * Math.random(), p.renderR); }
    for (let i = 0; i < 14; i++) this._sparkAt(p.head - p.dir * Math.random() * 0.35, p.renderR); // hot head
  }
  _burst(x, y, n) {
    const s = this.s;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (200 + Math.random() * 800) * s;
      this._spawn(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * sp, Math.sin(a) * sp, 0.3 + Math.random() * 0.6, 1, K_BURST);
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
  openPortal(cx, cy, R, dir = 1, a0 = -Math.PI / 2) {
    const p = this.portal;
    Object.assign(p, { state: 'opening', cx, cy, R, curR: R * 0.3, renderR: R * 0.3, clipR: 0, dir: dir || 1, t: 0, a0, head: a0, traceK: 0, overlay: 1, loading: true, flare: 0 });
    p.shock.push({ r: R * 0.3, v: 600 * this.s, a: 1 });
  }
  closePortal() {
    const p = this.portal;
    if (p.state === 'closed' || p.state === 'closing') return;
    p.closeFrom = p.renderR || p.curR; p.state = 'closing'; p.t = 0;
  }
  hop() {
    const p = this.portal; if (p.state === 'closed') return;
    p.flare = 1; p.shock.push({ r: p.renderR, v: 700 * this.s, a: 1 });
    if (!this.suppressPortal) for (let i = 0; i < 220; i++) this._sparkAt(Math.random() * TAU, p.renderR);
  }
  setLoading(v) { this.portal.loading = !!v; }
  setGeometry(cx, cy, R) { const p = this.portal; p.cx = cx; p.cy = cy; p.R = R; }

  _updatePortal(dt) {
    const p = this.portal; if (p.state === 'closed') return;
    p.t += dt;
    const edge = 3 * this.s;
    if (p.state === 'opening') {
      const T1 = 0.34, T2 = 1.0, r0 = p.R * 0.3;
      if (p.t < T1) {
        const k = p.t / T1;
        p.curR = p.renderR = r0; p.head = p.a0 + p.dir * TAU * easeInOut(k); p.traceK = k; p.clipR = 0;
        this._emitTrace(dt);
      } else {
        const k = clamp((p.t - T1) / (T2 - T1), 0, 1);
        p.traceK = 1; p.curR = p.renderR = r0 + (p.R - r0) * easeOutBack(k); p.clipR = Math.max(0, p.curR - edge);
        this._emitRing(dt, 2.6);
        if (k >= 1) { p.state = 'open'; p.t = 0; }
      }
    } else if (p.state === 'open') {
      p.curR += (p.R - p.curR) * Math.min(1, dt * 10);
      const wob = 1 + 0.006 * Math.sin(this.time * 6.3) + 0.004 * Math.sin(this.time * 11.7);
      p.renderR = p.curR * wob; p.clipR = Math.max(0, p.renderR - edge);
      this._emitRing(dt, 1 + p.flare * 3);
    } else if (p.state === 'closing') {
      const k = clamp(p.t / 0.42, 0, 1);
      p.curR = p.renderR = p.closeFrom * (1 - easeInCubic(k)); p.clipR = Math.max(0, p.curR - edge);
      this._emitRing(dt, 1.8 * (1 - k) + 0.2);
      if (k >= 1) { if (!this.suppressPortal) this._burst(p.cx, p.cy, 260); p.state = 'closed'; p.clipR = 0; p.curR = p.renderR = 0; }
    }
    p.flare = Math.max(0, p.flare - dt * 1.4);
    p.overlay += ((p.loading ? 1 : 0) - p.overlay) * Math.min(1, dt * (p.loading ? 8 : 2.2));
    for (const w of p.shock) { w.r += w.v * dt; w.a -= dt * 1.6; }
    p.shock = p.shock.filter((w) => w.a > 0);
  }

  // ---------- pointers (hand / phone wand / mouse cursors) ----------
  setPointer(id, x, y, drawing, kind, t) {
    let q = this.pointers.get(id);
    if (!q) { q = { x, y, rx: x, ry: y, trail: [], drawing: false, kind, seen: t, alpha: 0 }; this.pointers.set(id, q); }
    q.x = x; q.y = y; q.drawing = drawing; q.seen = t; q.kind = kind;
    if (drawing) q.trail.push({ x, y, t });
  }
  removePointer(id) { this.pointers.delete(id); }
  clearTrail(id) { const q = this.pointers.get(id); if (q) q.trail.length = 0; }

  _updatePointers(dt, now) {
    for (const q of this.pointers.values()) {
      while (q.trail.length && now - q.trail[0].t > 1.3) q.trail.shift();
      const visible = q.kind === 'mouse' ? now - q.seen < 2.5 : now - q.seen < 0.6;
      q.alpha += ((visible ? 1 : 0) - q.alpha) * Math.min(1, dt * 8);
      const dx = q.x - q.rx, dy = q.y - q.ry, dist = Math.hypot(dx, dy);
      if (q.alpha > 0.2) {
        const n = Math.min(14, Math.floor(dist / (7 * this.s)) + (q.drawing ? 1 : Math.random() < 0.3 ? 1 : 0));
        for (let k = 0; k < n; k++) {
          const f = Math.random(), a = Math.random() * TAU, sp = (40 + Math.random() * 170) * this.s;
          this._spawn(q.rx + dx * f, q.ry + dy * f, Math.cos(a) * sp + (dx / dt) * 0.12, Math.sin(a) * sp + (dy / dt) * 0.12 - 60 * this.s,
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
      if (this.life[i] <= 0) { this._kill(i); i--; continue; }
      const k = this.kind[i];
      if (k === K_ORBIT && p.state !== 'closed') { // centripetal pull keeps rim sparks on the circle
        const dx = this.x[i] - p.cx, dy = this.y[i] - p.cy, d = Math.hypot(dx, dy) || 1;
        const a = (this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]) / d;
        this.vx[i] -= (dx / d) * a * dt; this.vy[i] -= (dy / d) * a * dt;
      } else if (k === K_FLUNG || k === K_BURST || k === K_ORBIT) {
        this.vy[i] += g * dt; const drag = 1 - 1.2 * dt; this.vx[i] *= drag; this.vy[i] *= drag;
      } else { // ember: slow float upwards with sway
        this.vy[i] -= 25 * this.s * dt; this.vx[i] += (Math.random() - 0.5) * 60 * this.s * dt;
        this.vx[i] *= 1 - 0.8 * dt; this.vy[i] *= 1 - 0.5 * dt;
      }
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    if (this.hidden) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const p = this.portal;
    if (p.state !== 'closed' && !this.suppressPortal) this._drawInner(ctx);
    ctx.globalCompositeOperation = 'lighter';
    if (p.state !== 'closed' && !this.suppressPortal) this._drawRim(ctx);
    for (const w of p.shock) {
      ctx.beginPath(); ctx.arc(p.cx, p.cy, w.r, 0, TAU);
      ctx.strokeStyle = `rgba(${this.theme.glow},${w.a * 0.45})`; ctx.lineWidth = 6 * this.s * w.a; ctx.stroke();
    }
    this._drawParticles(ctx);
    this._drawPointers(ctx);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  _drawInner(ctx) {
    const p = this.portal, th = this.theme, s = this.s, r = p.clipR;
    if (r < 2) return;
    ctx.save();
    ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, TAU); ctx.clip();
    if (p.overlay > 0.01) { // "energy tunnel" while the live stream is loading
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, r);
      g.addColorStop(0, `rgba(${th.deep},${p.overlay})`); g.addColorStop(1, `rgba(0,0,0,${p.overlay})`);
      ctx.fillStyle = g; ctx.fillRect(p.cx - r, p.cy - r, 2 * r, 2 * r);
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 9; k++) {
        const rr = r * (0.12 + 0.095 * k), st = this.time * (2.2 - k * 0.13) * p.dir + k * 1.7;
        ctx.beginPath(); ctx.arc(p.cx, p.cy, rr, st, st + 0.9 + 0.25 * k);
        ctx.strokeStyle = `rgba(${th.glow},${0.22 * p.overlay})`; ctx.lineWidth = (2 + k * 0.9) * s; ctx.stroke();
      }
      const cg = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, r * 0.55);
      cg.addColorStop(0, `rgba(${th.glow},${0.28 * p.overlay})`); cg.addColorStop(1, `rgba(${th.glow},0)`);
      ctx.fillStyle = cg; ctx.fillRect(p.cx - r, p.cy - r, 2 * r, 2 * r);
    }
    ctx.globalCompositeOperation = 'source-over'; // depth: dark vignette at the rim
    const v = ctx.createRadialGradient(p.cx, p.cy, r * 0.68, p.cx, p.cy, r);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(p.cx - r, p.cy - r, 2 * r, 2 * r);
    ctx.globalCompositeOperation = 'lighter'; // warm light spilling in from the rim
    const w = ctx.createRadialGradient(p.cx, p.cy, r * 0.86, p.cx, p.cy, r);
    w.addColorStop(0, `rgba(${th.glow},0)`); w.addColorStop(1, `rgba(${th.glow},${0.3 + 0.25 * p.flare})`);
    ctx.fillStyle = w; ctx.fillRect(p.cx - r, p.cy - r, 2 * r, 2 * r);
    ctx.restore();
  }

  _drawRim(ctx) {
    const p = this.portal, th = this.theme, s = this.s, r = p.renderR;
    if (r < 1) return;
    let a0 = 0, a1 = TAU;
    if (p.state === 'opening' && p.traceK < 1) { a0 = p.a0; a1 = p.head; if (p.dir < 0) [a0, a1] = [a1, a0]; }
    const flick = 0.75 + 0.25 * Math.sin(this.time * 37) * Math.sin(this.time * 23);
    ctx.beginPath(); ctx.arc(p.cx, p.cy, r, a0, a1);
    ctx.strokeStyle = `rgba(${th.glow},${0.16 * (1 + p.flare)})`; ctx.lineWidth = 22 * s; ctx.stroke();
    ctx.strokeStyle = `rgba(${th.glow},0.32)`; ctx.lineWidth = 8 * s; ctx.stroke();
    ctx.strokeStyle = `rgba(${th.core},${0.7 * flick})`; ctx.lineWidth = 2.4 * s; ctx.stroke();
  }

  _drawParticles(ctx) {
    const n = this.n, b = this.bucket, X = this.x, Y = this.y, VX = this.vx, VY = this.vy, K = this.kind, th = this.theme, s = this.s;
    for (let i = 0; i < n; i++) {
      const h = this.heat[i] * Math.pow(this.life[i] / this.max[i], 0.6);
      b[i] = h > 0.85 ? 0 : h > 0.65 ? 1 : h > 0.45 ? 2 : h > 0.25 ? 3 : 4;
    }
    const LW = [2.3, 2.0, 1.7, 1.4, 1.1];
    for (let k = 0; k < 5; k++) { // one path per color bucket = few draw calls for thousands of sparks
      ctx.beginPath(); let any = false;
      for (let i = 0; i < n; i++) {
        if (b[i] !== k || K[i] === K_EMBER) continue;
        any = true; const st = K[i] === K_ORBIT ? 0.034 : 0.022; // orbiting sparks leave longer arcs
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
      const tr = q.trail;
      if (tr.length > 1) {
        for (const [w, a, col] of [[16, 0.07, th.trail], [7, 0.18, th.trail], [2.4, 0.85, th.core]]) {
          ctx.lineWidth = w * s;
          for (let i = 1; i < tr.length; i++) {
            const fa = Math.max(0, 1 - (this.time - tr[i].t) / 1.3);
            if (fa <= 0) continue;
            ctx.strokeStyle = `rgba(${col},${a * fa * q.alpha})`;
            ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
          }
        }
      }
      const sz = (q.drawing ? 54 : 34) * s;
      ctx.globalAlpha = q.alpha; ctx.drawImage(this.sprite, q.x - sz / 2, q.y - sz / 2, sz, sz);
      const c2 = sz * 0.3; ctx.drawImage(this.sprite, q.x - c2 / 2, q.y - c2 / 2, c2, c2);
      ctx.globalAlpha = 1;
    }
  }
}
