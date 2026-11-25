# B2B Ortak Arama – proje rehberi

Bu depo, Chrome eklentisi "B2B Ortak Arama"nın (Chrome Web Mağazası, liste dışı yayın) kaynağı ile yardımcı PowerShell betiklerini ve firma notlarını içerir.

## Klasör haritası
- `B2B_EKLENTI/` – eklenti kaynağı (MV3). `manifest.json` sürümün tek kaynağıdır (şu an 1.7.0).
  - `siteler.js`: site tanımları (ad, kısayol, desen, okuyucu, açılış adresi, ayar).
  - `okuyucular.js`: site türüne göre okuyucu fonksiyonları (`eryaz_b2b`, `eryaz_v4`, `a_grup`, `sadece_b2b`, `megatek`, `desiss`, ...).
  - `arama.js`, `arka.js`, `v4_kanca.js`: arayüz, arka plan ve yakalama.
  - `KURULUM.md`: kullanıcıya yönelik kurulum ve kullanım.
- `B2B_Ac.ps1` – kısayolları açar ve otomatik giriş yapar.
- `B2B_Protokol.ps1` – `b2bac:` adres işleyicisi (`tara`, `esle`, açma).
- `B2B_Acilis_Tespit.ps1` – her bilgisayarda kısayollardan açılış yöntemini tespit eder (yalnızca okur, `acilis_ayar.json` yazar).
- `B2B_Sifre_Kaydet.ps1` – şifreleri Windows DPAPI ile kaydeder (isteğe bağlı).
- `B2B_PANEL/` – Google Apps Script yönetici paneli (`Code.gs`), kalp atışı.
- `FIRMALAR/` – firma notları (`firmalar/*.md`), `KONTROL_TABLOSU.md` (durum), `ARAMA_KAYITLARI.md` (test kayıtları).
- `ESKI_SURUMLER/` – eski zip'ler ve betikler. Silinmez, referans olarak kalır.
- `.claude/` – skill'ler (`skills/`) ve ajanlar (`agents/`).

## Arama kodu yapısı (firma basina ayri)
- Her firmanin arama kodu `B2B_EKLENTI_TEST/okuyucular/<firma>.js` icindedir, `.claude/skills/firma-<firma>/SKILL.md` ile belgelenir.
- Bu dosyalar `araclar/okuyucu_uret.ps1` ile uretilir. Firma-ozel duzeltme yapilacaksa dosyanin ilk satiri `// OZEL` yapilir; betik bu dosyayi ezmez.
- Ortak `okuyucular.js` ve `arama.js` diger firmalar icin aynen kalir; bir firmanin sorununu ortak okuyucuya bayrak ekleyerek cozme.
- Okuyucu fonksiyonu sayfaya (`executeScript`) yalnizca kendi govdesiyle gider. Baska fonksiyona veya ust duzey degiskene referans verme; ayar gerekiyorsa kayittaki `cfg` ile ver.

## Değişmeyen düzen
- Eklenti Chrome Web Mağazası'nda **liste dışı** yayınlanıyor. Güncellemeler orada tutuluyor.
- Python'a geçilmiyor. Kurulum ve yardımcılar PowerShell ile kalıyor.
- Eklenti kodu (`B2B_EKLENTI/*.js`, `manifest.json`) yalnızca açık istekle değiştirilir. Sürüm numarası yalnızca mağaza sürümü çıkarılırken artırılır.

## Açılış yöntemi (bilgisayara göre)
Her B2B iki şekilde açılabilir. Hangisinin kullanılacağı firma tipinden değil, **o bilgisayardaki kısayoldan** belirlenir:
- `pencere`: kısayol masaüstü programını (`.exe`) açar. Program kendi penceresinde açılabilir, bazı programlar kendi içinde Chrome'u kullanabilir.
- `chrome`: kısayol doğrudan Chrome'u bir adresle açar, ya da kısayol yoksa `siteler.js`'teki adres yeni sekmede açılır.
- Tespit: `.lnk` hedefi `chrome.exe` ise `chrome`, başka `.exe` ise `pencere`, kısayol yoksa adres varsa `chrome`.
- Tespit yanlışsa kurulumda firma firma elle değiştirilir. Seçim `acilis_ayar.json` dosyasında tutulur, git'e girmez, sonraki tespit bu kaydı ezmez.
- Firma notlarına sabit açılış yöntemi yazılmaz, yalnızca "makineye göre tespit edilir" notu düşülür.
- Arama her iki yöntemde de `siteler.js`'teki `desen` ile sekme bulur, bu yüzden yöntem değişse de arama aynı kalır.

## Makineye özel dosyalar (git'e girmez, kopyalanmaz)
- `ayarlar.csv` (kullanıcı ve şifre sütunları), `sifreler/`, `log/`, `B2B_ARAMA/profil*`, `.pem`, `.crx`.
- `kisayol_ayar.json` (kısayol klasörü), `kisayol_eslesme.json` (site ↔ kısayol eşleşmesi), `acilis_ayar.json` (açılış yöntemi) bu bilgisayara özeldir. Her kurulumda yeniden üretilir.

## Kurallar
1. Makineye özel yol (`C:\Users\...`) koda veya belgeye sabit yazılmaz. Yollar betiğin konumundan ya da `kisayol_ayar.json`'dan okunur.
2. Şifre ve profil dosyalarına dokunulmaz, içerikleri raporlanmaz, konsola basılmaz.
3. Yeni firma eklenirken `siteler.js`, `manifest.json` (`host_permissions`), `okuyucular.js`, firma notu ve `KONTROL_TABLOSU.md` birlikte güncellenir.
4. Fiyat "doğru" sayılmadan önce kullanıcı onayı ve `ARAMA_KAYITLARI.md` kaydı gerekir.
5. Arama sonucu her zaman **stoklu** en düşük fiyat olarak değerlendirilir. Stok okunamazsa "stok bilinmiyor" işaretlenir.
6. Git: her değişiklik worktree'de ayrı dalda commit edilir. `main`'e doğrudan itilmez.

## Skill ve ajan listesi
Skill'ler: `b2b-kurulum`, `yeni-firma-ekle`, `firma-arama-test`, `kisayol-esle`, `surum-cikar`. Taslaklar: `toplu-arama-excel`, `toplu-b2b-ac`, `yeni-b2b-bildirim-akisi`, `en-ucuz-stoklu-secim`, `firma-resim-alma`, `musteri-geri-bildirim`.
Ajanlar: `firma-okuyucu`, `firma-md-yazar`, `kurulum-denetci`, `fiyat-stok-denetci`, `resim-denetci`, `geri-bildirim-denetci`, `eksik-md-denetci`.
