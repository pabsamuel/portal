# PRD — Portal MVP (web / PWA)

**Job to be done:** “Give me a jaw-drop moment on a big screen — at a party, on stream, in class, at an event —
triggered by a magic gesture.”

**Users (priority):** 1) streamers (OBS) · 2) party hosts, kids’ entertainers, escape rooms, venues · 3) families with a
laptop + TV/projector · 4) teachers (geography) — later.

## Shipped in v0.1.0 (prototype)
| ID | Story | Status |
|---|---|---|
| U1 | Open the app on a laptop → HDMI → TV; scan a QR; the phone becomes a wand in < 15 s | code ✓, device test pending |
| U2 | Draw a circle with the phone → portal opens < 300 ms after the gesture ends | code ✓ |
| U3 | Draw a circle with the index finger in front of the webcam → portal opens (no phone) | code ✓, real-camera test pending |
| U4 | The portal reveals a live cam (37 destinations, 65 stream IDs, auto-skip dead ones) | code ✓, IDs unverified |
| U5 | Fast flick left/right = previous/next destination | ✓ |
| U6 | Fist (0.5 s) / reverse / right-click / Esc = close | ✓ |
| U7 | Compliant mode: portal animation, then a clean unmodified player with nothing over it | ✓ (setting) |
| U8 | Add your own YouTube live link (e.g. a Sapanca cam) | ✓ |
| U9 | Label: place, flag, local time with ☀️/🌙, LIVE badge | ✓ |
| U10 | Settings: theme, size, categories, sounds, preview, sensitivity, language TR/EN | ✓ |
| U11 | Offline demo portal when there is no internet / YouTube fails | ✓ |
| U12 | Mouse/touch fallback (draw with the mouse) | ✓ |

## Next (not in v0.1.0)
| ID | Story | Milestone |
|---|---|---|
| N1 | Pro: play your own video file inside the portal (local, never uploaded) | S3 |
| N2 | Streamer/OBS mode: transparent background, trigger by hotkey / HTTP / wand | S2 |
| N3 | Landing page + waitlist | V3 |
| N4 | Payment + offline licence key (Merchant of Record) | S1 |
| N5 | Kiosk/event loop mode with custom branding | S3/G3 |

## Non-functional
- 60 fps target / 30 fps floor at 1080p on a 2019+ integrated-GPU laptop.
- Camera frames never leave the device. No accounts. Works in Chrome/Edge desktop; wand on iOS Safari 16+ and Android Chrome.
- Degrades gracefully: no camera → mouse/phone; no YouTube → offline portal; no pairing server → mouse/hand still work.

## Non-goals (until Revenue gate 1)
Native TV / Quest / mobile-AR apps · proxying or re-streaming third-party video · accounts, social, cloud uploads ·
multiplayer beyond several phones in one room · any franchise names or visuals.
