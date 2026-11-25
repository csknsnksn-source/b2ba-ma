# Karpart

**Ayar:** `klikPopup: true` (fiyat ayrıntı penceresi tıklamayla açılır, alım geçmişi tıklamayla)
**Genel durum:** Fiyat ONAYLANDI · Alım geçmişi ONAYLANDI

## Aramalar

### 791201J500 (alım geçmişi)
- Eklenti: 2 alım satırı (19.10.2026, belge 000025443, 390,07 KDV hariç, 2 adet)
- **Onay:** Kullanıcı onayladı

### 2091042 / 2461022600
- Site arama tablosu: Size Özel Fiyat = KDV hariç liste; İsk. %35 (ayrıntıda)
- Ayrıntı penceresi: Fiyat 1.553,91 · İnd 1 %35 · KDV'li Maliyet 1.212,05 (KDV hariç ~1.010,04)
- Eklenti önce: liste fiyatı gösterdi ✘
- Düzeltme: fiyat hücresine tıklayıp ayrıntıdan `MaliyetFiyatiKDVli` okuma
- Eklenti sonra: doğru ✔
- **Onay:** Kullanıcı onayladı ("EVET GELDİ")

### 2461022600 (FYC)
- Karpart ürün kodu: HYN000-80103 ve HN000-8505 (791201J500 için)
- **Onay:** Kullanıcı onayladı

## Bilinen sorunlar (25.11)
- Tablo iki istekle doluyor (arama + tablo verisi). Eski okuma tablo dolmadan bitip "yok (1.5 sn)" veriyordu. Cozum: `okuyucular/karpart.js` (OZEL), tablo hazir olana kadar bekler.
- Fiyat: tablo Liste/KDV'li; klikPopup tiklayinca maliyet okunur (onceden onayli).
