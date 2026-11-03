# B2B Ortak Arama – Oturum Notları (25.10.2026)

Hazırlayan: Claude, COSKUN (OTOŞEN BURSA OTOMOTİV) ile yapılan çalışmanın özeti.
Yarın kaldığımız yerden devam etmek için bu dosyayı okuyun.

---

## 1. Amaç

`PROGRAM OLANLAR` klasöründeki tedarikçi B2B sitelerinde **tek ekrandan parça arama**.

Her sonuç satırında şunlar olacak:
- B2B adı, parça no, marka, OEM
- Net fiyat (KDV hariç) ve KDV dahil fiyat

Sonuçlar ucuzdan pahalıya sıralanır ve filtrelenebilir. Satıra çift tıklayınca o sitenin sekmesi açılır.

---

## 2. Gelinen kurgu: Chrome eklentisi

- **Klasör:** `C:\Users\HP\OneDrive\Masaüstü\PROGRAM OLANLAR\B2B_EKLENTI`
- **Kullanım sırası:**
  1. Siteleri `B2B_Baslat.bat` ile kendi Chrome'unuzda (csknsnksn@gmail.com profili) açın ve giriş yapın.
  2. Eklenti simgesine basın, **B2B Arama** sekmesi açılır.
  3. Parça no yazın. Eklenti, açık ve giriş yapılmış sekmelerin hepsinde aynı anda arar.
- **Eklentinin yapmadıkları:** Siteleri kendisi açmaz, yeni oturum açmaz, şifre görmez ya da girmez.
- **Kurulum:** Uzantıları yönet → Geliştirici modu → "Paketlenmemiş öğe yükle" → `B2B_EKLENTI` klasörü.
- **Dosya değişince:** Uzantı kartında ↻ yenileyin. Manifest değişip Chrome izinleri almıyorsa: kaldırın, sonra yeniden "Paketlenmemiş öğe yükle".
- `chrome://extensions` adresi yazılarak açılmıyor. Menüden girin: ⋮ → Uzantılar → Uzantıları yönet.

### Neden eklentiye geçtik (önceki denemeler)

1. **Python programı (`B2B_ARAMA`, Playwright ile kendi tarayıcısı):** Kullanıcının Chrome oturumuyla çakıştı. Başbuğ ve Rotas "başka bilgisayardan giriş" uyarısı verdi.
2. **Windows arayüz otomasyonu (UIA) ile açık Chrome'u okumak:** Çok yavaştı, site başına 13–60 saniye sürdü.
3. **ParcaMatik_Pro.exe incelendi:** Hızlı çalışıyor. Ancak bilinmeyen exe dosyası güvenlik nedeniyle çalıştırılmadı.
4. **Electron fikri:** "Olmadı, yeni baştan başka bir kurgu yapalım" denildi ve eklenti kurgusu seçildi. Eklenti çalıştı ve hızlı.

**Önemli:** Eski Python programı (`B2B_ARAMA`) eklentiyle aynı anda açılmamalı, oturum çakışır. Yedek olarak duruyor.

---

## 3. Eklenti dosyaları (sürüm 0.4.4)

| Dosya | Görevi |
|---|---|
| manifest.json | MV3. İzinler: tabs, scripting, storage. host_permissions'ta 37 alan adı var, optional_host_permissions `*://*/*` |
| arka.js | Simgeye tıklanınca arama.html sekmesini açar veya öne getirir |
| siteler.js | Site listesi. Alanlar: ad, desen (adres) veya baslik (sekme başlığı), okuyucu, acilis, ayar |
| okuyucular.js | Her altyapı için okuma fonksiyonları ve "incele" |
| arama.html / arama.js | Arama ekranı: durum satırları, izin bandı, filtreler, tablo, CSV, foto önizleme, çift tık |
| KURULUM.md | Kurulum adımları |

### Okuyucu türleri

- **`a_grup`**: Başbuğ, Martaş, Dinamik, Rotas, Sayım Rulman.
  - `#searchInput` kutusuna yazıp Enter'a basar.
  - XHR ile gelen `ResultDetailed` JSON verisini okur.
  - ProductCode şifreli gelir; çözümü: hex → XOR 0x72 → hex → decodeURIComponent.
