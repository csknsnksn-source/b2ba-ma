// İntermobil arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: eryaz_web
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

async function b2b_intermobil_tek(parca) {
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

OKUYUCULAR.intermobil = b2b_intermobil_tek;
