---
name: firma-okuyucu-ayir
description: Bir B2B firmasinin arama kodunu ortak okuyucudan ayirip kendi dosyasina ve skill'ine tasir. Yeni firma eklenirken veya mevcut bir firma icin arama kodu duzeltilecekken kullan.
---

# Firma okuyucusunu ayirma (uretici betik)

Her firmanin arama kodu `B2B_EKLENTI_TEST/okuyucular/<firma>.js` icindedir ve `.claude/skills/firma-<firma>/SKILL.md` ile belgelenir.
Ortak `okuyucular.js` diger firmalar icin degistirilmez. Tum firmalar uretici betikle uretilir.

## Ne zaman kullanilir
- Yeni bir B2B siteyi eklerken (`siteler.js`'e girdi yazildiktan sonra).
- Bir firmada arama/fiyat/stok sorunu varsa ve duzeltme yalnizca o firmaya yapilacaksa.

## Adimlar
1. `siteler.js`'te firma girdisi olsun (`ad`, `desen`, `okuyucu`, `ayar`). Okuyucu turu ortak bir tur olmali (`eryaz_b2b`, `eryaz_v4`, `genel`, `sadece_b2b` vb.) veya yeni tur icin `okuyucular.js`'te kayit yazilmali.
2. Uretici betigi calistir (repo kokunden):
   `powershell -NoProfile -ExecutionPolicy Bypass -File araclar\okuyucu_uret.ps1`
   Bu, tum firma dosyalarini, `siteler.js` baglantilarini, `arama.html` script etiketlerini ve tum `firma-*` skill'lerini yeniden uretir.
3. Denetle:
   `powershell -NoProfile -ExecutionPolicy Bypass -File araclar\okuyucu_uret.ps1 -Kontrol`
   Hata (eksik veya elle degistirilmis dosya) varsa betigi yeniden calistir; elle yapilan degisiklik uretimde kaybolur, bu yuzden firma kodunu `okuyucular/<firma>.js` icinde degil, betigin kaynak mantiginda degistirme.
4. Firma-ozel bir duzeltme gerekiyorsa `okuyucular/<firma>.js` icinde yapilir ve skill'e not dusulur. Betik yeniden calistirilirsa bu duzeltme silinir; bu yuzden firma-ozel duzeltmeler icin once firma skill'ine yazilir, sonra ilgili dosyaya el ile uygulanir ve `-Kontrol` "elle degistirilmis" diye bildirir (bilerek).
5. Test: eklentiyi `chrome://extensions` sayfasinda yenile, firmada bir parca ara.

## Dikkat
- Fonksiyon adlari `b2b_<firma>_gonder`, `b2b_<firma>_oku` (tek adimlilar `b2b_<firma>_tek`) olur. Ortak fonksiyonlar hic degismez.
- Sayfaya yalnizca fonksiyonun kendi govdesi gider. Kopyalanan fonksiyonlar baska bir fonksiyona veya ust duzey degiskene referans vermemeli; betik bunu `UYARI` olarak raporlar.
- Yeni dosyalar `okuyucular.js`'ten sonra, `arama.js`'ten once yuklenir (`arama.html`).
