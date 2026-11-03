# B2B Ortak Arama – Kullanım Kılavuzu

Tek ekrandan parça numarası / OEM numarası ile birden fazla B2B'de arama yapar. Sonuçları **KDV hariç net fiyata göre ucuzdan pahalıya** listeler, ürün fotoğraflarını gösterir.

---

## 1. Kurulum (her bilgisayarda bir kez)

1. **KURULUM.bat** dosyasına çift tıklayın.
2. Kurulum kendiliğinden şunları yapar:
   - Python yoksa kurar,
   - gerekli paketleri kurar,
   - **masaüstüne "B2B Arama" kısayolu** oluşturur.
3. Sonunda "Programı şimdi açmak ister misiniz?" sorusuna **E** deyin.

> Kurulum bir hata verirse ekrandaki yazıyı Claude'a gönderin.

## 2. Şifreleri girme (ilk açılışta)

İlk açılışta **Ayarlar ve Şifreler** ekranı kendiliğinden açılır. Daha sonra sağ üstteki **⚙ Ayarlar / Şifreler** düğmesiyle açabilirsiniz.

### A) Excel ile toplu giriş (önerilen)
1. **Excel şablonunu aç** düğmesine basın.
2. Sarı hücrelere **Müşteri Kodu**, **Kullanıcı Adı** ve **Şifre** yazın. Müşteri kodu olmayan B2B'lerde boş bırakın.
3. Excel'i **kaydedip kapatın**.
4. **Excel'den içe aktar** düğmesine basın.
5. Program şifreleri şifreleyip saklar ve **Excel'deki şifreleri siler**. "Durum" sütununa "Kaydedildi" yazar.

> B2B listesi değiştiyse (yeni B2B eklendiyse) **Şablonu yenile** ile güncel listeyi alın.

### B) Tek tek giriş
Ayarlar ekranındaki tabloda ilgili satıra bilgileri yazıp **Kaydet**'e basın. Şifre kutusunu boş bırakırsanız kayıtlı şifre değişmez.

### Bir B2B'yi aramadan çıkarmak
Tablodaki **Arasın** kutusunun işaretini kaldırın.

## 3. Arama yapma

1. Masaüstündeki **B2B Arama** simgesine çift tıklayın.
2. Ayrı bir Chrome penceresi açılır. İlk sekme **arama ekranı**, diğerleri B2B siteleridir. Program B2B'lere kendisi giriş yapar.
3. Arama kutusuna parça no / OEM no yazıp **Enter**'a basın.

## 4. Arama ekranı

| Özellik | Açıklama |
|---|---|
| **Foto** | Ürün fotoğrafı. **Üzerine gelince büyür.** Fotoğrafı olmayan üründe "yok" yazar |
| **Çift tıklama** | Bir satıra **çift tıklayınca** o B2B'nin sekmesi açılır ve parça orada aranır (sipariş vermek için) |
| **Sıralama** | KDV hariç net fiyata göre ucuzdan pahalıya; en ucuz satır yeşil |
| **Stok** | Ürünün bulunduğu depolar ve adetleri. "Yolda" stok sayılmaz |
| **KDV dahil** | B2B'nin kendi verdiği değer (Mest için net fiyat + %20) |
| **B2B / Marka filtresi** | Arama sonrası adlara tıklayarak bir veya birkaçını seçin; **temizle** ile kaldırın |
| **Sadece stokta olanlar** | Stokta olmayanları gizler |
| **Excel'e aktar** | Ekranda görünen (filtreli) listeyi indirir |

### Durum şeridi (üstteki renkli etiketler)

| Renk | Anlamı | Ne yapmalı |
|---|---|---|
| 🟢 Yeşil | Arama başarılı | – |
| 🟠 "Giriş yapılmamış (şifre kayıtlı değil)" | Şifre girilmemiş | Ayarlar'dan şifreyi girin |
| 🟠 "Otomatik giriş başarısız" | Şifre yanlış veya site uyarı veriyor | Etikete tıklayıp sekmeye bakın, gerekirse şifreyi yeniden kaydedin |
| 🔴 "hata" | Site cevap vermedi | Log dosyasına bakın |

