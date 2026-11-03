# B2B Arama – Durum Notları (25.10.2026)

## Şu anki sürüm (kullanılabilir)
- `b2b_ara.py` → `b2b_ara_yedek_4ba8.py` ile aynı (md5 4ba8bb63…). Altay denemelerinden ÖNCEKİ sürüm.
- `siteler.json` → orijinal hali (md5 ddbe0f15…). Altay, Taypar, Hamle, Mega-Tek, Rulman Dünyası: `ERYAZ_SOAP`, `aktif: false` (otomatik açılmaz, aramaya girmez).
- `arama.html` → 🚀 B2B Kısayolları düğmesi dahil son hali (değişmedi).
- Aktif olarak aranan siteler: Başbuğ, Martaş, Dinamik (giriş sorunu var), Rotas, Sayım Rulman, İntermobil, Vahdet Tiryakioğlu, Mest.

## Lisanslı Eryaz B2B'ler (Altay, Taypar, Hamle, Mega-Tek, Rulman Dünyası) – iptal, ileride tekrar bakılacak
- Web ve SOAP girişi "Lisans Hakkınız Dolmuştur" hatasıyla engelleniyor (donanım parmak izi). Bu yol kapalı.
- Altay Firefox penceresinde UI otomasyonu ile arama çalıştı: parça yazılıyor, sonuç satırları okunuyor (kod, ad, üretici, üretici kodu, brüt fiyat, Kocaeli/Diğer stok).
- Net fiyat (KDV hariç / KDV dahil) satırın fiyat hücresinin üstüne gelince çıkan popup'tan okunuyor. Doğrulandı: MHR-22778 brüt 911,15 → 457,41 / 548,89.
- Sorunlar:
  - Ekranın altında kalan satırlar (görev çubuğu üstü) hover ile okunamıyor; sayfa kaydırma komutu tabloyu hareket ettirmedi.
  - Çalışma süresi site başına çok uzun (2,5–6 dk), çünkü her satır tek tek fareyle kontrol ediliyor.
  - Taypar/Hamle/Mega-Tek/Rulman sekmeleri Chrome penceresinde açık; sekme seçimi yapıldı ama tablo ekran dışında kaldı ve ilk satırlar Altay ile aynı göründü (sayfa doğru mu, doğrulanmadı).
- Kaynak (Ctrl+U) yöntemi denendi: veri ilk HTML'de yok, bu yol kapalı.
- Olası diğer yol (ileride): Firefox geliştirici araçları → Ağ sekmesinde `SearchProduct` yanıtını kopyalamak (manuel). Ya da sunucu tarafında yeni bir oturum açmak (lisans kontrolü nedeniyle kolay değil).

## Hazır ama programa bağlı DEĞİL
- `eryaz_ui.py` (UI otomasyon yardımcısı) klasörde duruyor. Ana program bunu çağırmıyor; siteler.json'da ERYAZ_UI tipi yok.
- `UI_Test.bat`, `UI_Fiyat.bat`, `UI_Kaynak.bat`, `ui_test.py`, `ui_fiyat_test.py`, `ui_kaynak.py`: deneme dosyaları. Silinebilir.
- `b2b_ara_yedek_4ba8.py`: son güvenli yedek (kullanılan dosyayla aynı).

## Sonraki adımlar (kaldığımız yer)
1. Diğer B2B'lere bakmak: Grup Işık (yeni arayüz), Aslan Kardeşler / Doğan / Kolaş / Murat (eski B4B, kullanıcı adı alanları farklı), WebForms A/B grupları.
2. Lisanslı 5 B2B için: ya Firefox ağ yanıtından veri alma, ya da yalnızca brüt fiyat + stok ile UI yöntemi (net fiyat yok). Karar kullanıcıda.
3. Dinamik'in giriş sorunu (şifre/uyarı) incelenecek.
4. Programa tekrar eklenecek her şey önce ayrı bir dosyada denenip, sonra `b2b_ara.py`'ye alınacak. Her değişiklikte önce yedek alınacak.

## Teknik notlar
- Dosya yazımında OneDrive bazen yazmayı geri alıyor: device_commit_files'ı `force: true` ile çalıştırıp md5 ile doğrulamak gerekiyor.
- Açılış kısayolları (`*.appref-ms`, `*.lnk`, `*.url`) program klasörünün üst klasöründe aranıyor; 🚀 düğmesi ile açılıyor.
- Log'lar: `log\arama_YYYY-MM-DD.txt`, `log\hata_YYYY-MM-DD.txt`.
