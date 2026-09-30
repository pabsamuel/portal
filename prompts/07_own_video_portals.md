# 07 — Kendi videonla portal (Pro)

**Goal:** Drop a local video (or pick a file) and it plays inside the portal with full effects — licensing-safe content.

```
- Settings → "Kendi videolarım": file picker + drag&drop onto the screen. Files stay local (object URLs); list persisted
  by name only (re-pick after reload) — no uploads anywhere.
- New entry type {type:'file'} handled in main.js/showEntry and portal-view.js (a <video> element inside #ytWrap, loop, muted by default).
- Also support a direct video URL (MP4/HLS with CORS) for streamers' own cloud files.
- Add these entries to the rotation under a "Benim" category; unit-free logic but add a smoke test path.
```
**Acceptance:** An MP4 from my phone plays inside the portal with sparks; nothing leaves the device.
