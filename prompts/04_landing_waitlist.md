# 04 — Tanıtım sayfası + bekleme listesi

**Goal:** A one-page site (landing.html in this repo, same static hosting) that converts video viewers to waitlist emails.
**Context:** docs/MARKETING_AND_LAUNCH.md, docs/BRAND_AND_NAMING.md, docs/PRICING.md. No franchise words.

```
Build landing.html (+ css/landing.css) — no framework:
- Hero: autoplaying muted looping demo video (assets/demo.mp4, I will add it) + headline + "Try the free demo" button → index.html.
- 3 use cases (party, stream, class) with short copy; pricing preview (Free/Home/Streamer/Pro, "coming Dec 14").
- Waitlist form: email only + optional "I'm a streamer / event business" checkbox. Use a no-backend provider I choose
  (ask me: Formspree / Buttondown / Google Form). No tracking cookies; privacy note.
- TR + EN (auto by browser language). LCP < 1.5 s on 4G (lazy-load video, no big fonts).
Then add the link to README and PROGRESS (V3 → 🟡/🟠).
```
**Acceptance:** Form submission reaches my inbox/list; Lighthouse performance ≥ 90 on mobile.
