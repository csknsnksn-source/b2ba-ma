# Başdaş

**Ayar:** standart (eryaz_b2b)
**Genel durum:** Arama BEKLİYOR (25.11: yanlış sonuç) · Fiyat BEKLİYOR · Alım geçmişi BEKLİYOR

## Aramalar

### sa072 (25.11)
- Eklenti: "Kodun içinde geçtiği ürünler"de Başdaş satırı olarak MB903639 · TERMİK KONTAK L-200 · 262,27 ₺ (KDV dahil 314,72 ₺) gösterdi. Stok "?".
- Bu ürün sa072 ile ilgili değil. Büyük olasılıkla önceki aramadan kalan eski sonuç (eski sonuç filtresi çalışmadı). Site ekranı henüz kontrol edilmedi.
- **Onay:** Kullanıcı yanlış olduğunu bildirdi. Site ekranıyla karşılaştırılıp eski sonuç filtresi düzeltilecek.

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
