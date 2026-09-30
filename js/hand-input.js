// hand-input.js — webcam hand tracking with MediaPipe Gesture Recognizer (runs 100% in the browser).
// Emits per-frame hand data: index fingertip (mirrored, normalized) + recognized pose.
// `fake: true` replays a scripted hand (circle → swipe → ✌️ → ✊) for demos and automated tests.
import { CONFIG } from './config.js';

const CONNECTIONS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];

export class HandInput {
  constructor({ video, preview, onFrame, onStatus, fake = false }) {
    this.video = video; this.preview = preview; this.pctx = preview ? preview.getContext('2d') : null;
    this.onFrame = onFrame; this.onStatus = onStatus; this.fake = fake;
    this.running = false; this.rec = null; this.lastVT = -1; this.lastRun = 0;
    this.fps = 0; this.frames = 0; this.fpsT = 0; this.procMs = 0; this.previewOn = true;
  }

  async start() {
    if (this.running) return;
    if (this.fake) { this.running = true; this.t0 = performance.now(); this.onStatus({ state: 'ready', fake: true }); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('no-camera-api'), { name: 'NotSupportedError' });
    this.onStatus({ state: 'asking' });
    const camP = navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } }, audio: false,
    });
    const modelP = this._loadModel();
    const stream = await camP;
    this.stream = stream; this.video.srcObject = stream;
    await this.video.play().catch(() => {});
    this.onStatus({ state: 'loading' });
    this.rec = await modelP;
    this.running = true;
    this.onStatus({ state: 'ready' });
  }

  async _loadModel() {
    const vision = await import(/* @vite-ignore */ `${CONFIG.MP_CDN}/vision_bundle.mjs`);
    const fileset = await vision.FilesetResolver.forVisionTasks(`${CONFIG.MP_CDN}/wasm`);
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: CONFIG.MP_MODEL, delegate },
      runningMode: 'VIDEO', numHands: 2,
      minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    try { return await vision.GestureRecognizer.createFromOptions(fileset, opts('GPU')); }
    catch (e) { console.warn('[hand] GPU delegate failed, falling back to CPU', e); return vision.GestureRecognizer.createFromOptions(fileset, opts('CPU')); }
  }

  stop() {
    this.running = false;
    if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    if (this.rec) { try { this.rec.close(); } catch { /* ignore */ } this.rec = null; }
    if (this.pctx) this.pctx.clearRect(0, 0, this.preview.width, this.preview.height);
    this.onFrame([], performance.now() / 1000, 640, 480);
  }

  tick(nowMs) {
    if (!this.running) return;
    if (this.fake) { this._fakeTick(nowMs); return; }
    const v = this.video;
    if (v.readyState < 2 || v.currentTime === this.lastVT || nowMs - this.lastRun < 28) return;
    this.lastVT = v.currentTime; this.lastRun = nowMs;
    const t0 = performance.now();
    let res;
    try { res = this.rec.recognizeForVideo(v, nowMs); } catch (e) { console.warn('[hand]', e); return; }
    this.procMs = this.procMs * 0.9 + (performance.now() - t0) * 0.1;
    this._countFps(nowMs);
    const hands = [], seen = new Set();
    for (let i = 0; i < (res.landmarks || []).length; i++) {
      const lm = res.landmarks[i];
      let id = 'hand-' + ((res.handedness && res.handedness[i] && res.handedness[i][0] && res.handedness[i][0].categoryName) || i);
      if (seen.has(id)) id += '-2';
      seen.add(id);
      const g = res.gestures && res.gestures[i] && res.gestures[i][0];
      hands.push({
        id, tipX: 1 - lm[8].x, tipY: lm[8].y, wristX: 1 - lm[0].x, wristY: lm[0].y,
        gesture: g && g.score > 0.55 ? g.categoryName : 'None', score: g ? g.score : 0,
      });
    }
    this.onFrame(hands, nowMs / 1000, v.videoWidth || 640, v.videoHeight || 480);
    if (this.previewOn && this.pctx) this._drawPreview(res.landmarks || []);
  }

  _countFps(nowMs) {
    this.frames++;
    if (nowMs - this.fpsT >= 1000) { this.fps = this.frames * 1000 / (nowMs - this.fpsT); this.frames = 0; this.fpsT = nowMs; }
  }

  _drawPreview(all) {
    const c = this.pctx, w = this.preview.width, h = this.preview.height;
    c.save(); c.clearRect(0, 0, w, h);
    c.translate(w, 0); c.scale(-1, 1); // mirror like a selfie
    c.globalAlpha = 0.85; c.drawImage(this.video, 0, 0, w, h); c.globalAlpha = 1;
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,190,90,0.9)'; c.fillStyle = '#fff';
    for (const lm of all) {
      c.beginPath();
      for (const [a, b] of CONNECTIONS) { c.moveTo(lm[a].x * w, lm[a].y * h); c.lineTo(lm[b].x * w, lm[b].y * h); }
      c.stroke();
      c.beginPath(); c.arc(lm[8].x * w, lm[8].y * h, 5, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  // Scripted hand for demos/tests (?fakehand=1): loops every 12 s.
  _fakeTick(nowMs) {
    if (nowMs - this.lastRun < 33) return;
    this.lastRun = nowMs;
    const t = ((nowMs - this.t0) / 1000) % 12;
    let x = 0.5, y = 0.5, gesture = 'Pointing_Up', present = true;
    if (t >= 1.0 && t < 2.3) { const a = -Math.PI / 2 + ((t - 1.0) / 1.3) * Math.PI * 2 * 1.05; x = 0.5 + 0.12 * Math.cos(a); y = 0.5 + 0.16 * Math.sin(a); } // 0.12*640 ≈ 0.16*480 px → round
    else if (t >= 2.3 && t < 5.0) { x = 0.5; y = 0.5 - 0.16; }
    else if (t >= 5.0 && t < 5.3) { const k = (t - 5.0) / 0.3; x = 0.35 + 0.4 * k; y = 0.4; }
    else if (t >= 5.3 && t < 7.0) { x = 0.75; y = 0.4; gesture = 'Open_Palm'; }
    else if (t >= 7.0 && t < 8.2) { x = 0.6; y = 0.45; gesture = 'Victory'; }
    else if (t >= 8.2 && t < 9.6) { x = 0.55; y = 0.5; gesture = 'Closed_Fist'; }
    else if (t >= 9.6) present = false;
    this._countFps(nowMs);
    const hands = present ? [{ id: 'hand-Fake', tipX: x, tipY: y, wristX: x, wristY: y + 0.2, gesture, score: 0.9 }] : [];
    this.onFrame(hands, nowMs / 1000, 640, 480);
  }
}
