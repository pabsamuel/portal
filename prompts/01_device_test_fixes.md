# 01 — Cihaz testi sonrası düzeltmeler

**Goal:** Fix what failed in the real-device test without adding features.
**Context:** CLAUDE.md, PROGRESS.md, docs/GESTURES.md, my filled docs/TEST_CHECKLIST.md (pasted below).

```
Here is my filled TEST_CHECKLIST (below). For each ✗ or weak score:
1) Explain the most likely root cause (be specific: file + function).
2) Propose the smallest fix; if it's a threshold, change the value in gesture-core.js / main.js and say why.
3) Add or update a unit test in tests/gesture-core.test.mjs for any gesture logic change.
4) Run npm test (+ smoke if possible). Show the output.
5) Update PROGRESS.md: items verified on my device become ✅ (100%), fixed-but-not-retested stay 🟠.
Do NOT add new features. Put ideas in docs/IDEAS_BACKLOG.md.

<CHECKLIST'İ BURAYA YAPIŞTIR>
```
**Acceptance:** every ✗ has a cause + fix or an explicit "needs hardware test"; tests green; PROGRESS.md updated.
