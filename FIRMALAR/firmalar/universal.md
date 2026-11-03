# Universal

**Ayar:** `popup: true` (fiyat popup'ı `/Services/PopupGosterimleri?UrunId=...` adresinden)
**Genel durum:** Arama ONAYLANDI · Fiyat ONAYLANDI · Alım geçmişi BEKLİYOR

## Aramalar

### UNI-19893
- Site tablo: LİSTE FİYATI 111,10 · KAMPANYA 0,00 (KDV'li sütun)
- Site popup: KDV'siz Maliyet 77,77 · KDV'li Maliyet 93,32
- Eklenti önce: 111,10 gösterdi ✘ (popup okunmadı, ilk denemede `popupOku is not defined`)
- Düzeltme: fonksiyon `genel_oku` içine alındı, `X-Requested-With` başlığı eklendi
- Eklenti sonra: net 77,77 / KDV 93,32 ✔
- **Onay:** Kullanıcı onayladı ("bravo oldu")
- Not: Çarpan yöntemi (0,70) denendi ve geri alındı, kullanıcı istemedi
