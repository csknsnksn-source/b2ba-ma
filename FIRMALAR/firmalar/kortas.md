# Kortaş

**Ayar:** `ozelKdvHaric: true` (Size Özel Fiyat KDV hariç liste, iskonto çarpılır)
**Genel durum:** Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### 01.11.2026 · 2461022600 (FYC, ACCENT02121)
- Site arama tablosu: Size Özel Fiyat 263,66 · İsk. %30+10
- Site detay: Fiyat 263,66 · İskonto %30+10 · Net 166,11 · KDV'li 199,33
- Site pencere (tooltip): Liste 263,66 · KDV'siz Net 166,11 · KDV'li Net 199,33
- Eklenti önce: net 219,72 / KDV 263,66 ✘ (özel fiyat KDV dahil sanıldı, iskonto okunmadı)
- Düzeltme: ardışık iskonto çarpımı (0,70 × 0,90), `ozelKdvHaric`
- Eklenti sonra: net 166,11 / KDV 199,33 ✔
- **Onay:** Kullanıcı onayladı (01.11.2026)
