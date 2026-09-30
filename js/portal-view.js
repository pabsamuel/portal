// portal-view.js — the DOM layer under the spark canvas: a circular window (CSS clip-path)
// holding either the YouTube live player or the offline procedural scene.
import { TAU } from './gesture-core.js';

const MARGIN = 1.16; // container is larger than the portal so the opening overshoot isn't cut off

export class PortalView {
  constructor({ root, wrap, offline }) {
    this.root = root; this.wrap = wrap; this.off = offline; this.offCtx = offline.getContext('2d');
    this.mode = 'portal'; // 'portal' | 'window' (compliant mode)
    this.offlineOn = false; this.size = 0;
    this.stars = Array.from({ length: 260 }, () => ({ a: Math.random() * TAU, d: Math.random(), sp: 0.5 + Math.random() }));
    this.setClip(0);
  }

  setGeometry(cx, cy, R) {
    this.cx = cx; this.cy = cy; this.R = R;
    const rs = this.root.style;
    if (this.mode === 'window') {
      const W = window.innerWidth, H = window.innerHeight;
      const w = Math.min(W * 0.8, H * 0.72 * 16 / 9), h = w * 9 / 16;
      Object.assign(rs, { left: (W - w) / 2 + 'px', top: (H - h) / 2 - H * 0.04 + 'px', width: w + 'px', height: h + 'px' });
      Object.assign(this.wrap.style, { left: '0px', top: '0px', width: w + 'px', height: h + 'px' });
      this._sizeOffline(w, h);
      this.rect = { x: (W - w) / 2, y: (H - h) / 2 - H * 0.04, w, h };
      return;
    }
    const S = 2 * R * MARGIN;
    Object.assign(rs, { left: cx - S / 2 + 'px', top: cy - S / 2 + 'px', width: S + 'px', height: S + 'px' });
    // 16:9 player scaled to COVER the circle; the extra height crops YouTube's own title/logo bars.
    const h = 2 * R * 1.2, w = h * 16 / 9;
    Object.assign(this.wrap.style, { left: (S - w) / 2 + 'px', top: (S - h) / 2 + 'px', width: w + 'px', height: h + 'px' });
    this._sizeOffline(S, S);
  }

  _sizeOffline(w, h) {
    const W = Math.round(Math.min(w, 1400)), H = Math.round(Math.min(h, 1400));
    if (this.off.width !== W || this.off.height !== H) { this.off.width = W; this.off.height = H; }
  }

  /** r = visible radius in px (0 hides). In window mode r>0 simply shows the rectangle. */
  setClip(r) {
    const rs = this.root.style;
    if (r <= 0.5) { if (rs.visibility !== 'hidden') rs.visibility = 'hidden'; return; }
    if (rs.visibility !== 'visible') rs.visibility = 'visible';
    rs.clipPath = this.mode === 'window' ? 'none' : `circle(${r.toFixed(1)}px at 50% 50%)`;
  }

  showOffline(on) {
    this.offlineOn = on;
    this.off.style.display = on ? 'block' : 'none';
    this.wrap.style.visibility = on ? 'hidden' : 'visible';
  }

  /** Procedural "cosmic void": nebula + warp-speed stars. Needs no internet. */
  renderOffline(time, dt) {
    if (!this.offlineOn) return;
    const c = this.offCtx, w = this.off.width, h = this.off.height, cx = w / 2, cy = h / 2, M = Math.max(w, h);
    c.globalCompositeOperation = 'source-over'; c.fillStyle = '#02030a'; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'lighter';
    const NEB = ['rgba(120,40,255,0.35)', 'rgba(20,140,255,0.28)', 'rgba(255,90,40,0.22)'];
    for (let i = 0; i < 3; i++) {
      const a = time * 0.07 * (i + 1) + i * 2.1;
      const x = cx + Math.cos(a) * w * 0.18, y = cy + Math.sin(a * 1.3) * h * 0.14;
      const g = c.createRadialGradient(x, y, 0, x, y, M * 0.45);
      g.addColorStop(0, NEB[i]); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    c.lineCap = 'round';
    for (const s of this.stars) {
      s.d += dt * (0.06 + s.d * 0.8) * s.sp;
      if (s.d > 1.15) { s.d = 0.02 + Math.random() * 0.05; s.a = Math.random() * TAU; s.sp = 0.5 + Math.random(); }
      const r = s.d * s.d * M * 0.75, r2 = r * 0.88;
      c.strokeStyle = `rgba(215,228,255,${Math.min(1, s.d * 1.6)})`;
      c.lineWidth = 0.6 + s.d * 2.4;
      c.beginPath(); c.moveTo(cx + Math.cos(s.a) * r2, cy + Math.sin(s.a) * r2); c.lineTo(cx + Math.cos(s.a) * r, cy + Math.sin(s.a) * r); c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  }
}
