// Kuzey Oto arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: sadece_b2b
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_kuzey_oto_gonder(parca, cfg) {
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

async function b2b_kuzey_oto_oku(ayar, cfg) {
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

OKUYUCULAR.kuzey_oto = { gonder: b2b_kuzey_oto_gonder, oku: b2b_kuzey_oto_oku, cfg: { kutu: ["quick-kelime"], dugme: ["urunAra"], alan: "aramaekrani" } };
