# Başaran

**Ayar:** standart (eryaz_b2b, `b2b.basaran-otomotiv.com.tr`)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### 2091042 (Başaran)
- Site: 5 satır (HMC-20910-42D00-WME 7.818,44 liste, net 5.316,54, KDV 6.379,85 vb.), İsk %32
- Eklenti: aynı değerler ✔ (`chrome_ui` ile test edilmişti)
- Sorun: ana sayfadan aramada sonuç çıkmıyordu → düzeltildi (Ara düğmesine tıklama)
- **Onay:** Kullanıcı onayladı ("geldi şimdi")

### 2091042 (25.11, stok noktaları)
- Site: stok iki sütun, MERKEZ ve DEPO, renkli nokta resimleri (`images/status/green.png` = Var). Diğer noktalar kırmızı (Yok).
- Eklenti önce: stok "?", Foto sütununda kırmızı top (stok noktası ürün resmi sanılıyordu).
- Düzeltme: ilk iki durum resmi MERKEZ/DEPO olarak okunuyor, foto stok noktası saymıyor (`okuyucular/basaran.js`, `// OZEL`).
- **Onay:** Kullanıcı "BAŞARAN TAMAM" dedi (25.11).

### Kullanıcı notu
- Başaran'da masaüstü kısayolu ("Başaran Otomotiv.appref-ms") tercihi, tıklayınca programın açılması için Kısayol ekle'de seçilir.
