# 10 — Mağaza/satış öncesi uyumluluk

**Goal:** Make the paid/store build policy-safe without losing the magic.

```
1) Default settings.compliant = true for YouTube sources in the paid build (keep the circle mode for Tier A: own video,
   NASA downloads, licensed packs).
2) In compliant mode: after the opening animation the YouTube player is shown unmodified (controls visible,
   ≥ 200×200, nothing overlapping — add an automated test that checks no element intersects the iframe rect).
3) Add attribution lines per source (cams.js: attribution field) under the player.
4) Replace YouTube in the featured sequence with Tier A content where possible.
5) Run npm run check (banned words), update docs/CAMERA_SOURCES_AND_LICENSING.md and PROGRESS (S4).
```
**Acceptance:** Intersection test passes; banned-word check clean; a reviewer could not point to an overlay on a YouTube player.
