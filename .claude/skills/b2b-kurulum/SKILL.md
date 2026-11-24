---
name: b2b-kurulum
description: Yeni bir bilgisayarda B2B eklentisini, kısayol açılışlarını ve bilgisayara özel ayarları kurar. Kullanıcı "yeni bilgisayara kur", "kurulum", "b2b açılmıyor", "protokol çalışmıyor" dediğinde kullan.
---

# B2B kurulumu (bilgisayara özel)

Her bilgisayar kendi kısayollarına ve Chrome profiline göre ayarlanır. Firma tipinden açılış yöntemi tahmin edilmez, tespit edilir.

## Adımlar
1. **Eklenti:** Chrome Web Mağazası'ndaki liste dışı bağlantıdan kur (bağlantı: KURULUM.md'de, henüz eklenmedi). Geliştirici modunda klasörden yükleme yalnızca geliştirme içindir.
2. **Kısayol klasörü:** Kullanıcının B2B kısayollarının bulunduğu klasörü seçtir. `kisayol_ayar.json` içine `klasor` olarak yazılır (`esle` adımı yapar).
3. **Protokol kaydı:** `KURULUM.bat` ile `b2bac:` HKCU kaydı yapılır. Yönetici izni gerekmez.
4. **Açılış tespiti:** `powershell -NoProfile -ExecutionPolicy Bypass -File B2B_Acilis_Tespit.ps1` çalıştırılır. Çıktı `acilis_ayar.json`'dur.
5. **Elle düzeltme:** Tespit yanlış çıkan firmalar için `acilis_ayar.json` içindeki `elle` alanına `pencere` veya `chrome` yazılır. Tespit bu alanı ezmez.
6. **Şifre (isteğe bağlı):** Kullanıcı isterse `B2B_Sifre_Kaydet.ps1` ile DPAPI kaydı yapılır. İstemezse Chrome'daki kayıtlı şifre kullanılır. Şifre içeriği hiçbir zaman raporlanmaz.
7. **Doğrulama:** `kurulum-denetci` ajanı çalıştırılır.

## Sorun giderme
- Açılmayan kısayol: `acilis_ayar.json` içinde yöntemi kontrol et, `elle` ile düzelt.
- Protokol çalışmıyor: HKCU'daki `b2bac` kaydını kontrol et, `KURULUM.bat`'ı yeniden çalıştır.
- Site "izin yok": Chrome'da siteye tıklayıp izin ver.

## Dikkat
- Makineye özel dosyalar (`kisayol_ayar.json`, `kisayol_eslesme.json`, `acilis_ayar.json`, `ayarlar.csv`, `sifreler/`) git'e girmez. Başka bilgisayara kopyalanmaz.
- Eski Python B2B_ARAMA programı eklentiyle aynı anda açılmaz.
