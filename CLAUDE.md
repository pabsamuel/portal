# CLAUDE.md — instructions for Claude Code in this repo

Project: **Farwindow Portal** (working title). Gesture-triggered sparking portal for TVs/projectors that reveals live
public webcams. Owner: Samet (Atesen Software). Static web app, no build step.

## Talk to Samet like this
- Reply in **Turkish** (he is C2 in English, but Turkish is faster for him). Code, comments, commit messages: English.
- **Every reply ends with the project completion %** from `PROGRESS.md` (e.g. “Proje: %27 (+4)”). Recalculate with the
  scoring rule in PROGRESS.md; never round up; code that is not tested on his device is not 100%.
- Be brutally honest and concrete. No hype, no “passive income”, no inflated numbers. Estimates are labeled as estimates.
- He has 3 days off per week and starts many projects; keep sessions to ONE milestone, finish it, then stop.

## Session ritual (always)
1. Read `PROGRESS.md` → state the next task and current %.
2. Plan first (files, tests, risks) → wait for approval when the change is bigger than ~50 lines.
3. Implement in small steps. After each: `npm test` (and `npm run test:smoke` when UI changed and Playwright is installed).
4. End: update `PROGRESS.md` (item status, new %, changelog line, next single task), propose a commit message.

## Architecture (read docs/TECH_ARCHITECTURE.md for detail)
- `index.html` + `js/main.js` = big screen. `wand.html` + `js/wand.js` = phone. `sources.html` = cam checker.
- `js/gesture-core.js` is **pure** (no DOM) and fully unit-tested — put all recognition logic there, add tests for every change.
- Units in gesture code: 1 unit = min(screenW, screenH) px; time in seconds.
- Layers: `#portalView` (YouTube iframe, CSS clip-path circle) → `#fx` canvas (sparks, ABOVE the video) → DOM UI.
- Phone ↔ screen: PeerJS cloud signaling → WebRTC data channel; messages `{t:'m',x,y,d}`, `{t:'btn',b}`, `{t:'shake'}`,
  `{t:'recenter'}`; screen → phone `{t:'state',...}`, `{t:'buzz',ms}`.
- Test hooks: `window.__portal.api` (open/close/hop/feed/onWandEvent/onWandMotion/state), URL flags `?offline=1`,
  `?fakehand=1`, `?auto=mouse|hand|phone`.

## Never
1. Never use franchise names or visuals (Doctor Strange, Sling Ring, Marvel, MCU, Kamar-Taj, Avengers…) in code, UI,
   assets, store listings or marketing. No runes/mandalas/glyphs in the portal. `npm run check` enforces the word list.
2. Never add unsecured/private IP camera sources (Insecam-style), scrapers, or stream-URL extraction from EarthCam/
   SkylineWebcams/Windy pages. Only official embeds (YouTube IFrame API) or licensed/owned footage.
3. Never proxy or re-stream third-party video through our servers. Never send webcam frames off the device.
4. Never add a build step, framework or paid service without asking. Keep it static and dependency-light.
5. Never build beyond the current milestone — put ideas in `docs/IDEAS_BACKLOG.md`.
6. Before any **commercial** release: `compliant` mode (unmodified YouTube player, no overlay) must be the default for
   YouTube sources, or the content must be licensed/owned. See docs/CAMERA_SOURCES_AND_LICENSING.md.

## Conventions
- ES modules, 2-space indent, no semicolon-less style changes, small functions, comments explain *why*.
- Strings shown to users go through `js/i18n.js` (TR + EN).
- Keep 60 fps on a 2019+ integrated-GPU laptop at 1080p; FX particle cap is 7000.
- Commit messages: `M<n>: <what>`; end with the attribution lines if your environment requires them.
