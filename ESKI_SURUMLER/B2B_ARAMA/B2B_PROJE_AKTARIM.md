# B2B Ortak Arama – Proje Aktarım Dosyası

Hazırlanma: 25.10.2026. Bu dosya, `otosen@otosen.info` Claude hesabındaki "b2b açma programı" projesinin tüm bilgilerini ve konuşmaların özetini içerir. Yeni bir Claude hesabında projeye yükleyip "Bu dosyayı oku, kaldığımız yerden devam edelim" diyerek devam edilebilir.

> Güvenlik notu: Bu dosyada hiçbir şifre, kullanıcı kodu veya müşteri kodu yoktur. Konuşmada paylaşılan giriş bilgileri bilerek dışarıda bırakıldı.

---

## 1. Kullanıcı ve çalışma tercihleri

- Kullanıcı: COSKUN, OTOŞEN BURSA OTOMOTİV (Osmangazi, Bursa). Operasyon sorumlusu.
- **Yanıtlar her zaman Türkçe olmalı.**
- Kullanıcı teknik detay yerine kısa, net adım ister. Çift tıklanacak `.bat` dosyası + "bitti" yazma akışıyla çalışıyoruz.
- **Altay, Taypar, Hamle, Mega-Tek ve Rulman Dünyası otomatik açılmamalı.** Bunlar yalnızca 🚀 B2B Kısayolları düğmesiyle açılır.
- Şifreler sohbete yazılmamalı; program Ayarlar ekranından şifreli (DPAPI) kaydedilir. Claude sitelere şifre girmez.
- Claude aboneliği `csknsnksn@gmail.com` Claude hesabında; Chrome uzantısı da o hesapta açık. Önceki proje `otosen@otosen.info` hesabındaydı (orada duruyor, silinmedi).

## 2. Amaç

Windows'ta çalışan **"B2B Ortak Arama"** aracı: tedarikçi B2B portallarına otomatik giriş yapar, tek ekranda parça arar. Sonuçta: B2B adı, parça kodu, marka, OEM, KDV hariç net fiyat (ucuzdan pahalıya), KDV dahil fiyat, foto, B2B/marka filtresi. Satıra çift tıklayınca o B2B açılır. Uzun vadede `PROGRAM OLANLAR` klasöründeki ~90 B2B'nin hepsi eklenecek.

## 3. Konum ve dosyalar

Klasör: `C:\Users\HP\OneDrive\Masaüstü\PROGRAM OLANLAR\B2B_ARAMA`
(B2B masaüstü kısayolları bir üst klasörde: `PROGRAM OLANLAR\*.appref-ms / *.lnk / *.url`)

