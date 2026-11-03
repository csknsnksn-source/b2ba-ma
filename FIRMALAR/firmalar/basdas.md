# Başdaş

**Ayar:** standart (eryaz_b2b)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### MR594202
- Site: JPI-500369 (JPI TAKOZ) · KDV'li 1.342,72 · tek satır
- Eklenti önce: arama hiç tetiklenmiyordu (`cfg` tanımsız hatası), eski sonuç kalıyordu ✘
- Düzeltme: `eryaz_b2b_gonder(parca, cfg)` imzası, `cfg = cfg || {}`
- Eklenti sonra: arama tetikleniyor ✔ (kullanıcı "evet şimdi oldu" dedi)
- Eski sonuç filtresi: aynı liste başka parça aramasında tekrar gelirse gösterilmez (kalıcı hafızada)
- **Onay:** Arama düzeltildi, fiyat ve alım geçmişi test edilecek

### 2231148000
- Site: sonuç yok, ama eklenti eski JPI-500369 satırını gösterdi (filtre öncesi)
- **Onay:** Kullanıcı "ikisindede yok" dedi, filtre sonrası tekrar test edilecek