## 5. Başka bilgisayara kurma

1. Ayarlar → **Kurulum paketi oluştur (zip)**. Program klasöründe `B2B_Arama_Kurulum.zip` oluşur. **İçinde şifre ve kişisel veri yoktur.**
2. Şifreleri taşımak için: Ayarlar → bir **ana şifre** yazın → **Yedek al**. `B2B_Yedek.b2bk` dosyası oluşur.
3. Diğer bilgisayarda zip'i açın, **KURULUM.bat**'a çift tıklayın.
4. `B2B_Yedek.b2bk` dosyasını yeni program klasörüne kopyalayın. Programda Ayarlar → aynı ana şifreyi yazın → **Yedekten yükle**.
   - Ya da yedek yerine Excel ile şifreleri yeniden girin.

> Ana şifreyi unutursanız yedek açılamaz. Yeni yedek almanız gerekir.

## 6. Desteklenen B2B'ler

**Başbuğ, Martaş, Dinamik, Rotas, Sayım Rulman, İntermobil, Vahdet Tiryakioğlu, Mest.**

Sırada: Eryaz yazılımlı tedarikçiler (Altay, Başaran ve ~28 tane daha), Yüce Yazılım / SadeceB2B (Merkez Oto, Arena, Kuzey, İlkem...), diğer web siteleri (Carpar, GloPar, KRAW, Motor Aşin...). DE-GA için tarayıcı lisansı bekleniyor.

## 7. Dosyalar

| Dosya / Klasör | Ne işe yarar |
|---|---|
| `KURULUM.bat` | Kurulum (Python, paketler, masaüstü kısayolu) |
| `FIREFOX_KUR.bat` | Chrome'da açılmayan B2B'ler (Altay) için Firefox bileşenini kurar |
| `B2B_Ara.bat` | Programı **siyah pencereyle** açar (sorun ararken kullanın) |
| `B2B_Sifreler.xlsx` | Şifre giriş şablonu (içe aktarınca şifreler silinir) |
| `B2B_Yedek.b2bk` | Ana şifreli yedek (başka bilgisayara taşımak için) |
| `siteler.json` | B2B listesi |
| `log\` | Aramalar ve hata kayıtları |
| `profil\` | Programın tarayıcı profili (silmeyin) |
| `sifreler\` | Şifrelenmiş giriş bilgileri (sadece bu bilgisayarda çözülebilir) |

## 8. Güvenlik

- Şifreler Windows'un kendi şifrelemesiyle (DPAPI) saklanır. **Yalnızca bu bilgisayarda, aynı Windows kullanıcısıyla** çözülebilir.
- Excel'den içe aktarınca Excel'deki şifreler silinir. Excel dosyası **açıkken** içe aktarma yapılmaz, böylece şifreler Excel'de kalmaz.
- Yedek dosyası ana şifreyle güçlü şekilde şifrelenir (AES).

## 9. Sorun giderme

- **Program açılmıyor:** `B2B_Ara.bat` ile açın, siyah pencerede hata görünür. Yoksa `KURULUM.bat`'ı tekrar çalıştırın.
- **Bir B2B Chrome'da boş sayfa gösteriyor:** `siteler.json`'da o B2B'ye `"tarayici": "firefox"` eklenir; program o siteyi ayrı bir Firefox penceresinde açar (önce `FIREFOX_KUR.bat` bir kez çalıştırılmalı). Şu an Altay böyle çalışıyor.
- **Fotoğraf "–" görünüyor:** O B2B'nin oturumu kapanmış olabilir. Bir arama yapınca program yeniden giriş yapar.
- **Bir B2B kırmızı / sonuç gelmiyor:** `log` klasöründeki o günün `hata_` dosyasını Claude'a gönderin.
