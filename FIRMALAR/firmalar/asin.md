# Aşin

**Ayar:** `asinGecmis: true` (alım geçmişi okuyucusu, çalışmıyor)
**Genel durum:** Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### 2231148000 / 22311-48000
- Site tablo: liste 4.641,00 · İsk. %20 · net 3.712,80 · KDV'li 4.455,36
- Eklenti: fiyat doğru ✔
- Alım geçmişi: 23.10.2026, 1 adet, 4.641,00, iskonto %20 (sitede "Stok Hareketleri" sekmesinde)
- Eklenti alım geçmişini göremedi: sekme tıklamayla yükleniyor, ürün Id'sine (11098) giden düz bağlantı yok
- Site API: `Search.aspx/GetStockActivity` (401 hatası verdi)
- **Onay:** Fiyat onaylandı. Alım geçmişi BEKLİYOR (sonra)

### MR594202
- Site: sonuç yok (arama boş döndü)
- Eklenti: önce eski 22311-48000 satırını gösteriyordu, filtre eklendi ✔
- **Onay:** Kullanıcı onayladı (Aşin'de bu parça yok)

### 2231148000 (arama sayfası)
- Arama adresi değişti: `search.aspx?q=` ile aranıyor (ana sayfa arama kutusu çalışmıyor)
- **Onay:** Test edildi, sonuç geldi
