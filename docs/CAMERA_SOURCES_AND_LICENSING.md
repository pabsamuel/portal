# Camera Sources and Licensing

**Rule zero:** if there is no written clause allowing our exact use, it is not allowed in a paid product.

## Current prototype mode (decided 30 Sep 2026)
Live **YouTube** streams play inside the circular portal (clipped, sparks drawn over the edge). This is acceptable for a
prototype, personal use and demo videos **you record yourself**. It conflicts with YouTube’s Required Minimum
Functionality (“You must not display overlays, frames, or other visual elements in front of any part of a YouTube
embedded player”) and with the “don’t alter the player” spirit of most cam providers. Before charging money:
switch YouTube sources to **Compliant mode** (Settings) or use Tier A content.

## Tier A — may appear inside the portal with effects (commercial-safe)
| Source | Basis | Conditions |
|---|---|---|
| Own recordings (Sapanca, Sakarya, Istanbul, Black Sea time-lapses) | Own copyright | Wide shots, no close-up faces, no private interiors |
| Customer’s own video (Pro, planned) | Customer warrants rights | Played locally, never uploaded |
| NASA downloaded video | “generally not subject to copyright in the United States” | No NASA insignia/logos; no implied endorsement; avoid identifiable astronauts in ads |
| Caltrans CWWP2 traffic cams | Free, intended for commercial/media info providers | Credit Caltrans; direct playback only |
| Direct licences (hotels, tourism boards, municipalities) | Signed contract | Must explicitly allow visual effects in a commercial app |

## Tier B — “Window mode” only in a paid product (unmodified player, nothing over it)
| Source | Key clauses | Implementation |
|---|---|---|
| YouTube live (official channels) | No overlays/frames over any part; player ≥ 200×200; one autoplaying player; Referer header | Compliant mode: portal animation, then a clean rectangle with controls |
| Windy Webcams API (free tier) | Attribution + link; data “as is”; not solely in a paid tier; ads intact; image URLs expire (10–15 min) | Free tier only; iframe untouched |
| 511NY | “cannot be altered in any way”; key; 10 calls / 60 s; “powered by 511NY” | Window mode; cached catalogue |

## Tier C — only with a signed licence
EarthCam (embedding needs written permission) · SkylineWebcams (live embeds only for camera hosts) · Explore.org
(commercial use via PR@explore.org; watermark must stay visible).

## Forbidden — always
- Unsecured / default-password IP camera directories (Insecam-style), controlling other people’s PTZ cams.
- Scraping stream URLs out of EarthCam / SkylineWebcams / Windy pages.
- Cams pointed into private spaces, pools, schools, hospitals, children’s areas.
- Marketing copy like “CCTV”, “spy”, “watch people”.

## Operations
- `js/cams.js` fields: key, yt[] (tried in order), ch (channel fallback), name/place (TR/EN), flag, tz, cat, lat/lon.
- Runtime: a stream that doesn’t start in 15 s, errors, or has ended is skipped for 6 h (localStorage `fw.dead`).
- Monthly: open `sources.html` → “Test all” → paste the JSON into Claude with `prompts/03_curate_sources.md`.
- Takedown: if an owner asks, remove within 24 h and note it in PROGRESS.md.
- Status 30 Sep 2026: 37 places / 65 IDs collected from search results; **not verified** (sandbox had no YouTube access).
