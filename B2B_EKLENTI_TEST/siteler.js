// B2B siteleri. "kisayol": PROGRAM OLANLAR klasorundeki kisayol dosyasinin adi (uzantisiz) - kapali siteyi acmak icin.
// "desen": sekmeyi bulmak icin adres deseni. "okuyucu": okuyucular.js'teki fonksiyon.
// Yeni site eklerken manifest.json icindeki host_permissions listesine de adresini ekleyin.
const SITELER = [
  { ad: "Başbuğ",       kisayol: "BASBUG OTOMOTIV (coşkun)", desen: "https://b2bbasbug.com/*",          okuyucu: "basbug", tur: "a_grup",     acilis: "https://b2bbasbug.com/web/b2b/search" },
  { ad: "Martaş",       kisayol: "Martaş Otomotiv (coşkun)", desen: "https://online.martas.com.tr/*",   okuyucu: "martas", tur: "a_grup",     acilis: "https://online.martas.com.tr/web/b2b/search" },
  { ad: "Dinamik",      kisayol: "Dinamik Otomotiv (coşkun)", desen: "https://bayi.adaoto.com.tr/*",     okuyucu: "dinamik", tur: "a_grup",     acilis: "https://bayi.adaoto.com.tr/web/b2b/search" },
  { ad: "Rotas",        kisayol: "Rotas Otomotiv (coşkun)", desen: "https://b2b.rotas.com.tr/*",       okuyucu: "rotas", tur: "a_grup",     acilis: "https://b2b.rotas.com.tr/web/b2b/search" },
  { ad: "Sayım Rulman", kisayol: "Sayim Rulman (coşkun)", desen: "https://bayi.sayimrulman.com/*",   okuyucu: "sayim_rulman", tur: "a_grup",     acilis: "https://bayi.sayimrulman.com/web/b2b/search" },
  { ad: "İntermobil",   kisayol: "ioto B4B - İntermobil (coşkun)", desen: "https://b4b.intermobil.com.tr/*",  okuyucu: "intermobil", tur: "eryaz_web",  acilis: "https://b4b.intermobil.com.tr/tr/search" },
  // Eryaz B2B (WebForms). "ayar.carpan": tabloda net fiyat yoksa liste fiyatina uygulanan cari iskonto carpani
  { ad: "Lepar",        kisayol: "Lepar Otomotiv", desen: "*://web.lepar.com.tr/*",           okuyucu: "lepar", tur: "eryaz_json", acilis: "https://web.lepar.com.tr/search.aspx", ayar: { kdv: 20 } },
  { ad: "Başaran",      kisayol: "Başaran Otomotiv", desen: "*://b2b.basaran-otomotiv.com.tr/*", okuyucu: "basaran", tur: "eryaz_b2b", acilis: "https://b2b.basaran-otomotiv.com.tr/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Askar",        kisayol: "Askar Otomotiv 01.16.0051", desen: "*://b2b.askarauto.com/*",          okuyucu: "askar", tur: "eryaz_b2b",  acilis: "http://b2b.askarauto.com/Default.aspx", ayar: { kdv: 20, popupFiyat: true } },
  // Ayni altyapi (Eryaz B2B) - 0.3.0 ile eklendi, sitede ilk aramada dogrulanacak
  { ad: "Akay", kisayol: "AkayOto", desen: "*://b2b.akayoto.com.tr/*", okuyucu: "akay", tur: "eryaz_b2b", acilis: "https://b2b.akayoto.com.tr/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Akkar", kisayol: "Akkar Motor LTD. ŞTİ.", desen: "*://b2b.akkarmotor.com/*", okuyucu: "akkar", tur: "eryaz_b2b", acilis: "https://b2b.akkarmotor.com/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Aşin", kisayol: "Aşin Otomotiv", desen: "*://b2b.asinotomotiv.com/*", okuyucu: "asin", tur: "eryaz_b2b", acilis: "https://b2b.asinotomotiv.com/Default.aspx", ayar: { kdv: 20, asinGecmis: true } },
  { ad: "Başdaş", kisayol: "Başdaş Dış Ticaret", desen: "*://b2b.basdasotomotiv.com/*", okuyucu: "basdas", tur: "eryaz_b2b",acilis: "https://b2b.basdasotomotiv.com/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Kortaş", kisayol: "KORTAS OTOMOTİV", desen: "*://b2b.kortasotomotiv.com/*", okuyucu: "kortas", tur: "eryaz_b2b", acilis: "https://b2b.kortasotomotiv.com/Default.aspx", ayar: { kdv: 20, ozelKdvHaric: true } },
  { ad: "Karakaş", kisayol: "Karakaş Otomotiv", desen: "*://b2b.karakasoto.com/*", okuyucu: "karakas", tur: "eryaz_b2b", acilis: "https://b2b.karakasoto.com/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Korea", kisayol: "Korea Otomotiv", desen: "*://b2b.koreaotomotiv.com/*", okuyucu: "korea", tur: "eryaz_b2b", acilis: "https://b2b.koreaotomotiv.com/Default.aspx", ayar: { kdv: 20, popupNetler: true } },
  { ad: "NES", kisayol: "NES Oto Parçaları", desen: "*://b2b.nesotoparcalari.com/*", okuyucu: "nes", tur: "eryaz_b2b", acilis: "https://b2b.nesotoparcalari.com/Default.aspx", ayar: { kdv: 20, popupKdvDahil: true } },
  { ad: "Sayılı", kisayol: "SAYILI OTOMOTİV", desen: "*://b2b.sayiliotomotiv.com/*", okuyucu: "sayili", tur: "eryaz_b2b", acilis: "https://b2b.sayiliotomotiv.com/Default.aspx", ayar: { kdv: 20, popupSayili: true } },
  { ad: "Sayıner", kisayol: "SAYINER", desen: "*://b2b.sayiner.com.tr/*", okuyucu: "sayiner", tur: "eryaz_b2b", acilis: "https://b2b.sayiner.com.tr/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Şahinoğlu", kisayol: "Sahinoglu Motor LTD. ŞTİ.", desen: "*://b2b.sahinogluotomotiv.net/*", okuyucu: "sahinoglu", tur: "eryaz_b2b", acilis: "https://b2b.sahinogluotomotiv.net/Default.aspx", ayar: { kdv: 20, tekFiyatKdvli: true, kdvliAlan: true } },
  { ad: "Yedekçi", kisayol: "YEDEKCİ OTOMOTİV", desen: "*://b2b.yedekciotomotiv.com/*", okuyucu: "yedekci", tur: "eryaz_b2b", acilis: "https://b2b.yedekciotomotiv.com/Default.aspx", ayar: { kdv: 20 } },
  { ad: "Yeni Alka", kisayol: "Yeni Alka Otomotiv", desen: "*://b2b.yenialkaotomotiv.com/*", okuyucu: "yeni_alka", tur: "eryaz_b2b", acilis: "https://b2b.yenialkaotomotiv.com/Default.aspx", ayar: { kdv: 20, tekFiyatKdvli: true } },
  { ad: "Çıtak", kisayol: "Çıtak Yedek Parça Ltd.", desen: "*://b2b.citak.com.tr/*", okuyucu: "citak", tur: "eryaz_b2b", acilis: "https://b2b.citak.com.tr/Default.aspx", ayar: { kdv: 20, ozelKdvHaric: true } },
  // SadeceB2B / Yuce Yazilim. Adresi bilinmeyenlerde sekme "baslik"tan bulunur (ilk kullanimda "Izin ver" gerekir)
  { ad: "İlsem",      kisayol: "İLSEM OTOMOTİV", baslik: "İlsem Otomotiv",         okuyucu: "ilsem", tur: "sadece_b2b", ayar: { kdv: 20 } },
  { ad: "Ergin",      kisayol: "Ergin Otomotiv Yeni", desen: "*://b2b.erginotomotiv.com/*",     okuyucu: "ergin", tur: "sadece_b2b", acilis: "https://b2b.erginotomotiv.com", ayar: { kdv: 20 } },
  { ad: "Teknopar",   kisayol: "Teknopar Otomotiv", desen: "*://b2b.teknoparotomotiv.com/*",  okuyucu: "teknopar", tur: "sadece_b2b", acilis: "https://b2b.teknoparotomotiv.com", ayar: { kdv: 20, havaleKdvli: true, mydparGecmis: true } },
  { ad: "Universal",  kisayol: "Universal Otomotiv", desen: "*://bayi.universaloto.com/*",     okuyucu: "universal", tur: "sadece_b2b", acilis: "https://bayi.universaloto.com", ayar: { kdv: 20, popup: true } },
  { ad: "Karpart",    kisayol: "KARPART OTOMOTİV", baslik: "Karpart Otomotiv",       okuyucu: "karpart", tur: "sadece_b2b", ayar: { kdv: 20, klikPopup: true } },
  { ad: "Arkaş",      kisayol: "ARKAŞ OTOMOTİV", baslik: "ARKAS OTOMOTİV",         okuyucu: "arkas", tur: "sadece_b2b", ayar: { kdv: 20, mydparGecmis: true, kdvliAlan: true } },
  { ad: "Mydpar",     kisayol: "Mydpar OTOMOTİV", baslik: "Mydpar OTOMOTİV",        okuyucu: "mydpar", tur: "sadece_b2b", ayar: { kdv: 20, netKdvli: true, mydparGecmis: true } },
  { ad: "Waha",       kisayol: "WAHA OTOMOTİV", baslik: "Waha Otomotiv",          okuyucu: "waha", tur: "sadece_b2b", ayar: { kdv: 20, mydparGecmis: true } },
  { ad: "Merkez Oto", kisayol: "Merkez Oto Yedek Parça (coşkun)", baslik: "Merkez Oto Yedek Parça", okuyucu: "merkez_oto", tur: "sadece_b2b", ayar: { kdv: 20 } },
  // Eryaz V4 (lisanslilar masaustu kisayoluyla acilir). Cevaplari v4_kanca.js yakalar.
  { ad: "Altay",  kisayol: "Altay Otomotiv A.Ş.", desen: "*://b4b.altayoto.com/*",     okuyucu: "altay", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Taypar", kisayol: "Taypar A.Ş.",         desen: "*://b4b.taypar.com/*",       okuyucu: "taypar", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Hamle",  kisayol: "Hamle Otomotiv",      desen: "*://b4b.hamlesiparis.com/*", okuyucu: "hamle", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Vahdet", kisayol: "vahdettiryakioglu.com.tr", desen: "*://b4b.vahdettiryakioglu.com.tr/*", okuyucu: "vahdet", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Rulman Dünyası", kisayol: "Rulman Dünyası", desen: "*://b4b.rulman.com.tr/*", okuyucu: "rulman_dunyasi", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Mega-Tek",  kisayol: "MEGA-TEK Otomotiv Makina Yedek Parça Ltd.Şti.", desen: "*://b4b.megatekotomotiv.com/*", okuyucu: "mega_tek", tur: "megatek", ayar: { kdv: 20 } },
  // Eryaz B4B (Aslan Kardesler, Dogan, GMW, Murat, Grup Isik): giris adresleri V4 ile ayni yapida - ilk aramada dogrulanacak
  { ad: "Aslan Kardeşler", kisayol: "ASLAN KARDEŞLER ONLINE - 1", desen: "*://b4b.askotomotiv.com/*", okuyucu: "aslan_kardesler", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Doğan",     kisayol: "Doğan Otomotiv B4B", desen: "*://b4b.doganotomotiv.com.tr/*", okuyucu: "dogan", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "GMW",       kisayol: "GMW",                desen: "*://b4b.gmw.net/*",               okuyucu: "gmw", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Murat",     kisayol: "MURAT OTOMOTİV",     desen: "*://b4b.muratotomotiv.com.tr/*",  okuyucu: "murat", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Grup Işık", kisayol: "Grup Işık",          desen: "*://b4b.grupisik.com.tr/*",       okuyucu: "grup_isik", tur: "eryaz_v4", ayar: { kdv: 20 } },
  // Desiss bayi paneli
  { ad: "Mest", kisayol: "Mest Otomotiv Bayi Paneli", desen: "*://siparis.mestoto.com.tr/*", okuyucu: "mest", tur: "desiss", ayar: { kdv: 20 } },
  // 26.10 eklenenler - Eryaz B2B (WebForms)
  { ad: "Balkan Radyatör", kisayol: "BALKAN RADYATÖR B2B (coşkun)", desen: "*://b2b.balkanotoradyator.com/*", okuyucu: "balkan_radyator", tur: "eryaz_b2b", acilis: "https://b2b.balkanotoradyator.com/Search.aspx", ayar: { kdv: 20, tekFiyatKdvli: true, kdvliAlan: true } },
  { ad: "Mete",            kisayol: "METE OTOMOTİV B2B (coşkun)",   desen: "*://b2b.meteoto.com/*",          okuyucu: "mete", tur: "eryaz_b2b", acilis: "https://b2b.meteoto.com/Default.aspx", ayar: { kdv: 20 } },
  // 26.10 eklenenler - altyapisi incele ciktisindan sonra belirlenecek
  { ad: "FCS",           kisayol: "siparis.fcs.com.tr Home (coşkun)",  desen: "*://siparis.fcs.com.tr/*",       okuyucu: "fcs", tur: "eryaz_v4", ayar: { kdv: 20 } },
  { ad: "Güneybağlılar", kisayol: "Güneybağlılar (coşkun)",            desen: "*://b2b.guneybaglilar.com/*",    okuyucu: "guneybaglilar", tur: "guneybaglilar", ayar: { kdv: 20 } },
  { ad: "DE-GA",         kisayol: "DE-GA B4B (coşkun)",                desen: "*://b4b.de-ga.com.tr/*",         okuyucu: "de_ga", tur: "dega", ayar: { kdv: 20 } },
  { ad: "Şenbay",        kisayol: "Şenbay Otomotiv- Ege B2B (coşkun)", desen: "*://b2b.senbayankara.com.tr/*",  okuyucu: "senbay", tur: "senbay", ayar: { kdv: 20 } },
  { ad: "GloPar",        kisayol: "GloPar-B2B (coşkun)",               desen: "*://b2b.glopar.com.tr/*",        okuyucu: "glopar", tur: "glopar", ayar: { kdv: 20, dovizKur: true } },
  { ad: "KRAW",          kisayol: "KRAW  \u00a0B2B (coşkun)",               desen: "*://b2b.kraw.com.tr/*",          okuyucu: "kraw", tur: "kraw", ayar: { kdv: 20, marka: "KRAW" } },
  { ad: "Bursa Nisa",    kisayol: "BURSA NİSA OTOMOTİV SAN.TİC.LTD.ŞTİ - Otomasyon", desen: "*://www.nisaotobursa.com/*", okuyucu: "bursa_nisa", tur: "bursa_nisa", ayar: { kdv: 20 } },
  // SadeceB2B masaustu kurulumu (C:\SadeceB2b) - Chrome'da aciliyorsa basliktan bulunur
  { ad: "İlkem",         kisayol: "İlkem Otomotiv B2b", baslik: "İlkem", okuyucu: "ilkem", tur: "sadece_b2b", ayar: { kdv: 20, ilkemHeader: true, mydparGecmis: true } },
  { ad: "Kuzey Oto",     kisayol: "Kuzey Oto B2b",      baslik: "Kuzey", okuyucu: "kuzey_oto", tur: "sadece_b2b", ayar: { kdv: 20, mydparGecmis: true } },
  // 26.10 - 16 yeni siteden web olanlar; okuyucu incele ciktisindan sonra yazilacak
  { ad: "ABS", kisayol: "ABS OTOMOTİV - VS B2B (coşkun)", desen: "*://b2b.absotomotiv.com/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "Carpar", kisayol: "CARPAR B2B Sistemine Hoş Geldiniz (coşkun)", desen: "*://b2b.carpar.com.tr/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "Ekici", kisayol: "EKİCİ OTOMOTİV - Otomotiv Yedek Parça (coşkun)", desen: "*://*.ekiciotomotiv.net/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "HİS-KA", kisayol: "HİS-KA OTOMOTİV (coşkun)", desen: "*://b2b.hiskaotomotiv.com/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "HYK", kisayol: "HYK Automotive   Otomobil Yedek Parçaları (coşkun)", desen: "*://*.hyk.com.tr/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "İntur", kisayol: "İNTUR OTOMOTİV VE TAŞIMACILIK SAN. VE TİC. LTD. ŞTİ (coşkun)", desen: "*://b2b.inturotomotiv.com.tr/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "Motor Aşin", kisayol: "Motor Aşin B2B (coşkun)", desen: "*://b2b.motorasin.com/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "Orient", kisayol: "Orient Ekspres Ltd. Şti. (coşkun)", desen: "*://*.b-orient.com/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
  { ad: "Şahinler", kisayol: "Şahinler   Şahinler Motorlu Araçlar San.ve Tic. A.Ş (coşkun)", desen: "*://*.sahinlerparca.com/*", okuyucu: "hazirlaniyor", ayar: { kdv: 20 } },
];
