// settings.js — persisted user settings (localStorage, wrapped so private mode never breaks the app).
const KEY = 'fw.settings.v1';

export const ALL_CATS = ['turkiye', 'city', 'nature', 'animals', 'water', 'sky', 'space', 'mountain', 'beach'];

export const DEFAULT_SETTINGS = {
  lang: (typeof navigator !== 'undefined' && !(navigator.language || 'tr').toLowerCase().startsWith('tr')) ? 'en' : 'tr',
  theme: 'ember',        // ember | aurora | plasma | frost
  size: 'gesture',       // gesture | large | huge
  cats: [...ALL_CATS],
  sfx: true,
  preview: true,         // small camera preview with hand skeleton
  sens: 1.0,             // hand-tracking reach (higher = smaller hand motion covers the screen)
  compliant: false,      // store-release mode: unmodified rectangular player, no effects over it
  ambient: true,         // blurred copy of the live view fills the screen around the portal
};

export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

export const settings = { ...DEFAULT_SETTINGS, ...store.get(KEY, {}) };
if (!Array.isArray(settings.cats) || !settings.cats.length) settings.cats = [...ALL_CATS];

export function saveSettings() { store.set(KEY, settings); }
