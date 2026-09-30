# PROGRESS — Proje ilerlemesi

> **Bu dosya projenin tek doğruluk kaynağıdır.** Her Claude oturumu bununla başlar ve bununla biter.
> Kural: Claude her cevabında aşağıdaki **toplam yüzdeyi** söyler.

## Toplam: **%23** — Faz 1 (Prototip) %57 · Faz 2 %0 · Faz 3 %0 · Faz 4 %0
_Son güncelleme: 30 Eyl 2026 — v0.1.0 prototip kodu yazıldı ve tarayıcıda test edildi; gerçek cihaz testi bekliyor._

### Puanlama kuralı (dürüst yüzde için)
Her iş kaleminin bir ağırlığı var (toplam 100). Kalemin ne kadarının sayıldığını durum belirler:
| Durum | Sayılan |
|---|---|
| ⬜ Başlanmadı | %0 |
| 🟡 Kod yazıldı (test edilmedi) | %40 |
| 🟠 Otomatik test / tarayıcıda doğrulandı | %70 |
| ✅ Senin cihazında (laptop+TV / telefon) doğrulandı | %100 |

Kodun yazılmış olması bitti demek değil. “Bitti” = senin TV’nde ve telefonunda çalıştı.

## Faz 1 — Prototip (ağırlık 40)
| # | Kalem | Ağırlık | Durum | Puan |
|---|---|---|---|---|
| P1 | Proje iskeleti + tüm dokümanlar + promptlar | 4 | ✅ | 4.0 |
| P2 | Portal efekti (kıvılcım halka, açılış/kapanış/zıplama, 4 tema, sesler) | 8 | 🟠 | 5.6 |
| P3 | Canlı kamera içeriği (YouTube portal içinde, ölü kamerayı atlama, kaynak kontrol sayfası, çevrimdışı yedek) | 6 | 🟡 (yedek 🟠) | 2.4 |
| P4 | Fare / dokunmatik ile daire çizme | 2 | 🟠 | 1.4 |
| P5 | El takibi (laptop kamerası, MediaPipe) | 8 | 🟡 (sahte elle 🟠) | 3.2 |
| P6 | Telefon asa (jiroskop + QR eşleştirme + dokunmatik ped) | 8 | 🟡 (protokol 🟠) | 3.2 |
| P7 | Ek jestler (kaydırma, ✊ kapat, ✌️ rastgele, 👍 ses, 🙌 boyut, 🤟 tema, sallama) | 4 | 🟠 | 2.8 |
| | **Faz 1 toplam** | **40** | | **22.6** |

## Faz 2 — Doğrulama (ağırlık 20)
| # | Kalem | Ağırlık | Durum |
|---|---|---|---|
| V1 | HTTPS’te yayınla (GitHub Pages linki; telefon için şart) | 3 | ⬜ (izin bekliyor) |
| V2 | Gerçek cihaz testi — Teknik Kapı (docs/TEST_CHECKLIST.md) | 5 | ⬜ |
| V3 | Tanıtım sayfası + bekleme listesi | 4 | ⬜ |
| V4 | 10–12 kısa video çek ve paylaş | 6 | ⬜ |
| V5 | Talep Kapısı kararı (23 Kas 2026) | 2 | ⬜ |

## Faz 3 — Satış (ağırlık 25)
| # | Kalem | Ağırlık | Durum |
|---|---|---|---|
| S1 | Ödeme (Merchant of Record) + lisans anahtarı | 8 | ⬜ |
| S2 | Yayıncı / OBS modu | 5 | ⬜ |
| S3 | Kendi videonla portal (Pro) | 4 | ⬜ |
| S4 | Gizlilik, kullanım şartları, marka kontrolü | 3 | ⬜ |
| S5 | Lansman (14 Ara 2026) | 5 | ⬜ |

## Faz 4 — Büyüme (ağırlık 15)
| # | Kalem | Ağırlık | Durum |
|---|---|---|---|
| G1 | Android TV / Fire TV sürümü | 8 | ⬜ |
| G2 | Gelir Kapısı 1 kararı (31 Oca 2027) | 2 | ⬜ |
| G3 | B2B / etkinlik satışları (ilk 3 müşteri) | 5 | ⬜ |

---

## Sıradaki TEK iş
**V1 + V2:** Uygulamayı HTTPS’te yayınla, sonra `docs/TEST_CHECKLIST.md`’yi laptop+TV ve telefonla doldur.
Sonuçları `prompts/01_device_test_fixes.md` ile Claude’a ver.

## Bilinen açıklar / riskler (dürüst liste)
- 🔴 **Kamera ID’leri doğrulanmadı.** Arama sonuçlarından toplandı; bu ortamdan YouTube’a erişilemedi. Uygulama çalışmayanı otomatik atlıyor ama ilk açılışta bazı yerler “kapalı” çıkabilir → `sources.html` ile test et, `prompts/03_curate_sources.md`.
- 🟠 El takibi gerçek kamerayla hiç denenmedi (sadece sahte el senaryosuyla). Işık, mesafe ve hız ayarı gerekebilir.
- 🟠 Telefon eşleştirme ücretsiz PeerJS sunucusuna bağlı; farklı ağlarda (telefon 4.5G, laptop Wi-Fi) bağlanamayabilir. Aynı Wi-Fi önerilir.
- 🟠 YouTube yayınını daire içinde kırpıp üstüne efekt çizmek YouTube API kurallarına aykırı. Prototip/kişisel kullanım için sorun değil ama **mağazaya/satışa çıkmadan önce** “Uyumlu mod” varsayılan olmalı ya da içerik lisanslı olmalı (docs/CAMERA_SOURCES_AND_LICENSING.md).
- 🟡 Marka adı (Farwindow) çalışma adı; tescil kontrolü yapılmadı.

## Karar günlüğü
- 30 Eyl 2026 — Samet: “dediğim gibi olsun” → portal içinde **canlı kamera** (YouTube) prototip modunda. Uyumlu mod ayarlarda duruyor, satıştan önce açılacak.
- 30 Eyl 2026 — Mimari: derleme gerektirmeyen statik web uygulaması (laptop → HDMI → TV/projektör). Telefon = asa (WebRTC). Native TV uygulamaları Gelir Kapısı 1’den sonra.
- 30 Eyl 2026 — Görsel: jenerik kıvılcım halkası; film adı/logo/rün/mandala yok (mağaza ret riski).

## Değişiklik günlüğü
- **v0.1.0 — 30 Eyl 2026:** İlk prototip. Portal efekti, 37 canlı kamera noktası (+alternatif ID’ler), fare/el/telefon girişleri, 8 jest, TR/EN arayüz, ayarlar, kendi yayınını ekleme, kaynak kontrol sayfası, çevrimdışı demo portal. Testler: 20 birim testi + 21 tarayıcı kontrolü geçti.

## Haftalık kontrol (her hafta ilk izin gününde, 15 dk)
```
Hafta: __ | Bu projeye saat: __ / diğer projelere: __
Bu hafta biten kalem(ler): __  → yeni toplam %: __
Metrikler: izlenme __ · e-posta __ · B2B soru __ · satış __ · net $ __
Engel: __
Bir sonraki oturumun TEK işi: __
Sıradaki kapı ve tarihi: __ | eşiğe mesafe: __
Yeni fikir geldiyse → docs/IDEAS_BACKLOG.md, dosyayı kapat.
```
