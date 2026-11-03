# Korea

**Ayar:** `popupNetler: true` (fiyat pencere okuması, hücre `div.Cell`, tetik `.tooltipstered`)
**Genel durum:** Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### 01.11.2026 · 264102f (sitede 26410-2F000)
- Site tablo: "Size Özel Fiyat" 1.515,50 (KDV hariç liste)
- Site pencere: Liste 1.515,50 · KDV'siz Net 811,55 · KDV'li Net 973,86
- Eklenti önce: net 1.262,92 / KDV 1.515,50 ✘ (pencere okunmadı, hücre `td` aranıyordu)
- Düzeltme: hücre seçici `td, [class*='Cell']`, tetik `.tooltipstered`
- Eklenti sonra: net 811,55 / KDV 973,86 ✔
- **Onay:** Kullanıcı onayladı (01.11.2026)
