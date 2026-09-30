# Farwindow Portal (çalışma adı) — Atesen Software

Havada elinle ya da telefonunla **bir daire çiz**. TV’de veya projektörde kıvılcımlardan bir portal açılır
ve içinden dünyanın bir yerindeki **canlı kamera** görünür: Tokyo’da Shibuya, İstanbul’da Haliç,
Uzay İstasyonu, Namib Çölü’nde bir su kaynağı, Laponya’da kuzey ışıkları…

**Durum:** v0.3.0 prototip · canlı: https://pabsamuel.github.io/portal/ · **Proje ilerlemesi: %27** → ayrıntı [PROGRESS.md](PROGRESS.md)

---

## Hızlı başlangıç

### A) Yayınlanmış link: https://pabsamuel.github.io/portal/ (önerilen; telefon asası için şart)
1. Laptopta Chrome ile uygulamanın https:// linkini aç, laptopu HDMI ile TV’ye / projektöre bağla, **F** ile tam ekran yap.
2. **✋ Elimle aç** → kamera izni ver → işaret parmağınla havada daire çiz.
3. **📱 Telefonum asa olsun** → QR’ı telefonla okut → “Asayı etkinleştir” → ortadaki daireye basılı tut, telefonla havada daire çiz.

### B) Kendi bilgisayarında (internet yine gerekir: YouTube + el modeli)
- Windows: klasördeki **`BASLAT.bat`**’a çift tıkla → tarayıcıda `http://localhost:8080` açılır.
  (Node.js varsa onu kullanır, yoksa Windows’un kendi PowerShell’iyle çalışır; kurulum gerekmez.)
- Mac/Linux: `node tools/serve.mjs` → `http://localhost:8080`
- Not: Bu modda **telefon jiroskopu çalışmaz** (telefonun HTTPS istemesi yüzünden). Telefonu kullanmak için yayınlanmış linki kullan
  ya da `js/config.js` içindeki `PUBLIC_BASE`’e yayınlanmış adresi yaz.

### Test modları (URL’nin sonuna ekle)
| Ek | Ne yapar |
|---|---|
| `?offline=1` | İnternet olmadan çevrimdışı “Kozmik Boşluk” portalı |
| `?fakehand=1&auto=hand` | Sahte el senaryosu oynar (daire → kaydırma → ✌️ → ✊) — kamera olmadan demo |
| `?auto=mouse` / `?auto=hand` | Başlangıç ekranını atlar |
| `?rec=1` | Çekim modu: arayüz gizli, yer adı büyük (tanıtım videosu çekmek için; **R** tuşuyla da açılır/kapanır) |
| `?obs=1&code=KOD` | OBS / yayıncı modu: şeffaf arka plan, telefon kodu sabit → [docs/OBS.md](docs/OBS.md) |
| `sources.html` | Bütün canlı kameraları test eder, çalışanları listeler |

## Kontroller
| Jest / Tuş | Sonuç |
|---|---|
| ◯ Havada daire çiz (el, telefon ya da fare) | Portal açılır · açıkken yeni yere zıplar |
| ⇆ Hızlıca sağa/sola savur | Sonraki / önceki kamera |
| ⇅ Hızlıca yukarı savur · Enter · çift tık · iki eli iyice aç · telefonda ⛶ | Portal tüm ekranı kaplar; aşağı savur / Esc ile geri |
| ✊ Yumruk (yarım saniye) | Portal kapanır |
| ✌️ Zafer işareti · 📱 sallamak · Boşluk tuşu | Rastgele yer |
| 👍 Başparmak · **M** | Video sesi aç/kapat |
| 🙌 İki açık eli aç/kapat · fare tekerleği · +/- | Portalı büyüt/küçült |
| 🤟 · **T** | Tema: Kıvılcım / Aurora / Plazma / Buz |
| **Esc** · sağ tık | Kapat |
| **1–9** | Belirli bir yere git (önce kendi videoların, sonra öne çıkan yerler) |
| **R** çekim modu · **D** teknik bilgi | Arayüzü gizle / fps, sıradaki kamera, telefon durumu |
| 🎬 Video dosyasını ekrana sürükle-bırak · Ayarlar → Kendi videoların | Kendi videon portalda oynar (bu tarayıcıda saklanır, hiçbir yere yüklenmez) |
| **F** tam ekran · **H** yardım · **O** ayarlar · **P** telefon · **C** kamera · **S** efekt sesi | |

