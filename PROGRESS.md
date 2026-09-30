# PROGRESS — Proje ilerlemesi

> **Bu dosya projenin tek doğruluk kaynağıdır.** Her Claude oturumu bununla başlar ve bununla biter.
> Kural: Claude her cevabında aşağıdaki **toplam yüzdeyi** söyler.

## Toplam: **%27** — Faz 1 (Prototip) %61 · Faz 2 %15 · Faz 3 %0 · Faz 4 %0
_Son güncelleme: 30 Eyl 2026 — v0.2.0 yayında: https://pabsamuel.github.io/portal/ (Samet'in Chrome'unda canlı yayın portalda oynadı)._

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
| P2 | Portal efekti (ateşleme → hızlanma → yırtılma açılışı, girdap, tam ekran, ortam ışığı, 4 tema, sesler) | 8 | 🟠 (yeni sürüm cihazda onay bekliyor) | 5.6 |
| P3 | Canlı kamera içeriği (158 yer / 229 yayın, arka planda hazırlanan kesintisiz geçiş, ölü yayını görünmeden atlama) | 6 | 🟠 (Samet'in Chrome'unda oynadı; yeni deste sistemi onay bekliyor) | 4.2 |
| P4 | Fare / dokunmatik ile daire çizme | 2 | 🟠 (zaman damgası hatası düzeltildi, onay bekliyor) | 1.4 |
| P5 | El takibi (laptop kamerası, MediaPipe) | 8 | 🟡 (sahte elle 🟠) | 3.2 |
| P6 | Telefon asa (jiroskop + QR eşleştirme + dokunmatik ped) | 8 | 🟡 (protokol 🟠) | 3.2 |
| P7 | Ek jestler (sağ/sol kaydırma, yukarı/aşağı = tam ekran, ✊ kapat, ✌️ rastgele, 👍 ses, 🙌 boyut/tam ekran, 🤟 tema, sallama) | 4 | 🟠 | 2.8 |
| | **Faz 1 toplam** | **40** | | **24.4** |

## Faz 2 — Doğrulama (ağırlık 20)
| # | Kalem | Ağırlık | Durum |
|---|---|---|---|
| V1 | HTTPS’te yayınla (GitHub Pages linki; telefon için şart) | 3 | ✅ https://pabsamuel.github.io/portal/ |
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
**V2:** `docs/TEST_CHECKLIST.md`’yi laptop+TV ve telefonla doldur (özellikle el kamerası ve telefon asası hiç denenmedi).
Sonuçları `prompts/01_device_test_fixes.md` ile Claude’a ver.

## Bilinen açıklar / riskler (dürüst liste)
- 🟠 **Kamera listesi zamanla çürür.** 229 yayının çoğu 30 Eyl’de “şu an canlı” aramasından alındı; kanallar yayın ID’sini değiştirdikçe ölür. Kullanıcı görmez (deste sistemi atlar) ama liste küçülür → ayda bir `sources.html` + `prompts/03_curate_sources.md`.
- 🟠 **Türkiye kategorisi zayıf (4 yer, doğrulanmamış).** Türk şehir kameraları YouTube’da neredeyse yok (İBB kendi sitesinde yayınlıyor). Çözüm: izinli kaynak bulmak ya da kendi çekimin (Tier A).
- 🟡 Deste sistemi iki oynatıcı kullanır: portal açıkken ~2 yayın kadar bant genişliği.
- 🟠 El takibi gerçek kamerayla hiç denenmedi (sadece sahte el senaryosuyla). Işık, mesafe ve hız ayarı gerekebilir.
- 🟠 Telefon eşleştirme ücretsiz PeerJS sunucusuna bağlı; farklı ağlarda (telefon 4.5G, laptop Wi-Fi) bağlanamayabilir. Aynı Wi-Fi önerilir.
- 🟠 YouTube yayınını daire içinde kırpıp üstüne efekt çizmek YouTube API kurallarına aykırı. Prototip/kişisel kullanım için sorun değil ama **mağazaya/satışa çıkmadan önce** “Uyumlu mod” varsayılan olmalı ya da içerik lisanslı olmalı (docs/CAMERA_SOURCES_AND_LICENSING.md).
- 🟡 Marka adı (Farwindow) çalışma adı; tescil kontrolü yapılmadı.

## Karar günlüğü
- 30 Eyl 2026 — Samet: “dediğim gibi olsun” → portal içinde **canlı kamera** (YouTube) prototip modunda. Uyumlu mod ayarlarda duruyor, satıştan önce açılacak.
- 30 Eyl 2026 — Mimari: derleme gerektirmeyen statik web uygulaması (laptop → HDMI → TV/projektör). Telefon = asa (WebRTC). Native TV uygulamaları Gelir Kapısı 1’den sonra.
- 30 Eyl 2026 — Görsel: jenerik kıvılcım halkası; film adı/logo/rün/mandala yok (mağaza ret riski).

## Değişiklik günlüğü
- **v0.2.0 — 30 Eyl 2026:** Samet'in canlı test geri bildirimleriyle: sinematik açılış (çizilen yerde ateşleme → hızlanma → ışıkla yırtılma), tam ekran portal (yukarı savur / Enter / çift tık / iki el / ⛶), ortam ışığı (portal çevresi bulanık canlı görüntü), iki oynatıcılı kesintisiz geçiş (ölü/kayıt yayınlar görünmeden elenir, uyarı mesajı yok), 158 yer / 229 yayın, fare çiziminde zaman damgası hatası düzeltildi, iz ilerleme parlaması, dikey kaydırma. GitHub Pages’te yayında.
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
