// config.js — the only file you normally need to edit for deployment.
export const CONFIG = {
  // Public HTTPS address of this app (with trailing slash). The phone page needs HTTPS for the
  // gyroscope, so when the big screen runs from http://localhost the QR code points here instead.
  // Leave '' to use the current address (fine when the app itself is opened from https://…).
  PUBLIC_BASE: '',

  APP_NAME: 'Farwindow Portal',   // working title — see docs/BRAND_AND_NAMING.md
  VERSION: '0.1.0',

  // Phone pairing (PeerJS free cloud signaling → direct WebRTC data channel)
  PEER_PREFIX: 'fwportal-',

  // Hand tracking (loaded only when camera mode is used)
  MP_CDN: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1',
  MP_MODEL: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',

  PLAY_TIMEOUT_MS: 15000,          // a live cam must start playing within this time
  DEAD_TTL_MS: 6 * 60 * 60 * 1000, // a failed cam is skipped for 6 hours
  MAX_FAIL_STREAK: 6,              // after this many dead cams in a row → offline portal
};
