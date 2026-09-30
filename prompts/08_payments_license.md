# 08 — Ödeme + lisans anahtarı

**Goal:** Sell Home/Streamer/Pro from Türkiye without a backend of our own.
**Context:** docs/PRICING.md, docs/LEGAL_PRIVACY_IP.md (Stripe not available for TR businesses → Merchant of Record).

```
1) Ask me which MoR I opened (Polar / Paddle / Lemon Squeezy) and paste its product IDs.
2) Buy buttons on landing.html → MoR checkout links.
3) Licence: the MoR issues a licence key; the app validates it via the MoR's public licence-validation endpoint once,
   then caches a signed/obfuscated unlock locally (offline-friendly). Never hard-code secrets in the client.
4) Free tier limits: 3 destinations + watermark; Home unlocks everything; Streamer unlocks obs.html; Pro unlocks kiosk/branding.
5) Refund flow text + support email in the footer. Update PROGRESS (S1).
```
**Acceptance:** Test purchase in the MoR's test mode unlocks the app; refund revokes on next validation.
