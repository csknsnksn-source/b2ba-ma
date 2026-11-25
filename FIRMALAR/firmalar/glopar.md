# GloPar

**Ayar:** okuyucu `glopar`, adres `b2b.glopar.com.tr` (siteler.js, kdv 20)
**Genel durum:** Fiyat DÜZELTİLDİ (test sürümünde, kullanıcı doğruladı) · Alım geçmişi BEKLİYOR
**Açılış:** makineye göre tespit edilir (`B2B_Acilis_Tespit.ps1`). Firma notuna sabit yöntem yazılmaz.

## Stok ve resim
- Stok nerede: BELİRLENMEDİ (ilk aramada incelenecek)
- Resim adresi: BELİRLENMEDİ

## Notlar
- Tabloda fiyat DOLAR cinsindedir (`$7,84`). Eklenti bunu TL olarak okumuyor, sayfanın üstündeki kurla (USD) TL'ye çevirir (`dovizKur: true`, `B2B_EKLENTI_TEST`).
- Doğru TL değerleri satırın üzerine gelince açılan pencerededir (ör. Net ₺396,93, KDV dahil ₺476,31). Popup'a bağımlı değil.

## Aramalar

### sp1074 (GloPar, 25.11)
- Site (fare üstü pencere): Liste $7,84 · Fiyat ₺396,93 · Net ₺396,93 · Net Fiyat Kdv Dahil ₺476,31
- Eklenti öncesi: "yok" (popup bağımlılığı nedeniyle satır düşüyordu)
- Eklenti sonra (test sürümü, dovizKur): kullanıcı doğruladı ("evet oldu")
- **Onay:** Kullanıcı onayladı (25.11)
