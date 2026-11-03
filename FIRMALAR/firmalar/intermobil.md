# İntermobil

**Ayar:** `eryaz_web` (`b4b.intermobil.com.tr`, Next.js arayüzü)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Önemli not (arama)
- Arama kutusu (`placeholder="Ara.."`) yalnız arama sayfasında (`/tr/search`). Sekme ana sayfada (`/tr`) açılıyor.
- Eklenti artık sekme ana sayfadaysa kendisi `/tr/search` adresine geçiyor (`arama.js`, siteAra içinde `eryaz_web` kontrolü).

## Aramalar

### 2461022600 (kullanıcı denemesi)
- İlk denemede sekme ana sayfadaydı, arama yapılamadı (kutu bulunamadı)
- Düzeltme: sekme arama sayfasına götürülüyor, sonra arama yapılıyor
- **Onay:** Kullanıcı onayladı ("tamam oldu") — arama çalışıyor
- **Fiyat:** Kullanıcı onayladı ("fiyat ok")
- Alım geçmişi sonra kontrol edilecek
