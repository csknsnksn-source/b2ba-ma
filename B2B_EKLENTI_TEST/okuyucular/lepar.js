// Lepar arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: eryaz_json
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_lepar_gonder(parca) {
  if (/login/i.test(location.pathname) || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/search.aspx?q=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

function b2b_lepar_oku(ayar) {
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

OKUYUCULAR.lepar = { gonder: b2b_lepar_gonder, oku: b2b_lepar_oku };
