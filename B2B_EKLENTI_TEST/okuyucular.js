// Okuyucular: B2B sekmesinin ICINDE (sayfanin kendi oturumuyla) calisir.
// Her fonksiyon tek basina calisabilmeli (disaridaki degiskenlere erismez); chrome.scripting ile sayfaya gonderilir.
// Yontem: sayfanin kendi istegini dinler, arama kutusuna parcayi yazip Enter'a basar, gelen veriyi okur.
// Sifre girmez, giris yapmaz.

// ------------------------------------------------------------------ ORTAK: istek dinleyici
// (Her okuyucunun icine kopyalanir, cunku okuyucular disaridaki fonksiyonlara erisemez.)

// ------------------------------------------------------------------ A GRUBU
// Basbug, Martas, Dinamik, Rotas, Sayim Rulman (.../web/b2b/search altyapisi)
async function okuyucu_a_grup(parca) {
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  if (location.pathname.includes("/login")) return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  const kutu = document.querySelector("#searchInput");
  if (!kutu) return { hata: "GIRIS", mesaj: "Arama kutusu bulunamadı (arama sayfasında değil ya da oturum kapalı)" };

  const gelen = [];
  const oAc = XMLHttpRequest.prototype.open, oGonder = XMLHttpRequest.prototype.send, oFetch = window.fetch;
  XMLHttpRequest.prototype.open = function (m, u) { this.__b2bAdres = String(u || ""); return oAc.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener("load", () => {
      try {
        const t = this.responseText;
        if (t && t.includes("ResultDetailed")) gelen.push({ adres: this.__b2bAdres, metin: t, durum: this.status });
      } catch (e) {}
    });
    return oGonder.apply(this, arguments);
  };
  window.fetch = async function () {
    const r = await oFetch.apply(this, arguments);
    try { r.clone().text().then(t => { if (t && t.includes("ResultDetailed")) gelen.push({ adres: r.url, metin: t, durum: r.status }); }).catch(() => {}); } catch (e) {}
    return r;
  };

  const kodCoz = kod => {
    try {
      const ara = String.fromCharCode(...kod.match(/../g).map(h => parseInt(h, 16) ^ 0x72));
      const ham = String.fromCharCode(...ara.match(/../g).map(h => parseInt(h, 16)));
      try { return decodeURIComponent(ham).trim(); } catch (e) { return unescape(ham).trim(); }
    } catch (e) { return kod || ""; }
  };
  const donustur = veri => {
    const depolar = {};
    for (const d of veri.WarehouseList || []) depolar[d.WarehouseID] = [d.ColumnName || String(d.WarehouseID), d.ShowCartSummary !== false];
    const out = [];
    for (const u of veri.ResultDetailed || []) {
      const fiyat = Number(u.NetPriceWoVat);
      if (!fiyat || fiyat <= 0) continue;
      const stok = []; let toplam = 0;
      for (const a of u.Availability || []) {
        const [adi, sayilir] = depolar[a.WarehouseID] || [String(a.WarehouseID), true];
        const miktar = a.Amount || 0;
        if (miktar && sayilir) { stok.push(`${adi} ${miktar}`); toplam += miktar; }
      }
      const resimVar = u.PictureExists && u.ID;
      out.push({
        kod: kodCoz(u.ProductCode || ""), marka: u.Brand || "", oem: u.OemNr || "", ad: u.Name_PType || "",
        fiyat: Math.round(fiyat * 100) / 100,
        fiyatKdvli: u.NetPriceWVat ? Math.round(Number(u.NetPriceWVat) * 100) / 100 : null,
        stok: stok.join(", "), stokVar: toplam > 0,
        resim: resimVar ? `${location.origin}/Service/Thumb/${u.ID}.res` : null,
        resimBuyuk: resimVar ? `${location.origin}/Service/Res/${u.ID}.res` : null,
        urunId: u.ID || null, alimVar: !!u.PurchasedProduct,
      });
    }
    return out;
  };

  try {
    const yaz = Object.getOwnPropertyDescriptor(kutu.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value").set;
    kutu.focus();
    yaz.call(kutu, parca);
    kutu.dispatchEvent(new Event("input", { bubbles: true }));
    kutu.dispatchEvent(new Event("change", { bubbles: true }));
    for (const tur of ["keydown", "keypress", "keyup"])
      kutu.dispatchEvent(new KeyboardEvent(tur, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));

    const satirlar = [];
    let islenen = 0, anaGeldi = false, bekleyen = true;
    const bitis = Date.now() + 25000;
    while (Date.now() < bitis) {
      while (islenen < gelen.length) {
        const g = gelen[islenen++];
        if (g.durum === 401 || g.durum === 403) return { hata: "GIRIS", mesaj: "Oturum kapanmış, sekmede tekrar giriş yapın" };
        let veri;
        try {
          const dis = JSON.parse(g.metin);
          veri = dis;
          for (const k of Object.keys(dis)) if (k.endsWith("Result")) { veri = typeof dis[k] === "string" ? JSON.parse(dis[k]) : dis[k]; break; }
        } catch (e) { continue; }
        if (!veri || !veri.ResultDetailed) continue;
        satirlar.push(...donustur(veri));
        if (!g.adres.toLowerCase().includes("remaining")) anaGeldi = true;
        bekleyen = !!(veri.RemainingProductIds && veri.RemainingProductIds.length);
      }
      if (anaGeldi && !bekleyen) break;
      if (location.pathname.includes("/login")) return { hata: "GIRIS", mesaj: "Oturum kapanmış, sekmede tekrar giriş yapın" };
      await bekle(200);
    }
    if (!anaGeldi) return { hata: "ZAMAN", mesaj: "Site cevap vermedi" };
    return { tamam: true, satirlar };
  } finally {
    XMLHttpRequest.prototype.open = oAc; XMLHttpRequest.prototype.send = oGonder; window.fetch = oFetch;
  }
}

// ------------------------------------------------------------------ ERYAZ WEB (Intermobil)
async function okuyucu_eryaz_web(parca) {
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  if (location.pathname.includes("/login")) return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  const kutu = document.querySelector('input[placeholder="Ara.."]') || document.querySelector('input[type="search"]');
  if (!kutu) return { hata: "GIRIS", mesaj: "Arama kutusu bulunamadı (arama sayfasında değil ya da oturum kapalı)" };

  const gelen = [];
  const oAc = XMLHttpRequest.prototype.open, oGonder = XMLHttpRequest.prototype.send, oFetch = window.fetch;
  const ilgili = u => String(u || "").includes("/api/Search/SearchOptimized");
  XMLHttpRequest.prototype.open = function (m, u) { this.__b2bAdres = String(u || ""); return oAc.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    if (ilgili(this.__b2bAdres)) this.addEventListener("load", () => { try { gelen.push({ adres: this.responseURL || this.__b2bAdres, metin: this.responseText, durum: this.status }); } catch (e) {} });
    return oGonder.apply(this, arguments);
  };
  window.fetch = async function (girdi) {
    const r = await oFetch.apply(this, arguments);
    try { if (ilgili(r.url)) r.clone().text().then(t => gelen.push({ adres: r.url, metin: t, durum: r.status })).catch(() => {}); } catch (e) {}
    return r;
  };

  const donustur = veri => {
    const out = [];
    const kotu = s => ["unavail", "out", "none", "nostock", "no_stock"].some(x => s.includes(x));
    for (const u of ((veri.data || {}).items || [])) {
      const fiyat = Number(u.finalUnitPrice);
      if (!fiyat || fiyat <= 0) continue;
      const oemler = u.oems || [];
      const oem = (oemler.find(o => o.isDefault) || oemler[0] || {}).oemCode || "";
      const stok = u.stock || {};
      const durum = String(((stok.stockDisplay || {}).status) || "").toLowerCase();
      const depolar = [];
      for (const d of stok.items || []) {
        const sd = d.stockDisplay || {};
        const ds = String(sd.status || "").toLowerCase();
        if (ds && !kotu(ds)) depolar.push(`${d.warehouseName || ""} ${sd.exactQuantity != null ? sd.exactQuantity : (sd.localizedLabel || "")}`.trim());
      }
      const resim = u.thumbnailUrl ? new URL(u.thumbnailUrl, location.origin).href : null;
      out.push({
        kod: u.code || "", marka: u.manufacturerName || "", oem,
        ad: (u.name || "") + (u.description ? " – " + u.description : ""),
        fiyat: Math.round(fiyat * 100) / 100,
        fiyatKdvli: u.finalUnitPriceWithVat ? Math.round(Number(u.finalUnitPriceWithVat) * 100) / 100 : null,
        stok: depolar.join(", "), stokVar: !!durum && !kotu(durum),
        resim, resimBuyuk: resim,
      });
    }
    return out;
  };

  try {
    const yaz = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    kutu.focus();
    yaz.call(kutu, parca);
    kutu.dispatchEvent(new Event("input", { bubbles: true }));
    kutu.dispatchEvent(new Event("change", { bubbles: true }));
    for (const tur of ["keydown", "keypress", "keyup"])
      kutu.dispatchEvent(new KeyboardEvent(tur, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    if (kutu.form) { try { kutu.form.requestSubmit(); } catch (e) {} }

    const hedef = parca.trim().toLowerCase();
    const bitis = Date.now() + 25000;
    while (Date.now() < bitis) {
      for (const g of gelen) {
        let q = "";
        try { q = (new URL(g.adres, location.origin).searchParams.get("q") || "").trim().toLowerCase(); } catch (e) {}
        if (q && q !== hedef) continue;
        if (g.durum === 401 || g.durum === 403) return { hata: "GIRIS", mesaj: "Oturum kapanmış, sekmede tekrar giriş yapın" };
        if (g.durum !== 200) return { hata: "SITE", mesaj: `Site hata döndü: HTTP ${g.durum}` };
        try { return { tamam: true, satirlar: donustur(JSON.parse(g.metin)) }; } catch (e) { return { hata: "SITE", mesaj: "Cevap okunamadı" }; }
      }
      if (location.pathname.includes("/login")) return { hata: "GIRIS", mesaj: "Oturum kapanmış, sekmede tekrar giriş yapın" };
      await bekle(200);
    }
    return { hata: "ZAMAN", mesaj: "Site cevap vermedi" };
  } finally {
    XMLHttpRequest.prototype.open = oAc; XMLHttpRequest.prototype.send = oGonder; window.fetch = oFetch;
  }
}

// ------------------------------------------------------------------ ERYAZ B2B (WebForms)
// Lepar, Basaran, Askar ve ayni altyapidaki siteler. Bu sitelerde "Ara" sayfayi BASTAN YUKLER,
// bu yuzden iki adim: (1) eryaz_b2b_gonder: parcayi yazip Ara'ya basar; (2) eryaz_b2b_oku: sonucu okur
// (eklenti sayfa yuklenene kadar birkac kez dener).
function eryaz_b2b_gonder(parca, cfg) {
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

async function eryaz_b2b_oku(ayar) {
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

// ------------------------------------------------------------------ GENEL (SadeceB2B / Yuce Yazilim ve benzerleri)
// cfg: { kutu: [id...], dugme: [id...], alan: id }  -> arama kutusu, Ara dugmesi, sonuc alani
function genel_gonder(parca, cfg) {
  const bul = ids => ids.map(i => document.getElementById(i)).find(Boolean);
  // Arama baska sayfadaysa oraya gec (Senbay: /Stok)
  if (cfg.sayfa && !location.pathname.toLowerCase().startsWith(cfg.sayfa.toLowerCase()) && !document.querySelector('input[type="password"]')) {
    setTimeout(() => { location.href = location.origin + cfg.sayfa; }, 30);
    return { yonlendi: true };
  }
  // Dugme yazisiyla bulma (id'si olmayan "Bul" dugmesi ve yanindaki kutu)
  let metinDugme = null, metinKutu = null;
  if (cfg.dugmeMetin) {
    metinDugme = [...document.querySelectorAll("button, a, input[type=submit], input[type=button]")]
      .find(e => (e.innerText || e.textContent || e.value || "").trim().toLocaleLowerCase("tr-TR") === cfg.dugmeMetin.toLocaleLowerCase("tr-TR"));
    for (let k = metinDugme && metinDugme.parentElement, i = 0; k && i < 3 && !metinKutu; k = k.parentElement, i++)
      metinKutu = k.querySelector('input[type="text"], input:not([type])');
  }
  const gorunur = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const secKutu = cfg.kutuSec ? ([...document.querySelectorAll(cfg.kutuSec)].find(gorunur) || document.querySelector(cfg.kutuSec)) : null;
  const kutu = bul(cfg.kutu || []) || secKutu || metinKutu || document.querySelector('input[type="search"], input[type="text"][placeholder*="ara" i]');
  if (!kutu) {
    if (document.querySelector('input[type="password"]')) return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
    return { hata: "GIRIS", mesaj: "Arama kutusu bulunamadı (arama sayfasında değil)" };
  }
  const alan = document.getElementById(cfg.alan);
  const eski = alan ? (alan.innerText || alan.textContent || "").slice(0, 800) : "";
  window.__b2bIsaret = Date.now();
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
  const yaz = Object.getOwnPropertyDescriptor(kutu.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value").set;
  kutu.focus();
  yaz.call(kutu, parca);
  kutu.dispatchEvent(new Event("input", { bubbles: true }));
  kutu.dispatchEvent(new Event("change", { bubbles: true }));
  const dugme = bul(cfg.dugme || []) || (cfg.dugmeSec ? document.querySelector(cfg.dugmeSec) : null) || metinDugme;
  setTimeout(() => {
    if (cfg.formGonder && kutu.form) { try { kutu.form.requestSubmit(); } catch (e) { kutu.form.submit(); } }
    else if (dugme) dugme.click();
    else for (const tur of ["keydown", "keypress", "keyup"])
      kutu.dispatchEvent(new KeyboardEvent(tur, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  }, 50);
  return { tamam: true, eski };
}

async function genel_oku(ayar, cfg) {
  ayar = ayar || {};
  // Sayfaya yalnizca bu fonksiyonun govdesi gittigi icin yardimci fonksiyon burada tanimlanir
  const popupOku = async urunId => {
    const html = await (await fetch("/Services/PopupGosterimleri?UrunId=" + encodeURIComponent(urunId), { credentials: "include", headers: { "X-Requested-With": "XMLHttpRequest" } })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const sayiBul = t => { const m = /\d{1,3}(?:\.\d{3})*,\d{2}/.exec(t || ""); return m ? Number(m[0].replace(/\./g, "").replace(",", ".")) : null; };
    const etiketli = re => {
      for (const el of doc.querySelectorAll("*")) {
        const yazi = (el.textContent || "").normalize("NFC");
        if (el.children.length || !re.test(yazi)) continue;
        const deger = el.nextElementSibling || (el.closest("tr") ? el.closest("tr").children[1] : null);
        const v = sayiBul(deger ? deger.textContent : "");
        if (v != null) return v;
      }
      return null;
    };
    // TEST: site ayarinda popupNet / popupKdv verilmisse (ornek GloPar) onlari kullan
    const netRe = ayar.popupNet ? new RegExp(ayar.popupNet, "i") : /KDV.?S.{1,2}Z\s*MAL/i;
    const kdvRe = ayar.popupKdv ? new RegExp(ayar.popupKdv, "i") : /KDV.?L.{1,2}\s*MAL/i;
    const r = { net: etiketli(netRe), kdvli: etiketli(kdvRe) };
    if (r.net == null && r.kdvli == null) throw new Error("etiket yok, cevap: " + html.replace(/\s+/g, " ").slice(0, 80));
    return r;
  };
  const temiz = t => String(t || "").replace(/[-]/g, "").replace(/\s+/g, " ").trim();
  const PARA = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺)?/;
  const PARA_TL = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺)/;
  const sayi = (t, siki) => { const m = (siki ? PARA_TL : PARA).exec(t); return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null; };
  const alanAdi = baslik => {
    const b = baslik.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase().replace(/ı/g, "i").trim();
    // netKdvli (Mydpar): "Net Fiyat KDV'li" KDV'li fiyattir; "Liste Fiyat..." sutunlari liste fiyatidir
    // ilkemHeader (Ilkem): "Oem" sutunu parca kodu, "Mensei" sutunu marka
    if (ayar.ilkemHeader && b === "oem") return "kod";
    if (ayar.ilkemHeader && /^men/.test(b)) return "marka";
    // havaleKdvli (Teknopar): fiyat olarak "Kdv'li Anında Havale" sutunu alinir; diger fiyat sutunlari kullanilmaz
    if (ayar.havaleKdvli && b.includes("havale")) return "kdvli";
    if (ayar.havaleKdvli && (b.includes("kredi") || b.includes("fiyat"))) return "listeKdvli";
    if (ayar.netKdvli && b.includes("net") && /kdv.?li/.test(b)) return "kdvli";
    if (ayar.netKdvli && b.includes("liste")) return "listeKdvli";   // kullanilmaz: net KDV'li sutundan hesaplanir
    if ((b.includes("kmp") || b.includes("kamp")) && !b.includes("dahil") && !b.includes("kdv'li")) return "kampanya";
    if (b.includes("kdv'li") || b.includes("kdvli") || b.includes("kdv dahil")) return "kdvli";
    if (b.includes("size özel") || b.includes("size ozel") || b.includes("özel fiyat") || b.includes("ozel fiyat")) return "ozel";
    if (b.includes("kdv'siz") || b.includes("kdvsiz") || b.includes("net")) return "net";
    if (b.includes("liste") || b.includes("fiyat")) return "liste";
    if (b.includes("isk")) return "isk";
    if (b.includes("oem") || b.includes("orjinal") || b.includes("orijinal") || b.includes("üretici kodu") || b.includes("uretici kodu") || b.includes("referans")) return "oem";
    if (b.includes("kod")) return "kod";
    if (b.includes("marka") || b.includes("üretici") || b.includes("uretici")) return "marka";
    if (/(^|\s)adi$/.test(b) || b.includes("ürün adi") || b.includes("urun adi")) return "ad";
    if (b.includes("stok") || b.includes("durum") || b.includes("depo")) return "stok";
    if (b.includes("ad") || b.includes("açıklama") || b.includes("aciklama") || b.includes("tanim")) return "ad";
    return null;
  };
  const sonuc = { isaret: window.__b2bIsaret || null, bitti: window.__b2bBitti === true, hazir: document.readyState === "complete", imza: "", satirlar: [] };
  if (document.querySelector('input[type="password"]')) { sonuc.hata = "GIRIS"; sonuc.mesaj = "Oturum kapanmış, sekmede tekrar giriş yapın"; return sonuc; }
  const alan = document.getElementById(cfg.alan) || document.body;
  sonuc.imza = (alan.innerText || alan.textContent || "").slice(0, 800);
  // Adresle arayan sitelerde (DE-GA) sonuc yazisi cikana kadar bekle
  if (cfg.bekle && !new RegExp(cfg.bekle, "i").test(document.body.innerText || document.body.textContent || "") && performance.now() < 15000) { sonuc.imza = "bekle" + Date.now(); return sonuc; }

  const kdv = Number(ayar.kdv || 20), carpan = Number(ayar.carpan || 1);
  // TEST (dovizKur): sayfanin ust cubugundaki kur ("USD: 50,6286") ile doviz fiyati TL'ye cevrilir
  const kurOku = cur => { const m = new RegExp(cur + ":\\s*(\\d{1,3}(?:\\.\\d{3})*,\\d+)", "i").exec(document.body.innerText || ""); return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null; };
  let dovizSorun = false;
  for (const tablo of alan.querySelectorAll("table")) {
    const trler = [...tablo.querySelectorAll("tr")];
    if (trler.length < 2) continue;
    const basTr = trler.find(tr => tr.querySelector("th")) || trler[0];
    const basMetin = [...basTr.children].map(c => temiz(c.innerText || c.textContent));
    const basliklar = basMetin.map(alanAdi);
    // Hem "Marka" (arac markasi) hem "Uretici" sutunu varsa urun markasi = Uretici
    const uIdx = basMetin.findIndex(t => /üretici|uretici/i.test(t)), mIdx = basMetin.findIndex(t => /^marka$/i.test(t));
    if (uIdx >= 0 && mIdx >= 0 && uIdx !== mIdx) basliklar[mIdx] = null;
    if (!basliklar.some(a => ["liste", "net", "ozel", "kdvli"].includes(a))) continue;
    for (const tr of trler) {
      if (tr === basTr) continue;
      const hucreler = [...tr.children].map(c => temiz(c.innerText || c.textContent));
      if (hucreler.length < 3) continue;
      const u = {};
      // TEST: doviz cinsi fiyat (ornek GloPar: "$7,84") TL degildir; TL gibi okunmaz.
      // dovizKur ayari aciksa tutar + para birimi saklanir, asagida kurla TL'ye cevrilir.
      let dovizli = null;
      basliklar.forEach((a, i) => {
        if (!a || !hucreler[i] || u[a] != null) return;
        if (["liste", "net", "ozel", "kdvli", "listeKdvli"].includes(a) && /[$€]|USD|EUR/i.test(hucreler[i])) {
          if (a === "liste" && ayar.dovizKur) dovizli = { v: Number(hucreler[i].replace(/[^\d,]/g, "").replace(",", ".")), cur: /EUR|€/i.test(hucreler[i]) ? "EUR" : "USD" };
          return;
        }
        u[a] = hucreler[i];
      });
      let liste = u.liste != null ? sayi(u.liste) : null;
      if (dovizli && !isNaN(dovizli.v)) {
        const kur = kurOku(dovizli.cur);
        if (kur) liste = dovizli.v * kur; else dovizSorun = true;
      }
      let net = u.net != null ? sayi(u.net) : null, kdvli = u.kdvli != null ? sayi(u.kdvli) : null;
      const ozel = u.ozel != null ? sayi(u.ozel) : null;
      // kdvliAlan (Arkas): "Net Fiyat KDV'li" sutunu KDV dahildir; net = KDV dahil / 1,20 (liste/iskonto kullanilmaz)
      if (ayar.kdvliAlan && kdvli != null) net = kdvli / (1 + kdv / 100);
      const isk = u.isk ? Number(String(u.isk).replace(/[^\d,.]/g, "").replace(",", ".")) || 0 : 0;
      if (net == null && ozel != null) { if (ayar.ozelKdvDahil === false) net = ozel; else { kdvli = ozel; net = ozel / (1 + kdv / 100); } }
      if (net == null && liste != null) net = liste * carpan * (1 - isk / 100);
      // 0 veya negatif fiyat "fiyat yok" demektir; gercek fiyat gibi kullanma (ornek: Universal KDV'li 0,00)
      if (net != null && net <= 0) net = null;
      if (kdvli != null && kdvli <= 0) kdvli = null;
      if (net == null && kdvli != null) net = kdvli / (1 + kdv / 100);
      // ayar.popup: fiyat popup'indaki KDV'siz / KDV'li maliyet tabloda gorunmuyorsa oradan al
      if (ayar.popup) {
        const pid = tr.querySelector("td[pid]") ? tr.querySelector("td[pid]").getAttribute("pid") : null;
        // Popup okunamazsa (ag hatasi, beklenmeyen cevap) liste fiyatiyla devam et; tum aramayi dusurme
        if (pid) { try { const p = await popupOku(pid); if (p.net != null) net = p.net; if (p.kdvli != null) kdvli = p.kdvli; } catch (e) {} }
      }
      // klikPopup: fiyat hucresine tiklayinca acilan ayrinti penceresinden KDV'li maliyeti oku (Karpart)
      if (ayar.klikPopup) {
        const fiyatHucresi = tr.querySelector('td[onclick*="urunPopoverSet"]');
        if (fiyatHucresi) {
          fiyatHucresi.click();
          await new Promise(r => setTimeout(r, 1500));
          const m = /MaliyetFiyatiKDVli\s*([\d.]+,\d{2})/.exec(document.body.innerText || "");
          if (m) { kdvli = Number(m[1].replace(/\./g, "").replace(",", ".")); net = kdvli / (1 + kdv / 100); }
        }
      }
      if (net == null) continue;
      if (kdvli == null) kdvli = net * (1 + kdv / 100);
      const kmp = u.kampanya != null ? sayi(u.kampanya) : null;          // daha ucuz kampanya fiyati (KDV haric)
      let kampanyaVar = false, normNet = null, normKdv = null;
      if (kmp && kmp > 0 && kmp < net) { normNet = net; normKdv = kdvli; kdvli = kdvli * kmp / net; net = kmp; kampanyaVar = true; }
      const stok = u.stok || "";
      const img = tr.querySelector("img[src]");
      sonuc.satirlar.push({
        kampanya: kampanyaVar, normalFiyat: normNet != null ? Math.round(normNet * 100) / 100 : null, normalKdvli: normKdv != null ? Math.round(normKdv * 100) / 100 : null,
        kod: u.kod || "", marka: u.marka || "", oem: u.oem || "", ad: u.ad || "",
        fiyat: Math.round(net * 100) / 100, fiyatKdvli: Math.round(kdvli * 100) / 100,
        stok, stokVar: stok ? !/yok|0$/i.test(stok) : null,
        resim: img ? img.src : null, resimBuyuk: img ? img.src : null,
      });
    }
  }
  // TEST: doviz fiyati var ama kur okunamadiysa "yok" yerine acik hata goster
  if (dovizSorun && !sonuc.satirlar.length) { sonuc.hata = "SITE"; sonuc.mesaj = "Döviz kuru okunamadı (USD/EUR), fiyat gösterilemiyor"; }
  return sonuc;
}

// ------------------------------------------------------------------ TESHIS
// Sayfadaki kutularin/dugmelerin/tablolarin ADLARINI cikarir. Kutularin icerigini (deger, sifre) OKUMAZ.
async function sayfa_incele() {
  const kisa = (t, n) => String(t || "").replace(/\s+/g, " ").trim().slice(0, n || 40);
  const gorunur = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const out = { adres: location.href, baslik: document.title, kutular: [], dugmeler: [], bolgeler: [], tablolar: [] };
  for (const e of document.querySelectorAll("input, textarea, select")) {
    if (["hidden"].includes(e.type)) continue;
    out.kutular.push({ etiket: e.tagName.toLowerCase(), id: e.id, name: e.name, tip: e.type, ipucu: kisa(e.placeholder), gorunur: gorunur(e) });
  }
  for (const e of document.querySelectorAll("button, a[id], input[type=submit], input[type=button], [onclick]")) {
    if (out.dugmeler.length > 60) break;
    if (!e.id && !e.getAttribute("onclick") && e.tagName !== "BUTTON") continue;
    out.dugmeler.push({ etiket: e.tagName.toLowerCase(), id: e.id, yazi: kisa(e.innerText || e.value, 25), href: kisa(e.getAttribute("href"), 60), gorunur: gorunur(e) });
  }
  const anahtar = /result|grid|gv|search|ara|list|urun|product|sonuc|tablo/i;
  for (const e of document.querySelectorAll("[id]")) {
    if (out.bolgeler.length > 60) break;
    if (anahtar.test(e.id) && !["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName))
      out.bolgeler.push({ etiket: e.tagName.toLowerCase(), id: e.id, cocuk: e.children.length, yazi: kisa(e.innerText, 60) });
  }
  const gv = document.getElementById("gvResult") || document.getElementById("aramaekrani");
  if (gv) {
    const q = gv.querySelector('input[id^="qty"]');
    let satir = q;
    if (q) { let ust = q.parentElement; while (ust && ust !== gv && ust.querySelectorAll('input[id^="qty"]').length === 1) { satir = ust; ust = ust.parentElement; } }
    const yap = kok => { const r = []; const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode()) && r.length < 60) { const t = kisa(n.nodeValue, 50); if (t) r.push(t); } return r; };
    out.ornekSatir = satir ? yap(satir) : yap(gv).slice(0, 40);
    out.ustBaslik = yap(gv.parentElement || gv).slice(0, 30);
  }
  if (!gv) {
    // Genel: icinde tek adet/miktar kutusu olan en buyuk kap = bir urun satiri
    const q = [...document.querySelectorAll("input")].find(e => /qty|quantit|adet|miktar|^number$/i.test(e.id + " " + e.name + " " + e.placeholder) && (e.offsetWidth || e.offsetHeight));
    if (q) {
      let satir = q, ust = q.parentElement;
      const say = el => [...el.querySelectorAll("input")].filter(e => /qty|quantit|adet|miktar|^number$/i.test(e.id + " " + e.name + " " + e.placeholder)).length;
      while (ust && ust !== document.body && say(ust) === 1) { satir = ust; ust = ust.parentElement; }
      const r = []; const w = document.createTreeWalker(satir, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode()) && r.length < 60) { const t = kisa(n.nodeValue, 50); if (t) r.push(t); }
      out.ornekSatir = r;
      out.ornekSatirKap = satir.tagName.toLowerCase() + (satir.id ? "#" + satir.id : "") + (satir.className ? "." + String(satir.className).trim().split(/\s+/).join(".") : "");
    }
  }
  // Angular sayfalarda (Eryaz B4B) alim gecmisi fonksiyonunun kaynagi: hangi adrese ne gonderdigi gorunur
  try {
    if (window.angular) {
      const adaylar = [document.getElementById("product-info-modal"), document.querySelector("[ng-controller]"), document.body].filter(Boolean);
      for (const el of adaylar) {
        let sc = window.angular.element(el).scope && window.angular.element(el).scope();
        while (sc && typeof sc.getProductOrderList !== "function") sc = sc.$parent;
        if (sc) {
          const adlar = Object.keys(sc).filter(a => typeof sc[a] === "function" && /order|hareket|history/i.test(a));
          out.angular = { fonksiyonlar: adlar, kaynak: Object.fromEntries(adlar.filter(a => /productorder/i.test(a)).map(a => [a, String(sc[a]).slice(0, 3000)])),
            secili: (() => { try { return JSON.stringify(sc.SelectedProduct).slice(0, 300); } catch (e) { return null; } })() };
          break;
        }
      }
    }
  } catch (e) { out.angularHata = String(e.message || e); }
  if (window.__b2bV4) {
    const k = window.__b2bV4;
    out.v4 = { kanca: true, ham: k.ham || null, cevap: k.adet, kur: k.kur ? JSON.stringify(k.kur).slice(0, 400) : null, kayit: k.liste.length, hata: k.hata, basliklar: Object.keys(k.basliklar || {}), istekler: k.urller.slice(-40).map(x => typeof x === "string" ? x : x.u + (x.g ? "  <= " + x.g : "")), ilgili: k.ilgili,
      ornek: k.liste[0] ? Object.fromEntries(Object.entries(k.liste[0]).slice(0, 60).map(([a, b]) => [a, typeof b === "object" && b ? JSON.stringify(b).slice(0, 80) : String(b).slice(0, 60)])) : null };
  }
  for (const t of [...document.querySelectorAll("table")].slice(0, 15)) {
    const ilk = [...t.querySelectorAll("tr")].slice(0, 3).map(tr => [...tr.children].map(c => kisa(c.innerText, 20)));
    out.tablolar.push({ id: t.id, sinif: kisa(t.className), satir: t.rows.length, ornek: ilk });
  }
  if (window.__b2bGecmisOrnek) out.gecmisOrnek = window.__b2bGecmisOrnek;
  // Sayfanin betiklerindeki sunucu adresleri (alim gecmisi / siparis / hareket ile ilgili olanlar ve cevresi)
  try {
    const metinler = [...document.querySelectorAll("script:not([src])")].map(s => s.textContent);
    const dis = [...document.querySelectorAll("script[src]")].map(s => s.src).filter(u => u.startsWith(location.origin) && !/jquery|bootstrap|signalr|moment|select2|swiper|slick/i.test(u)).slice(0, 20);
    for (const u of dis) { try { metinler.push(await (await fetch(u, { credentials: "same-origin" })).text()); } catch (e) {} }
    const bulunan = new Map();
    for (const m of metinler) {
      const re = /["'`\/]([\w-]+\.(?:aspx|asmx|ashx)\/\w+|\/[A-Z][\w]*\/(?:Get|Search|Load)\w+|\/(?:api|web|Service|services)\/[\w\/.-]{3,80}|\/[\w\/-]*(?:[Oo]rder|[Hh]istory|[Gg]ecmis|[Ss]iparis|[Hh]areket|[Ii]nvoice|[Ff]atura)[\w\/-]*)/g; let x;
      while ((x = re.exec(m))) {
        const ad = x[1];
        if (!bulunan.has(ad)) bulunan.set(ad, /order|hareket|movement|history|gecmis|siparis|activity|stockact|invoice|fatura|alim|purchase/i.test(ad) ? m.slice(Math.max(0, x.index - 400), x.index + 600) : null);
      }
    }
    out.adresler = [...bulunan.keys()].slice(0, 120);
    out.gecmisKodu = Object.fromEntries([...bulunan].filter(([, v]) => v).slice(0, 8));
    // Sitenin isteklere ekledigi ozel basliklarin (imza vb.) uretildigi kod parcasi
    const ozel = Object.keys((window.__b2bV4 && window.__b2bV4.basliklar) || {}).filter(a => !/^(authorization|x-companyid)$/i.test(a)).slice(0, 4);
    if (ozel.length) {
      out.baslikKodu = {};
      for (const ad of ozel) for (const m of metinler) { const i = m.indexOf(ad); if (i >= 0) { out.baslikKodu[ad] = m.slice(Math.max(0, i - 1500), i + 1500); break; } }
    }
  } catch (e) { out.adresHata = String(e.message || e); }
  return out;
}

// ------------------------------------------------------------------ ERYAZ V4 (Altay, Taypar, Hamle, Rulman Dunyasi, Vahdet)
// Arama: /Search?text=... adresine gider (sayfa yenilenir). Cevaplari v4_kanca.js kaydeder, oku onlari isler.
function eryaz_v4_gonder(parca) {
  if (document.getElementById("Password") || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/Search?text=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

// Mega-Tek: arama isteğini sayfa içinde (SearchProduct) doğrudan yapar; yanıttaki ürünleri okur
async function megatek_oku(parca, ayar) {
  ayar = ayar || {};
  const sonuc = { hazir: true, imza: "", satirlar: [] };
  const aranan = String(parca || new URLSearchParams(location.search).get("text") || "").trim();
  if (!aranan) { sonuc.hata = "SITE"; sonuc.mesaj = "Aranacak parca yok"; return sonuc; }
  // ASP.NET dogrulama anahtari: sayfadaki gizli alandan (veya cerezden) alinip istege eklenir
  const tokenAlan = document.querySelector('input[name="__RequestVerificationToken"]');
  const token = tokenAlan ? tokenAlan.value : (document.cookie.match(/__RequestVerificationToken=([^;]+)/) || [])[1] || "";
  const cevap = await fetch(location.origin + "/Search/SearchProduct", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json; charset=utf-8", "X-Requested-With": "XMLHttpRequest", ...(token ? { "__RequestVerificationToken": decodeURIComponent(token) } : {}) },
    body: JSON.stringify({ dataCount: 0, manufacturer: null, vehicleBrand: null, vehicleModel: null, vehicleGroup: null, productGroup1: null, productGroup2: null, productGroup3: null, productOrder: "", productCodeGeneralSearchText: "", t9Text: aranan, campaign: false, newArrival: false, newProduct: false, nonecampaign: false, onQuantity: false, onWay: false, campaignDetailGroupHeader: null, comporsionProduct: false }),
  });
  if (!cevap.ok) { sonuc.hata = "SITE"; sonuc.mesaj = "Arama yanıtı alınamadı (" + cevap.status + ")"; return sonuc; }
  const veri = await cevap.json();
  const liste = (() => { try { return JSON.parse(veri.d || "[]"); } catch (e) { return []; } })();
  sonuc.imza = liste.map(u => u.Code).join("|");
  const sayiMetin = t => { const m = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:\.\d+)?)/.exec(String(t || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")); if (!m) return null; const s = m[1]; return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); };
  for (const u of liste) {
    const net = sayiMetin(u.PriceNetCustomerStr);
    const kdvli = sayiMetin(u.PriceNetWithVatCustomerStr) ?? (net != null ? net * 1.2 : null);
    if (net == null) continue;
    sonuc.satirlar.push({
      kampanya: false, normalFiyat: null, normalKdvli: null, urunId: u.Id || null,
      kod: u.Code || "", marka: u.Manufacturer || "", oem: u.ManufacturerCode || "", ad: u.Name || "",
      fiyat: Math.round(net * 100) / 100, fiyatKdvli: Math.round(kdvli * 100) / 100,
      stok: u.AvailableText || "", stokVar: /^var/i.test(u.AvailableText || "") ? true : (/yok/i.test(u.AvailableText || "") ? false : null),
      resim: null, resimBuyuk: null,
    });
  }
  return sonuc;
}

async function eryaz_v4_oku(ayar) {
  ayar = ayar || {};
  const kdv = Number(ayar.kdv || 20);
  const sonuc = { isaret: window.__b2bIsaret || null, hazir: document.readyState === "complete", imza: "", satirlar: [] };
  if (document.getElementById("Password") || document.querySelector('input[type="password"]')) {
    sonuc.hata = "GIRIS"; sonuc.mesaj = "Oturum kapanmış, sekmede tekrar giriş yapın"; return sonuc;
  }
  if (window.__b2bIsaret) { sonuc.imza = "eski" + Date.now(); return sonuc; }   // sayfa henuz yenilenmedi
  const k0 = window.__b2bV4;
  if (!k0) { sonuc.hata = "SITE"; sonuc.mesaj = "Sekmeyi bir kez yenileyin (F5)"; return sonuc; }
  const gecen = performance.now();
  // Yalniz ARANAN parca icin gelen cevaplari kullan (site acilista eski aramayi tekrar yapabiliyor)
  const aranan = new URLSearchParams(location.search).get("text") || "";
  const an = s => { try { s = decodeURIComponent(String(s).replace(/\+/g, " ")); } catch (e) {} return String(s).toLocaleUpperCase("tr-TR").replace(/[^0-9A-ZÇĞİÖŞÜ]/g, ""); };
  const uygun = (k0.cevaplar || []).filter(c => !c.govde || !aranan || an(c.govde).includes(an(aranan)));
  const k = { ...k0, adet: uygun.length, liste: uygun.flatMap(c => c.liste) };
  if (!k.adet && gecen > 3500 && !window.__b2bTetik) {
    // Bazi surumler (Mega-Tek gibi) adresteki ?text= ile kendiliginden aramaz: kutuya yazip aramayi biz baslatalim
    window.__b2bTetik = true;
    const parca = new URLSearchParams(location.search).get("text") || "";
    const kutu = document.getElementById("txtGeneralSearch") || document.getElementById("productCodeGeneralSearch");
    if (parca && kutu) {
      const yaz = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      yaz.call(kutu, parca);
      kutu.dispatchEvent(new Event("input", { bubbles: true }));
      kutu.dispatchEvent(new Event("change", { bubbles: true }));
      const jq = window.jQuery || window.$;
      if (jq && jq.fn && jq.Event) {
        for (const tur of ["keydown", "keypress", "keyup"]) jq(kutu).trigger(jq.Event(tur, { which: 13, keyCode: 13, key: "Enter" }));
      } else {
        for (const tur of ["keydown", "keypress", "keyup"]) kutu.dispatchEvent(new KeyboardEvent(tur, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
      }
      // Kutunun yanindaki buyutec dugmesi
      let kap = kutu.parentElement, dugme = null;
      for (let i = 0; i < 4 && kap && !dugme; i++, kap = kap.parentElement)
        dugme = [...kap.querySelectorAll("button, a, span, i")].find(e => /fa-search|search-btn|btnSearch/i.test(e.className + " " + e.id + " " + e.innerHTML.slice(0, 200)));
      if (dugme) setTimeout(() => { if (!window.__b2bV4.cevaplar.some(c => an(c.govde).includes(an(parca)))) (dugme.closest("button, a") || dugme).click(); }, 600);
    }
  }
  if (!k.adet) {
    // Cevap henuz gelmedi: sayfa acildiktan sonra 7 sn bekle, gelmezse "yok"
    if (gecen < 22000) { sonuc.imza = "bekle" + Date.now(); return sonuc; }   // cok sekme ayni anda yuklenince yavaslar
    sonuc.hata = "SITE"; sonuc.mesaj = "Arama cevabı yakalanamadı – incele'yi gönderin"; return sonuc;
  }
  if (Date.now() - k.son < 1500) { sonuc.imza = "geliyor" + Date.now(); return sonuc; }
  sonuc.imza = "v4:" + k.adet + ":" + k.liste.length;
  const tl = t => { const m = /[\d.]+,\d+|\d+/.exec(String(t || "")); return m ? Number(m[0].replace(/\./g, "").replace(",", ".")) : null; };
  // Doviz: fiyat metninde EUR/USD isareti varsa sitenin kendi kur listesinden TL'ye cevir
  const dovizBul = t => { t = String(t || ""); return /€|EUR/i.test(t) ? "EUR" : /\$|USD/i.test(t) ? "USD" : /£|GBP/i.test(t) ? "GBP" : null; };
  const kurBul = kod => {
    let bulunan = null;
    const gez = (x, d) => {
      if (bulunan || !x || typeof x !== "object" || d > 4) return;
      if (!Array.isArray(x) && Object.values(x).some(v => typeof v === "string" && v.toUpperCase().includes(kod))) {
        for (const [a, v] of Object.entries(x)) {
          const n = typeof v === "number" ? v : (typeof v === "string" && /^\d+([.,]\d+)?$/.test(v) ? Number(v.replace(",", ".")) : NaN);
          if (n > 1 && n < 1000 && /rate|kur|value|selling|satis|forex/i.test(a)) { bulunan = n; return; }
        }
      }
      for (const v of Object.values(x)) gez(v, d + 1);
    };
    gez(k.kur, 0);
    return bulunan;
  };
  // Kur listesi yakalanmadiysa ve dovizli urun varsa sitenin kendi kur listesini iste
  if (!k.kur && k.liste.some(u => u && /[€$£]|EUR|USD|GBP/i.test(String(u.PriceNetCustomerStr || "") + String(u.PriceNetWithVatCustomerStr || "") + String(u.CurrencyCode || "")))) {
    for (const yontem of ["POST", "GET"]) {
      try {
        const c = await fetch(location.origin + "/Home/GetCurrencyList", { method: yontem, credentials: "same-origin", headers: { "X-Requested-With": "XMLHttpRequest" } });
        if (c.ok) { k.kur = await c.json(); break; }
      } catch (e) {}
    }
  }
  const gorulen = new Set();
  for (const u of k.liste) {
    if (!u || typeof u !== "object") continue;
    const id = u.Id != null ? u.Id : (u.Code + "|" + u.Manufacturer);
    if (gorulen.has(id)) continue;
    gorulen.add(id);
    let net = u.PriceNetCustomer && u.PriceNetCustomer.ValueFinal;
    if (net == null || !(Number(net) > 0)) continue;
    net = Number(net);
    let kdvli = tl(u.PriceNetWithVatCustomerStr);
    const kampanya = tl(u.CampaignPriceCustomerStr);
    let kampanyaVar = !!(u.Campaign && Number(u.Campaign.Type) > 0), normNet = null, normKdv = null;
    if (kampanya && kampanya > 0 && kampanya < net) { normNet = net; normKdv = kdvli; net = kampanya; kdvli = tl(u.CampaignPriceWithVatCustomerStr); kampanyaVar = true; }
    let dovizNot = "";
    // Doviz: her fiyat kendi metnine gore cevrilir (net $ olup KDV'li TL gelebilir - FCS)
    const pn = u.PriceNetCustomer || {};
    const netDoviz = dovizBul(u.PriceNetCustomerStr) || (pn.Currency && !/^(TL|TRY)$/i.test(pn.Currency) ? dovizBul(pn.Currency) : null);
    const kdvDoviz = dovizBul(u.PriceNetWithVatCustomerStr);
    if (netDoviz || kdvDoviz) {
      const d = netDoviz || kdvDoviz;
      const kur = Number(pn.Rate) > 1 && netDoviz ? Number(pn.Rate) : kurBul(d);
      // net metni yabanci para ve ValueFinal o metinle ayniysa ValueFinal dovizdir; degilse site zaten TL'ye cevirmistir
      const netStr = tl(u.PriceNetCustomerStr);
      const netDovizli = netDoviz && (netStr == null || Math.abs(netStr - net) <= Math.max(0.02, net * 0.01));
      if (kur) {
        if (netDovizli) { dovizNot = ` [${net.toLocaleString("tr-TR")} ${d} × ${kur}]`; net *= kur; if (normNet) normNet *= kur; }
        if (kdvDoviz && kdvli) { kdvli *= kur; if (normKdv) normKdv *= kur; }
      } else if (netDovizli) dovizNot = ` [${d} fiyat – kur bulunamadı]`;
    }
    if (!kdvli) kdvli = net * (1 + kdv / 100);
    const durum = String(u.AvailabilityText || "").trim();
    const stokVar = ["var", "az var"].includes(durum.toLocaleLowerCase("tr-TR")) || Number(u.TotalQuantity || 0) > 0;
    const not = String(u.Notes || "").trim();
    const resim = u.HavePicture && u.PicturePath ? new URL(u.PicturePath, location.origin).href : null;
    if (normNet && !normKdv) normKdv = normNet * (1 + kdv / 100);
    sonuc.satirlar.push({
      kampanya: kampanyaVar, normalFiyat: normNet ? Math.round(normNet * 100) / 100 : null, normalKdvli: normKdv ? Math.round(normKdv * 100) / 100 : null,
      kod: u.Code || "", marka: u.Manufacturer || "", oem: u.Oem || u.TecdocOemNumber || "",
      ad: String(u.Name || "").trim() + (not && not !== "-" ? " – " + not : "") + dovizNot,
      fiyat: Math.round(net * 100) / 100, fiyatKdvli: Math.round(kdvli * 100) / 100,
      stok: stokVar ? (durum || "Var") : (durum || "Yok"), stokVar, resim, resimBuyuk: resim,
    });
  }
  // Fiyat alani var ama fiyat 0/"-" ise: sitede urun var ama size fiyati yok -> "yok" say (hata degil)
  if (!sonuc.satirlar.length && k.liste.length && !k.liste.some(u => u && "PriceNetCustomer" in u)) {
    const ilk = k.liste[0] || {};
    sonuc.hata = "SITE";
    sonuc.mesaj = "Cevap okunamadı (alanlar: " + Object.keys(ilk).slice(0, 25).join(",") + ") – incele'yi gönderin";
  } else if (!sonuc.satirlar.length && k.hata) {
    sonuc.hata = "SITE"; sonuc.mesaj = "Cevap okunamadı: " + k.hata;
  }
  return sonuc;
}

// ------------------------------------------------------------------ DESISS (Mest bayi paneli)
// Arama: /urunler?arama=... adresine gider. Cevabi (webbayiapi .../api/urunler/search) v4_kanca.js kaydeder.
function desiss_gonder(parca) {
  if (/\/login/i.test(location.pathname) || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/urunler?arama=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

function desiss_oku(ayar) {
  ayar = ayar || {};
  const kdv = Number(ayar.kdv || 20);
  const sonuc = { isaret: window.__b2bIsaret || null, hazir: document.readyState === "complete", imza: "", satirlar: [] };
  if (window.__b2bIsaret) { sonuc.imza = "eski" + Date.now(); return sonuc; }
  if (/\/login/i.test(location.pathname) || document.querySelector('input[type="password"]')) {
    sonuc.hata = "GIRIS"; sonuc.mesaj = "Oturum kapanmış, sekmede tekrar giriş yapın"; return sonuc;
  }
  const k = window.__b2bV4;
  if (!k) { sonuc.hata = "SITE"; sonuc.mesaj = "Sekmeyi bir kez yenileyin (F5)"; return sonuc; }
  const aranan = (new URLSearchParams(location.search).get("arama") || "").trim().toLocaleLowerCase("tr-TR");
  const uygun = (k.desiss || []).filter(c => {
    try { return (new URL(c.url, location.href).searchParams.get("aramaTerimi") || "").trim().toLocaleLowerCase("tr-TR") === aranan; } catch (e) { return false; }
  });
  if (!uygun.length) {
    if (performance.now() < 22000) { sonuc.imza = "bekle" + Date.now(); return sonuc; }
    sonuc.hata = "SITE"; sonuc.mesaj = "Arama cevabı yakalanamadı – incele'yi gönderin"; return sonuc;
  }
  if (Date.now() - k.son < 1200) { sonuc.imza = "geliyor" + Date.now(); return sonuc; }
  sonuc.imza = "desiss:" + uygun.length;
  const gorulen = new Set();
  for (const c of uygun) {
    for (const u of (c.veri && (c.veri.items || c.veri.Items)) || []) {
      const fiyat = Number(u.fiyat);
      if (!(fiyat > 0)) continue;
      const anahtar = (u.urunKod || u.parcaNo || u.oemNo) + "|" + u.marka;
      if (gorulen.has(anahtar)) continue;
      gorulen.add(anahtar);
      let marka = String(u.marka || "").trim();
      if (/^se[çc]iniz$/i.test(marka)) marka = "";
      const depolar = [];
      if (u.merkezStoktaVar) depolar.push("Merkez");
      if (u.msAvrupaStoktaVar) depolar.push("Avrupa");
      const stokVar = !!u.stoktaVar || depolar.length > 0;
      const ek = [u.anaModel, u.mensei ? "Menşei " + u.mensei : null].filter(Boolean).join(" / ");
      const resim = u.resimUrl && !/resimyok/i.test(u.resimUrl) ? u.resimUrl : null;
      sonuc.satirlar.push({
        kod: u.parcaNo || u.urunKod || u.oemNo || "", marka, oem: u.oemNo || "",
        ad: String(u.parcaAdi || "").trim() + (ek ? " – " + ek : ""),
        fiyat: Math.round(fiyat * 100) / 100, fiyatKdvli: Math.round(fiyat * (1 + kdv / 100) * 100) / 100,
        stok: depolar.length ? depolar.join(", ") : (stokVar ? "Var" : "Yok"), stokVar,
        resim, resimBuyuk: resim ? resim.replace("/thumb/", "/") : null,
      });
    }
  }
  return sonuc;
}

// ------------------------------------------------------------------ ADRESLE ARAMA (DE-GA gibi): cfg.yol icinde {q}
function adres_gonder(parca, cfg) {
  if (document.querySelector('input[type="password"]')) return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + cfg.yol.replace("{q}", encodeURIComponent(parca));
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

// ------------------------------------------------------------------ KART DUZENLI SITELER (KRAW): her urun bir kart
function kraw_oku(ayar) {
  ayar = ayar || {};
  const kdv = Number(ayar.kdv || 20);
  const sonuc = { isaret: window.__b2bIsaret || null, bitti: window.__b2bBitti === true, hazir: document.readyState === "complete", imza: "", satirlar: [] };
  if (document.querySelector('input[type="password"]')) { sonuc.hata = "GIRIS"; sonuc.mesaj = "Oturum kapanmış, sekmede tekrar giriş yapın"; return sonuc; }
  // Ayni sayfada (ajax) aranirken istekler bitmeden okuma
  if (window.__b2bIsaret && !window.__b2bBitti) return sonuc;
  const temiz = t => String(t || "").replace(/\s+/g, " ").trim();
  const adetKutu = e => /^(number|adet|qty|quantity)$/i.test(e.name || "") || /adet/i.test(e.placeholder || "");
  const kartlar = [];
  for (const q of document.querySelectorAll("input")) {
    if (!adetKutu(q)) continue;
    let kart = q, ust = q.parentElement;
    while (ust && ust !== document.body && [...ust.querySelectorAll("input")].filter(adetKutu).length === 1) { kart = ust; ust = ust.parentElement; }
    if (kart !== q && !kartlar.includes(kart)) kartlar.push(kart);
  }
  const yapraklar = kok => { const r = []; const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const p = n.parentElement; if (p && ["SCRIPT", "STYLE", "OPTION"].includes(p.tagName)) continue; const t = temiz(n.nodeValue); if (t) r.push(t); } return r; };
  const tlSayi = t => { const m = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺)/.exec(t); return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null; };
  const kodlar = [];
  for (const kart of kartlar) {
    const y = yapraklar(kart);
    const kod = y.find(t => /^[A-Z0-9]{1,6}-[A-Z0-9-]+$/i.test(t) && !/^\d{5}-/.test(t)) || "";
    const fiyat = y.map(tlSayi).find(v => v != null);
    if (!kod || fiyat == null) continue;
    kodlar.push(kod);
    const oemler = [...kart.querySelectorAll(".oems td, table td")].map(td => temiz(td.textContent)).filter(t => t && t !== "OEM");
    const iKod = y.indexOf(kod), iOem = y.indexOf("OEM");
    const ad = y.slice(iKod + 1, iOem > iKod ? iOem : iKod + 3).join(" – ");
    const stokYazi = y.find(t => /^stok (var|az|yok)$/i.test(t)) || "";
    const img = kart.querySelector("img[src]");
    const net = ayar.kdvDahil ? fiyat / (1 + kdv / 100) : fiyat;
    sonuc.satirlar.push({
      kod, marka: ayar.marka || "", oem: oemler.join(" / "), ad,
      fiyat: Math.round(net * 100) / 100, fiyatKdvli: Math.round(net * (1 + kdv / 100) * 100) / 100,
      stok: stokYazi.replace(/^stok\s*/i, ""), stokVar: stokYazi ? !/yok/i.test(stokYazi) : null,
      resim: img ? img.src : null, resimBuyuk: img ? img.src : null,
    });
  }
  const bilgi = (document.body.innerText || document.body.textContent || "").match(/\d+\s*Adet Ürün Bulundu|ürün bulunamadı/i);
  sonuc.imza = (bilgi ? bilgi[0] : "") + "|" + kodlar.join(",");
  return sonuc;
}

// ------------------------------------------------------------------ ALIM GECMISI (Eryaz B4B / V4): sitenin "Stok Hareketleri" verisi
// /Search/GetProductOrderYear -> yil listesi, /Search/GetProductOrderList {productCode, id} -> alimlar. Yalniz okur.
async function v4_gecmis(kodlar) {
  const iste = async (yol, veri) => {
    const c = await fetch(location.origin + yol, { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json;charset=utf-8", "X-Requested-With": "XMLHttpRequest" }, body: JSON.stringify(veri) });
    if (!c.ok) throw new Error("HTTP " + c.status);
    return c.json();
  };
  let yilId = 0;
  try { const yillar = await iste("/Search/GetProductOrderYear", {}); if (Array.isArray(yillar) && yillar.length) yilId = yillar[0].Id; }
  catch (e) { return { hata: "Alım geçmişi alınamadı (" + (e.message || e) + ")" }; }
  const tarih = t => { const m = /Date\((-?\d+)/.exec(String(t || "")); if (m) return Number(m[1]); const d = Date.parse(t); return isNaN(d) ? null : d; };
  const satirlar = [];
  const sira = [...new Set(kodlar)].slice(0, 30);
  for (let i = 0; i < sira.length; i += 5) {
    await Promise.all(sira.slice(i, i + 5).map(async kod => {
      try {
        const liste = await iste("/Search/GetProductOrderList", { productCode: kod, id: yilId });
        for (const e of (Array.isArray(liste) ? liste : [])) {
          satirlar.push({ tarih: tarih(e.Date), evrak: e.DocumentNo || "", kod: e.ProductCode || kod, ad: e.ProductName || "", marka: e.Manufacturer || "",
            miktar: Number(e.Quantity) || 0, birim: e.Unit || "", fiyat: Number(e.Price) || 0, toplam: Number(e.Total) || 0,
            isk: [e.Discount1, e.Discount2, e.Discount3, e.Discount4].map(Number).filter(x => x > 0) });
        }
      } catch (e) {}
    }));
  }
  return { satirlar };
}

// ------------------------------------------------------------------ ERYAZ B2B YENI (Lepar): search.aspx?q=... ve Search.aspx/SearchProduct ({d:"[...]"})
function eryaz_json_gonder(parca) {
  if (/login/i.test(location.pathname) || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/search.aspx?q=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

function eryaz_json_oku(ayar) {
  ayar = ayar || {};
  const kdv = Number(ayar.kdv || 20);
  const sonuc = { isaret: window.__b2bIsaret || null, hazir: document.readyState === "complete", imza: "", satirlar: [] };
  if (window.__b2bIsaret) { sonuc.imza = "eski" + Date.now(); return sonuc; }
  if (/login/i.test(location.pathname) || document.querySelector('input[type="password"]')) {
    sonuc.hata = "GIRIS"; sonuc.mesaj = "Oturum kapanmış, sekmede tekrar giriş yapın"; return sonuc;
  }
  const k = window.__b2bV4;
  if (!k) { sonuc.hata = "SITE"; sonuc.mesaj = "Sekmeyi bir kez yenileyin (F5)"; return sonuc; }
  const aranan = new URLSearchParams(location.search).get("q") || "";
  const an = s => { try { s = decodeURIComponent(String(s).replace(/\+/g, " ")); } catch (e) {} return String(s).toLocaleUpperCase("tr-TR").replace(/[^0-9A-ZÇĞİÖŞÜ]/g, ""); };
  // Yalniz aranan metinle yapilan aramanin cevabi (bos arama tum urunleri getirir, onu alma)
  const uygun = (k.cevaplar || []).filter(c => { const m = /t9Text\s*:\s*'([^']*)'/.exec(c.govde || "") || /"t9Text"\s*:\s*"([^"]*)"/.exec(c.govde || ""); return m && an(m[1]) && an(m[1]) === an(aranan); });
  if (!uygun.length) {
    if (performance.now() < 22000) { sonuc.imza = "bekle" + Date.now(); return sonuc; }
    sonuc.hata = "SITE"; sonuc.mesaj = "Arama cevabı yakalanamadı – incele'yi gönderin"; return sonuc;
  }
  if (Date.now() - k.son < 1200) { sonuc.imza = "geliyor" + Date.now(); return sonuc; }
  sonuc.imza = "json:" + uygun.length;
  const gorulen = new Set();
  for (const u of uygun.flatMap(c => c.liste)) {
    if (!u || gorulen.has(u.Id)) continue;
    gorulen.add(u.Id);
    const net = Number(u.Cost);
    if (!(net > 0)) continue;
    const kdvli = Number(u.CostWithVAT) > 0 ? Number(u.CostWithVAT) : net * (1 + (Number(u.TaxRate) || kdv) / 100);
    const durum = String(u.AvailableText || "").trim();
    const stokVar = /var/i.test(durum) && !/yok/i.test(durum);
    const kmp = !!(u.Campaign && Number(u.Campaign.Type) > 0);
    const resim = u.Picture && u.PicturePath ? u.PicturePath : null;
    sonuc.satirlar.push({
      kod: u.Code || "", marka: u.Manufacturer || "", oem: String(u.ManufacturerCode || "").replace(/^-$/, ""),
      ad: String(u.Name || "").trim() + (u.Notes3 ? " – " + u.Notes3 : "") + (u.Notes1 && u.Notes1 !== u.Manufacturer ? " (" + u.Notes1 + ")" : ""),
      fiyat: Math.round(net * 100) / 100, fiyatKdvli: Math.round(kdvli * 100) / 100,
      stok: durum || (stokVar ? "Var" : "Yok"), stokVar, kampanya: kmp, resim, resimBuyuk: resim, urunId: u.Id,
    });
  }
  return sonuc;
}

// ------------------------------------------------------------------ ALIM GECMISI (Lepar / Eryaz B2B yeni): Search.aspx/GetStockActivity
// Parametre adi bilinmedigi icin birkac olasi ad denenir; calisan ad sekmede hatirlanir. Alan adlari esnek eslenir.
async function eryaz_json_gecmis(urunler) {
  const iste = async (yol, govde) => {
    const c = await fetch(location.origin + "/" + yol, { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json; charset=utf-8", "X-Requested-With": "XMLHttpRequest" }, body: govde });
    if (!c.ok) throw new Error("HTTP " + c.status);
    let v = await c.json();
    if (v && typeof v.d === "string") { try { v = JSON.parse(v.d); } catch (e) { v = v.d; } } else if (v && "d" in v) v = v.d;
    return v;
  };
  const adaylar = window.__b2bGecmisParam ? [window.__b2bGecmisParam] : ["productId", "id", "groupId", "productID", "ProductId", "stockId"];
  const yol = "Search.aspx/GetStockActivity";
  const tarih = t => { if (t == null) return null; const m = /Date\((-?\d+)/.exec(String(t)); if (m) return Number(m[1]);
    const g = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(String(t)); if (g) return new Date(+g[3], +g[2] - 1, +g[1]).getTime(); const d = Date.parse(t); return isNaN(d) ? null : d; };
  const sayi = v => typeof v === "number" ? v : (v == null ? NaN : Number(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")));
  const anahtar = (e, re, haric) => Object.keys(e).find(a => re.test(a) && !(haric && haric.test(a)));
  const satirlar = []; let ornek = null, sonHata = null;
  for (const u of urunler.slice(0, 30)) {
    if (!u.id) continue;
    let liste = null;
    for (const p of adaylar) {
      try { liste = await iste(yol, `{${p}: ${Number(u.id)}}`); window.__b2bGecmisParam = p; break; }
      catch (e) { sonHata = String(e.message || e); }
    }
    if (!Array.isArray(liste)) { if (liste && !ornek) ornek = JSON.stringify(liste).slice(0, 1500); continue; }
    for (const e of liste) {
      if (!e || typeof e !== "object") continue;
      if (!ornek) ornek = JSON.stringify(e).slice(0, 1500);
      const kT = anahtar(e, /date|tarih/i), kE = anahtar(e, /document|fiche|fis|fiş|evrak|belge|docno|dosya/i, /id$/i),
        kTur = anahtar(e, /type|tur|tür|islem|işlem|trcode/i, /id$/i), kM = anahtar(e, /quantity|miktar|amount|qty/i),
        kB = anahtar(e, /unit|birim/i), kNF = anahtar(e, /net.?price|price.?net|net.?fiyat|fiyat.?net|netfiyat|costnet|^cost$/i, /vat|kdv|total|tutar/i),
        kF = anahtar(e, /price|fiyat/i, /vat|kdv|total|tutar|net/i), kNT = anahtar(e, /net.?total|net.?tutar|nettutar|total.?net/i, /vat|kdv/i),
        kTop = anahtar(e, /total|tutar|toplam/i, /vat|kdv|net/i);
      const fiyat = sayi(e[kNF] ?? e[kF]), miktar = sayi(e[kM]);
      const toplam = sayi(e[kNT] ?? e[kTop]);
      satirlar.push({ tarih: tarih(e[kT]), evrak: String(e[kE] ?? ""), tur: String(e[kTur] ?? ""), kod: u.kod, ad: u.ad || "", marka: "",
        miktar: isNaN(miktar) ? 0 : miktar, birim: String(e[kB] ?? ""), fiyat: isNaN(fiyat) ? 0 : fiyat,
        toplam: isNaN(toplam) ? (isNaN(fiyat) || isNaN(miktar) ? 0 : fiyat * miktar) : toplam,
        isk: Object.keys(e).filter(a => /disc|isk/i.test(a)).map(a => sayi(e[a])).filter(x => x > 0 && x < 100) });
    }
  }
  window.__b2bGecmisOrnek = { ornek, sonHata, param: window.__b2bGecmisParam || null };
  if (!satirlar.length && sonHata && !window.__b2bGecmisParam) return { hata: "Alım geçmişi alınamadı (" + sonHata + ")" };
  return { satirlar };
}

// Karpart: her urunun satirina tiklanir, "Onceki Alimlarimiz" tablosu o urune gore dolar; tablo okunur
async function karpart_gecmis(urunler) {
  const satirlar = [];
  for (const u of urunler.slice(0, 10)) {
    const tr = [...document.querySelectorAll("tr")].find(t => t.querySelector('td[onclick*="urunPopoverSet"]') && t.innerText.includes(u.kod));
    if (!tr) continue;
    tr.click();
    await new Promise(r => setTimeout(r, 1500));
    for (const s of document.querySelectorAll("#oncekialimlarUrunListesi tr")) {
      const h = [...s.children].map(c => (c.innerText || c.textContent || "").trim());
      if (h.length < 5) continue;
      const sayi = t => Number(String(t).replace(/\./g, "").replace(",", ".")) || 0;
      const t = /(\d{2})\.(\d{2})\.(\d{4})/.exec(h[4]);
      const miktar = sayi(h[2]), fiyat = sayi(h[3]);
      satirlar.push({ kod: u.kod, ad: u.ad || "", evrak: h[0], miktar, birim: "", fiyat, toplam: Math.round(miktar * fiyat * 100) / 100, isk: [], tarih: t ? new Date(+t[3], +t[2] - 1, +t[1]).getTime() : 0 });
    }
  }
  return { satirlar };
}

// Mydpar: satira tiklanir, "Onceki Alimlar" tablosu (Belge No | Miktar | Net Fiyat | Tarih) okunur
async function mydpar_gecmis(urunler) {
  const satirlar = [];
  let onceki = "";   // tablo bir onceki urunle ayni kaldiysa o urune ait degildir (guncellenmemis)
  for (const u of urunler.slice(0, 10)) {
    let tr = [...document.querySelectorAll("tr")].find(t => t.querySelector("td[pid], td[id^='pop']") && t.innerText.includes(u.kod));
    // Isaretsiz siteler (Ilkem): kodu iceren en ic satir
    if (!tr) tr = [...document.querySelectorAll("tr")].find(t => t.children.length >= 5 && t.querySelectorAll("tr").length === 0 && t.innerText.includes(u.kod));
    if (!tr) continue;
    // Kodu mavi bir baglanti olan siteler icin (Kuzey Oto): once o baglantiya tikla, yoksa satira
    const baglanti = [...tr.querySelectorAll("a")].find(a => (a.innerText || "").trim() === u.kod);
    (baglanti || tr).click();
    await new Promise(r => setTimeout(r, 1500));
    const tablo = [...document.querySelectorAll("table")].find(t => t.querySelectorAll("table").length === 0 && /Belge No/i.test(t.innerText) && /Net Fiyat/i.test(t.innerText));
    if (!tablo) continue;
    if (tablo.innerText === onceki) continue;
    onceki = tablo.innerText;
    for (const s of tablo.querySelectorAll("tbody tr")) {
      const h = [...s.children].map(c => (c.innerText || c.textContent || "").trim());
      if (h.length < 4) continue;
      const sayi = t => Number(String(t).replace(/\./g, "").replace(",", ".")) || 0;
      const t = /(\d{2})\.(\d{2})\.(\d{4})/.exec(h[3]);
      const miktar = sayi(h[1]), fiyat = sayi(h[2]);
      satirlar.push({ kod: u.kod, ad: u.ad || "", evrak: h[0], miktar, birim: "", fiyat, toplam: Math.round(miktar * fiyat * 100) / 100, isk: [], tarih: t ? new Date(+t[3], +t[2] - 1, +t[1]).getTime() : 0 });
    }
  }
  return { satirlar };
}

// Asin: urunun detay sayfasi arka planda acilir (sekme degismez), "Stok Hareketleri" tablosu okunur
async function asin_gecmis(urunler) {
  const satirlar = [];
  const sayi = t => { const s = String(t || "").replace(/[^\d.,-]/g, ""); return s.includes(",") ? (Number(s.replace(/\./g, "").replace(",", ".")) || 0) : (Number(s) || 0); };
  for (const u of urunler.slice(0, 10)) {
    const tr = [...document.querySelectorAll("tr")].find(t => t.children.length >= 3 && t.querySelectorAll("tr").length === 0 && t.innerText.includes(u.kod));
    const link = tr && [...tr.querySelectorAll("a")].find(a => /ProductDetail/i.test(a.getAttribute("href") || ""));
    if (!link) continue;
    const html = await (await fetch(link.href, { credentials: "include" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const kap = doc.getElementById("gvOrders");
    if (!kap) continue;
    const basliklar = [...kap.querySelectorAll(".Heading .Cell")].map(c => (c.textContent || "").trim().toLowerCase());
    const idx = ad => basliklar.findIndex(b => b.startsWith(ad));
    const iTar = idx("tarih"), iDos = idx("dosya"), iMik = idx("miktar"), iBir = idx("birim"), iFiy = idx("fiyat"), iIsk = idx("iskonto 1"), iTop = idx("toplam");
    for (const r of kap.querySelectorAll(".Row")) {
      const h = [...r.querySelectorAll(".Cell")].map(c => (c.textContent || "").trim());
      if (!h.length || iTar < 0) continue;
      const t = /(\d{2})\/(\d{2})\/(\d{4})/.exec(h[iTar] || "");
      const miktar = sayi(h[iMik]), fiyat = sayi(h[iFiy]);
      satirlar.push({ kod: u.kod, ad: u.ad || "", evrak: (iDos >= 0 && h[iDos]) || h[iTar], miktar, birim: iBir >= 0 ? h[iBir] : "", fiyat, toplam: iTop >= 0 && sayi(h[iTop]) ? sayi(h[iTop]) : Math.round(miktar * fiyat * 100) / 100, isk: iIsk >= 0 && sayi(h[iIsk]) ? [sayi(h[iIsk])] : [], tarih: t ? new Date(+t[3], +t[2] - 1, +t[1]).getTime() : 0 });
    }
  }
  return { satirlar };
}

// Basbug grubu: urunun bize satis (alim) gecmisi - /Service/GetCustomerProductSellHistory {productID}
async function a_grup_gecmis(urunler) {
  const satirlar = []; let sonHata = null, ornek = null;
  function islenecek(v, u) {
    for (const e of v) {
        if (!ornek) ornek = JSON.stringify(e).slice(0, 1500);
        const m = /Date\((-?\d+)/.exec(String(e.InvoiceDate || ""));
        const fiyat = Number(e.NetPriceWoVat ?? e.ListPrice) || 0, miktar = Number(e.Amount) || 0;
        satirlar.push({ tarih: m ? Number(m[1]) : null, evrak: String(e.CleanDocumentNr || e.DocumentNr || ""), tur: "", kod: u.kod,
          ad: e.ProductName || u.ad || "", marka: "", miktar, birim: e.UnitType || "", fiyat: Math.round(fiyat * 100) / 100,
          toplam: Math.round(fiyat * miktar * 100) / 100,
          isk: [1, 2, 3, 4, 5, 6].map(i => Number(e["Discount" + i])).filter(x => x > 0 && x < 100) });
    }
  }
  const secili = urunler.filter(u => u.id && u.alimVar).slice(0, 10);
  // Site her istege kendi imzasini ekler ve disaridan yapilan istegi reddeder ("Client Server Validation Error").
  // Bu yuzden sitenin kendi ekranini kullaniriz: urun satirini secip "Stok Gecmisi"ne basariz,
  // sitenin gonderdigi istegin cevabini v4_kanca.js kaydeder, biz onu okuruz.
  const bekle = ms => new Promise(r => setTimeout(r, ms));
  const kayit = window.__b2bV4;
  if (!kayit) return { hata: "Sayfa kaydedicisi yok – sekmeyi F5 ile yenileyin" };
  const gorunur = el => !!(el && el.offsetParent !== null);
  const dugmeBul = () => [...document.querySelectorAll("button, a, [role=tab], li")].find(b => gorunur(b) && /^\s*Stok Geçmişi\s*$/i.test(b.innerText || ""));
  const norm = x => String(x || "").replace(/\s+/g, " ").trim().toUpperCase();
  const teshis = [];
  const satirBul = kod => {
    const k = norm(kod), kSade = k.replace(/[^A-Z0-9]/g, "");
    let en = null, enUz = 1e9;
    for (const el of document.querySelectorAll("body *")) {
      if (/^(SCRIPT|STYLE|svg)$/i.test(el.tagName)) continue;
      const t = norm(el.textContent);
      if (t.length > k.length + 40 || t.length >= enUz) continue;
      if ((t.includes(k) || t.replace(/[^A-Z0-9]/g, "").includes(kSade)) && gorunur(el)) { en = el; enUz = t.length; }
    }
    if (!en) {
      // teshis: kodun son parcasini iceren ilk gorunur oge
      const parca = k.split(" ").pop();
      const ip = [...document.querySelectorAll("body *")].find(el => el.childElementCount === 0 && gorunur(el) && norm(el.textContent).includes(parca));
      teshis.push({ kod, ornek: ip ? (ip.closest("datatable-body-row, tr, [role=row]") || ip.parentElement || ip).outerHTML.slice(0, 700) : null });
      return null;
    }
    return en.closest("datatable-body-row, tr, [role=row], .datatable-row-wrapper") || en;
  };
  const cevapBekle = async (id, bas) => {
    const son = Date.now() + 7000;
    while (Date.now() < son) {
      const c = (kayit.ilgili || []).find(x => x.t >= bas && /GetCustomerProductSellHistory/i.test(x.url) && x.govde.includes(String(id)));
      if (c) return c;
      await bekle(150);
    }
    return null;
  };
  for (const u of secili) {
    try {
      const satir = satirBul(u.kod);
      if (!satir) { sonHata = "satır bulunamadı: " + u.kod; continue; }
      const bas = Date.now();
      satir.scrollIntoView({ block: "center" });
      satir.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      await bekle(600);
      let c = (kayit.ilgili || []).find(x => x.t >= bas && /GetCustomerProductSellHistory/i.test(x.url) && x.govde.includes(String(u.id)));
      if (!c) { const d = dugmeBul(); if (d) d.click(); else { sonHata = "Stok Geçmişi düğmesi bulunamadı"; continue; } c = await cevapBekle(u.id, bas); }
      if (!c) { sonHata = "cevap gelmedi: " + u.kod; continue; }
      let v = JSON.parse(c.cevap);
      for (const k of Object.keys(v || {})) if (k.endsWith("Result")) { const x = v[k]; if (typeof x === "string") { try { v = JSON.parse(x); } catch (e) { throw new Error(x.slice(0, 80)); } } else v = x; break; }
      if (!Array.isArray(v)) { if (!ornek) ornek = JSON.stringify(v).slice(0, 1500); continue; }
      islenecek(v, u);
    } catch (e) { sonHata = String(e.message || e); }
  }
  const http = null;
  window.__b2bGecmisOrnek = { ornek, sonHata, secili: secili.map(u => u.kod), satirlar: satirlar.length, teshis: teshis.slice(0, 3) };
  if (!satirlar.length && sonHata) return { hata: "Alım geçmişi alınamadı (" + sonHata + ")" };
  return { satirlar };
}

function hazirlaniyor() { return { hata: "SITE", mesaj: "Okuyucu hazırlanıyor – sitede bir parça arayıp incele'yi gönderin" }; }

const OKUYUCULAR = {
  hazirlaniyor: hazirlaniyor,
  eryaz_v4: { gonder: eryaz_v4_gonder, oku: eryaz_v4_oku },
  megatek: { gonder: eryaz_v4_gonder, oku: megatek_oku },
  eryaz_json: { gonder: eryaz_json_gonder, oku: eryaz_json_oku },
  desiss: { gonder: desiss_gonder, oku: desiss_oku },
  a_grup: okuyucu_a_grup,
  eryaz_web: okuyucu_eryaz_web,
  eryaz_b2b: { gonder: eryaz_b2b_gonder, oku: eryaz_b2b_oku },   // iki adimli (sayfa yenilenir)
  // TEST: Basdas - her aramada adresle (?q=) yukleme; eski sonuc gosterilmez
  eryaz_b2b_adres: { gonder: p => eryaz_b2b_gonder(p, { adresleAra: true }), oku: eryaz_b2b_oku },
  sadece_b2b: { gonder: genel_gonder, oku: genel_oku, cfg: { kutu: ["quick-kelime"], dugme: ["urunAra"], alan: "aramaekrani" } },
  guneybaglilar: { gonder: genel_gonder, oku: genel_oku, cfg: { kutu: ["txtAra"], dugme: ["btnAra"], alan: "tablo_wrapper" } },
  bursa_nisa: { gonder: genel_gonder, oku: genel_oku, cfg: { kutu: ["urun-ara"], dugmeSec: "#searchform button", alan: "formUrunSearch" } },
  senbay: { gonder: genel_gonder, oku: genel_oku, cfg: { sayfa: "/Stok", dugmeMetin: "Bul" } },
  kraw: { gonder: genel_gonder, oku: kraw_oku, cfg: { kutuSec: 'input[name="q"]', formGonder: true } },
  dega: { gonder: adres_gonder, oku: genel_oku, cfg: { yol: "/productsearch?key={q}&showType=0&groupId=", bekle: "adet ürün bulundu|ürün bulunamadı|sonuç bulunamadı" } },
  glopar: { gonder: genel_gonder, oku: genel_oku, cfg: { kutu: ["urunAra"], dugme: ["btnUrun"], alan: "divUrunListele" } },
};
