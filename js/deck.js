// deck.js — two player slots: one visible, one warming up the next destination in the background.
// The user never sees a dead camera: candidates are tried invisibly in the standby slot, dead
// sources are marked and skipped, and only a stream that is already PLAYING is swapped in.
// Each slot can play a YouTube live stream (LivePlayer) or the user's own video (VideoPlayer).
import { LivePlayer } from './youtube.js';
import { VideoPlayer } from './video-player.js';
import { sourcesOf } from './cams.js';

class SlotPlayer {
  constructor(host) {
    const mk = () => { const d = document.createElement('div'); d.className = 'slot-sub'; host.appendChild(d); return d; };
    this.ytHost = mk(); this.vidHost = mk();
    this.yt = new LivePlayer(this.ytHost); this.vid = new VideoPlayer(this.vidHost);
  }
  play(src) {
    const own = src.type === 'video';
    (own ? this.yt : this.vid).stop();
    this.ytHost.style.visibility = own ? 'hidden' : '';
    this.vidHost.style.visibility = own ? '' : 'hidden';
    return own ? this.vid.play(src) : this.yt.play(src);
  }
  stop() { this.yt.stop(); this.vid.stop(); }
  setMuted(m) { this.yt.setMuted(m); this.vid.setMuted(m); }
}

const MAX_SOURCE_TRIES = 24; // per search, before giving up (e.g. no internet)
const MAX_ENTRIES = 80;

export class Deck {
  constructor({ hosts, isDead, markDead, nextEntry }) {
    this.hosts = hosts;
    this.players = hosts.map((h) => new SlotPlayer(h));
    this.isDead = isDead; this.markDead = markDead; this.nextEntry = nextEntry;
    this.active = 0; this.standby = null; this.sbToken = 0; this.presentToken = 0;
    this.presenting = false; this.muted = true; this.warmTimer = 0;
    hosts[0].classList.add('active');
  }
  get other() { return 1 - this.active; }

  /** Cheap pre-check without touching a player: removed/private videos have a 120×90 placeholder thumbnail. */
  static exists(id) {
    return new Promise((res) => {
      const im = new Image(), t = setTimeout(() => res(true), 3000); // unknown → let the player decide
      im.onload = () => { clearTimeout(t); res(im.naturalWidth > 120); };
      im.onerror = () => { clearTimeout(t); res(true); };
      im.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    });
  }

  /** Try entries in `slot` until one actually plays. Silent: failures are marked dead and skipped. */
  async _findLive(slot, first, isCurrent) {
    let entry = first, tries = 0, entries = 0;
    while (entry && tries < MAX_SOURCE_TRIES && entries < MAX_ENTRIES) {
      entries++;
      for (const src of sourcesOf(entry)) {
        if (this.isDead(src.key)) continue;
        tries++;
        try {
          if (src.type === 'yt' && !(await Deck.exists(src.id))) throw { code: 'gone' };
          if (!isCurrent()) throw { code: 'cancel' };
          const info = await this.players[slot].play(src);
          if (!isCurrent()) throw { code: 'cancel' };
          if (info && info.live === false) throw { code: 'not-live' }; // an old recording, not a live cam
          return { entry, src, live: info ? info.live : null, own: src.type === 'video' };
        } catch (err) {
          if (err instanceof Error) throw err;                 // YouTube API itself unavailable
          if ((err && err.code === 'cancel') || !isCurrent()) throw { code: 'cancel' };
          this.markDead(src.key, err && err.code);
        }
      }
      entry = this.nextEntry();
    }
    throw { code: 'none' };
  }

  /** Warm the standby player with the next live cam (after `delay` ms). */
  prepare(delay = 0) {
    clearTimeout(this.warmTimer);
    this.warmTimer = setTimeout(() => this._prepare(), delay);
  }
  _prepare() {
    if (this.standby || this.presenting) return;
    const slot = this.other, token = ++this.sbToken;
    const sb = { slot, status: 'loading', entry: null, live: null, own: false, error: null };
    this.standby = sb;
    this.players[slot].setMuted(true);
    sb.promise = this._findLive(slot, this.nextEntry(), () => token === this.sbToken)
      .then((r) => { if (token === this.sbToken) Object.assign(sb, { status: 'ready', entry: r.entry, live: r.live, own: r.own }); return sb; })
      .catch((err) => {
        sb.status = 'failed'; sb.error = err;
        if (token === this.sbToken) { this.standby = null; if (!(err instanceof Error)) this.prepare(30000); }
        return sb;
      });
  }
  cancelStandby() {
    this.sbToken++; clearTimeout(this.warmTimer);
    if (this.standby) { if (this.standby.slot !== this.active) this.players[this.standby.slot].stop(); this.standby = null; }
  }

  /** Put a PLAYING stream on screen. entry = null → the pre-warmed next cam. Resolves {entry, live}. */
  async present(entry = null) {
    const my = ++this.presentToken, isCurrent = () => my === this.presentToken;
    const sb = this.standby;
    if (!entry && sb) {
      if (sb.status === 'loading') await sb.promise;
      if (!isCurrent()) throw { code: 'cancel' };
      if (sb.status === 'ready' && this.standby === sb) { this.standby = null; this._swap(sb.slot); return { entry: sb.entry, live: sb.live, own: sb.own }; }
      if (sb.status === 'failed' && sb.error instanceof Error) throw sb.error;
    }
    this.cancelStandby();
    const slot = this.other;
    this.presenting = true;
    try {
      this.players[slot].setMuted(true);
      const r = await this._findLive(slot, entry || this.nextEntry(), isCurrent);
      if (!isCurrent()) throw { code: 'cancel' };
      this._swap(slot);
      return { entry: r.entry, live: r.live, own: r.own };
    } finally { if (isCurrent()) this.presenting = false; }
  }

  _swap(slot) {
    const old = this.active;
    this.active = slot;
    this.hosts[slot].classList.add('active'); this.hosts[old].classList.remove('active');
    this.players[slot].setMuted(this.muted);
    this.players[old].stop();       // hidden now — free its bandwidth
    this.presenting = false;
    this.prepare(400);              // start warming the next one
  }

  cancel() { this.presentToken++; this.presenting = false; }
  stopActive() { this.cancel(); this.players[this.active].stop(); }
  setMuted(m) { this.muted = m; this.players[this.active].setMuted(m); }
}