| Dosya | Görevi |
|---|---|
| `b2b_ara.py` | Ana program. Python 3.15 + Playwright (Chrome, yoksa Edge). Kendi profili `profil\` (oturumlar burada kalır). Firefox desteği `profil_firefox\`. Kullanılan sürüm md5 `4ba8bb63…` = `b2b_ara_yedek_4ba8.py`. |
| `arama.html` | Arama ekranı: sonuç tablosu, foto önizleme, Ayarlar paneli, 🚀 B2B Kısayolları paneli (filtre, Enter ilk eşleşmeyi açar, Esc kapatır). |
| `siteler.json` | Site listesi (`ad`, `tip`, `url`, `aktif`). md5 `ddbe0f15…` |
| `ayarlar.py` | Excel şablonu `B2B_Sifreler.xlsx` (içe aktarınca Şifre sütunu silinir), şifreli yedek `B2B_Yedek.b2bk` (Fernet + PBKDF2), kurulum paketi `B2B_Arama_Kurulum.zip`. |
| `kasa.py` | DPAPI ile şifreli giriş bilgileri: `sifreler\*.giris`. |
| `KURULUM.bat` → `kurulum.ps1` | Python bul/kur, pip paketleri, playwright chromium+firefox, masaüstü kısayolu "B2B Arama", `python_yolu.txt`. |
| `B2B_Ara.bat` | Konsollu açılış. |
| `FIREFOX_KUR.bat` | Playwright Firefox kurulumu. |
| `Adres_Bul.bat` → `servis_bul.py` | Masaüstü B2B programlarından sunucu adreslerini çıkarır → `adresler.txt`. |
| `KULLANIM.md`, `OKU_BENI.txt` | Kullanım notları. |
| `DURUM_NOTLARI.md` | Son durum özeti. |
| `log\arama_YYYY-MM-DD.txt`, `log\hata_YYYY-MM-DD.txt` | Loglar. |

Program içi fonksiyonlar (arayüze açık): pyAra, pySekme, pySiteler, pyResim, pyGoster, pyAyarListe, pyGirisKaydet, pyGirisSil, pyAktif, pyAyarIslem, pyKisayollar, pyKisayolAc.

Deneme/inceleme dosyaları (silinebilir veya tekrar kullanılabilir): `eryaz_ui.py`, `ui_test.py`, `ui_fiyat_test.py`, `ui_kaynak.py`, `UI_*.bat`, `giris_incele.py`, `Giris_Incele*.bat`, `arama_incele.py`, `Arama_Incele_*.bat`, `tani.py`, `kesif.py`, `inceleme\altay\*` vb.

## 4. Çalışan bağlayıcılar (siteler.json "tip")

### A – Başbuğ, Martaş, Dinamik, Rotas, Sayım Rulman (aktif)
- Arama sayfası `.../web/b2b/search`, giriş `.../web/login` (`input[name=customercode|username|password]`, `button[type=submit].loginBtn`).
- Arama `textarea#searchInput` + Enter. Cevap: `ResultDetailed` içeren XHR. `ProductCode` şifreli: hex → XOR 0x72 → hex → URL-kodlu metin. Fiyat `NetPriceWoVat` / `NetPriceWVat`.
- Foto `/Service/Thumb/{ID}.res`, büyük `/Service/Res/{ID}.res` (oturum çerezi gerekir).
- Dinamik: otomatik giriş başarısız oluyor (şifre/uyarı) – incelenecek.

### ERYAZ_WEB – İntermobil (aktif)
- `/tr/search`, giriş `/tr/login`. Cevap GET `/api/Search/SearchOptimizedHydrated?q=...`. Foto `thumbnailUrl`.

### ERYAZ_V4 – Vahdet Tiryakioğlu (aktif)
- `/Search?text=...`, cevap POST `/Search/SearchProduct`. Giriş `#CustomerCode #UserCode #Password #btnLogin`. Fiyat `PriceNetCustomer.ValueFinal`, kampanya fiyatı varsa o. Foto `PicturePath`.

### DESISS – Mest (aktif)
- `/urunler?arama=...`, cevap `webbayiapi.mestoto.com.tr/api/urunler/search?aramaTerimi=...`. `fiyat` = sepetteki net, KDV +%20.

## 5. Lisanslı Eryaz B2B'ler – PASİF (Altay, Taypar, Hamle, Mega-Tek, Rulman Dünyası)

- siteler.json'da `tip: ERYAZ_SOAP`, `aktif: false`.
- Web girişi ve masaüstü programının SOAP servisi (`loginservice.asmx`) "Lisans Hakkınız Dolmuştur" veriyor (donanım/lisans kontrolü). Bu yol kapalı.
- **UI otomasyonu denemesi (Altay, Firefox penceresi):** "Ara.." kutusuna parça yazılıp Enter; sonuç satırları Windows erişilebilirlik ağacında `DataItemControl` olarak okunuyor. Satır başı '+' ile biten DataItem. Hücreler: Kodu, Adı, Üretici, Üretici kodu, Birim, (boş/-), brüt fiyat, Kocaeli stok, Diğer stok, Sip.Mik. Metinlerde ikon karakterleri (U+E000–F8FF) ve sert boşluk var, temizlenmeli.
- **Net fiyat:** Tablodaki fiyat brüt. Fiyatın üzerine gelince popup: "KDV Hariç Fiyat" (1. değer) ve "KDV Dahil Fiyat" (2. değer = 1. × 1,20). Doğrulama: MHR-22778 brüt 911,15 → 457,41 / 548,89.
- Sorunlar: ekranın altındaki satırlar (≈1030 px altı) hover ile okunamıyor, sayfa kaydırma işe yaramadı; site başına 2,5–6 dk sürüyor; Taypar/Hamle/Mega-Tek/Rulman Chrome sekmesinde açıkken tablo ekran dışında kaldı ve ilk satırlar Altay ile aynı göründü (doğru sayfa mı, doğrulanmadı).
- Sayfa kaynağı (Ctrl+U) denendi: Angular, veri ilk HTML'de yok.
- Karar: **şimdilik iptal.** Program bu denemelerden önceki sürüme döndürüldü. Olası yollar: Firefox geliştirici araçlarından `SearchProduct` yanıtı (manuel) veya yalnızca brüt + stok ile UI yöntemi.
- Askar Otomotiv de `loginservice.asmx` kullanıyor (Eryaz tipi), lisans engeline takılabilir.

