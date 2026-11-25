// Mega-Tek arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: megatek
// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.
// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.

function b2b_mega_tek_gonder(parca) {
  if (document.getElementById("Password") || document.querySelector('input[type="password"]'))
    return { hata: "GIRIS", mesaj: "Oturum kapalı, sekmede giriş yapın" };
  window.__b2bIsaret = Date.now();
  const hedef = location.origin + "/Search?text=" + encodeURIComponent(parca);
  setTimeout(() => { location.href = hedef; }, 30);
  return { tamam: true, eski: "" };
}

async function b2b_mega_tek_oku(parca, ayar) {
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

OKUYUCULAR.mega_tek = { gonder: b2b_mega_tek_gonder, oku: b2b_mega_tek_oku };
