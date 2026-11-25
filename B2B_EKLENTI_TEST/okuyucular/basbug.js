// Başbuğ arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: a_grup
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

async function b2b_basbug_tek(parca) {
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

OKUYUCULAR.basbug = b2b_basbug_tek;
