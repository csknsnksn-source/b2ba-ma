// Mest arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: desiss
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_mest_gonder(parca) {
  if (/\/login/i.test(location.pathname) || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/urunler?arama=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

function b2b_mest_oku(ayar) {
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

OKUYUCULAR.mest = { gonder: b2b_mest_gonder, oku: b2b_mest_oku };