## Klasör yapısı
```
portal/
├── index.html            büyük ekran uygulaması
├── wand.html             telefon (asa) sayfası
├── sources.html          canlı kamera kontrol sayfası
├── css/                  stiller
├── js/
│   ├── main.js           akış: girişler → jestler → portal
│   ├── gesture-core.js   saf jest algoritmaları (daire, kaydırma, tutma, sallama, air-mouse, filtre)
│   ├── portal-fx.js      kıvılcım portal efektleri (Canvas 2D)
│   ├── portal-view.js    dairesel video penceresi + çevrimdışı sahne
│   ├── youtube.js        canlı yayın oynatıcı (IFrame API)
│   ├── deck.js           iki oynatıcı: görünen + arka planda hazırlanan sıradaki
│   ├── video-player.js   kendi videoların (dosya / .mp4 linki)
│   ├── media-store.js    kendi video dosyaların (IndexedDB, cihazda kalır)
│   ├── hand-input.js     el takibi (MediaPipe, tarayıcıda)
│   ├── wand-link.js      telefon eşleştirme (PeerJS/WebRTC) — ekran tarafı
│   ├── wand.js           telefon tarafı (jiroskop → imleç)
│   ├── cams.js           canlı kamera listesi  ← en sık güncellenecek dosya
│   ├── ui.js, i18n.js, settings.js, audio.js, config.js
├── vendor/               peerjs, qrcode (yerel kopya)
├── tests/                birim testleri + tarayıcı duman testi
├── tools/                yerel sunucular (Node / PowerShell)
├── docs/                 bütün planlama dokümanları (aşağıda)
├── prompts/              sıradaki işler için hazır Claude Code promptları
├── CLAUDE.md             Claude Code’un bu projedeki kuralları
├── PROGRESS.md           ilerleme % + sıradaki iş + karar günlüğü
└── BASLAT.bat            Windows’ta çift tıkla çalıştır
```

## Dokümanlar
| Dosya | İçerik |
|---|---|
| [docs/00_DECISION_BRIEF.md](docs/00_DECISION_BRIEF.md) | **Önce bunu oku.** Karar, eşikler, tarihler |
| [docs/PRD.md](docs/PRD.md) | Ürün gereksinimleri, kapsam, kapsam dışı |
| [docs/GESTURES.md](docs/GESTURES.md) | Jest seti ve algoritma parametreleri |
| [docs/TECH_ARCHITECTURE.md](docs/TECH_ARCHITECTURE.md) | Mimari, veri akışı, port sırası |
| [docs/CAMERA_SOURCES_AND_LICENSING.md](docs/CAMERA_SOURCES_AND_LICENSING.md) | Kaynaklar, lisans kuralları, yasaklar |
| [docs/LEGAL_PRIVACY_IP.md](docs/LEGAL_PRIVACY_IP.md) | Marka/telif, KVKK/GDPR, Türkiye vergi notları |
| [docs/BRAND_AND_NAMING.md](docs/BRAND_AND_NAMING.md) | İsim adayları, görsel kimlik |
| [docs/PRICING.md](docs/PRICING.md) | Fiyatlandırma |
| [docs/FINANCIAL_MODEL.md](docs/FINANCIAL_MODEL.md) | TRY/USD senaryolar, kur duyarlılığı |
| [docs/MARKETING_AND_LAUNCH.md](docs/MARKETING_AND_LAUNCH.md) | Kısa video planı, lansman |
| [docs/ROADMAP_AND_MILESTONES.md](docs/ROADMAP_AND_MILESTONES.md) | 3 izin gününe göre takvim |
| [docs/PROJECT_MANAGEMENT_SYSTEM.md](docs/PROJECT_MANAGEMENT_SYSTEM.md) | Yarım bırakmamak için sistem |
| [docs/CLAUDE_ILE_CALISMA_REHBERI.md](docs/CLAUDE_ILE_CALISMA_REHBERI.md) | Claude’u verimli kullanma rehberi |
| [docs/TEST_CHECKLIST.md](docs/TEST_CHECKLIST.md) | Gerçek cihaz test formu (Teknik Kapı) |
| [docs/PREMORTEM.md](docs/PREMORTEM.md) | Başarısızlık senaryoları (sıralı) |
| [docs/IDEAS_BACKLOG.md](docs/IDEAS_BACKLOG.md) | Fikir deposu (kapsam değil!) |

## Testler
```
npm test                 # 20 jest algoritması testi (Node 18+)
npm i -D playwright && npm run test:smoke   # tarayıcıda uçtan uca 21 kontrol + ekran görüntüleri
npm run check            # sözdizimi + yasaklı kelime kontrolü
```

## Gizlilik
El takibi tamamen tarayıcıda çalışır; kamera görüntüsü hiçbir sunucuya gitmez. Telefon ile ekran arasında sadece
hareket verisi (birkaç sayı) gider. Canlı görüntüler YouTube’daki herkese açık canlı yayın kameralarından gelir.

## Yasal not
Bağımsız bir projedir; herhangi bir film/çizgi roman markasıyla ilişkisi yoktur. Canlı yayınlar sahiplerine aittir.
