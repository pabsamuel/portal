// ui.js — HUD, panels (phone pairing / settings / help), destination label, toasts, hints.
import { t, tx, lang, applyI18n } from './i18n.js';
import { settings, saveSettings, ALL_CATS } from './settings.js';
import { THEME_KEYS } from './portal-fx.js';
import qrcode from '../vendor/qrcode.mjs';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class UI {
  constructor(handlers) {
    this.h = handlers;
    this.label = $('#label'); this.toastEl = $('#toast'); this.hintEl = $('#hint'); this.hud = $('#hud');
    this.hudAt = 0; this.entry = null; this.status = null; this.clockAt = 0; this.toastTimer = 0;
    this.wand = { state: 'off' }; this.userCams = [];
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      e.preventDefault();
      this.h.action(b.dataset.act, b.dataset, b);
    });
    document.addEventListener('change', (e) => this._onSetting(e));
    document.addEventListener('input', (e) => { if (e.target.type === 'range') this._onSetting(e); });
    document.addEventListener('pointermove', () => this.pokeHud(), { passive: true });
    this.renderAll();
  }

  renderAll() {
    applyI18n();
    this.renderSettings(); this.renderHelp(); this.renderPhone();
    if (this.entry) this.showLabel(this.entry, this.status);
  }

  // ---------- panels ----------
  openPanel(name) {
    for (const p of document.querySelectorAll('.panel')) p.classList.toggle('hidden', p.id !== 'panel' + name);
    if (name === 'Phone') this.renderPhone();
    if (name === 'Settings') this.renderSettings();
  }
  closePanels() { for (const p of document.querySelectorAll('.panel')) p.classList.add('hidden'); }
  panelOpen() { return !!document.querySelector('.panel:not(.hidden)'); }
  togglePanel(name) { const el = $('#panel' + name); if (el && !el.classList.contains('hidden')) this.closePanels(); else this.openPanel(name); }

  renderPhone() {
    const el = $('#panelPhone'); if (!el) return;
    const w = this.wand, info = w.url || null;
    let qr = '<div class="qr-wait">…</div>';
    if (info && w.code) {
      try { const q = qrcode(0, 'M'); q.addData(info.url); q.make(); qr = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch { /* ignore */ }
    }
    const st = { off: '—', connecting: '…', ready: t('wandWaiting'), connected: `${w.n || 1} ${t('wandCount')} ✓`, lost: t('wandLost'), error: t('peerFail'), nolib: t('noPeerLib') }[w.state] || w.state;
    el.innerHTML = `
      <header><h2>📱 ${esc(t('phoneTitle'))}</h2><button class="x" data-act="close-panel" aria-label="${esc(t('close'))}">✕</button></header>
      <div class="phone-body">
        <div class="qr">${qr}</div>
        <div class="steps">
          <ol><li>${esc(t('phoneStep1'))}</li><li>${esc(t('phoneStep2'))}</li><li>${esc(t('phoneStep3'))}</li></ol>
          <p class="code">${esc(t('code'))}: <b>${esc(w.code || '·····')}</b> <span class="st st-${esc(w.state)}">${esc(st)}</span></p>
          ${info ? `<p class="url"><code>${esc(info.url)}</code></p>` : ''}
          ${info && !info.secure ? `<p class="warn">⚠️ ${esc(t('phoneHttpsWarn'))}</p>` : ''}
          <p class="note">${esc(t('phoneNote'))}</p>
        </div>
      </div>`;
  }
  setWand(w) { this.wand = { ...this.wand, ...w }; if (!$('#panelPhone').classList.contains('hidden')) this.renderPhone(); this._chip('#stWand', w.chip, w.level); }

  renderSettings() {
    const el = $('#panelSettings'); if (!el) return;
    const seg = (key, vals, label) => `<div class="seg">${vals.map((v) => `<button data-act="set" data-key="${key}" data-val="${v}" class="${settings[key] === v ? 'on' : ''}">${esc(label(v))}</button>`).join('')}</div>`;
    const catsL = t('cats'), themesL = t('themes');
    el.innerHTML = `
      <header><h2>⚙️ ${esc(t('settingsTitle'))}</h2><button class="x" data-act="close-panel" aria-label="${esc(t('close'))}">✕</button></header>
      <div class="rows">
        <div class="row"><span class="lbl">${esc(t('theme'))}</span>${seg('theme', THEME_KEYS, (v) => themesL[v] || v)}</div>
        <div class="row"><span class="lbl">${esc(t('size'))}</span>${seg('size', ['gesture', 'large', 'huge'], (v) => t({ gesture: 'sizeGesture', large: 'sizeLarge', huge: 'sizeHuge' }[v]))}</div>
        <div class="row col"><span class="lbl">${esc(t('categories'))}</span><div class="chips">${ALL_CATS.map((c) => `<label class="chipbox"><input type="checkbox" data-cat="${c}" ${settings.cats.includes(c) ? 'checked' : ''}>${esc(catsL[c] || c)}</label>`).join('')}</div></div>
        <div class="row"><label class="tog"><input type="checkbox" data-set="sfx" ${settings.sfx ? 'checked' : ''}> ${esc(t('sfx'))}</label></div>
        <div class="row"><label class="tog"><input type="checkbox" data-set="preview" ${settings.preview ? 'checked' : ''}> ${esc(t('preview'))}</label></div>
        <div class="row"><span class="lbl">${esc(t('sensitivity'))}</span><input type="range" min="0.6" max="1.8" step="0.05" data-set="sens" value="${settings.sens}"><span class="val">${Number(settings.sens).toFixed(2)}×</span></div>
        <div class="row"><label class="tog"><input type="checkbox" data-set="compliant" ${settings.compliant ? 'checked' : ''}> ${esc(t('compliant'))}</label></div>
        <div class="row"><span class="lbl">${esc(t('language'))}</span>${seg('lang', ['tr', 'en'], (v) => v.toUpperCase())}</div>
        <div class="row col"><span class="lbl">${esc(t('addCam'))}</span>
          <div class="addcam"><input id="ucUrl" type="url" placeholder="${esc(t('addCamUrl'))}"><input id="ucName" type="text" placeholder="${esc(t('addCamName'))}"><button data-act="add-cam">${esc(t('add'))}</button></div>
          <ul class="uclist">${this.userCams.map((c) => `<li><span>${esc(c.flag || '📍')} ${esc(tx(c.name))}</span><button class="ghost sm" data-act="remove-cam" data-key="${esc(c.key)}">${esc(t('remove'))}</button></li>`).join('')}</ul>
        </div>
        <div class="row"><button class="ghost" data-act="clear-dead">${esc(t('clearDead'))}</button><a class="link" href="sources.html" target="_blank" rel="noopener">${esc(t('sourcesPage'))}</a></div>
      </div>`;
  }
  setUserCams(list) { this.userCams = list; }

  _onSetting(e) {
    const el = e.target;
    if (el.dataset.cat) {
      const on = new Set(settings.cats);
      el.checked ? on.add(el.dataset.cat) : on.delete(el.dataset.cat);
      if (!on.size) { el.checked = true; return; } // keep at least one category
      settings.cats = ALL_CATS.filter((c) => on.has(c)); saveSettings(); this.h.settingChanged('cats');
      return;
    }
    const key = el.dataset.set; if (!key) return;
    settings[key] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
    saveSettings();
    if (el.type === 'range') { const v = el.parentElement.querySelector('.val'); if (v) v.textContent = Number(el.value).toFixed(2) + '×'; }
    this.h.settingChanged(key);
  }

  renderHelp() {
    const el = $('#panelHelp'); if (!el) return;
    const rows = [['◯', 'gCircle', 'gCircleDo'], ['⇆', 'gSwipe', 'gSwipeDo'], ['✊', 'gFist', 'gFistDo'], ['✌️', 'gVictory', 'gVictoryDo'], ['👍', 'gThumb', 'gThumbDo'], ['🙌', 'gTwo', 'gTwoDo'], ['🤟', 'gRock', 'gRockDo'], ['📱', 'gShake', 'gShakeDo']];
    el.innerHTML = `
      <header><h2>❔ ${esc(t('helpTitle'))}</h2><button class="x" data-act="close-panel" aria-label="${esc(t('close'))}">✕</button></header>
      <ul class="gestures">${rows.map(([i, a, b]) => `<li><span class="gi">${i}</span><span class="ga">${esc(t(a))}</span><span class="gb">${esc(t(b))}</span></li>`).join('')}</ul>
      <p class="keys"><b>${esc(t('keys'))}:</b> ${esc(t('keysList'))}</p>`;
  }

  // ---------- label under the portal ----------
  showLabel(entry, status) {
    this.entry = entry; this.status = status;
    const badge = status === 'live' ? `<span class="badge live">● ${esc(t('live'))}</span>` : status === 'recorded' ? `<span class="badge rec">${esc(t('recorded'))}</span>` : status === 'offline' ? `<span class="badge demo">${esc(t('offline'))}</span>` : '';
    this.label.innerHTML = `<div class="lname">${esc(entry.flag || '')} ${esc(tx(entry.name))}</div><div class="lsub">${badge}<span class="lplace">${esc(tx(entry.place))}</span><span class="lclock"></span></div>`;
    this.label.classList.remove('hidden');
    this.clockAt = 0;
  }
  hideLabel() { this.entry = null; this.label.classList.add('hidden'); }
  placeLabel(cx, cy, R, rect) {
    const W = window.innerWidth, H = window.innerHeight, st = this.label.style;
    let top, left = rect ? W / 2 : Math.min(Math.max(cx, 220), W - 220);
    if (rect) top = rect.y + rect.h + 18;
    else if (cy + R + 110 < H) top = cy + R + 22;
    else if (cy - R - 110 > 0) top = cy - R - 100;
    let maxW = '';
    if (!rect && top === undefined) {
      if (cx - R > 320) { left = (cx - R) / 2; top = cy - 40; maxW = cx - R - 24 + 'px'; }      // big portal: label beside it
      else if (W - cx - R > 320) { left = cx + R + (W - cx - R) / 2; top = cy - 40; maxW = W - cx - R - 24 + 'px'; }
      else top = H - 110;
    }
    st.top = Math.max(8, top) + 'px'; st.left = left + 'px'; st.maxWidth = maxW;
  }

  tick(now, app) {
    if (this.entry && now - this.clockAt > 1) {
      this.clockAt = now;
      const el = this.label.querySelector('.lclock');
      if (el && this.entry.tz) {
        try {
          const d = new Date();
          const time = new Intl.DateTimeFormat(lang() === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: this.entry.tz }).format(d);
          const hour = +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: this.entry.tz }).format(d);
          el.textContent = `${hour >= 6 && hour < 19 ? '☀️' : '🌙'} ${time} ${t('localTime')}`;
        } catch { el.textContent = ''; }
      }
    }
    if (now - this.hudAt > 3.5 && !this.panelOpen() && !app.hudPinned) this.hud.classList.add('dim');
  }

  pokeHud() { this.hudAt = performance.now() / 1000; this.hud.classList.remove('dim'); }

  toast(msg, ms = 2600) {
    this.toastEl.textContent = msg; this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toastEl.classList.add('hidden'), ms);
  }
  hint(text) {
    if (!text) { this.hintEl.classList.add('hidden'); return; }
    if (this.hintEl.textContent !== text) this.hintEl.textContent = text;
    this.hintEl.classList.remove('hidden');
  }

  setHand(text, level) { this._chip('#stHand', text, level); }
  _chip(sel, text, level) {
    const el = $(sel); if (!el || text == null) return;
    el.querySelector('em').textContent = text;
    el.className = 'chip ' + (level || '');
  }
  hideStart() { $('#start').classList.add('hidden'); document.body.classList.add('running'); }
}
