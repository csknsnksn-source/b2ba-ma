# Arama kayıtları

Her kayıt: tarih · aranan parça · firma · sitede görülen değer · eklentide görülen değer · sonuç · onay.
Yeni kayıt en üste eklenir.

---

## 25.11.2026

**2091042 · Başaran (stok noktaları)**
- Site: 5 satır, fiyatlar değişmedi (HMC-20910-42D00-WME net 5.316,54 / KDV dahil 6.379,85). Stok MERKEZ ve DEPO sütunlarında renkli noktalar (`images/status/green.png` = Var; diğerleri kırmızı = Yok).
- Eklenti önce: stok "?", Foto sütununda kırmızı top.
- Düzeltme: MERKEZ/DEPO durum resimlerinden okunuyor, foto stok noktası sayılmıyor (`okuyucular/basaran.js`, `// OZEL`).
- Onay: **Kullanıcı onayladı** ("BAŞARAN TAMAM", 25.11). Alım geçmişi ayrı bekliyor.

**SA072 · Başdaş**
- Site (kendi ekranı, `search.aspx?q=SA072`): 58305-44A40/J (Dyb. yeşil, İst. yeşil, İzm. kırmızı, KDV dahil 844,63 TL) · MB903639 TERMİK KONTAK (üç nokta yeşil, KDV dahil 314,72 TL)
- Eklenti önce: stok "?" ve foto olarak yeşil top (stok noktası resimleri yanlış okunuyordu)
- Düzeltme: stok noktaları `status` resminin dosya adından okunuyor (`okuyucular/basdas.js`)
- Eklenti sonra: kullanıcı testi yaptı, "OK DOĞRU"
- Onay: **Kullanıcı onayladı** (25.11)

**sp1074 · GloPar**
- Site (fare üstü pencere): Liste $7,84 · Fiyat ₺396,93 · Net ₺396,93 · Net Fiyat Kdv Dahil ₺476,31 (kur USD 50,6286)
- Eklenti önce: "yok" (dolar fiyatı atlanıp popup'a bağlıydı, popup yoktu)
- Düzeltme: dolar fiyatı sayfa kuruyla TL'ye çevrilir (`dovizKur`)
- Eklenti sonra: kullanıcı "evet oldu" dedi (test sürümü)
- Onay: **Kullanıcı onayladı**

## 01.11.2026

**264102f · Korea**
- Site (pencere): Liste (KDV hariç) 1.515,50 · KDV'siz Net 811,55 · KDV'li Net 973,86
- Eklenti önce: net 1.262,92 / KDV 1.515,50 (yanlış, Size Özel Fiyat KDV dahil sanıldı)
- Düzeltme: pencere okuma (`popupNetler`), hücre `div.Cell` olarak aranıyor
- Eklenti sonra: net 811,55 / KDV 973,86 ✔
- Onay: **Kullanıcı onayladı**

**2461022600 · Kortaş (FYC)**
- Site (detay): Fiyat 263,66 · İsk. %30+10 · Net 166,11 · KDV'li 199,33
- Eklenti önce: net 219,72 / KDV 263,66 (yanlış)
- Düzeltme: `ozelKdvHaric` + ardışık iskonto çarpımı (0,70 × 0,90)
- Eklenti sonra: net 166,11 / KDV 199,33 ✔
- Onay: **Kullanıcı onayladı**

**2461022600 · Yeni Alka**
- Site: "KDV'li Net" 318,24 (ve 244,80, 128,52)
- Eklenti önce: bu değerleri net sanıyor, KDV dahil 381,89 (yanlış)
- Düzeltme: `tekFiyatKdvli` (fiyat KDV'li kabul edilir)
- Beklenen: net 265,20 / KDV 318,24 · net 204,00 / KDV 244,80 · net 107,10 / KDV 128,52
- Onay: **Kullanıcı onayladı** ("düzeldi ok")

**2461022600 · NES**
- Site (tablo): KDV Hariç Liste 327,04 · KDV'li Net 392,45
- Site (pencere, fiyatın üstünde): Anında Havale ve Özel satırları: KDV hariç 264,90 · KDV dahil 317,88
- Kullanıcı beklenen: KDV dahil 317,88 (net 264,90)
- Eklenti: pencere okunamadı, tablo değeri gösteriliyor (327,04 / 392,45) ✘
- Düzeltme: `popupKdvDahil`, hücre `div` olarak aranıyor, tetik `.tooltipstered`
- Onay: **BEKLİYOR** (düzeltmeden sonra test edilmedi)

**2461022600 · Akkar**
- Eklenti önce: sonuç hiç gelmiyordu ("Yok")
- Düzeltme: başlık "Stok Kodu" tanınıyor
- Eklenti sonra: 20910 42A00 K · net 1.219,76 · KDV 1.463,71 ✔
- Onay: **Kullanıcı onayladı**

**2461022600 · Aşin**
- Eklenti önce: fiyat doğru (22311-48000 · 4.641,00 liste · 3.712,80 net · 4.455,36 KDV'li)
- Alım geçmişi: Stok Hareketleri sekmesi tıklamayla yükleniyor, eklenti göremiyor
- Onay: fiyat **onaylandı**, alım geçmişi **BEKLİYOR** (sonra)

**MR594202 · Aşin / Başdaş**
- Site Aşin: sonuç yok (arama boş döndü)
- Site Başdaş: JPI-500369 (takoz) çıkıyor
- Eklenti sorunu: Başdaş için arama düğmesi tıklanmıyordu (`cfg` tanımsız), düzeltildi. Eski Aşin satırı (22311-48000) yanlışlıkla göründü, filtrelendi
- Onay: Başdaş arama **düzeltildi**, Aşin sonuç yok doğru

---

## Önceki günlerden (özet, ayrıntısı sohbette)

- **2461022600 / 2091042 / 791201J500 / 2510003010 / 263604A900 / 251004A855 / 2461022600 vb.** üzerinden: Karpart, Mydpar, Teknopar, Arkaş, Waha, İlkem, Kuzey Oto, Universal, Lepar, Başaran için fiyat ve alım geçmişi kontrolleri. Ayrıntıları `KONTROL_TABLOSU.md` içinde durum olarak.
- **Karpart 791201J500:** alım geçmişi 19.10.2026, 2 satır, onaylandı.
- **Mydpar 791201J500:** fiyat 377,83 / net 314,86, alım geçmişi onaylandı.
- **Teknopar 285134A001:** alım ALP2026000023614 (402,77), onaylandı.
- **Waha 2461022600:** 6 adet, 420,00, 07.09.2026, onaylandı.
- **İlkem 2461022600:** fiyat ve alım geçmişi onaylandı.
- **Kuzey Oto 263604A900:** KIA-03-00215 satırı, 7 adet 441,58, onaylandı.
