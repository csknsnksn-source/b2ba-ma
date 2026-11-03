# Arkaş

**Ayar:** `mydparGecmis: true` (alım geçmişi okuyucusu), `kdvliAlan: true` (fiyat)
**Genel durum:** Fiyat ONAYLANDI · Alım geçmişi DÜZELTİLDİ (onay bekliyor)

## Aramalar

### 209104ae (M-20910-4AE00 ve 20910-4AE00)
- Site: "Net Fiyat KDV'li" sütunu KDV dahil: 3.443,81 ve 8.698,88 · liste 4.415,14 / 11.152,41 · İnd 1 %35
- Eklenti önce: liste fiyatı net gibi gösterildi, KDV dahil değer doğru ✘
- Düzeltme: `kdvliAlan` (net = KDV dahil / 1,20)
- Beklenen: net 2.869,84 / KDV 3.443,81 · net 7.248,73 / KDV 8.698,88
- **Onay:** Kullanıcı onayladı ("doğru kaydet")

### 791201J500 / 2510003010
- Eklenti fiyat: doğru ✔ (kullanıcı "DOĞRU")
- Site alım geçmişi: 2510003010 için 2 satır (1.120,01 ve 2.855,40)

### 2461022600 (alım geçmişi)
- Eklenti önce: tablo bir önceki parçanın kayıtlarını her satıra yazıyordu ✘
- Düzeltme: tablo içeriği aynı kalıyorsa o satıra alım yazılmıyor
- **Onay:** Kullanıcı "TAMAMDIR ŞİMDİ" dedi, kontrol edilecek
