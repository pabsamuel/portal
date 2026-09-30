// wand-link.js — big-screen side of phone pairing. PeerJS (free cloud signaling) sets up a direct
// WebRTC data channel; phones then stream gyro-derived cursor deltas and button events.
import { CONFIG } from './config.js';
import { store } from './settings.js';

const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const genCode = () => Array.from({ length: 5 }, () => ALPH[(Math.random() * ALPH.length) | 0]).join('');

export class WandLink {
  constructor({ onMotion, onEvent, onStatus }) {
    this.onMotion = onMotion; this.onEvent = onEvent; this.onStatus = onStatus;
    this.conns = new Map(); this.code = null; this.peer = null; this.started = false;
  }

  start() {
    if (this.started) return;
    const Peer = window.Peer || (window.peerjs && window.peerjs.Peer);
    if (!Peer) { this.onStatus({ state: 'nolib' }); return; }
    this.started = true;
    let code = store.get('fw.wandCode', null);
    if (!code) { code = genCode(); store.set('fw.wandCode', code); }
    this._open(Peer, code, 0);
  }

  _open(Peer, code, attempt) {
    this.code = code;
    this.onStatus({ state: 'connecting', code });
    const peer = new Peer(CONFIG.PEER_PREFIX + code.toLowerCase(), { debug: 1 });
    this.peer = peer;
    peer.on('open', () => this.onStatus({ state: this.conns.size ? 'connected' : 'ready', code, n: this.conns.size }));
    peer.on('connection', (conn) => this._accept(conn));
    peer.on('disconnected', () => { setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch { /* ignore */ } }, 1500); });
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { // our code is still registered from a previous tab/session
        peer.destroy();
        if (attempt < 1) setTimeout(() => this._open(Peer, code, attempt + 1), 4000);
        else { const c = genCode(); store.set('fw.wandCode', c); this._open(Peer, c, 0); }
        return;
      }
      if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
        this.onStatus({ state: 'error', code, err: err.type });
        setTimeout(() => { try { if (!peer.destroyed) peer.reconnect(); } catch { /* ignore */ } }, 3000);
        return;
      }
      console.warn('[wand] peer error', err.type, err);
    });
  }

  _accept(conn) {
    const drop = () => {
      if (!this.conns.has(conn.peer)) return;
      this.conns.delete(conn.peer);
      this.onStatus({ state: this.conns.size ? 'connected' : 'lost', code: this.code, n: this.conns.size });
      this.onEvent(conn.peer, { t: 'bye' });
    };
    conn.on('open', () => {
      this.conns.set(conn.peer, conn);
      this.onStatus({ state: 'connected', code: this.code, n: this.conns.size });
      this.onEvent(conn.peer, { t: 'hello' });
    });
    conn.on('data', (msg) => {
      if (typeof msg === 'string') { try { msg = JSON.parse(msg); } catch { return; } }
      if (!msg || typeof msg !== 'object') return;
      if (msg.t === 'm') this.onMotion(conn.peer, +msg.x || 0, +msg.y || 0, !!msg.d);
      else this.onEvent(conn.peer, msg);
    });
    conn.on('close', drop);
    conn.on('error', drop);
  }

  broadcast(msg) { for (const c of this.conns.values()) { try { c.send(msg); } catch { /* ignore */ } } }

  /** URL the phone should open. {url, secure} — secure=false means the phone can't use the gyroscope. */
  wandUrl() {
    const base = CONFIG.PUBLIC_BASE || new URL('.', location.href).href;
    const url = new URL('wand.html', base);
    url.searchParams.set('c', this.code || '');
    return { url: url.href, secure: url.protocol === 'https:' };
  }
}
