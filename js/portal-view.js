// portal-view.js — the DOM layer under the spark canvas.
// #portalView covers the whole viewport and is clipped to a circle (CSS clip-path) that follows the
// portal. Inside it, #ytWrap holds the live player (or the offline scene) at "cover the viewport" size
// and is scaled/moved with a GPU transform — so the portal can grow smoothly into full screen.
import { TAU } from './gesture-core.js';

const FIT = 1.15; // video height = FIT × portal diameter (the extra crops YouTube's own title/logo bars)

export class PortalView {
  constructor({ root, wrap, host, offline }) {
    this.root = root; this.wrap = wrap; this.host = host; this.off = offline; this.offCtx = offline.getContext('2d');
    this.mode = 'portal'; // 'portal' | 'window' (compliant mode: unmodified rectangle, nothing drawn over it)
    this.offlineOn = false; this.rect = null; this.lastT = '';
    this.stars = Array.from({ length: 260 }, () => ({ a: Math.random() * TAU, d: Math.random(), sp: 0.5 + Math.random() }));
    this.layout();
    this.setClip(0, 0, 0);
  }

  /** Size the video layer to cover the viewport (call on resize). */
  layout() {
    const W = window.innerWidth, H = window.innerHeight;
    this.W = W; this.H = H;
    this.cw = Math.max(W, H * 16 / 9); this.ch = this.cw * 9 / 16;
    Object.assign(this.wrap.style, { width: this.cw + 'px', height: this.ch + 'px' });
    const ow = Math.round(Math.min(this.cw, 1280)), oh = Math.round(ow * 9 / 16);
    if (this.off.width !== ow || this.off.height !== oh) { this.off.width = ow; this.off.height = oh; }
    this.lastT = '';
  }

  /**
   * Called every frame with the portal circle from the effects layer (page px).
   * scaleR = radius used to size the video (no wobble); when it grows past the screen the video
   * reaches scale 1 = full screen.
   */
  frame(cx, cy, clipR, scaleR) {
    if (this.mode === 'window') {
      const w = Math.min(this.W * 0.8, this.H * 0.72 * 16 / 9), h = w * 9 / 16;
      const x = (this.W - w) / 2, y = (this.H - h) / 2 - this.H * 0.04;
      this.rect = { x, y, w, h };
      this._transform(w / this.cw, x, y);
      this.setClip(clipR > 0.5 ? 1 : 0, 0, 0);
      return;
    }
    this.rect = null;
    const s = Math.min(1, (2 * Math.max(scaleR, 1) * FIT) / this.ch);
    this._transform(s, cx - (this.cw * s) / 2, cy - (this.ch * s) / 2);
    this.setClip(clipR, cx, cy);
  }

  _transform(s, tx, ty) {
    const t = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
    if (t !== this.lastT) { this.wrap.style.transform = t; this.lastT = t; }
  }

  setClip(r, cx, cy) {
    const rs = this.root.style;
    if (r <= 0.5) { if (rs.visibility !== 'hidden') { rs.visibility = 'hidden'; rs.clipPath = 'circle(0px at 0px 0px)'; } return; }
    if (rs.visibility !== 'visible') rs.visibility = 'visible';
    rs.clipPath = this.mode === 'window' ? 'none' : `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
  }

  showOffline(on) {
    this.offlineOn = on;
    this.off.style.display = on ? 'block' : 'none';
    this.host.style.visibility = on ? 'hidden' : ''; // '' = inherit; 'visible' would override the hidden parent
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
      const x = cx + Math.cos(a) * w * 0.12, y = cy + Math.sin(a * 1.3) * h * 0.14;
      const g = c.createRadialGradient(x, y, 0, x, y, M * 0.35);
      g.addColorStop(0, NEB[i]); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    c.lineCap = 'round';
    for (const s of this.stars) {
      s.d += dt * (0.06 + s.d * 0.8) * s.sp;
      if (s.d > 1.15) { s.d = 0.02 + Math.random() * 0.05; s.a = Math.random() * TAU; s.sp = 0.5 + Math.random(); }
      const r = s.d * s.d * M * 0.6, r2 = r * 0.88;
      c.strokeStyle = `rgba(215,228,255,${Math.min(1, s.d * 1.6)})`;
      c.lineWidth = 0.6 + s.d * 2.4;
      c.beginPath(); c.moveTo(cx + Math.cos(s.a) * r2, cy + Math.sin(s.a) * r2); c.lineTo(cx + Math.cos(s.a) * r, cy + Math.sin(s.a) * r); c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  }
}
