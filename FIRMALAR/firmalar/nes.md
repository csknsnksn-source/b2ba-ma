# NES

**Ayar:** `popupKdvDahil: true` (fiyat pencere okuması: Anında Havale / Özel satırları)
**Genel durum:** Fiyat BEKLİYOR (düzeltme yapıldı, test edilmedi) · Alım geçmişi BEKLİYOR

## Aramalar

### 01.11.2026 · 2461022600 (24610-22600, MOBİS, KORE)
- Site tablo: KDV Hariç Liste 327,04 · KDV'li Net 392,45
- Site pencere (fiyatın üstünde): Anında Havale ve Özel satırları, KDV hariç 264,90 · KDV dahil 317,88
- Kullanıcının beklediği: KDV dahil 317,88 (net 264,90)
- Eklenti (düzeltmeden önce): 327,04 / 392,45 ✘ (pencere okunamadı)
- Denemeler: hover olayları genişletildi, sonra `td` → `div` hücre düzeltmesi yapıldı (NES'te de hücre `div.Cell`)
- Eklenti (düzeltmeden sonra): net 264,90 / KDV dahil 317,88 ✔
- **Onay:** Kullanıcı onayladı
