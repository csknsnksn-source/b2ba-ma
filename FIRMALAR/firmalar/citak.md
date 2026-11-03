# Çıtak

**Ayar:** `ozelKdvHaric: true` (Size Özel Fiyat KDV hariç liste; "%20+5" ardışık iskonto çarpılır)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### h100 yedek (MC840219, YAĞ MÜŞÜRÜ ISUZU NPR66 ... DMAX CANTER)
- Site tablo: "Size Özel Fiyat" 74,31 · İsk. %20+5
- Site pencere (tooltip): Liste 74,31 · KDV'siz Net 56,48 · KDV'li Net 67,77
- Eklenti önce: net 61,93 / KDV 74,31 ✘ (liste KDV dahil sanıldı, iskonto okunmadı)
- Düzeltme: `ozelKdvHaric` + ardışık iskonto çarpımı (0,80 × 0,95)
- Beklenen: net 56,48 / KDV 67,77
- Eklenti sonra: ✔ (kullanıcı onayladı, "çıtak ta tamam")
- **Onay:** Kullanıcı onayladı
