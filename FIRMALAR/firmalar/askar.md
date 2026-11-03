# Askar

**Ayar:** `popupFiyat: true` (fiyat ve vadeli kampanya pencereden okunur)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Kampanya ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### 2091042 (01.0215148005 - TAKIM CONTA H100 KOMPLE)
- Site tablo: "Size Özel Fiyat" 1.404,81 (ilk satır sütunu)
- Site pencere (fiyatın üstünde):
  - Liste 1.600,83 · Fiyat (KDV hariç) 960,50 · Fiyat (KDV dahil) 1.152,60
  - Vadeli Kampanya Fiyatı (Min.Sip.Mik: 0): KDV hariç 876,23 · KDV dahil 1.051,48
  - 10.000 TL üzeri aynı gün nakit: 744,80 / 893,76 (kaydedilmedi, kullanıcı istemedi)
  - Nakit ödeme (ay sonu): 771,08 / 925,30 (kaydedilmedi)
  - Tek çekim kredi kartı (ay sonu): 814,89 / 977,87 (kaydedilmedi)
- Eklenti önce: 1.404,81 / 1.600,83 gösteriyordu ✘
- Düzeltme: `popupFiyat` (Fiyat satırı net/KDV dahil), kampanya için "Vadeli Kampanya" satırı
- Eklenti sonra: fiyat ✔ (960,50 / 1.152,60), kampanya ✔ (876,23 / 1.051,48)
- **Onay:** Kullanıcı onayladı ("ok oldu askar kaydet")

### Kullanıcı kararı
- Sadece vadeli kampanya kaydedilecek, nakit ve kredi kartı fiyatları eklenmeyecek.
