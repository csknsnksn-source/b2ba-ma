# B2B Ortak Arama – Kurulum ve Kullanım (sürüm 1.7.0)

## Ne yapar?
Chrome'da **açık ve giriş yapılmış** B2B sekmelerinin hepsinde aynı anda parça arar.

Sonuçlar tek tabloda gelir ve ucuzdan pahalıya sıralanır. Her satırda B2B, parça no, marka, ürün adı, net fiyat, KDV dahil fiyat, stok, kampanya ve OEM kodu yer alır.

- Eklenti yeni oturum açmaz, şifre görmez ve saklamaz. Sekmelerin kendi oturumunu kullanır.
- B2B sitelerini siz açarsınız. İsterseniz eklenti, masaüstündeki kısayollardan sizin yerinize açabilir.

## Yeni bilgisayara kurulum
1. `B2B_KURULUM_x.zip` dosyasını **B2B kısayollarının bulunduğu klasöre** (örneğin `Masaüstü\PROGRAM OLANLAR`) çıkartın.
   - Kısayol adları ana bilgisayardakilerle aynıysa "kapalı – aç" düğmeleri çalışır.
2. **KURULUM.bat** dosyasına çift tıklayın. Bu dosya:
   - kısayolları açma özelliğini kurar (yalnız sizin Windows kullanıcınıza, yönetici izni gerekmez),
   - eklenti klasörünün yolunu panoya kopyalar,
   - Chrome'da Uzantılar sayfasını açar.
3. Chrome Uzantılar sayfasında:
   1. Sağ üstten **Geliştirici modu**'nu açın.
   2. **Paketlenmemiş öğe yükle**'ye basın.
   3. Açılan pencerede adres kutusuna **Ctrl+V** yapıştırıp Enter'a basın, sonra **Klasör seç**'e basın.
   4. Yapboz simgesinden **B2B Ortak Arama**'yı raptiye ile sabitleyin.
4. Eklentiyi, B2B sitelerine giriş yaptığınız **Chrome profiline** kurun. Sekmeler hangi profildeyse eklenti de orada olmalıdır.
5. Otomatik giriş istiyorsanız şifreleri **B2B_Sifre_Kaydet.bat** ile kaydedin. Şifreler o bilgisayarda Windows tarafından şifrelenir ve başka bilgisayara taşınmaz. İstemezseniz Chrome'daki kayıtlı şifre kullanılır.
6. **Açılış tespiti:** B2B kısayollarını bu bilgisayar için tanımak üzere `B2B_Acilis_Tespit.ps1` dosyasını çalıştırın (sağ tık → PowerShell ile çalıştır). Her firmanın bu bilgisayarda **Chrome'da mı yoksa kendi penceresinde mi** açılacağı kaydedilir. Tespit yanlış çıkan firma olursa `acilis_ayar.json` içindeki `elle` alanına `pencere` veya `chrome` yazın.

`chrome://extensions` adresi yazılarak açılmazsa Chrome menüsünü kullanın: ⋮ → Uzantılar → Uzantıları yönet.

## Kullanım
1. Simgeye tıklayın, **B2B Ortak Arama** sayfası açılır.
2. **Kapalıları aç** düğmesi, açık olmayan B2B'leri açar. Her firmanın açılış yöntemi o bilgisayara göre belirlenir: kısayolu Chrome'u açıyorsa Chrome'da, masaüstü programını açıyorsa kendi penceresinde açılır. Firmanın türü tek başına belirleyici değildir, aynı program iki bilgisayarda farklı açılabilir. Açılan sitelere giriş yapın.
   - **Kısayolları tara** düğmesi: kısayol klasörünü tarar ve hangi sitenin hangi kısayola eşleştiğini `kisayol_listesi.txt` dosyasına yazıp açar. Eşleşmeyen site varsa buradan görebilirsiniz.
3. Parça numarasını yazıp **Ara**'ya basın.
4. Üst çubuktaki **Var / Yok / Hata** kutuları:
   - Fareyle üstüne gelince o gruptaki siteler görünür, tıklayınca liste sabitlenir.
   - **Hata** kutusunda oturumu kapanan, hata veren ve sekmesi kapalı siteler bulunur. Siteye tıklayınca açılır.
5. Sonuç tablosu:
   - **Yeşil** grup: kodu tam eşleşenler. **Sarı** grup: kodun içinde geçtiği ürünler. Sonra diğer benzerler gelir.
   - Stok: **Var** yeşil, **Az** mor, **Yok/?** kırmızı.
   - **KAMPANYA** etiketi: üstüne gelince normal (vadeli) fiyat görünür. Fiyatın altında üstü çizili normal fiyat yazar.
   - Satıra çift tıklarsanız o B2B'nin sekmesine gidersiniz.
6. **Pano** düğmesi şunları gösterir:
   - TCMB USD/EUR efektif satış kurları,
   - son arama,
   - bugün arananlar,
   - sık arananlar,
   - en sık en ucuz çıkan B2B.
   - Listedeki bir parçaya tıklamak onu yeniden arar.
7. **Alım geçmişi:** Daha önce alım yaptığınız ürünlerin satır numarası turuncu yuvarlak içinde ve kalın görünür. Satırın üstüne gelince o firmadan o ürünün alımları (tarih, evrak, miktar, alış fiyatı) açılır.
   - Şimdilik Eryaz B4B/V4 sitelerinde (Altay, Taypar, Hamle vb.) ve Lepar'da çalışıyor. Başbuğ grubu henüz yok.
8. **Excel'e aktar** düğmesi görünen sonuçları CSV olarak indirir.

## Güncelleme
- Yeni sürüm gelince `B2B_EKLENTI` klasöründeki dosyaları değiştirin, sonra Uzantılar sayfasında eklentinin **↻** düğmesine basın.
- Kartta yeni sürüm numarası görünmezse eklentiyi **Kaldır**'la kaldırıp **Paketlenmemiş öğe yükle** ile yeniden ekleyin.

## Sorun olursa
- Bir site hata verirse **Hata** kutusundan o sitenin **incele** düğmesine basın. Çıkan metni kopyalayıp Claude'a gönderin.
- "İzin yok – tıklayın" yazan siteye tıklayıp izin verin.
- Eski **B2B_ARAMA** Python programını eklentiyle aynı anda açmayın. Aynı hesaplarla kendi oturumunu açtığı için çakışır.

## Kaldırma
- Uzantılar sayfasında **Kaldır**'a basın.
- Kısayol özelliğini kaldırmak için **B2B_Kisayol_Kaldir.bat** dosyasını çalıştırın.
