---
name: yeni-firma-ekle
description: Yeni bir B2B sitesini eklentiye ekler. siteler.js girdisi, manifest host_permissions, okuyucu, firma notu ve KONTROL_TABLOSU satırını birlikte günceller. Kullanıcı "yeni b2b ekle", "yeni firma" dediğinde kullan.
---

# Yeni firma ekleme

## Adımlar
1. Siteyi ve kısayolunu belirle. Kısayol klasörde yoksa eklenti dışı bırakılmaz, `tanimsiz_siteler.md`'ye yazılır.
2. `B2B_EKLENTI/siteler.js`'e girdi ekle: `ad`, `kisayol`, `desen`, `okuyucu`, `acilis`, `ayar`.
3. `B2B_EKLENTI/manifest.json` içindeki `host_permissions` listesine adresi ekle.
4. Okuyucu gerekiyorsa `okuyucular.js`'e ekle. Yoksa okuyucu `hazirlaniyor` olarak kalır ve YOK işaretlenir.
5. `FIRMALAR/firmalar/<firma>.md` oluştur. Şablon: `lepar.md`. Stok ve resim alanları zorunlu, bilinmiyorsa "BELİRLENMEDİ".
6. `FIRMALAR/KONTROL_TABLOSU.md`'ye satır ekle. Yeni firma için durum BEKLİYOR.
7. Açılış yöntemi **sabit yazılmaz**. Makinede `B2B_Acilis_Tespit.ps1` çalıştırılır.
8. Kayıt: yeni test yapılınca `ARAMA_KAYITLARI.md`'ye yazılır. Onaysız "doğru" yazılmaz.

## Kontrol
- `siteler.js`'teki firma sayısı ile `firmalar/*.md` sayısı eşleşmeli.
- Manifest sürümü bu işte değiştirilmez. Sürüm `surum-cikar` ile artırılır.
