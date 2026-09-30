# 03 — Canlı kamera listesini güncelle

**Goal:** Keep ≥ 25 working places (≥ 4 in Türkiye) in js/cams.js.
**Context:** I ran sources.html → “Hepsini test et”. JSON output is below. docs/CAMERA_SOURCES_AND_LICENSING.md rules apply.

```
Using the JSON below:
1) Remove stream IDs that failed (keep the place if at least one ID or channel works).
2) Reorder the first 20 entries so the "featured" sequence alternates categories (city, Türkiye, space, animals, water, sky…).
3) For places with no working ID, search for the channel's current official live stream ID and add it as a candidate
   (only official channels/owners; no restreams of other people's cams; never Insecam-type sources).
4) Keep the file format and comments; update the "verified on" date comment at the top.
5) Update PROGRESS.md item P3 and the known-risks list.

<SOURCES.HTML JSON ÇIKTISINI BURAYA YAPIŞTIR>
```
**Acceptance:** sources.html re-run shows ≥ 25 working places; no forbidden sources.