- **`eryaz_web`**: İntermobil. `/api/Search/SearchOptimized` yanıtını okur.
- **`eryaz_b2b`** (ASP.NET WebForms). İki adımda çalışır, çünkü sayfa yenilenir:
  - **gonder:** Arama kutusu `#tbGeneralSearch` ya da `#txtGeneralSearch`. Kutuya yazar ve `#btnSearch` tıklar. Sekme Default.aspx'teyse Search.aspx'e geçer.
  - **oku:** `#gvResult` alanını okur. Sütunları başlıklardan eşler. Satır = içinde tek `qty…` kutusu olan en büyük kap.
- **`sadece_b2b`** (SadeceB2B / Yüce Yazılım): kutu `#quick-kelime`, düğme `#urunAra`, sonuç alanı `#aramaekrani`. Sütunları tablo başlıklarından eşler.

### Aramanın bittiğini algılama

Eklenti şu işaretlerden birini görünce aramayı bitmiş sayar:
- Sayfa yenilendi (işaret kayboldu).
- ASP.NET PageRequestManager "endRequest" olayı geldi.
- Sitenin XHR/fetch istekleri bitti.
- Tablo içeriği değişti.

Hiçbiri olmazsa 12 saniye sonra **"yok"** yazar. Kullanıcı isteği: sonuç yoksa "site cevap vermedi" değil, "yok" yazılacak.

### Fiyat kuralları

Sırayla bakılır:
1. Tabloda **Net** fiyat varsa o kullanılır.
2. **"Size Özel Fiyat"** KDV dahil kabul edilir; net = ÷ 1,20.
3. Yalnız **Liste fiyatı** varsa: net = liste × carpan × (1 − iskonto).
   - **Lepar** için carpan 0,665.
   - Lepar doğrulaması: liste 1.292,30 → 859,38 → %5 → **net 816,41** → KDV dahil 979,69. Kullanıcı onayladı.
4. Yalnız **KDV'li fiyat** varsa (Başdaş gibi): net = KDV'li ÷ 1,20 (0.4.3).
5. **"KDV Dahil Kmp. Fiyatı"** kampanya fiyatı olarak ayrı tutulur, normal fiyatla karışmaz (0.4.3).

### Arama ekranındaki yardımcılar

- **İzin bandı / "İzin yok – tıklayın":** Yeni bir siteye erişim izni istemek için.
- **İncele:** Sekmedeki kutu, düğme ve tablo adlarını kopyalanabilir metin olarak verir. Kutulara yazılmış değerleri ve şifreleri okumaz. 0.4.4'ten beri ilk sonuç satırının yazılarını da gösteriyor (`ornekSatir`).
- **Kontrol:** Hangi sitelerin sekmesinin açık olduğunu gösterir.
- **CSV:** Sonuçları dışa aktarır.

---

## 4. Site durumu (son test: SP1174 araması)

