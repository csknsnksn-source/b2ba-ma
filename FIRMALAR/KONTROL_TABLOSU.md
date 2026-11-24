# Firma kontrol tablosu

Her firma için: fiyat ve alım geçmişinin kontrol edilip onaylanıp onaylanmadığı.
Durum anahtarı: **ONAYLANDI** (test edildi, doğru) · **DÜZELTİLDİ** (kod değişti, onay bekliyor) · **BEKLİYOR** (test edilmedi / sorun açık) · **YOK** (okuyucu yok)
Arama kayıtları: `ARAMA_KAYITLARI.md`

| Firma | Fiyat | Alım geçmişi | Ayar (siteler.js) | Not |
|---|---|---|---|---|
| Korea | ONAYLANDI (01.11) | BEKLİYOR | popupNetler | Pencere okuması, hücre div. Bkz. ARAMA_KAYITLARI |
| NES | ONAYLANDI (02.11) | BEKLİYOR | popupKdvDahil | Pencere okuması (Anında Havale / Özel), KDV dahil 317,88 / net 264,90 |
| Kortaş | ONAYLANDI (01.11) | BEKLİYOR | ozelKdvHaric | Ardışık iskonto %30+10 |
| Yeni Alka | ONAYLANDI (01.11) | BEKLİYOR | tekFiyatKdvli | Tek fiyat KDV'li |
| Akkar | ONAYLANDI | BEKLİYOR | — | Başlık "Stok Kodu" düzeltildi |
| Aşin | ONAYLANDI | BEKLİYOR | asinGecmis | Alım: Stok Hareketleri tıklamayla yükleniyor, Id bağlantısı yok |
| Başdaş | ONAYLANDI | BEKLİYOR | — | Arama (cfg) düzeltildi, fiyat onaylandı. Eski sonuç filtresi var |
| Balkan Radyatör | ONAYLANDI (01.11) | BEKLİYOR | tekFiyatKdvli, kdvliAlan | "KDV'li Net" sütunu doğrudan KDV dahil |
| Karpart | ONAYLANDI | ONAYLANDI | klikPopup | Fiyat ve alım tıklamayla |
| Mydpar | ONAYLANDI | ONAYLANDI | netKdvli, mydparGecmis | |
| Teknopar | ONAYLANDI | ONAYLANDI | havaleKdvli, mydparGecmis | Havale fiyatı |
| Arkaş | ONAYLANDI (02.11) | BEKLİYOR | mydparGecmis, kdvliAlan | Fiyat: "Net Fiyat KDV'li" KDV dahil. Alım geçmişi onayı için tekrar kontrol |
| Waha | ONAYLANDI | ONAYLANDI | mydparGecmis | |
| İlkem | ONAYLANDI | ONAYLANDI | ilkemHeader, mydparGecmis | Oem=kod, Menşei=marka |
| Kuzey Oto | ONAYLANDI | ONAYLANDI | mydparGecmis | Kod bağlantısına tıklayarak |
| Universal | ONAYLANDI (02.11) | BEKLİYOR | popup | Arama ve fiyat (popup'tan) onaylandı |
| Lepar | ONAYLANDI | BEKLİYOR | — | Fiyat kullanıcı onayladı |
| Başaran | ONAYLANDI | BEKLİYOR | — | Arama ve fiyat onaylandı (Ara düğmesi düzeltmesi) |
| Mest | BEKLİYOR | BEKLİYOR | — | 19893 için "gene yanlış" bildirildi, çözülmedi |
| Vahdet | ONAYLANDI (02.11) | BEKLİYOR | eryaz_v4 | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Başbuğ | ONAYLANDI (02.11) | BEKLİYOR | a_grup | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Dinamik | ONAYLANDI (02.11) | BEKLİYOR | a_grup | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Martaş | ONAYLANDI (02.11) | BEKLİYOR | a_grup | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Sayım Rulman | ONAYLANDI (02.11) | BEKLİYOR | a_grup | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Rotas | BEKLİYOR | BEKLİYOR | — | Eski siteler, son sürümle kontrol edilecek |
| Akay | BEKLİYOR | BEKLİYOR | — | Sonra |
| Karakaş | BEKLİYOR | BEKLİYOR | — | Sonuç gelmiyor olabilir |
| Şahinoğlu | ONAYLANDI (02.11) | BEKLİYOR | tekFiyatKdvli, kdvliAlan | "KDV'li Net" KDV dahil; alım geçmişi sonra |
| Sayılı | ONAYLANDI (02.11) | BEKLİYOR | popupSayili | Havale ana fiyat, kampanya KDV dahil 432,45 |
| Sayıner, Yedekçi | BEKLİYOR | BEKLİYOR | — | |
| Askar | ONAYLANDI (02.11) | BEKLİYOR | popupFiyat | Fiyat ve vadeli kampanya onaylandı |
| Çıtak | ONAYLANDI (02.11) | BEKLİYOR | ozelKdvHaric | "Size Özel Fiyat" KDV hariç, "%20+5" ardışık iskonto |
| Mete | BEKLİYOR | BEKLİYOR | — | |
| Başaran, Başdaş dışındaki eryaz B2B'ler (Aşin hariç) | — | — | — | Yukarıda |
| Altay | ONAYLANDI (02.11) | ONAYLANDI | eryaz_v4 | Arama, fiyat, alım geçmişi onaylandı |
| Hamle | ONAYLANDI (02.11) | ONAYLANDI | eryaz_v4 | Arama, fiyat, alım geçmişi onaylandı |
| Aslan Kardeşler | ONAYLANDI (02.11) | ONAYLANDI | eryaz_v4 | Arama, fiyat, alım geçmişi onaylandı |
| Grup Işık | ONAYLANDI (02.11) | BEKLİYOR | eryaz_v4 | Arama ve fiyat onaylandı; alım geçmişi sonra |
| FCS | ONAYLANDI (02.11) | BEKLİYOR | eryaz_v4 | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Taypar | ONAYLANDI (02.11) | BEKLİYOR | eryaz_v4 | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Rulman Dünyası | ONAYLANDI (02.11) | BEKLİYOR | eryaz_v4 | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Doğan, GMW, Murat | BEKLİYOR | BEKLİYOR | — | Masaüstü programı tipi, denenmedi |
| Mega-Tek | BEKLİYOR (en sona) | BEKLİYOR | megatek | SearchProduct isteği 500 hatası veriyor. Eklentinin gövdesi ile sitenin gövdesi karşılaştırılacak. TL fiyat pencerede (Vadeli) |
| İntermobil | ONAYLANDI (02.11) | BEKLİYOR | eryaz_web | Arama ve fiyat onaylandı. Sekme ana sayfadaysa eklenti arama sayfasına geçiyor |
| İlsem | ONAYLANDI (02.11) | BEKLİYOR | sadece_b2b | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Merkez Oto | ONAYLANDI (02.11) | BEKLİYOR | sadece_b2b | Arama ve fiyat onaylandı; alım geçmişi sonra |
| Ergin | BEKLİYOR | BEKLİYOR | — | Denenmedi |
| Şenbay | BEKLİYOR | BEKLİYOR | senbay | Satırı eksikti, eklendi. Test edilmedi |
| Bursa Nisa, DE-GA, GloPar, Güneybağlılar, KRAW | BEKLİYOR | BEKLİYOR | bursa_nisa, dega, glopar, guneybaglilar, kraw | Satırı eksikti, eklendi. Test edilmedi |
| ABS, Carpar, Ekici, HİS-KA, HYK, İntur, Motor Aşin, Orient, Şahinler | YOK | YOK | — | Okuyucu yazılmadı |
| Akbilya, Arena, Bayar vb. (16 kısayol) | — | — | — | Eklentide site yok, kısayol klasörde duruyor |
