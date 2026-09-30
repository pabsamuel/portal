# Legal, Privacy, IP — working notes (not legal advice; confirm with a lawyer / mali müşavir)

## Trademarks & look
- **Banned words** (code, UI, metadata, ads, hashtags, file names): Doctor Strange, Strange (as a name), Sling Ring,
  Marvel, MCU, Kamar-Taj, Sorcerer Supreme, Mystic Arts, Avengers. `npm run check` greps for them.
- **Banned visuals:** rune/mandala/glyph rings, the two-finger ring prop, film-style sound effects, character costumes.
- A generic ring of sparks is fine. Apple (Guideline 5.2) and other stores reject apps using third-party marks without
  authorization — assume every store and ad platform does the same.
- The original “sling ring portal” reference stays **only** in private planning, never in anything public.

## Privacy
- User camera: processed on-device by MediaPipe in the browser; frames are never stored or sent. Say so in the UI (done)
  and in the privacy policy.
- Phone link: only motion numbers and button events travel between phone and screen (WebRTC, peer-to-peer).
- Third-party cams: prefer wide views; no zoom, no recording/screenshots of Tier B players, no face recognition.
- GDPR / KVKK: identifiable people on video are personal data. Prefer landscapes, nature, space; avoid street-level cams
  in paid Tier A packs; document source choices; honour takedowns within 24 h.
- Kid-safe mode (backlog) = Tier A nature/space only.

## Türkiye seller-side notes (confirm with your mali müşavir)
- Business form: existing şahıs işletmesi is enough; add the software/service activity code (NACE) if missing.
- Payments: Stripe does not onboard Türkiye-registered businesses directly → use a **Merchant of Record** (Polar,
  Paddle, Lemon Squeezy; plan with 5% + USD 0.50 per sale). The MoR handles buyer-side VAT/sales tax.
- Invoicing: issue an e-Arşiv invoice to the MoR as a **service export**; KDV-exempt under KDV Kanunu 11/1-a.
- Income tax: GVK 89/13 software service-export deduction was raised to **100% for periods from 1 Jan 2026**
  (Presidential Decision 11257, Resmî Gazete 33239, 30 Apr 2026) on condition the earnings are brought to Türkiye.
- Genç girişimci exemption (TRY 400,000 for 2026) — only if eligible (first registration before 29, within 3 years).
- GVK 20/B (15% final withholding) covers **mobile apps sold via app platforms** — don’t assume it covers web/TV sales.

## Store policies checklist (before any store submission)
Original name + icon · no franchise references · privacy labels (camera: not collected) · content rights documented per
source · compliant mode default for YouTube · age rating general · support email · takedown contact.
