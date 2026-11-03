# Sayılı

**Ayar:** `popupSayili: true` (fiyat pencereden "Hemen Öde (Havale)", kampanya "Kampanya Fiyatı" KDV dahil)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Kampanya ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### h100 yed / CWRVR-10080 (DEPO SU YEDEK I30 07- DIZEL / CEED 7-, VOYER)
- Site tablo: Liste 616,02 TL, sayfada Gelenler filtresi
- Site pencere (fiyatın üstünde):
  - Hemen Öde (Havale): KDV dahil 367,58 (ana fiyat)
  - Hemen Öde (Tek Çekim): 389,20 (kaydedilmedi)
  - Ay Sonu Fiyatı (Havale): 389,20 (kaydedilmedi)
  - Ay Sonu Fiyatı (Tek Çekim): 410,83 (kaydedilmedi)
  - Fiyatı: 480,50 KDV dahil (kaydedilmedi)
  - Kampanya Fiyatı: KDV dahil 432,45 (kampanya olarak kaydedildi)
- Eklenti önce: aramada sonuç geldi ama satır listelenmedi ("Yok" kutusuna düştü). Sebep: eski sonuç filtresi, sonra kaldırıldı ✘
- Düzeltme: eski sonuç filtresi kaldırıldı, pencere okuması (`popupSayili`) eklendi
- **Onay:** Kullanıcı talimatıyla kaydedildi ("kaydet sayılı için"). Fiyat değerleri son testte doğrulanmadı, tekrar kontrol edilebilir.

### Genel
- Pano düğmesi sorunu: arama.js 676. satırdaki fazladan "MR594202" yazısı silindi (script orada kopuyordu). Bu düzeltme tüm firmalar için geçerli.
