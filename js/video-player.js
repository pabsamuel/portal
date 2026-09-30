// video-player.js — plays the user's own videos (local files or direct MP4/WebM links) inside the portal.
// Same interface as LivePlayer (play/stop/setMuted/destroy) so the Deck can treat both alike.
// Nothing is uploaded: local files are object URLs of blobs kept in this browser.

export class VideoPlayer {
  constructor(host) { this.host = host; this.el = null; this.muted = true; this.token = 0; this.pending = null; }

  _ensure() {
    if (this.el) return this.el;
    const v = document.createElement('video');
    v.className = 'own-video'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    this.host.appendChild(v);
    this.el = v;
    return v;
  }

  /** src = {type:'video', url}. Resolves {live:null, own:true} once frames are playing. */
  play(src, timeoutMs = 12000) {
    this._cancel();
    const my = ++this.token, v = this._ensure();
    v.style.display = 'block';
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (ok, info) => {
        if (done) return; done = true; clearTimeout(timer);
        v.removeEventListener('playing', onPlay); v.removeEventListener('error', onErr);
        if (this.pending && this.pending.my === my) this.pending = null;
        ok ? resolve(info) : reject(info);
      };
      const onPlay = () => { if (my === this.token) finish(true, { live: null, own: true }); };
      const onErr = () => { if (my === this.token) finish(false, { code: 'video-error' }); };
      const timer = setTimeout(() => finish(false, { code: 'timeout' }), timeoutMs);
      this.pending = { my, finish };
      v.addEventListener('playing', onPlay); v.addEventListener('error', onErr);
      if (v.getAttribute('src') !== src.url) v.src = src.url;
      v.muted = true;
      try { v.currentTime = 0; } catch { /* not seekable yet */ }
      const p = v.play();
      if (p && p.catch) p.catch(() => { if (my === this.token) finish(false, { code: 'play-blocked' }); });
    });
  }

  _cancel() { if (this.pending) { const f = this.pending.finish; this.pending = null; f(false, { code: 'cancel' }); } }
  setMuted(m) { this.muted = m; if (this.el) this.el.muted = m; }
  stop() { this.token++; this._cancel(); if (this.el) { this.el.pause(); this.el.style.display = 'none'; } }
  destroy() { this.stop(); if (this.el) { this.el.removeAttribute('src'); this.el.load(); this.el.remove(); this.el = null; } }
}
