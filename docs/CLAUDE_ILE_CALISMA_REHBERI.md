# Claude ile verimli çalışma rehberi (bu proje için)

## Nerede ne yapılır?
| İş | Nerede | Neden |
|---|---|---|
| Kod yazma, hata düzeltme, test | **Claude Code** (bu klasörde) | Dosyaları görür, testleri çalıştırır, commit atar |
| Plan, karar, pazar araştırması, metin yazma | **Claude sohbeti** (“Drstrangeportal” projesi) | Proje dokümanlarını hatırlar |
| Tekrarlayan kontrol (ör. her ay kamera testi) | Zamanlanmış görev | Unutmazsın |

## Altın kurallar
1. **Bir oturum = bir iş.** “Hem portalı düzelt hem ödeme ekle hem video çek” deme. PROGRESS.md’deki sıradaki TEK işi ver.
2. **Her oturuma aynı cümleyle başla:** `prompts/00_session_start.md` içeriğini yapıştır. Claude PROGRESS.md’yi okur,
   yüzdeyi ve sıradaki işi söyler.
3. **Önce plan, sonra kod.** Büyük işlerde “önce planla, onaylamadan kod yazma” de (Claude Code’da Shift+Tab ile plan modu).
4. **Kanıt iste.** “Çalışıyor” yetmez: “testleri çalıştır ve çıktıyı göster”, “ekran görüntüsü al” de.
5. **Somut hata ver.** “Çalışmıyor” yerine: ne yaptın, ne bekledin, ne oldu, konsoldaki kırmızı yazı (F12 → Console),
   hangi cihaz/tarayıcı. Ekran görüntüsü ekle.
6. **Bağlam şişince temizle.** İş bitince PROGRESS.md güncellensin, sonra `/clear`. Uzun sohbetlerde Claude eski
   detayları karıştırmaya başlar.
7. **Kapsam kayması olursa durdur.** Claude yeni özellik önerirse: “IDEAS_BACKLOG.md’ye yaz, şimdi yapma.”
8. **Yüzdeyi sorgula.** Claude %’yi PROGRESS.md’deki kurala göre hesaplar. Cihazında denemediğin şey %100 olamaz.

## Hazır kalıplar
- Başlangıç: `prompts/00_session_start.md`
- Cihaz testi sonrası: `prompts/01_device_test_fixes.md` + doldurduğun TEST_CHECKLIST
- Kamera listesini yenileme: `prompts/03_curate_sources.md` + sources.html’in JSON çıktısı
- Hata bildirimi:
  ```
  HATA: [ne oldu]
  Beklenen: [ne olmalıydı]
  Adımlar: 1) … 2) … 3) …
  Cihaz/tarayıcı: [ör. Windows laptop Chrome 1xx, TV HDMI; iPhone 13 Safari]
  Konsol: [F12 → Console’daki kırmızı satırlar]
  Önce nedenini bul ve anlat, sonra en küçük düzeltmeyi yap, sonra test et. Sonunda PROGRESS.md’yi ve %’yi güncelle.
  ```

## Yapma
- Aynı anda 3 Claude oturumunda 3 farklı projeye kod yazdırma.
- “Her şeyi yap” deme; Claude her şeyi yarım yapar.
- Claude’un söylediği sayıları (satış, dönüşüm) doğrulanmış veri gibi kullanma — “tahmin” etiketi var mı bak.
