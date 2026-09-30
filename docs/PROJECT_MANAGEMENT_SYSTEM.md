# Proje Yönetim Sistemi — “Başla, bitir, bırak”

Senin dediğin sorun: çok şeye başlıyorsun, bitiremiyorsun. Bu sistem bunu **kurallarla** çözer, motivasyonla değil.

## 1) Portföy panosu (haftada bir güncelle)
| Sütun | Limit | Anlamı |
|---|---|---|
| AKTİF | **en fazla 2** | Bu hafta izin günlerinde çalışılan projeler |
| BAKIM | en fazla 3 | Haftada toplam ≤ 2 saat: sadece bozulanı düzelt, müşteriye cevap ver |
| PARK | sınırsız | Durdurulmuş; tarihli bir “tekrar bakma” notu var |
| ARŞİV | sınırsız | Bitti ya da öldü; 5 satırlık ders notu yazıldı |
| FİKİRLER | sınırsız | Dokunulmaz. Sadece listeye yazılır |

**Kural:** AKTİF’e bir şey girecekse, AKTİF’ten bir şey çıkmak zorunda. Bu portal projesi AKTİF olacaksa
son 90 günde en az kazandıran projeyi 8 haftalığına BAKIM’a al.

## 2) Her projenin 4 zorunlu satırı (yoksa proje değil, fikirdir)
1. Tek cümlelik hedef — *“23 Kasım’a kadar 300 kişilik bekleme listesi.”*
2. Tek metrik — *bekleme listesi e-postası.*
3. Sıradaki kapı + tarih — *Talep Kapısı, 23 Kas 2026.*
4. Öldürme kuralı — *<30k izlenme ve <50 e-posta → park.*

## 3) Haftalık kontrol (her hafta ilk izin gününde 15 dk, PROGRESS.md’nin altına)
Hafta · saat (bu proje/diğerleri) · biten kalem · yeni % · metrikler · engel · **sonraki oturumun TEK işi** · kapıya mesafe.
Yeni fikir geldiyse IDEAS_BACKLOG.md’ye yaz ve dosyayı kapat. O hafta ona dokunma.

## 4) “Bitti” tanımı
Kabul kriterleri geçti · testler yeşil · yayında · **senin TV’nde ve telefonunda denendi** · PROGRESS.md güncellendi ·
commit atıldı. “Benim laptopta çalışıyor” = bitmedi (%70 sayılır).

## 5) Öldürme kuralları
- Üst üste 2 kilometre taşı tarihi kaçtı → sonrakinin kapsamını yarıya indir ya da park et.
- Kapıda eşik altı → aynı gün park + 5 satır ders notu. Duygusal pazarlık yok.
- Her kapı için sadece **bir** 2 haftalık uzatma hakkı.
- Yeni fikirler sadece ayın 1’inde AKTİF’e girebilir ve bir AKTİF projeyi çıkararak girer.

## 6) Claude oturum ritüeli (her seferinde aynı)
1. Claude Code’u proje klasöründe aç → `prompts/00_session_start.md`’yi yapıştır.
2. Claude PROGRESS.md’yi okur, sıradaki işi ve %’yi söyler, plan yapar → sen onaylarsın.
3. Uygular → test eder → sen cihazda denersin.
4. PROGRESS.md güncellenir, commit → `/clear`. Bitmediyse PROGRESS.md’ye “buradan devam” yaz.

## 7) Enerji gerçeği
Çalışma günlerinde (4 × 12 saat) proje yok. İzin günlerinin 1’i dinlenme. Plan bunu varsayar; aksini varsayan plan
başarısız olmaya mahkûm.