## 6. Eryaz dışı B2B'ler – şu an üzerinde çalışılan

- **SadeceB2B / Yüce Yazılım platformu:** Arkaş, Arsan Motor (`b2b.arsanmotor.com.tr`), Ergin (`b2b.erginotomotiv.com`), Karpart, Mydpar, Waha, İLSEM, Teknopar (`b2b.teknoparotomotiv.com`), Universal (`bayi.universaloto.com`).
  - Arsan girişi: ASP.NET WebForms, `txtUserName`, `txtPassword`, `btnGiris`. Kullanıcı Arsan'ı iptal etti.
  - Ergin girişi: `/Login/?ReturnUrl=/default.aspx`, alanlar "Kullanıcı Adı", "Şifre", "Giriş" (Yüce Yazılım / c1soft).
- **Lepar Otomotiv** (`web.lepar.com.tr/Default.aspx`): kullanıcının Chrome'unda açık ve giriş yapılmış. Sayfada "Ürün Ara..." kutusu ve "Ara..." butonu var, menü: Ana Sayfa, Ürün Arama, Sepet, Siparişler, İade, Cari Hesap, Online Ödeme, Katalog. **Sıradaki iş: Lepar bağlayıcısı.**
  - Hazır araç: `Arama_Incele_Lepar.bat` → `arama_incele.py`. Ayrı bir Chrome penceresi açar, kullanıcı kendisi giriş yapıp parça aratır, Enter'a basar. Çıktı: `sonra_lepar.txt` (sayfa alanları), `sonra_lepar.html`, `ag_lepar.txt` (arama istekleri ve cevapları; şifre içeren istekler kaydedilmez).
  - Chrome uzantısı (Claude in Chrome) ile kullanıcının açık Lepar sekmesinden doğrudan bakmak da mümkün (uzantı Gmail Claude hesabında).

## 7. Masaüstü programlarından bulunan adresler (adresler.txt özeti)

- **Eryaz V4/B4B (lisanslı olabilir):** Altay `b4b.altayoto.com`, Taypar `b4b.taypar.com`, Hamle `b4b.hamlesiparis.com`, Mega-Tek `b4b.megatekotomotiv.com`, Rulman Dünyası `b4b.rulman.com.tr`, Aslan Kardeşler `b4b.askotomotiv.com`, Doğan `b4b.doganotomotiv.com.tr`, GMW/Kolaş `b4b.gmw.net`, Murat `b4b.muratotomotiv.com.tr`, Grup Işık `b4b.grupisik.com.tr`.
- **Eryaz B2B (loginservice.asmx / login.aspx):** Akay `b2b.akayoto.com.tr`, Akkar `b2b.akkarmotor.com`, Askar `b2b.askarauto.com`, Aşin `b2b.asinotomotiv.com`, Başaran `b2b.basaran-otomotiv.com.tr`, Başdaş `b2b.basdasotomotiv.com`, Kortaş `b2b.kortasotomotiv.com`, Karakaş `b2b.karakasoto.com`, Korea `b2b.koreaotomotiv.com`, Lepar `web.lepar.com.tr`, NES `b2b.nesotoparcalari.com`, Sayılı `b2b.sayiliotomotiv.com`, Sayıner `b2b.sayiner.com.tr`, Şahinoğlu `b2b.sahinogluotomotiv.net`, Tok `bayi.tokotomarket.com.tr`, Yedekçi `b2b.yedekciotomotiv.com`, Yak `b2b.yakotomotiv.com.tr`, Yeni Alka `b2b.yenialkaotomotiv.com`, Çıtak `b2b.citak.com.tr`, İzmir Teknik Rulman `b2b.izmirteknikrulman.com` (web yok).
- **SadeceB2B:** yukarıda (bölüm 6).
- **Bekleyenler / diğer:** DE-GA (Buyasoft, tarayıcı lisansı), Merkez Oto (SadeceB2B), ABS, HİS-KA, Mete, Balkan Radyatör, Carpar, GloPar, KRAW, Motor Aşin, Güneybağlılar, Ekici, HYK, İntur, Orient, Şahinler, Şenbay, FCS, Bursa Nisa, Bayar. Silverlight (Özaş, İlpar) kapsam dışı.

