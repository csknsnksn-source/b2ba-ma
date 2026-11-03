# Balkan Radyatör

**Ayar:** `tekFiyatKdvli: true`
**Genel durum:** Fiyat DÜZELTİLDİ (onay bekliyor) · Alım geçmişi BEKLİYOR

## Aramalar

### 2531025100 (BHY000016 ve BHY001016)
- Site: Liste 5.194,76 · İsk. %30+5+5+5+12 · KDV'li Net 3.292,29 (BHY000016) · 2.705,59 (BHY001016, liste 4.269,03)
- Eklenti önce: liste fiyatından iskonto hesaplanıyordu, yanlış (BHY000016 net 2.286,31 / KDV 2.743,58) ✘
- Düzeltme: `kdvliAlan: true` — "KDV'li Net" sütunu doğrudan KDV dahil alınıyor
- Beklenen: BHY000016 net 2.743,58 / KDV 3.292,29 · BHY001016 net 2.254,66 / KDV 2.705,59
- **Onay:** Kullanıcı onayladı (ayrıca Balkan'ın fiyat sütunu "KDV'li Net" olarak kullanılıyor, `kdvliAlan`)

### 2231148000 (Balkan görünümü)
- Site: BTO057016 (Toyota Corolla) · liste 1.530,73 KDV dahil
- Eklenti önce: net 1.530,73 (KDV dahil değer net sanıldı) ✘
- Düzeltme: `tekFiyatKdvli` (tek fiyat KDV dahil)
- Beklenen: net 1.275,61 / KDV dahil 1.530,73
- **Onay:** BEKLİYOR (kullanıcı test etmeli)
