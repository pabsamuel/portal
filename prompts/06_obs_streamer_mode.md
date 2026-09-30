# 06 — Yayıncı (OBS) modu

**Goal:** Streamers add the portal as an OBS Browser Source and trigger it from stream deck/hotkeys.

```
Implement obs.html (reuses main modules):
- Transparent background (no #bg), no HUD/labels unless ?label=1.
- Triggers: keyboard (when the source is interacted), BroadcastChannel from a small control page (control.html),
  and the phone wand (same pairing).
- Portal content options: (a) the streamer's own video/scene via a URL they give (MP4/HLS/image) — effects allowed;
  (b) YouTube only in compliant window mode.
- Document setup steps (OBS: Browser Source → URL → 1920×1080 → "Shutdown source when not visible" off) in docs/OBS.md.
```
**Acceptance:** Works in OBS 30+ on Windows; transparent background verified; control page triggers open/close/hop.
