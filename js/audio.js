// audio.js — synthesized portal sounds (Web Audio). No sound files, no licensing questions.
export class Sfx {
  constructor() { this.ctx = null; this.enabled = true; this.active = false; }

  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = this.enabled ? 0.55 : 0; this.master.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // low hum while a portal is open
    this.hum = c.createGain(); this.hum.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110.6;
    o1.connect(lp); o2.connect(lp); lp.connect(this.hum); this.hum.connect(this.master);
    o1.start(); o2.start();
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  setEnabled(v) { this.enabled = v; if (this.master) this.master.gain.value = v ? 0.55 : 0; }

  _whoosh(f0, f1, dur, vol, delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, src = c.createBufferSource(); src.buffer = this.noise;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  _thump(f0 = 90, f1 = 38, dur = 0.38, vol = 0.55, delay = 0) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  _click(when, vol) {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800 + Math.random() * 3200;
    const g = c.createGain(), len = 0.01 + Math.random() * 0.02;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    src.connect(hp); hp.connect(g); g.connect(this.master);
    src.start(when, Math.random() * 1.5); src.stop(when + len + 0.02);
  }
  _crackle(n, spread, delay = 0) { if (!this.ctx) return; const t = this.ctx.currentTime + delay; for (let i = 0; i < n; i++) this._click(t + Math.random() * spread, 0.03 + Math.random() * 0.09); }
  _setHum(on) { if (!this.hum) return; const t = this.ctx.currentTime; this.hum.gain.cancelScheduledValues(t); this.hum.gain.setTargetAtTime(on ? 0.05 : 0, t, 0.3); }

  // Synced with OPEN_T in portal-fx.js: ignite (0–0.5 s) → spin-up (→0.78 s) → tear open
  open() {
    if (!this.ctx) return;
    this._crackle(45, 0.5);                       // ignition sizzle
    this._whoosh(180, 1400, 0.8, 0.22);           // energy gathering
    this._whoosh(300, 3200, 0.75, 0.6, 0.76);     // tear open
    this._thump(95, 36, 0.45, 0.7, 0.76);
    this._crackle(50, 0.6, 0.76);
    this.active = true; this._setHum(true);
  }
  full() { if (!this.ctx) return; this._whoosh(200, 3600, 0.9, 0.45); this._thump(70, 30, 0.5, 0.4); }
  close() { if (!this.ctx) return; this._whoosh(2400, 200, 0.5, 0.4); this._thump(70, 30, 0.3, 0.35); this._crackle(25, 0.3); this.active = false; this._setHum(false); }
  hop() { if (!this.ctx) return; this._whoosh(600, 3200, 0.6, 0.35); this._crackle(20, 0.5); }
  tick(dt) { // continuous sizzle while a portal is open
    if (!this.ctx || !this.active || !this.enabled) return;
    let n = 22 * dt;
    while (n > 0) { if (Math.random() < n) this._click(this.ctx.currentTime + Math.random() * 0.03, 0.012 + Math.random() * 0.045); n -= 1; }
  }
}
