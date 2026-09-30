# Technical Architecture (v0.1.0)

## Why this stack
Static files, **no build step**, no framework, no server of our own. Anyone (including Claude Code) can open any file and
change it; deploy = copy files to any HTTPS static host (GitHub Pages). Cost ≈ USD 0/month.

## Runtime pieces
```
                    ┌────────────────────── big screen (laptop → HDMI → TV / projector) ─────────────────────┐
  webcam ──► hand-input.js (MediaPipe, in-browser) ─┐                                                      │
  mouse/touch ───────────────────────────────────────┼─► main.js feed() ─► gesture-core.js ─► actions        │
  phone ──WebRTC──► wand-link.js ────────────────────┘      (circle, swipe, hold)        open/hop/close     │
                                                                                            │              │
                            portal-fx.js (Canvas: sparks, trails)  ◄─────────────────────────┤              │
                            portal-view.js (div clip-path circle) ◄── youtube.js (IFrame API) ◄── cams.js   │
                    └────────────────────────────────────────────────────────────────────────────────────┘
  phone: wand.html + wand.js — DeviceMotion → airMouseDelta() → {t:'m',x,y,d} ~60 Hz over a WebRTC data channel
```

## Components
| File | Responsibility | Notes |
|---|---|---|
| `js/gesture-core.js` | Circle/Swipe/Hold/Shake detectors, One-Euro filter, air-mouse math | Pure; `npm test` |
| `js/main.js` | Input funnel, portal state machine, playlist, dead-source cache, keyboard/mouse, frame loop | Exposes `window.__portal.api` |
| `js/portal-fx.js` | Particle system (7,000 cap, struct-of-arrays), rim, loading swirl, vignette, trails, 4 themes | One path per colour bucket → few draw calls |
| `js/portal-view.js` | Video layer covers the viewport; GPU transform scales it to the portal (or full screen); circular clip; ambient light (`backdrop-filter` + circular mask) around the portal; offline scene; window mode | Smooth portal ↔ full-screen |
| `js/deck.js` | Two LivePlayers: visible + standby. Standby pre-warms the next cam; only PLAYING streams are swapped in; removed (thumbnail placeholder), failing and not-live sources are skipped silently | The user never sees a dead cam |
| `js/youtube.js` | Loads IFrame API; `play(src)` resolves on PLAYING, rejects on error/ended/15 s timeout; reuses player via `loadVideoById` | Handles channel `live_stream` embeds |
| `js/hand-input.js` | getUserMedia + GestureRecognizer (GPU→CPU fallback), ~30 fps, preview skeleton, scripted fake hand | MediaPipe from jsDelivr, model from Google storage |
| `js/wand-link.js` | PeerJS peer `fwportal-<code>`, accepts multiple phones, QR URL | Code persisted in localStorage |
| `js/wand.js` | Phone UI, iOS motion permission, gravity calibration, pad (pen down / trackpad), shake, wake lock, reconnect | |
| `js/cams.js` | Destinations (37 places, 65 stream IDs, alt IDs, channel fallbacks) | **Unverified IDs** — run sources.html |
| `js/ui.js`, `i18n.js`, `settings.js`, `audio.js` | HUD/panels/label, TR+EN, persisted settings, synthesized sounds | |
| `sources.html` + `js/sources.js` | Tests every stream in the real browser; exports a working list; can mark dead ones | |

## Data flow for one portal
1. Detector emits `circle {cx, cy, r, dir, startAngle}`.
2. `openPortalAt` sizes (gesture: r×1.25 clamped to 0.30–0.47 of min dimension; large/huge modes centered), positions the
   video layer, starts the FX opening (0.34 s spark trace → 0.66 s iris with overshoot), plays the open sound.
3. `showEntry` tries each stream ID (then channel fallback). While loading, the FX draws an “energy tunnel” over the video.
   On PLAYING the tunnel fades out → the live cam is visible through the ring. On failure: mark dead (6 h), toast, next place.
   After 6 failures in a row, or if the YouTube API itself can’t load → offline portal.
4. Hop: flare + shockwave + loading tunnel → next stream. Close: ring collapses (0.42 s) + spark burst → player stopped after 0.52 s.

## Performance budget
- Canvas DPR capped at 1.5 and total pixels ≤ 3.2 M (4K TVs render at ~1080p internally).
- Spark emission ∝ circumference (≈1,000–2,000 live particles at typical sizes). Headless software rendering hit 30 fps; a real GPU should hold 60.
- Hand inference throttled to ≤ 35 Hz on the main thread; move to a Worker if a device drops below 20 fps (prompt 02).

## Latency targets
Wand message → cursor ≤ 80 ms p95 on the same Wi-Fi; gesture end → portal ignition ≤ 300 ms (currently next frame).

## Hosting & costs (estimates)
GitHub Pages (free, HTTPS) · PeerJS cloud signaling (free, best-effort) · jsDelivr + Google storage for MediaPipe (free).
Risks: PeerJS cloud downtime → optional self-hosted PeerServer later (≈ USD 0–5/month on a small VM).

## Port order (only after Revenue gate 1)
1. Android TV / Google TV + Fire TV (WebView shell, wand default, camera only if a UVC webcam gives ≥ 20 fps)
2. OBS/streamer packaging · 3. Samsung Tizen / LG webOS (wand only) · 4. tvOS (Continuity Camera; only if iOS ≥ 40% of buyers)
5. Quest passthrough (backlog).
