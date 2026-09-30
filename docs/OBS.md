# Yayıncı (OBS) modu ve çekim modu

> Durum: **kod yazıldı, otomatik testte doğrulandı** (şeffaf arka plan, başlangıç ekranı yok, sabit telefon kodu).
> **OBS'in içinde hiç denenmedi.** İlk denemede aşağıdaki kontrol listesini doldur.

## 1. OBS'e portal ekleme (5 dakika)
1. OBS → **Kaynaklar** → **+** → **Tarayıcı** (Browser) → isim: `Portal`.
2. **URL:** `https://pabsamuel.github.io/portal/?obs=1&code=SAMET1`
   - `code=` senin sabit telefon kodun (4–8 harf/rakam). Her açılışta aynı kalır, telefonda bir kere yer imi yaparsın.
   - Kod başka biri tarafından kullanılıyorsa (çok düşük ihtimal) başka bir kod seç.
3. **Genişlik 1920, Yükseklik 1080.**
4. ✅ **“Sesi OBS üzerinden kontrol et”** (portaldaki video sesini OBS mikserinde görürsün).
5. ⬜ **“Görünür değilken kaynağı kapat”** işaretini **kaldır** — sıradaki kamera arka planda hazırlanıyor; kaynak kapanırsa her seferinde baştan yükler.
6. Özel CSS alanı: varsayılan kalabilir (zaten şeffaf).
7. `Portal` kaynağını webcam kaynağının **üstüne** sürükle. Portalın dışı şeffaftır; portal senin görüntünün üstünde açılır.

## 2. Telefonu asa yap
Telefonda aç: `https://pabsamuel.github.io/portal/wand.html?c=SAMET1` → **Asayı etkinleştir** → ortadaki daireye basılı tut, telefonla havada daire çiz.
Butonlar: önceki / rastgele / sonraki / tam ekran / kapat, sallama = rastgele yer.
Bu linki telefonda ana ekrana ekle; kod sabit olduğu için bir daha QR okutmana gerek yok.

## 3. Klavye (isteğe bağlı)
OBS'te `Portal` kaynağına sağ tık → **Etkileşim** (Interact). Açılan pencerede kısayollar çalışır:
Boşluk rastgele · ← → önceki/sonraki · Enter tam ekran · Esc kapat · **1–9** belirli yer · O ayarlar · T tema · D teknik bilgi.

## 4. Neler çalışmaz (dürüst liste)
- **El kamerası OBS'te çalışmaz:** webcam'i OBS kullanıyor ve tarayıcı kaynağı kamera izni vermez. OBS'te kumanda = telefon.
- **Kendi video dosyanı eklemek:** OBS'in tarayıcı kaynağının kendi hafızası var. En garantisi: Etkileşim penceresinde **O → “Doğrudan video linki”** ile bir `.mp4` linki eklemek. Dosya seçici OBS sürümüne göre açılmayabilir (denenmedi).
- **PeerJS ücretsiz sunucusu** yavaşlarsa telefon geç bağlanır; aynı Wi-Fi önerilir.

## 5. ⚠️ Yayında YouTube kamerası göstermek
Başkasının canlı yayınını kendi Twitch/YouTube yayınında göstermek **telif bildirimi / yayın uyarısı** riski taşır
(kanal sahibinin içeriği, üstüne efekt bindiriyorsun). Kişisel deneme için sorun çıkmayabilir ama **düzenli yayın için**:
- **Kendi çektiğin videoları** kullan (Ayarlar → Kendi videoların → “Sadece benim videolarım”), ya da
- izni/lisansı olan içerik kullan (bkz. `docs/CAMERA_SOURCES_AND_LICENSING.md`).
Bu bir hukuki görüş değildir.

## 6. Çekim modu (tanıtım videoları için, OBS olmadan)
- Uygulamayı normal aç, **R**'ye bas (ya da adrese `?rec=1` ekle): menüler, ipuçları, bildirimler gizlenir; yer adı büyür.
- **1–9:** tam olarak hangi yerin açılacağını seç (önce kendi videoların, sonra öne çıkan 12 yer: Shibuya, Times Square, Kīlauea, ISS, Namib, Venedik…).
- Kaydı Windows'ta **Win + Alt + R** (Xbox Game Bar) veya OBS **Ekran yakalama** ile al. Tekrar **R** = arayüz geri gelir.
- **D:** fps, parçacık sayısı, hazırlanan sıradaki kamera, telefon durumu. Cihaz testinde sorun olursa bunun ekran görüntüsünü Claude'a ver.

## İlk OBS denemesi kontrol listesi
| Kontrol | Sonuç |
|---|---|
| Portalın dışı şeffaf mı (webcam görünüyor mu)? | |
| Telefon `wand.html?c=KOD` ile bağlandı mı? | |
| Telefonla daire → portal açıldı mı? | |
| Portal içinde canlı kamera / kendi videon oynadı mı? | |
| Video sesi OBS mikserinde görünüyor mu? | |
| Yayın 30 dk boyunca akıcı mı (OBS istatistik: işlenmemiş kare < %1)? | |
