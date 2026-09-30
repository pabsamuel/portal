// youtube.js — YouTube IFrame API wrapper for live cams: resolves when the stream is actually
// PLAYING, rejects on error / timeout / ended, and reuses one player for fast portal hops.
import { CONFIG } from './config.js';

let apiPromise = null;

export function loadYouTubeAPI(timeoutMs = 12000) {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch { /* ignore */ } resolve(window.YT); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = () => reject(new Error('yt-api-load'));
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('yt-api-timeout')), timeoutMs);
  }).catch((e) => { apiPromise = null; throw e; });
  return apiPromise;
}

const PLAYER_VARS = {
  autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3,
  playsinline: 1, rel: 0, modestbranding: 1, cc_load_policy: 0,
};

export class LivePlayer {
  constructor(host) {
    this.host = host; this.player = null; this.kind = null; this.ready = false;
    this.token = 0; this.muted = true; this.pending = null; this.handlers = {};
  }

  /** src = {type:'yt'|'ch', id}. Resolves {live} when playing. Rejects {code}. */
  async play(src, timeoutMs = CONFIG.PLAY_TIMEOUT_MS) {
    const YT = await loadYouTubeAPI();
    this._cancelPending();
    const my = ++this.token;
    return new Promise((resolve, reject) => {
      let done = false, visibleMs = 0;
      const finish = (ok, info) => {
        if (done) return; done = true; clearInterval(timer);
        if (this.pending && this.pending.my === my) this.pending = null;
        ok ? resolve(info) : reject(info);
      };
      // Browsers defer autoplay in hidden tabs, so only count time while the page is visible;
      // otherwise switching tabs would wrongly mark every cam as dead.
      const timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        visibleMs += 250;
        if (visibleMs >= timeoutMs) finish(false, { code: 'timeout' });
      }, 250);
      this.pending = { my, finish };
      this.handlers = {
        state: (e) => {
          if (my !== this.token) return;
          if (e.data === YT.PlayerState.PLAYING) {
            let live = null;
            try { const d = this.player.getVideoData && this.player.getVideoData(); if (d && typeof d.isLive === 'boolean') live = d.isLive; } catch { /* ignore */ }
            finish(true, { live });
          } else if (e.data === YT.PlayerState.ENDED) finish(false, { code: 'ended' });
        },
        error: (e) => { if (my === this.token) finish(false, { code: e.data }); },
      };
      try {
        if (src.type === 'yt' && this.player && this.kind === 'yt' && this.ready) {
          this.player.loadVideoById({ videoId: src.id });
          this._applyMute();
        } else {
          this._create(YT, src);
        }
      } catch (err) { finish(false, { code: 'player', err }); }
    });
  }

  _create(YT, src) {
    this.destroy();
    const pv = { ...PLAYER_VARS };
    if (location.protocol.startsWith('http')) pv.origin = location.origin;
    const events = {
      onReady: (e) => { this.ready = true; try { this._applyMute(e.target); e.target.playVideo(); } catch { /* ignore */ } },
      onStateChange: (e) => this.handlers.state && this.handlers.state(e),
      onError: (e) => this.handlers.error && this.handlers.error(e),
    };
    const el = document.createElement('div');
    this.host.appendChild(el);
    if (src.type === 'yt') {
      this.player = new YT.Player(el, { width: '100%', height: '100%', videoId: src.id, playerVars: pv, events });
    } else { // channel's current live stream
      const iframe = document.createElement('iframe');
      const q = new URLSearchParams({ channel: src.id, enablejsapi: '1' });
      for (const [k, v] of Object.entries(pv)) q.set(k, String(v));
      iframe.src = `https://www.youtube.com/embed/live_stream?${q}`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.width = '100%'; iframe.height = '100%'; iframe.setAttribute('frameborder', '0');
      el.replaceWith(iframe);
      this.player = new YT.Player(iframe, { events });
    }
    this.kind = src.type;
  }

  _applyMute(p = this.player) {
    if (!p || !p.mute) return;
    if (this.muted) p.mute(); else { p.unMute(); p.setVolume(70); }
  }
  setMuted(m) { this.muted = m; try { this._applyMute(); } catch { /* ignore */ } }

  _cancelPending() { if (this.pending) { const f = this.pending.finish; this.pending = null; f(false, { code: 'cancel' }); } }

  stop() {
    this.token++; this._cancelPending();
    try { this.player && this.player.stopVideo && this.player.stopVideo(); } catch { /* ignore */ }
  }

  destroy() {
    try { this.player && this.player.destroy && this.player.destroy(); } catch { /* ignore */ }
    this.player = null; this.ready = false; this.kind = null;
    this.host.innerHTML = '';
  }
}
