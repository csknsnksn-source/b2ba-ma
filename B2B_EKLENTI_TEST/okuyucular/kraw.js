// KRAW arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: kraw
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_kraw_gonder(parca, cfg) {
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

function b2b_kraw_oku(ayar) {
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

OKUYUCULAR.kraw = { gonder: b2b_kraw_gonder, oku: b2b_kraw_oku, cfg: { kutuSec: 'input[name="q"]', formGonder: true } };
