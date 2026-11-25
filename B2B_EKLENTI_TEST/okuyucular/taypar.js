// Taypar arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: eryaz_v4
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_taypar_gonder(parca) {
  if (document.getElementById("Password") || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/Search?text=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

async function b2b_taypar_oku(ayar) {
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

OKUYUCULAR.taypar = { gonder: b2b_taypar_gonder, oku: b2b_taypar_oku };
