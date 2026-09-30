# Pre-mortem — “It’s 30 Apr 2027 and the project failed. Why?”

Ranked by probability. Columns: probability · financial damage · speed of failure · difficulty of early detection ·
difficulty of correction.

| # | Failure | Prob. | $ damage | Speed | Detect early | Correct | Countermeasure | Early signal |
|---|---|---|---|---|---|---|---|---|
| 1 | Licensing makes “live world inside the portal” unsellable | 70% | Low–Med | Fast | Easy | Hard | Compliant mode + Tier A own/NASA/customer footage; B2B sells own-content portals | Store rejection, ToS email, API key revoked |
| 2 | Abandoned for other ventures | 60% | Low cash, high opportunity | Slow | Hard | Medium | WIP limit 2, dated gates, weekly check-in, % in every Claude reply | Two missed check-ins |
| 3 | Feed rot (stream IDs die, cams go offline) | 60% | Low | Slow | Medium | Medium | Auto-skip + 6 h dead cache, monthly sources.html run, channel fallbacks | > 30% dead in sources.html |
| 4 | Views but no sales | 50% | Low | Medium | Easy | Hard | Waitlist gate before building payments; Streamer/Pro tiers; direct B2B outreach | CTR < 0.5% on landing |
| 5 | Gestures unreliable in real rooms | 40% | Low | Fast | Easy | Medium | Tech gate; wand as default; trackpad fallback; tuning prompt | < 85% success in TEST_CHECKLIST |
| 6 | Payment / tax friction from Türkiye | 30% | Low–Med | Slow | Medium | Medium | MoR from day 1; accountant check in November | MoR KYC delays > 2 weeks |
| 7 | A bigger app clones it | 30% | Low | Slow | Easy | Hard | Speed, B2B relationships, own-content packs | Similar app in top charts |
| 8 | IP complaint / store rejection over the film look | 25% | Medium | Fast | Easy | Easy | Banned-word CI, no runes, Aurora default for store | Review rejection citing 5.2 |
| 9 | PeerJS cloud unreliable → phone pairing fails | 20% | Low | Fast | Easy | Easy | Self-hosted PeerServer (small VM) | Pairing success < 90% |
| 10 | YouTube / Windy access revoked | 15% | Medium | Fast | Easy | Medium | Compliant mode; Tier A packs | Player errors spike |
| 11 | Privacy complaint from someone visible on a cam | 5–10% | Medium | Fast | Hard | Easy | Wide shots, no recording, 24 h takedown | Email/DM complaint |