| Durum | Siteler |
|---|---|
| ✅ Sonuç verdi | Başbuğ, Dinamik, İntermobil, Lepar, Aşin, Kortaş |
| ✅ Hızlı "yok" (çalışıyor, ürün yok) | Martaş, Rotas, Sayım, Ergin |
| 🔧 Düzeltildi, test bekliyor | **Başdaş** (0.4.3: yalnız KDV'li fiyat sorunu), **Korea** (0.4.4: başlıklar ayrı yerde, "TL" ayrı yazılıyor) |
| ⏳ "yok (30 sn)" gösteriyordu, 0.4.2 bitiş algılaması gerçek sitede denenmedi | Başaran, Askar, Akay, Akkar, Karakaş, NES, Sayılı, Sayıner, Şahinoğlu, Yedekçi, Yeni Alka, Çıtak, Teknopar, Universal |
| 🔑 İzin bekliyor ("İzin yok – tıklayın" ile verilecek) | İlsem, Karpart, Arkaş, Mydpar, Waha, Merkez Oto |
| ❌ İptal (kullanıcı isteği) | Yak, Tok, Arsan. Lisanslı Altay, Taypar, Hamle, Mega-Tek ve Rulman Dünyası (Firefox'ta açık) şimdilik iptal, otomatik açılmayacak |

Notlar:
- **Askar:** Kullanıcı "askar yok orda" dedi. Sayfa düzeni Korea'ya benziyor, 0.4.4 düzeltmesi Askar'da da işe yarayabilir.
- **Akkar:** "No tab with id" hatası düzeltildi (incele artık güncel sekmeyi buluyor). Akkar'ın okunması doğrulanmadı.

---

## 5. Gün içinde yapılan sürümler (özet)

- **0.2.0:** İlk eklenti. Başbuğ grubu, İntermobil, Lepar, Başaran, Askar.
- **0.3.x:** Eryaz B2B için iki adımlı okuma (WebForms'ta sayfa yenilenince betik ölüyordu).
  - Askar'ın `txtGeneralSearch` kutusu ve "Size Özel Fiyat" sütunu eklendi.
  - Sekme Default.aspx'teyse Search.aspx'e geçiş eklendi (Akay, Çıtak).
  - Aynı altyapıdaki 14 site eklendi.
  - Yak ve Tok çıkarıldı.
- **0.4.0:** SadeceB2B okuyucusu ve 9 site. Adresi bilinmeyen siteler sekme başlığından bulunuyor.
- **0.4.1:** İzin hatasına tıklayınca izin isteme. "Only permissions specified in the manifest" hatası için bütün alan adları manifest'e yazıldı.
- **0.4.2:** Sonuç yoksa "yok". PageRequestManager, XHR takibi ve 12 sn sınırı eklendi.
- **0.4.3:** Başdaş: KDV'li fiyattan net hesabı; kampanya sütunu ayrıldı. genel_oku'da "Stok Kodu" sütunu stok sanılıyordu, düzeltildi.
- **0.4.4:** Korea:
  - Başlıklar `lblSearch…Text` etiketlerinden okunuyor.
  - "1.234,56" ile "TL" ayrı yazılmışsa da fiyat okunuyor.
  - İncele'ye örnek satır eklendi.

Testler, sitelerin sayfa yapısını taklit eden yerel test sayfalarıyla (jsdom) yapıldı. Lepar, İlsem, Başdaş ve Korea örneklerinde doğru sonuç alındı.

---

## 6. Güvenlik kuralları (değişmez)

- Claude sitelere şifre girmez ve sohbette paylaşılan şifreleri tekrar yazmaz.
  - Sohbette bir B2B giriş bilgisi paylaşılmıştı. O şifrenin değiştirilmesi önerildi.
- Tarayıcı çerezleri ve oturumları başka programa aktarılmaz.
- Eklenti yalnızca kullanıcının kendi açtığı, girişli sekmeleri kullanır.
- Bilinmeyen exe dosyaları çalıştırılmaz.

## 7. Hesap notu

- Claude hesabı: otosen@otosen.info. Bu proje ve önceki işler bu hesapta.
- B2B siteleri ve eklenti: Chrome'da **csknsnksn@gmail.com** profili. Lisanslar orada.
- Kullanıcı hesap taşımak istemedi (projeler kaybolmasın). Çözüm: siteleri kendi Chrome'unda açar, eklenti oradan okur.

---

## 8. Yarın buradan devam

1. Chrome'da uzantıyı ↻ yenileyin ve kartta **0.4.4** yazdığını kontrol edin.
2. **SP1174** arayın. Korea ve Başdaş sonuç veriyor mu, fiyatlar sitedekiyle tutuyor mu? Ekran görüntüsünü gönderin.
3. Hâlâ "yok" diyen ama üründe olan site varsa, o satırın **İncele** çıktısını gönderin.
4. İzin bekleyen SadeceB2B sitelerine (İlsem, Karpart, Arkaş, Mydpar, Waha, Merkez Oto) tıklayıp izin verin, sonra tekrar arayın.
5. Sıradaki siteler:
   - Vahdet (Eryaz V4)
   - Mest (Desiss)
   - Grup Işık
   - B4B grubu: Aslan Kardeşler, Doğan, Kolaş/GMW, Murat
   - Tekil siteler: ABS, Carpar, DE-GA, Ekici, GloPar, Güneybağlılar, HİS-KA, HYK, İntur, Jetpar, KRAW, Mete, Meydan, Motor Aşin, Orient, Oto Rulman-Ege, FCS, Şahinler, Şenbay…
6. Daha sonra:
   - Firefox'taki lisanslı siteler
   - KURULUM.md'yi 0.4.x'e göre güncellemek
