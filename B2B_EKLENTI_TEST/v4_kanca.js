// Butun B2B sekmelerinde calisir. Eryaz V4 ve Desiss (Mest) arama cevaplarini, kurlari ve
// alim gecmisi/siparis gibi isteklerin adreslerini kaydeder. Eklenti bu kaydi okur. Hicbir sey gondermez.
(function () {
  if (window.__b2bV4Kanca) return;
  window.__b2bV4Kanca = true;
  const kayit = window.__b2bV4 = { liste: [], son: 0, adet: 0, urller: [], hata: null, kur: null, cevaplar: [], desiss: [], ilgili: [], basliklar: {} };
  // Alim gecmisi / siparis / hareket gibi istekler: adresi, gonderilen veri ve cevabin basi (teshis ve okuma icin)
  const ILGI = /hareket|history|gecmis|geçmiş|order|siparis|sipariş|alim|alım|movement|purchase|previous|onceki|önceki|fatura|invoice|transaction|buy|detail|detay/i;
  const isle = (url, metin, govde) => {
    try {
      kayit.urller.push({ u: String(url).slice(0, 160), g: String(govde || "").slice(0, 200) });
      if (kayit.urller.length > 80) kayit.urller.shift();
      if (ILGI.test(url)) {
        kayit.ilgili.push({ url: String(url).slice(0, 300), govde: String(govde || "").slice(0, 600), cevap: String(metin || "").slice(0, /SellHistory/i.test(url) ? 300000 : 6000), t: Date.now() });
        if (kayit.ilgili.length > 12) kayit.ilgili.shift();
      }
      if (/GetCurrencyList/i.test(url)) { try { kayit.kur = JSON.parse(metin); } catch (e) {} return; }
      if (/\/api\/urunler\/search/i.test(url)) {        // Desiss (Mest) bayi paneli
        try { kayit.desiss.push({ url: String(url), veri: JSON.parse(metin) }); } catch (e) { kayit.hata = "Mest cevabi okunamadi"; }
        kayit.son = Date.now(); return;
      }
      if (!/SearchProduct/i.test(url)) return;
      kayit.ham = String(metin).slice(0, 3000);
      // Cevap dogrudan liste, ya da {ProductList: ...} gibi bir paket (icinde metin olarak JSON da olabilir)
      const coz = x => { if (typeof x === "string") { try { return JSON.parse(x); } catch (e) { return x; } } return x; };
      const listeBul = (x, d) => {
        x = coz(x);
        if (Array.isArray(x)) return x;
        if (!x || typeof x !== "object" || d > 4) return null;
        for (const a of ["ProductList", "productList", "Products", "Data", "data", "Items", "items", "Result", "result", "List", "list"])
          if (a in x) { const r = listeBul(x[a], d + 1); if (r) return r; }
        for (const v of Object.values(x)) { const r = listeBul(v, d + 1); if (r && r.length && typeof r[0] === "object") return r; }
        return null;
      };
      const v = coz(metin);
      const liste = listeBul(v, 0);
      kayit.adet++;
      kayit.son = Date.now();
      if (Array.isArray(liste)) { kayit.liste.push(...liste); kayit.cevaplar.push({ govde: String(govde || "").slice(0, 2000), liste }); }
      else kayit.hata = "Beklenmeyen cevap: " + Object.keys(v || {}).slice(0, 15).map(a => a + ":" + typeof v[a]).join(",");
    } catch (e) { kayit.hata = String(e.message || e); kayit.son = Date.now(); }
  };
  const oGon = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (b) { try { this.__b2bGovde = typeof b === "string" ? b : (b instanceof URLSearchParams ? b.toString() : ""); } catch (e) {} return oGon.apply(this, arguments); };
  // Sitenin kendi isteklerine ekledigi oturum basliklari (token vb.). Yalniz bu sayfanin bellegidedir, disari gonderilmez;
  // eklenti ayni siteye yapacagi okuma isteklerinde (alim gecmisi) bunlari kullanir.
  const STD = /^(content-type|accept|accept-language|cache-control|pragma|x-requested-with)$/i;
  const baslikAl = (ad, deger) => { try { if (ad && !STD.test(ad) && deger != null) kayit.basliklar[String(ad)] = String(deger); } catch (e) {} };
  const oBaslik = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (ad, deger) { baslikAl(ad, deger); return oBaslik.apply(this, arguments); };
  const oAc = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, url) {
    this.__b2bUrl = url;
    this.addEventListener("load", () => { let t = ""; try { t = (!this.responseType || this.responseType === "text") ? this.responseText : ""; } catch (e) {} try { isle(this.responseURL || this.__b2bUrl, t, this.__b2bGovde); } catch (e) {} });
    return oAc.apply(this, arguments);
  };
  const oFetch = window.fetch;
  window.fetch = function (girdi, ayr) {
    const url = typeof girdi === "string" ? girdi : (girdi && girdi.url) || "";
    try { const h = (ayr && ayr.headers) || (girdi && girdi.headers); if (h) { if (typeof h.forEach === "function" && !Array.isArray(h)) h.forEach((v, a) => baslikAl(a, v)); else if (Array.isArray(h)) h.forEach(([a, v]) => baslikAl(a, v)); else Object.entries(h).forEach(([a, v]) => baslikAl(a, v)); } } catch (e) {}
    return oFetch.apply(this, arguments).then(c => {
      const g = ayr && typeof ayr.body === "string" ? ayr.body : "";
      if (/SearchProduct|GetCurrencyList|\/api\/urunler\/search/i.test(url) || ILGI.test(url)) c.clone().text().then(t => isle(url, t, g)).catch(() => {});
      else isle(url, "", g);
      return c;
    });
  };
})();
