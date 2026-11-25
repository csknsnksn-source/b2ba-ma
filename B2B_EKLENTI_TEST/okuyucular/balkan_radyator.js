// Balkan Radyatör arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: eryaz_b2b
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_balkan_radyator_gonder(parca, cfg) {
  cfg = cfg || {};
  // adresleAra (Basdas): her aramada sonuc sayfasi yeniden yuklenir; eski tablo okunmaz.
  // Basdas adres cubugundaki q= parametresini dusurdugu icin q'ya bakilmaz. Bunun yerine
  // sessionStorage'daki yonlendirme bayragi kullanilir: bayrak bu parca icin tazeyse ve bu sayfa
  // bayraktan SONRA yuklendiyse (performance.timeOrigin) tekrar yonlendirme yapilmaz -> dongu olmaz.
  if (cfg.adresleAra) {
    let bayrak = null;
    try { bayrak = JSON.parse(sessionStorage.getItem("b2bAdresAra") || "null"); } catch (e) { bayrak = null; }
    const taze = !!bayrak && bayrak.parca === parca && Date.now() - bayrak.zaman < 60000;
    const yeniSayfa = taze && performance.timeOrigin > bayrak.zaman;
    if (!(/search\.aspx/i.test(location.pathname) && yeniSayfa)) {
      try { sessionStorage.setItem("b2bAdresAra", JSON.stringify({ parca: parca, zaman: Date.now() })); } catch (e) { }
      setTimeout(() => { location.href = location.origin + "/search.aspx?q=" + encodeURIComponent(parca); }, 30);
      return { yonlendi: true };
    }
  }
  // Asin: ana sayfadaki arama calismiyor; arama sayfasini parcayla (?q=) acmak sonucu getiriyor
  if (/asinotomotiv/i.test(location.hostname) && !/search\.aspx/i.test(location.pathname)) {
    setTimeout(() => { location.href = location.origin + "/search.aspx?q=" + encodeURIComponent(parca); }, 30);
    return { yonlendi: true };
  }
  const kutu = document.getElementById("tbGeneralSearch") || document.getElementById("txtGeneralSearch")
    || document.querySelector('input[type="text"][id*="GeneralSearch" i], input[type="text"][id*="Search" i], input[type="search"], input[type="text"][id*="Ara" i]');
  if (!kutu) {
    const giris = document.querySelector('input[type="password"]');
    if (giris) return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
    // Ana sayfadaysa (Default.aspx vb.) arama sayfasina gec; eklenti yuklenince tekrar dener
    if (!/search\.aspx/i.test(location.pathname)) {
      setTimeout(() => { location.href = location.origin + "/Search.aspx"; }, 30);
      return { yonlendi: true };
    }
    return { hata: "GIRIS", mesaj: "Arama kutusu bulunamadı" };
  }
  const t = document.getElementById("gvResult");
  const eski = t ? (t.innerText || t.textContent || "").slice(0, 800) : "";
  window.__b2bIsaret = Date.now();      // sayfa bastan yuklenirse bu isaret kaybolur
  // ASP.NET UpdatePanel ile (sayfa yenilenmeden) gelen sonuclarda: istek bitince isaretle
  // Sitenin arka plan isteklerini izle: tiklamadan sonra baslayan istekler bitince "bitti" de
  window.__b2bBitti = false;
  (function () {
    const say = { bas: 0, bit: 0 };
    window.__b2bSay = say;
    const kontrol = () => { if (say.bas > 0 && say.bit >= say.bas) setTimeout(() => { if (say.bit >= say.bas) window.__b2bBitti = true; }, 400); };
    if (!window.__b2bIzleniyor) {
      window.__b2bIzleniyor = true;
      const oGonder = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function () {
        const s = window.__b2bSay;
        if (s) { s.bas++; this.addEventListener("loadend", () => { s.bit++; if (window.__b2bSayKontrol) window.__b2bSayKontrol(); }); }
        return oGonder.apply(this, arguments);
      };
      const oFetch = window.fetch;
      window.fetch = function () {
        const s = window.__b2bSay;
        if (s) s.bas++;
        return oFetch.apply(this, arguments).finally(() => { if (s) { s.bit++; if (window.__b2bSayKontrol) window.__b2bSayKontrol(); } });
      };
    }
    window.__b2bSayKontrol = kontrol;
  })();
  try {
    const prm = window.Sys && Sys.WebForms && Sys.WebForms.PageRequestManager && Sys.WebForms.PageRequestManager.getInstance();
    if (prm) { const h = () => { window.__b2bBitti = true; try { prm.remove_endRequest(h); } catch (e) {} }; prm.add_endRequest(h); }
  } catch (e) {}
  const yaz = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  yaz.call(kutu, parca);
  kutu.dispatchEvent(new Event("input", { bubbles: true }));
  kutu.dispatchEvent(new Event("change", { bubbles: true }));
  const dugme = document.getElementById("btnSearch") || document.querySelector('[id*="btnSearch" i], [id*="btnAra" i], [id*="lnkSearch" i]');
  // Tiklamayi sonraya birak: bu fonksiyon sayfa yenilenmeden once cevap dondurebilsin
  setTimeout(() => {
    if (cfg.formGonder && kutu.form) { try { kutu.form.requestSubmit(); } catch (e) { kutu.form.submit(); } }
    else if (dugme) dugme.click();
    else for (const tur of ["keydown", "keypress", "keyup"])
      kutu.dispatchEvent(new KeyboardEvent(tur, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  }, 50);
  return { tamam: true, eski };
}

async function b2b_balkan_radyator_oku(ayar) {
  ayar = ayar || {};
  const temiz = t => String(t || "").replace(/[-]/g, "").replace(/\s+/g, " ").trim();
  const PARA = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺|TRY)/;
  const YALIN = /^(?:₺|TL)?\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺|TRY)?$/;   // para birimi ayri yazilmis fiyat
  const sayi = t => { const m = PARA.exec(t) || YALIN.exec(t); return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null; };
  const STOK = ["var", "yok", "az var", "az", "kritik", "yolda", "sipariş üzerine"];
  const ATIK = new Set(["Kampanyalı Ürün", "Resim", "Sepete Ekle", "Sepete At", "Detay", "-", "✖", "Açıklama", "Ekle", "TL", "₺", "TRY"]);
  const alanAdi = baslik => {
    const b = baslik.replace(/[’‘`´]/g, "'").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/ı/g, "i").trim();
    if ((b.includes("kmp") || b.includes("kampanya")) && (b.includes("fyt") || b.includes("fiyat"))) return "kampanya";
    if (b.includes("kdv'li") || b.includes("kdvli") || b.includes("kdv dahil")) return "kdvli";
    if (b.includes("size özel") || b.includes("size ozel") || b.includes("özel fiyat") || b.includes("ozel fiyat")) return "ozel";
    if (b.includes("kdv'siz") || b.includes("kdvsiz") || b.includes("net")) return "net";
    if (b.includes("liste") || b === "fiyat" || b === "fiyati") return "liste";
    if ((b.includes("kmp") || b.includes("kampanya")) && (b.includes("fyt") || b.includes("fiyat"))) return "kampanya";
    if (b.includes("isk")) return "isk";
    if (b.includes("üretici kodu") || b.includes("uretici kodu") || b.includes("oem") || b.includes("orjinal") || b.includes("orijinal")) return "oem";
    if (b.includes("araç") || b.includes("arac")) return "arac";
    if (b.startsWith("kod") || b.startsWith("stok kod")) return "kod";
    if (["adi", "ad", "urun adi", "ürün adi", "stok adi"].includes(b)) return "ad";
    if (b.includes("üretici") || b.includes("uretici") || b.includes("marka") || b.includes("menşei") || b.includes("mensei")) return "marka";
    if (b.includes("birim")) return "birim";
    if (b.includes("ölçü") || b.includes("olcu")) return "olcu";
    if (["drm", "durum", "stok"].includes(b)) return "stok";
    return null;
  };
  const yapraklar = kok => {
    const out = [];
    const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const p = n.parentElement;
      if (!p || ["SCRIPT", "STYLE", "OPTION"].includes(p.tagName)) continue;
      const t = temiz(n.nodeValue);
      if (t) out.push(t);
    }
    return out;
  };

  const sonuc = { isaret: window.__b2bIsaret || null, bitti: window.__b2bBitti === true, hazir: document.readyState === "complete", imza: "", satirlar: [] };
  if (location.pathname.toLowerCase().includes("login") || document.querySelector('input[type="password"]')) {
    sonuc.hata = "GIRIS"; sonuc.mesaj = "Oturum kapanmış, sekmede tekrar giriş yapın"; return sonuc;
  }
  const tablo = document.getElementById("gvResult");
  if (!tablo) return sonuc;
  sonuc.imza = (tablo.innerText || tablo.textContent || "").slice(0, 800);

  const panel = document.getElementById("searchReaultPanel") || document.getElementById("searchResultPanel") || tablo.parentElement;
  const basliklar = [];
  if (panel) {
    const w = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (tablo.contains(n)) break;
      const t = temiz(n.nodeValue);
      if (t && basliklar[basliklar.length - 1] !== t) basliklar.push(t);
    }
  }
  let alanlar = basliklar.map(alanAdi);
  // Baslik paneli fiyat sutunu icermiyorsa (Korea/Askar duzeni): baslik etiketlerini sayfadan topla
  if (!alanlar.some(a => ["liste", "net", "kdvli", "kampanya", "ozel"].includes(a))) {
    const etiketler = [...document.querySelectorAll('[id*="lblSearch"][id$="Text"]')]
      .map(e => temiz(e.textContent)).filter(t => t && !/^(arama|ürün arama|genel arama)$/i.test(t));
    const ek = etiketler.map(alanAdi);
    if (ek.some(a => ["liste", "net", "kdvli", "kampanya", "ozel"].includes(a))) {
      const bas = [];
      if (!ek.includes("kod")) bas.push("kod");
      if (!ek.includes("ad")) bas.push("ad");
      alanlar = bas.concat(ek);
      sonuc.basliklar = bas.concat(etiketler);
    }
  }
  if (!sonuc.basliklar) sonuc.basliklar = basliklar;
  let metinSira = alanlar.filter(a => ["kod", "oem", "arac", "ad", "marka", "birim", "olcu"].includes(a));
  let fiyatSira = alanlar.filter(a => ["liste", "net", "kdvli", "kampanya", "ozel"].includes(a));
  if (!metinSira.length) metinSira = ["kod", "oem", "arac", "ad", "marka"];
  if (!fiyatSira.length) fiyatSira = ["liste"];

  const satirElemanlari = [];
  for (const q of tablo.querySelectorAll('input[id^="qty"]')) {
    let satir = q, ust = q.parentElement;
    while (ust && ust !== tablo && ust.querySelectorAll('input[id^="qty"]').length === 1) { satir = ust; ust = ust.parentElement; }
    if (satir !== q && !satirElemanlari.includes(satir)) satirElemanlari.push(satir);
  }
  const carpan = Number(ayar.carpan || 1), kdv = Number(ayar.kdv || 20);
  for (const tr of satirElemanlari) {
    const u = { stok: "", isk: 0 };
    const fiyatlar = [], metinler = [];
    let iskAlindi = false;
    for (const m of yapraklar(tr)) {
      if (m === "Kampanyalı Ürün") u.kmpYazi = true;
      if (ATIK.has(m)) continue;
      const f = sayi(m);
      if (f != null) { fiyatlar.push(f); continue; }
      if (/^%\s*\d+([.,]\d+)?(\s*\+\s*\d+([.,]\d+)?)*$/.test(m)) {
        // "%30+10" gibi ardisik iskontolar: carpanlari carpilir (0,70 x 0,90)
        if (!iskAlindi) {
          u.iskCarpan = m.replace(/%/g, "").split("+").reduce((c, p) => c * (1 - (Number(p.replace(",", ".")) || 0) / 100), 1);
          u.isk = (1 - u.iskCarpan) * 100; iskAlindi = true;
        }
        continue;
      }
      if (STOK.includes(m.toLowerCase())) { if (!u.stok) u.stok = m; continue; }
      if (/^\d+$/.test(m)) continue;
      metinler.push(m);
    }
    metinSira.forEach((a, i) => { if (metinler[i] != null) u[a] = metinler[i]; });
    fiyatSira.forEach((a, i) => { if (fiyatlar[i] != null) u[a] = fiyatlar[i]; });
    let net = u.net, kdvliHazir = u.kdvli;
    if (net == null && u.ozel != null) {
      // ozelKdvHaric (Kortaş): ozel fiyat KDV haric liste fiyatidir, iskonto uygulanir
      if (ayar.ozelKdvHaric) net = u.ozel * (u.iskCarpan || 1);
      else if (ayar.ozelKdvDahil === false) net = u.ozel;
      else { kdvliHazir = u.ozel; net = u.ozel / (1 + kdv / 100); }
    }
    // tekFiyatKdvli (Balkan): tek gorunen fiyat KDV dahildir; net = fiyat / (1 + KDV)
    if (ayar.tekFiyatKdvli) {
      // kdvliAlan (Balkan): "KDV'li Net" sutunu dogrudan KDV dahil fiyattir, iskonto tekrar uygulanmaz
      const ham = ayar.kdvliAlan ? (u.kdvli ?? u.net) : (u.liste ?? u.net ?? u.kdvli);   // Yeni Alka: "KDV'li Net" degeri eklenti tarafindan net gibi okunuyor
      if (ham != null) { kdvliHazir = ayar.kdvliAlan ? ham : ham * carpan * (1 - (u.isk || 0) / 100); net = kdvliHazir / (1 + kdv / 100); }
    }
    if (net == null && u.liste != null) net = u.liste * carpan * (1 - u.isk / 100);
    // popupKdvDahil (NES): fiyat hucresinin ustune gelince acilan pencerede KDV dahil fiyat (Aninda Havale / Ozel)
    let popupNot = "";
    if ((ayar.popupKdvDahil || ayar.popupNetler || ayar.popupFiyat || ayar.popupSayili) && net != null) {
      const beklenen = (ayar.popupSayili && u.liste != null) ? u.liste : (kdvliHazir != null ? kdvliHazir : net * (1 + kdv / 100));
      // Hucreler bazi sitelerde td degil div.Cell olarak yapilmis (Korea, NES)
      const hucre = [...tr.querySelectorAll("td, [class*='Cell'], [class*='cell']")].find(c => Math.abs(sayi(c.innerText || "") - beklenen) < 0.05);
      if (hucre) {
        // Pencere, fiyat yazisinin kendisindeki (p.priceLists.tooltipstered) olaylarla aciliyor
        const tetik = hucre.matches(".tooltipstered") ? hucre : (hucre.querySelector(".tooltipstered") || hucre.querySelector("p") || hucre);
        for (const tur of ["mouseover", "mouseenter", "mousemove"]) {
          tetik.dispatchEvent(new MouseEvent(tur, { bubbles: true, cancelable: true, view: window }));
        }
        await new Promise(r => setTimeout(r, 1500));
        // popupNetler (Korea): pencerede "KDV'siz Net" ve "KDV'li Net" satirlari
        const ara = document.body.innerText || "";
        const netM = /KDV[’']siz Net:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i.exec(ara);
        const kdvM = /KDV[’']li Net:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i.exec(ara);
        const m = ayar.popupNetler ? (netM && kdvM ? [0, netM[1], kdvM[1]] : null)
          : ayar.popupSayili ? (() => { const hv = /Hemen Öde \(Havale\):?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(ara); return hv ? [0, hv[1], hv[1]] : null; })()
          : ayar.popupFiyat ? /Fiyat:\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*TL?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(ara)
          : /(?:Anında Havale|Özel)[\s\S]{0,60}?(\d{1,3}(?:\.\d{3})*,\d{2})\s*₺?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(ara);
        tetik.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        if (m) {
          kdvliHazir = Number(m[2].replace(/\./g, "").replace(",", "."));
          net = (ayar.popupNetler || ayar.popupFiyat) ? Number(m[1].replace(/\./g, "").replace(",", ".")) : kdvliHazir / (1 + kdv / 100);
        } else popupNot = " [POPUP: " + ((/KDV[\s\S]{0,60}/.exec(ara) || ["yok"])[0]).replace(/\s+/g, " ") + "]";
        // popupSayili (Sayili): "Kampanya Fiyatı" KDV dahil gelir; kampanya (KDV hariç) olarak alinir
        if (ayar.popupSayili) {
          const kp = /Kampanya Fiyatı:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(ara);
          if (kp) u.kampanya = Number(kp[1].replace(/\./g, "").replace(",", ".")) / (1 + kdv / 100);
        }
        // popupFiyat (Askar): "Vadeli Kampanya Fiyatı" satiri kampanya fiyatidir (KDV hariç, KDV dahil)
        if (ayar.popupFiyat) {
          const k = /Vadeli Kampanya[\s\S]{0,80}?(\d{1,3}(?:\.\d{3})*,\d{2})\s*TL?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(ara);
          if (k) u.kampanya = Number(k[1].replace(/\./g, "").replace(",", "."));
        }
      }
    }
    if (net == null && kdvliHazir != null) net = kdvliHazir / (1 + kdv / 100);   // yalniz KDV'li fiyat gosteren siteler
    if (net == null) continue;
    let kdvli = kdvliHazir != null ? kdvliHazir : net * (1 + kdv / 100);
    // Kampanya: "KDV Dahil Kmp. Fiyati" gibi sutun daha ucuzsa onu kullan, normal fiyati sakla
    let kampanyaVar = !!u.kmpYazi, normNet = null, normKdv = null;
    if (u.kampanya != null && u.kampanya > 0) {
      const kmpDahil = (sonuc.basliklar || []).some(b => /kmp|kampanya/i.test(b) && /dahil/i.test(b));
      const kNet = kmpDahil ? u.kampanya / (1 + kdv / 100) : u.kampanya;
      if (kNet < net - 0.01) { normNet = net; normKdv = kdvli; net = kNet; kdvli = kNet * (1 + kdv / 100); kampanyaVar = true; }
    }
    const img = tr.querySelector("img[src*='Thumb'], img[src*='thumb'], img[src*='Image'], img[src*='image']");
    sonuc.satirlar.push({
      kampanya: kampanyaVar, normalFiyat: normNet != null ? Math.round(normNet * 100) / 100 : null, normalKdvli: normKdv != null ? Math.round(normKdv * 100) / 100 : null,
      urunId: (() => { const q = tr.querySelector('input[id^="qty"]'); const m = q && /^qty(\d+)$/.exec(q.id); return m ? Number(m[1]) : null; })(),
      kod: u.kod || "", marka: u.marka || "", oem: (u.oem || "").replace(/[\s/]+$/, ""),
      ad: (u.ad || "") + (u.arac ? " – " + u.arac : "") + popupNot,
      fiyat: Math.round(net * 100) / 100, fiyatKdvli: Math.round(kdvli * 100) / 100,
      stok: u.stok, stokVar: u.stok ? ["var", "az var", "az", "kritik"].includes(u.stok.toLowerCase()) : null,
      resim: img ? img.src : null, resimBuyuk: img ? img.src : null,
    });
  }
  return sonuc;
}

OKUYUCULAR.balkan_radyator = { gonder: b2b_balkan_radyator_gonder, oku: b2b_balkan_radyator_oku };
