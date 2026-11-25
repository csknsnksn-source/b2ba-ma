# Başdaş

**Ayar:** standart (eryaz_b2b), kod: `B2B_EKLENTI_TEST/okuyucular/basdas.js`
**Genel durum:** Arama ONAYLANDI (25.11) · Fiyat ONAYLANDI (25.11) · Alım geçmişi BEKLİYOR

## Bilinen sorunlar (25.11)
- **Stok:** Site stoğu yazıyla değil renkli noktalarla veriyor (yeşil = Var, yarım = Az Var, kırmızı X = Yok, kamyon = Yolda, pembe = Sipariş Üzerine). Eklenti yazı okuduğu için stok "?" gösteriyor ve nokta resmini ürün resmi sanıyor (Foto sütununda yeşil top çıkıyor). Çözüm (25.11, DevTools): stok noktası `<img src="images/status/green2.png">` olarak geliyor. Dosya adından durum çıkarılır (green = Var, yellow/orange/half = Az Var, red/cross = Yok, truck = Yolda, pink/purple = Sipariş Üzerine). `green2.png` = Var kesin. Kırmızı X'in dosya adı henüz doğrulanmadı; tanınmazsa "?" görünür ve ad stokta okunabilir. Kod: `okuyucular/basdas.js` (`// OZEL`).
- **Adresle yükleme:** Test sürümünde her aramada `search.aspx?q=<parça>` ile yükleniyor (`adresleAra`, sessionStorage bayrağı). Gerekli değildi, ama zararsız; "Arama başlatılamadı" hatasının düzeltilmesiyle birlikte kaldı.
- Not: Başta "eski sonuç" sanıldı, sonra yanlış çıktı. Site SA072 için MB903639 satırını gerçekten döndürüyor (üç stok noktası yeşil). Eski sonuç sorunu yok.

## Aramalar

### SA072 (25.11)
- Site (kendi ekranı, `search.aspx?q=SA072`): iki satır. 58305-44A40/J (Dyb. yeşil, İst. yeşil, İzm. kırmızı X, KDV dahil 844,63 TL) ve MB903639 TERMİK KONTAK (Dyb., İst., İzm. üçü de yeşil, KDV dahil 314,72 TL).
- Eklenti: iki satır da geliyor (fiyatlar doğru: MB903639 net 262,27 × 1,2 = 314,72). Stok "?" ve Foto yeşil top (yanlış).
- **Onay:** Kullanıcı SA072 testini yaptı: "OK DOĞRU" (25.11). Stok noktaları ve fiyatlar doğru.

### MR594202
- Site: JPI-500369 (JPI TAKOZ) · KDV'li 1.342,72 · tek satır
- Eklenti önce: arama hiç tetiklenmiyordu (`cfg` tanımsız hatası), eski sonuç kalıyordu
- Düzeltme: `eryaz_b2b_gonder(parca, cfg)` imzası, `cfg = cfg || {}`
- Eklenti sonra: arama tetikleniyor (kullanıcı "evet şimdi oldu" dedi)
- **Onay:** Arama düzeltildi, fiyat ve alım geçmişi test edilecek

### 2231148000
- Site: sonuç yok, ama eklenti eski JPI-500369 satırını gösterdi (eski sonuç filtresi o zaman çalışmıyordu)
- **Onay:** Kullanıcı "ikisindede yok" dedi, tekrar test edilecek