## 8. Teknik notlar

- Dosyalar OneDrive klasöründe; yazılan dosya bazen eski haline dönüyor. Yazdıktan sonra md5 ile kontrol edip gerekirse tekrar yazmak gerekiyor.
- Program açılışta aktif sitelerin sekmelerini arka planda açar ve kayıtlı şifreyle girer; oturumlar `profil\` klasöründe kalır.
- Tarayıcı çerezleri/oturumları programa aktarılmıyor (güvenlik kararı). Her site için program kendi oturumunu açar.
- Kullanıcının kendi Chrome'undaki açık sekmeler yalnızca Claude in Chrome uzantısıyla kullanılabilir.

## 9. Konuşma özeti (kronolojik)

1. 24.10: Program iskeleti kuruldu: Playwright, Grup A bağlayıcısı (Başbuğ, Martaş, Dinamik, Rotas, Sayım), arama ekranı, foto, Ayarlar, şifreli kasa, Excel içe aktarma, yedekleme, kurulum paketi, masaüstü kısayolu.
2. ERYAZ_WEB (İntermobil), ERYAZ_V4 (Vahdet), DESISS (Mest) eklendi. `servis_bul.py` ile masaüstü B2B programlarının adresleri çıkarıldı.
3. 25.10 sabah: Altay ve diğer 4 lisanslı Eryaz B2B için web girişi, Firefox, SOAP girişi ve oturum yakalama denendi; lisans engeli nedeniyle başarısız. Kullanıcı bu 5'inin otomatik açılmamasını istedi → pasif yapıldı.
4. 🚀 B2B Kısayolları düğmesi eklendi (üst klasördeki kısayolları açar).
5. UI otomasyonu: Altay Firefox penceresinde arama + satır okuma + hover ile net fiyat başarıyla çalıştı (8/13 satır). Programa ERYAZ_UI bağlayıcısı eklendi; diğer 4 site Chrome sekmelerinde bulundu ama fiyat okunamadı ve çok yavaştı.
6. Kullanıcı kararı: 4'ü (ve Altay entegrasyonu) iptal, program Altay öncesi sürüme döndürüldü, `DURUM_NOTLARI.md` yazıldı.
7. Eryaz dışı sitelere geçildi: Askar (Eryaz tipi çıktı), Arsan (giriş alanları alındı, kullanıcı iptal etti), Ergin (giriş sayfası incelendi), Lepar (sıradaki).
8. Gmail bağlantısı (`csknsnksn@gmail.com`) bu sohbete kuruldu ve çalışıyor.
9. Chrome uzantısı Gmail Claude hesabında olduğu için otosen hesabındaki sohbetten bağlanamadı; kullanıcı Gmail hesabına geçmeye karar verdi. Bu dosya o geçiş için hazırlandı.

## 10. Yeni oturumda ilk adımlar

1. Claude masaüstü uygulamasında bu bilgisayarı ve `B2B_ARAMA` klasörünü bağla.
2. Bu dosyayı ve `DURUM_NOTLARI.md`'yi oku.
3. Chrome uzantısıyla açık Lepar sekmesinde bir parça aratıp arama isteğinin adresini ve cevap biçimini incele (veya `Arama_Incele_Lepar.bat`).
4. Lepar bağlayıcısını `b2b_ara.py`'ye ekle: önce yedek al, sonra `siteler.json`'a Lepar'ı ekle, giriş için kayıtlı şifreyi (kasa) kullan.
5. Sonra Ergin / Teknopar / Universal (SadeceB2B), ardından Eryaz B2B grubu.
