# 02 — Jest ayarı ve performans

**Goal:** Reach the tech-gate thresholds (camera ≥ 85%, wand ≥ 90%, ≤ 1 false trigger / 10 min) and ≥ 30 fps on my laptop.
**Context:** docs/GESTURES.md tuning order; js/gesture-core.js; js/hand-input.js; js/main.js (onHandFrame mapping).

```
My measurements: camera __/20, wand __/20, false triggers __ in 10 min, FPS chip shows __ fps, laptop: __.
Tune in this order and stop as soon as thresholds are met:
1) Sensitivity/mapping (k in onHandFrame), One-Euro params.
2) Circle thresholds: roundMax 0.34→0.40, angleFrac 0.85→0.80 (one at a time, re-run tests).
3) If fps < 20: move MediaPipe inference into a Web Worker (ImageBitmap transfer) — keep the same onFrame contract.
4) Add a debug overlay (key D) that draws the current trace, centroid and live ΣΔθ / roundness numbers so I can see why a circle fails.
Add tests for every threshold change (positive + negative cases). Update docs/GESTURES.md with final values.
```
**Acceptance:** thresholds met in my re-test; unit tests updated; GESTURES.md matches code.
