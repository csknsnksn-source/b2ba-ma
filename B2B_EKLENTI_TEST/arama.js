// B2B Ortak Arama - arama sayfasi
const $ = s => document.querySelector(s);
const SURE_SINIRI = 30000;   // bir site icin en fazla bekleme (ms)

let sonuclar = [];           // tum satirlar
let durumlar = {};           // site adi -> {durum, mesaj, adet, sure}
let secB2B = new Set(), secMarka = new Set();

const para = n => n == null ? "" : n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
const kacis = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ------------------------------------------------------------------ sekme bulma
const kucuk = t => String(t || "").toLocaleLowerCase("tr-TR");
async function sekmeBul(site) {
  // Adresi bilinmeyen sitelerde sekme, sayfa basligindan bulunur
  const sekmeler = site.desen ? await chrome.tabs.query({ url: site.desen })
    : (await chrome.tabs.query({})).filter(t => kucuk(t.title).includes(kucuk(site.baslik)) && /^https?:/.test(t.url || ""));
  if (!sekmeler.length) return null;
  // Oncelik: arama sayfasinda olan, sonra son kullanilan
  const ara = t => /search/i.test(t.url || "") ? 1 : 0;
  sekmeler.sort((a, b) => (ara(b) - ara(a)) || ((b.lastAccessed || 0) - (a.lastAccessed || 0)));
  return sekmeler[0];
}

let oncekiSonuc = {};   // her B2B icin son aramanin parcasi ve sonuc imzasi (eski liste kontrolu); kalici hafizada tutulur
chrome.storage.local.get("oncekiSonuc").then(v => { oncekiSonuc = v.oncekiSonuc || {}; }).catch(() => { });
async function siteAra(site, parca) {
  const bas = performance.now();
  const sekme = await sekmeBul(site);
  if (!sekme) return { durum: "yok", mesaj: "Sekme açık değil" };
  if (sekme.discarded) { try { await chrome.tabs.reload(sekme.id); await new Promise(r => setTimeout(r, 3000)); } catch (e) { } }
  // Intermobil: arama kutusu yalniz arama sayfasinda; sekme ana sayfadaysa eklenti kendisi arama sayfasina gecer
  if ((site.tur || site.okuyucu) === "eryaz_web" && !/\/search/i.test(sekme.url || "")) {
    try {
      await chrome.tabs.update(sekme.id, { url: new URL("/tr/search", sekme.url).href });
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 500));
        const t = await chrome.tabs.get(sekme.id);
        if (t.status === "complete" && /\/search/i.test(t.url || "")) break;
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) { }
  }
  // Firma dosyasi (okuyucular/<firma>.js) yoksa eski ortak okuyucuya (tur) dusulur
  const okuyucu = OKUYUCULAR[site.okuyucu] || OKUYUCULAR[site.tur];
  let sonuc;
  try {
    sonuc = typeof okuyucu === "function"
      ? await tekAdim(sekme.id, okuyucu, parca, site.ayar || {})
      : await ikiAdim(sekme.id, okuyucu, parca, site.ayar || {});
  } catch (e) { sonuc = { hata: "SITE", mesaj: String(e.message || e) }; }
  if (sonuc.hata && /permission|izin/i.test(sonuc.mesaj || ""))
    sonuc = { hata: "GIRIS", mesaj: "İzin yok – tıklayın", izinAdresi: new URL(sekme.url).origin + "/*" };
  const sure = ((performance.now() - bas) / 1000).toFixed(1);
  if (sonuc.hata) return { durum: sonuc.hata === "GIRIS" ? "giris" : "hata", mesaj: sonuc.mesaj, sure, sekmeId: sekme.id, izinAdresi: sonuc.izinAdresi };
  let satirlar = (sonuc.satirlar || []).map(r => ({ ...r, b2b: site.ad, sekmeId: sekme.id }));
  // Eski sonuc kontrolu: site farkli bir parca aranmasina ragmen onceki aramanin ayni listesini gosteriyorsa bu satirlar gosterilmez
  const imza = satirlar.map(r => r.kod).sort().join("|");
  const onceki = oncekiSonuc[site.ad];
  // (eski sonuc filtresi kaldirildi: ayni urun listesini donen farkli aramalarda gecerli satirlari gizliyordu)
  oncekiSonuc[site.ad] = { parca, imza };
  chrome.storage.local.set({ oncekiSonuc }).catch(() => { });
  return { durum: "ok", adet: satirlar.length, satirlar, sure, sekmeId: sekme.id };
}

const bekle = ms => new Promise(r => setTimeout(r, ms));
const calistir = (tabId, func, args) =>
  chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func, args })
    .then(r => (r && r[0] && r[0].result) || null);

// B2B sitelerinin bildirim/duyuru popup'larini kapatir (aramayi engellemesin diye). Self-contained (sayfaya tek basina gider).
// Yalnizca diyalog/modal kutularinin ICINDEKI kapatma dugmelerine tiklar; kutu disina dokunmaz.
async function popupKapat() {
  const dugmeMetinleri = ["tamam", "kapat", "anladım", "anladim", "okudum", "sonra", "daha sonra", "hayır", "hayir", "ok", "×", "x", "vazgeç", "vazgec"];
  const kapandi = [];
  const gorunur = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const kutular = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal.show, .modal.in, .swal2-popup, .ui-dialog, .bootbox, [class*="modal" i], [class*="popup" i], [class*="duyuru" i], [class*="bildirim" i]')].filter(gorunur);
  for (const k of kutular) {
    const dugme = [...k.querySelectorAll("button, a, input[type=button], input[type=submit], span, div")].find(b => {
      if (b.children.length > 1) return false;
      const t = (b.innerText || b.value || "").trim().toLowerCase();
      return t && dugmeMetinleri.includes(t) && gorunur(b);
    });
    if (dugme) { dugme.click(); kapandi.push((dugme.innerText || dugme.value || "").trim()); }
  }
  // Kapatilamayan arka plan perdesi aramanin tiklamalarini engelleyebilir: kaldir
  for (const o of document.querySelectorAll(".modal-backdrop, .swal2-container, .overlay-backdrop")) {
    if (gorunur(o)) { o.remove(); kapandi.push("perde"); }
  }
  return kapandi;
}

// Sayfa yenilenmeyen siteler: tek fonksiyon arar ve sonucu dondurur
async function tekAdim(tabId, func, parca, ayar) {
  const zaman = new Promise(r => setTimeout(() => r({ hata: "ZAMAN", mesaj: "Site cevap vermedi" }), SURE_SINIRI));
  await calistir(tabId, popupKapat, []).catch(() => null);   // bildirim popup'i aramayi engellemesin
  return (await Promise.race([calistir(tabId, func, [parca, ayar]), zaman])) || { hata: "SITE", mesaj: "Sonuç alınamadı" };
}

// "Ara"da sayfasi bastan yuklenen siteler: once gonder, sonra sayfa yuklenince oku
async function ikiAdim(tabId, okuyucu, parca, ayar) {
  const cfg = okuyucu.cfg || {};
  await calistir(tabId, popupKapat, []).catch(() => null);   // gonderimden once popup'lari kapat
  let g = await calistir(tabId, okuyucu.gonder, [parca, cfg]);
  if (g && g.yonlendi) {
    // Sekme arama sayfasina geciyor: yuklenmesini bekleyip aramayi yeniden baslat
    const son = Date.now() + 15000;
    await bekle(800);
    g = null;
    while (Date.now() < son) {
      try {
        const t = await chrome.tabs.get(tabId);
        if (t.status === "complete") { g = await calistir(tabId, okuyucu.gonder, [parca, cfg]); if (g && !g.yonlendi) break; }
      } catch (e) { }
      await bekle(400);
    }
    if (!g || g.yonlendi) return { hata: "SITE", mesaj: "Arama sayfası açılamadı" };
  }
  if (!g) return { hata: "SITE", mesaj: "Arama başlatılamadı" };
  if (g.hata) return g;
  const bitis = Date.now() + SURE_SINIRI;
  const basladi = Date.now();
  let onceki = null, sabit = 0, son = null;
  await bekle(600);
  while (Date.now() < bitis) {
    let r = null;
    await calistir(tabId, popupKapat, []).catch(() => null);   // okumadan once popup'lari kapat
    try { r = await calistir(tabId, okuyucu.oku, [ayar, cfg]); } catch (e) { r = null; }   // sayfa yuklenirken hata normal
    if (r) {
      if (r.hata === "GIRIS" || r.hata === "SITE") return r;
      son = r;
      const yeni = (r.isaret == null && r.hazir) || (r.bitti && Date.now() - basladi > 1500) || (r.imza && r.imza !== g.eski);
      // Hicbir degisiklik yoksa (parca yok, sayfa ayni kaldi) 12 sn sonra "yok" kabul et
      if (!yeni && Date.now() - basladi > 12000 && r.hazir) return { tamam: true, satirlar: r.satirlar || [] };
      if (yeni) {
        if (r.imza === onceki) { if (++sabit >= 1) return { tamam: true, satirlar: r.satirlar }; }
        else { onceki = r.imza; sabit = 0; }
      }
    }
    await bekle(500);
  }
  // Sayfa okunabildiyse (site calisiyor) ama sonuc degismediyse: o parca yok
  if (son) return { tamam: true, satirlar: son.satirlar || [] };
  return { hata: "ZAMAN", mesaj: "Site cevap vermedi" };
}

// ------------------------------------------------------------------ site izinleri
async function eksikIzinler() {
  const eksik = [];
  for (const s of SITELER) {
    let desen = s.desen;
    if (!desen) {           // basliktan bulunan site: acik sekmesinin adresine izin gerekir
      const t = await sekmeBul(s);
      if (!t) continue;
      desen = new URL(t.url).origin + "/*";
    }
    try { if (!(await chrome.permissions.contains({ origins: [desen] }))) eksik.push(desen); } catch (e) { eksik.push(desen); }
  }
  return eksik;
}

async function izinBandi() {
  const eksik = await eksikIzinler();
  const bant = $("#izinBandi");
  bant.hidden = !eksik.length;
  if (eksik.length) $("#izinSayi").textContent = eksik.length;
}

$("#izinVer").onclick = async () => {
  const eksik = await eksikIzinler();
  try { await chrome.permissions.request({ origins: eksik }); } catch (e) { alert("İzin verilemedi: " + (e.message || e)); }
  izinBandi();
};

// ------------------------------------------------------------------ arama
async function ara() {
  const parca = $("#parca").value.trim();
  if (!parca) return;
  $("#ara").disabled = true;
  panoAcik = false; $("#pano").hidden = true; $("#panoDugme").classList.remove("secili");
  alimlar = []; alimDurum = ""; alimCiz();
  sonuclar = []; durumlar = {}; secB2B.clear(); secMarka.clear();
  for (const s of SITELER) durumlar[s.ad] = { durum: "bekle" };
  ciz();
  const bas = performance.now();
  await Promise.all(SITELER.map(async site => {
    const r = await siteAra(site, parca);
    durumlar[site.ad] = r;
    if (r.satirlar) sonuclar.push(...r.satirlar);
    ciz();
  }));
  sonuclar.sort((a, b) => a.fiyat - b.fiyat);
  $("#bilgi").dataset.sure = ((performance.now() - bas) / 1000).toFixed(1);
  $("#ara").disabled = false;
  panoAcik = false;
  ciz();
  izinBandi();
  gecmisKaydet(parca).then(panoCiz);
  alimGecmisiTopla(parca);
}


// ------------------------------------------------------------------ ALIM GECMISI: bulunan urunlerin sitelerdeki "Stok Hareketleri" kayitlari
let alimlar = [], alimDurum = "", alimAcik = true;
try { alimAcik = localStorage.getItem("b2bAlimAcik") !== "0"; } catch (e) { }
// Eryaz B2B (eski gorunumlu) sitelerde de ayni Stok Hareketleri adresi denenir; yoksa sessizce gecilir
const ALIM_OKUYUCU = { /* a_grup: a_grup_gecmis (Basbug - sonra yapilacak) */ eryaz_v4: v4_gecmis, eryaz_json: eryaz_json_gecmis, eryaz_b2b: eryaz_json_gecmis };
async function alimGecmisiTopla(parca) {
  const isler = [];
  for (const site of SITELER) {
    const fn = site.ayar && site.ayar.klikPopup ? karpart_gecmis : site.ayar && site.ayar.mydparGecmis ? mydpar_gecmis : site.ayar && site.ayar.asinGecmis ? asin_gecmis : site.ayar && site.ayar.basaranGecmis ? b2b_basaran_gecmis : ALIM_OKUYUCU[site.tur || site.okuyucu];
    const d = durumlar[site.ad];
    if (!fn || !d || !d.sekmeId) continue;
    const satir = sonuclar.filter(r => r.b2b === site.ad && r.kod);
    if (!satir.length) continue;
    // V4 siteleri urun koduyla, Lepar urun numarasiyla (Id) sorgular
    const kodlar = (["eryaz_json", "eryaz_b2b", "a_grup"].includes(site.tur || site.okuyucu) || fn === karpart_gecmis || fn === mydpar_gecmis || fn === asin_gecmis || fn === b2b_basaran_gecmis) ? satir.map(r => ({ kod: r.kod, id: r.urunId, ad: r.ad, alimVar: r.alimVar })) : satir.map(r => r.kod);
    isler.push({ site, fn, sekmeId: d.sekmeId, kodlar });
  }
  if (!isler.length) { alimDurum = ""; alimCiz(); return; }
  alimDurum = `Alım geçmişi aranıyor… (${isler.length} B2B)`;
  alimCiz();
  await Promise.all(isler.map(async is => {
    try {
      const r = await calistir(is.sekmeId, is.fn, [is.kodlar]);
      if ($("#parca").value.trim() !== parca) return;            // bu arada yeni arama baslamis
      if (r && r.satirlar) {
        const simdi = new Map(sonuclar.filter(x => x.b2b === is.site.ad).map(x => [kodNorm(x.kod), x]));
        for (const a of r.satirlar) { const s = simdi.get(kodNorm(a.kod)); alimlar.push({ ...a, b2b: is.site.ad, simdi: s ? s.fiyat : null, sekmeId: is.sekmeId }); }
      }
    } catch (e) { }
    alimCiz();
    if (r_varMi()) ciz();                                         // satir numaralarini (alim gecmisi isareti) guncelle
  }));
  if ($("#parca").value.trim() !== parca) return;
  alimDurum = "";
  alimCiz();
}
function r_varMi() { return alimlar.length > 0; }
// Bir urunun o firmadan alim gecmisi (B2B + kod eslesmesi)
function alimBul(r) { const k = kodNorm(r.kod); return alimlar.filter(a => a.b2b === r.b2b && kodNorm(a.kod) === k).sort((a, b) => (b.tarih || 0) - (a.tarih || 0)); }
function alimPopup(r, e, normal) {
  const pop = $("#alimPopup");
  const list = alimBul(r);
  if (!list.length && !normal) { pop.style.display = "none"; return; }
  const gun = t => t ? new Date(t).toLocaleDateString("tr-TR") : "";
  const toplamMiktar = list.reduce((t, a) => t + a.miktar, 0);
  pop.innerHTML = (normal ? `<div class="pop-kmp">${kacis(normal)}</div>` : "") + (list.length ? `
    <div class="pop-bas"><b>${kacis(r.b2b)}</b> · ${kacis(r.kod)} · ${list.length} alım, toplam ${toplamMiktar} ${kacis(list[0].birim || "")}</div>
    <table><tr><th>Tarih</th><th>Evrak No</th><th class="sayi">Miktar</th><th class="sayi">Alış fiyatı</th><th class="sayi">Toplam</th></tr>
    ${list.slice(0, 12).map(a => `<tr><td>${gun(a.tarih)}</td><td class="evrak">${kacis(a.evrak)}</td><td class="sayi">${a.miktar}</td>
      <td class="sayi"><b>${para(a.fiyat)}</b>${a.isk.length ? ` <small>(%${a.isk.join("+")})</small>` : ""}</td><td class="sayi">${para(a.toplam)}</td></tr>`).join("")}
    </table>${list.length > 12 ? `<div class="pop-not">+${list.length - 12} kayıt daha (üstteki Alım geçmişi kutusunda)</div>` : ""}` : "");
  pop.style.display = "block";
  const x = Math.min(e.clientX + 18, innerWidth - pop.offsetWidth - 12), y = e.clientY + 16 + pop.offsetHeight > innerHeight ? e.clientY - pop.offsetHeight - 12 : e.clientY + 16;
  pop.style.left = Math.max(8, x) + "px"; pop.style.top = Math.max(8, y) + "px";
}
function alimCiz() {
  const kutu = $("#alimGecmisi");
  if (!alimlar.length && !alimDurum) { kutu.hidden = true; kutu.innerHTML = ""; return; }
  kutu.hidden = false;
  const liste = [...alimlar].sort((a, b) => (b.tarih || 0) - (a.tarih || 0));
  const firma = new Set(liste.map(a => a.b2b)).size;
  const toplam = liste.reduce((t, a) => t + (a.toplam || 0), 0);
  const gun = t => t ? new Date(t).toLocaleDateString("tr-TR") : "";
  const ust = `<div class="alim-ust"><button class="incele" id="alimAc">${alimAcik ? "▾" : "▸"} Alım geçmişi</button>
    <span>${liste.length ? `<b>${firma}</b> firmada <b>${liste.length}</b> alım kaydı · toplam ${para(toplam)} (KDV hariç)` : ""}</span>
    <span class="alim-durum">${kacis(alimDurum)}</span></div>`;
  let govde = "";
  if (alimAcik && liste.length) {
    govde = `<table class="alim-tablo"><thead><tr><th>Tarih</th><th>Evrak No</th><th>B2B</th><th>Ürün Kodu</th><th>Ürün</th><th class="sayi">Miktar</th>
      <th class="sayi">Alış fiyatı (KDV hariç)</th><th class="sayi">Toplam</th><th class="sayi">Şu anki net</th></tr></thead><tbody>${liste.slice(0, 200).map(a => {
      const fark = a.simdi && a.fiyat ? (a.simdi - a.fiyat) / a.fiyat * 100 : null;
      const ok = fark == null ? "" : fark > 0.5 ? `<span class="art">▲ %${fark.toFixed(0)}</span>` : fark < -0.5 ? `<span class="dus">▼ %${(-fark).toFixed(0)}</span>` : "";
      return `<tr data-sekme="${a.sekmeId}"><td>${gun(a.tarih)}</td><td class="evrak">${kacis(a.evrak)}</td><td>${kacis(a.b2b)}</td><td><b>${kacis(a.kod)}</b></td>
          <td class="ad">${kacis(a.ad)}</td><td class="sayi">${a.miktar} ${kacis(a.birim)}</td>
          <td class="sayi" title="${a.isk.length ? "İskonto: %" + a.isk.join(" + %") : ""}"><b>${para(a.fiyat)}</b></td><td class="sayi">${para(a.toplam)}</td>
          <td class="sayi">${a.simdi ? para(a.simdi) + " " + ok : "–"}</td></tr>`;
    }).join("")}</tbody></table>`;
  }
  kutu.innerHTML = ust + govde;
  $("#alimAc").onclick = () => { alimAcik = !alimAcik; try { localStorage.setItem("b2bAlimAcik", alimAcik ? "1" : "0"); } catch (e) { } alimCiz(); };
  kutu.querySelectorAll("tr[data-sekme]").forEach(tr => tr.ondblclick = () => sekmeyeGit(Number(tr.dataset.sekme)));
}

// ------------------------------------------------------------------ PANO: kurlar, son arama, bugun arananlar, sik arananlar
let panoAcik = true;
async function gecmisOku() { try { return (await chrome.storage.local.get("gecmis")).gecmis || []; } catch (e) { return []; } }
async function gecmisKaydet(parca) {
  const q = kodNorm(parca);
  const fiyatli = sonuclar.filter(r => r.fiyat > 0);
  fiyatli.forEach(r => r.grup = eslesmeGrubu(r, q));
  const enIyiGrup = Math.min(...fiyatli.map(r => r.grup), 9);
  const aday = fiyatli.filter(r => r.grup === enIyiGrup).sort((a, b) => a.fiyat - b.fiyat)[0];
  const kayit = {
    q: parca, t: Date.now(), adet: fiyatli.length,
    b2b: Object.values(durumlar).filter(d => d.durum === "ok" && d.adet).length,
    enUcuz: aday ? { b2b: aday.b2b, kod: aday.kod, marka: aday.marka, fiyat: aday.fiyat, fiyatKdvli: aday.fiyatKdvli, tam: aday.grup === 1 } : null,
  };
  const g = await gecmisOku();
  g.unshift(kayit);
  try { await chrome.storage.local.set({ gecmis: g.slice(0, 2000) }); } catch (e) { }
}

// TCMB kurlari (efektif satis). 1 saat onbellek.
async function kurGetir(zorla) {
  let onb = null;
  try { onb = (await chrome.storage.local.get("kur")).kur; } catch (e) { }
  if (!zorla && onb && Date.now() - onb.t < 3600000) return onb;
  try {
    const c = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", { cache: "no-store" });
    const xml = new DOMParser().parseFromString(await c.text(), "text/xml");
    const al = (kod, alan) => { const e = xml.querySelector(`Currency[CurrencyCode="${kod}"] ${alan}`); const v = e ? Number(e.textContent.trim()) : NaN; return v > 0 ? v : null; };
    const kok = xml.querySelector("Tarih_Date");
    const kur = {
      t: Date.now(), tarih: kok ? kok.getAttribute("Tarih") : "",
      usd: { efektif: al("USD", "BanknoteSelling"), doviz: al("USD", "ForexSelling") },
      eur: { efektif: al("EUR", "BanknoteSelling"), doviz: al("EUR", "ForexSelling") }
    };
    if (!kur.usd.efektif && !kur.usd.doviz) throw new Error("kur okunamadı");
    try { await chrome.storage.local.set({ kur }); } catch (e) { }
    return kur;
  } catch (e) { return onb ? { ...onb, eski: true } : { hata: String(e.message || e) }; }
}

function aramaYap(q) { $("#parca").value = q; ara(); }

async function panoCiz() {
  const pano = $("#pano");
  pano.hidden = !(panoAcik || !sonuclar.length);   // "aranıyor" durumu panoyu gizlemesin: takılan bir site panoyu kilitlemesin
  $("#panoDugme").classList.toggle("secili", !pano.hidden);
  if (pano.hidden) return;
  const g = await gecmisOku();
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const bugunku = g.filter(k => k.t >= bugun.getTime());
  const saat = t => new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const kart = (baslik, icerik) => `<div class="pkart"><h3>${baslik}</h3>${icerik}</div>`;
  const kur = await kurGetir(false);
  const k4 = v => v == null ? "–" : v.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const kurHtml = kur.hata ? `<div class="pbos">Kur alınamadı (${kacis(kur.hata)})</div>` : `
    <div class="kurlar">
      <div><span class="kad">$ USD</span><b>${k4(kur.usd.efektif)}</b><small>döviz satış ${k4(kur.usd.doviz)}</small></div>
      <div><span class="kad">€ EUR</span><b>${k4(kur.eur.efektif)}</b><small>döviz satış ${k4(kur.eur.doviz)}</small></div>
    </div>
    <div class="pnot">TCMB efektif satış · ${kacis(kur.tarih || "")}${kur.eski ? " · (son alınan)" : ""} <button class="incele" id="kurYenile">↻</button></div>`;
  const son = g[0];
  const enUcuzYazi = k => k && k.enUcuz ? `<div class="ucuz">${k.enUcuz.tam ? "✓ " : ""}<b>${para(k.enUcuz.fiyat)}</b> · ${kacis(k.enUcuz.b2b)} · ${kacis(k.enUcuz.kod)}</div>` : `<div class="pbos">fiyatlı sonuç yok</div>`;
  const sonHtml = son ? `<div class="sonq tik" data-q="${kacis(son.q)}">${kacis(son.q)}</div>
    <div class="pnot">${saat(son.t)} · ${son.adet} sonuç · ${son.b2b} B2B</div>${enUcuzYazi(son)}` : `<div class="pbos">Henüz arama yok</div>`;
  const tekil = []; const gor = new Set();
  for (const k of bugunku) { const a = k.q.toLocaleUpperCase("tr-TR"); if (!gor.has(a)) { gor.add(a); tekil.push(k); } }
  const bugunHtml = tekil.length ? `<div class="pnot">${bugunku.length} arama · ${tekil.length} farklı parça</div><div class="pliste">${tekil.slice(0, 60).map(k =>
    `<span class="pq tik" data-q="${kacis(k.q)}" title="${saat(k.t)} · ${k.adet} sonuç${k.enUcuz ? " · en ucuz " + para(k.enUcuz.fiyat) + " (" + kacis(k.enUcuz.b2b) + ")" : ""}">${kacis(k.q)} <i>${k.adet}</i></span>`).join("")}</div>` : `<div class="pbos">Bugün arama yok</div>`;
  const ay = Date.now() - 30 * 86400000, say = new Map();
  for (const k of g) if (k.t >= ay) { const a = k.q.toLocaleUpperCase("tr-TR"); say.set(a, (say.get(a) || 0) + 1); }
  const sik = [...say].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const sikHtml = sik.length ? `<div class="pliste">${sik.map(([q, n]) => `<span class="pq tik" data-q="${kacis(q)}">${kacis(q)} <i>${n}×</i></span>`).join("")}</div>` : `<div class="pbos">Henüz tekrar aranan parça yok</div>`;
  const kazanan = new Map();
  for (const k of g) if (k.t >= ay && k.enUcuz) kazanan.set(k.enUcuz.b2b, (kazanan.get(k.enUcuz.b2b) || 0) + 1);
  const kaz = [...kazanan].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const kazHtml = kaz.length ? `<table class="ptablo">${kaz.map(([b, n]) => `<tr><td>${kacis(b)}</td><td class="sayi">${n} kez</td></tr>`).join("")}</table>` : `<div class="pbos">Veri yok</div>`;
  pano.innerHTML = kart("Kurlar", kurHtml) + kart("Son arama", sonHtml) + kart("Bugün arananlar", bugunHtml)
    + kart("Sık arananlar (30 gün)", sikHtml) + kart("En ucuz çıkan B2B (30 gün)", kazHtml);
  pano.querySelectorAll("[data-q]").forEach(e => e.onclick = () => aramaYap(e.dataset.q));
  const ky = $("#kurYenile"); if (ky) ky.onclick = async () => { await kurGetir(true); panoCiz(); };
}

// ------------------------------------------------------------------ cizim
// Durum: baslik cubugunda 3 kutu (Var / Yok / Hata). Fare ustune gelince liste acilir, tiklayinca sabitlenir.
let acikKutu = null;   // tiklanip sabitlenen kutu: "var" | "yok" | "hata"
function durumSinifi(d) {
  if (d.durum === "ok") return d.adet ? "var" : "yok";
  if (d.durum === "acik") return "var";
  if (d.durum === "bekle") return "bekle";
  return "hata";
}
function cipYap(site, d) {
  const parca = document.createDocumentFragment();
  const c = document.createElement("span");
  c.className = "cip " + (d.durum === "acik" ? "ok" : (d.durum === "ok" && !d.adet ? "bekle" : d.durum));
  const sure = d.sure ? ` (${d.sure} sn)` : "";
  c.textContent = d.durum === "ok" ? (d.adet ? `${site.ad}: ${d.adet} sonuç${sure}` : `${site.ad}: yok${sure}`)
    : d.durum === "bekle" ? `${site.ad}: aranıyor…`
      : d.durum === "acik" ? `${site.ad}: sekme açık`
        : d.durum === "yok" && d.mesaj === "Sekme açık değil" ? `${site.ad}: kapalı – aç`
          : `${site.ad}: ${d.mesaj}${sure}`;
  if (d.durum === "yok" || d.durum === "giris" || (d.durum === "ok" && d.adet) || d.durum === "acik") {
    c.classList.add("tik");
    c.title = d.durum === "yok" ? (site.acilis ? "Tıklayın: siteyi yeni sekmede açar" : "Tıklayın: masaüstündeki kısayolu açar (" + site.kisayol + ")") : "Tıklayın: sekmeye gider";
    c.onclick = async () => {
      if (d.izinAdresi) {
        try { if (await chrome.permissions.request({ origins: [d.izinAdresi] })) { c.textContent = `${site.ad}: izin verildi, tekrar arayın`; } }
        catch (e) { alert("İzin verilemedi: " + (e.message || e)); }
        return;
      }
      if (d.sekmeId) sekmeyeGit(d.sekmeId);
      else if (acilisYontemi(site) === "pencere" && site.kisayol) kisayolAc([site]);   // TEST: bu bilgisayarda pencere secili
      else if (site.acilis) await chrome.tabs.create({ url: site.acilis, active: true });
      else if (site.kisayol) kisayolAc([site]);
      else alert(`${site.ad} için sekme açık değil. B2B_Baslat ile açıp giriş yapın.`);
    };
  }
  parca.appendChild(c);
  if (d.sekmeId) {
    const inc = document.createElement("button");
    inc.className = "incele";
    inc.textContent = "incele";
    inc.title = `${site.ad} sayfasının yapısını çıkar (destek için)`;
    inc.onclick = e => { e.stopPropagation(); incele(site, d.sekmeId); };
    parca.appendChild(inc);
  }
  return parca;
}
function durumCiz() {
  const yer = $("#durumKutulari");
  yer.innerHTML = "";
  $("#durumlar").innerHTML = "";
  const hepsi = SITELER.filter(s => durumlar[s.ad]);
  if (!hepsi.length) return;
  const grup = { var: [], yok: [], hata: [], bekle: [] };
  for (const s of hepsi) grup[durumSinifi(durumlar[s.ad])].push(s);
  const aramaVar = hepsi.some(s => ["ok", "bekle"].includes(durumlar[s.ad].durum));
  const KUTULAR = [
    ["var", aramaVar ? "Var" : "Açık", "Sonuç veren B2B'ler"],
    ["yok", "Yok", "Bu parçayı bulamayan B2B'ler"],
    ["hata", "Hata", "Hata veren, oturumu kapalı ya da sekmesi açık olmayan B2B'ler"],
  ];
  for (const [ad, yazi, aciklama] of KUTULAR) {
    const liste = grup[ad];
    const k = document.createElement("div");
    k.className = "dkutu k-" + ad + (acikKutu === ad ? " sabit" : "") + (liste.length ? "" : " bos");
    const dug = document.createElement("button");
    dug.innerHTML = `${yazi} <b>${liste.length}</b>`;
    dug.title = aciklama + (acikKutu === ad ? " – kapatmak için tekrar tıklayın" : " – sabitlemek için tıklayın");
    dug.onclick = e => { e.stopPropagation(); acikKutu = acikKutu === ad ? null : ad; durumCiz(); };
    k.appendChild(dug);
    const pano = document.createElement("div");
    pano.className = "dpano";
    pano.onclick = e => e.stopPropagation();
    if (!liste.length) pano.innerHTML = `<span class="bos-yazi">${aciklama}: yok</span>`;
    // Her kutuda alfabetik sira (Turkce alfabeye gore)
    const gosterilen = [...liste].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
    for (const s of gosterilen) pano.appendChild(cipYap(s, durumlar[s.ad]));
    k.appendChild(pano);
    yer.appendChild(k);
  }
  if (grup.bekle.length) {
    const b = document.createElement("span");
    b.className = "aranan";
    b.textContent = `${grup.bekle.length} B2B aranıyor…`;
    b.title = grup.bekle.map(s => s.ad).join(", ");
    yer.appendChild(b);
  }
}
document.addEventListener("click", () => { if (acikKutu) { acikKutu = null; durumCiz(); } });

async function incele(site, sekmeId) {
  let metin;
  try {
    // Sekme kapanip yeniden acilmis olabilir: guncel sekmeyi tekrar bul
    // incele: arama sayfasi degil, en son baktiginiz sekme (orn. urun detay sayfasi) incelenir
    const hepsi = site.desen ? await chrome.tabs.query({ url: site.desen })
      : (await chrome.tabs.query({})).filter(t => kucuk(t.title).includes(kucuk(site.baslik)) && /^https?:/.test(t.url || ""));
    hepsi.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    const guncel = hepsi[0];
    if (!guncel) throw new Error("Bu sitenin sekmesi şu an açık değil");
    const r = await chrome.scripting.executeScript({ target: { tabId: guncel.id }, world: "MAIN", func: sayfa_incele });
    metin = JSON.stringify({ site: site.ad, ...(r[0].result || {}) }, null, 1);
  } catch (e) { metin = `${site.ad}: incelenemedi - ${e.message || e}`; }
  $("#inceleMetin").value = metin;
  $("#incelePanel").hidden = false;
  $("#inceleMetin").select();
}

function filtreCiz(gorunen) {
  const kutu = $("#filtreler");
  kutu.innerHTML = "";
  if (!sonuclar.length) return;
  const say = (alan) => { const m = new Map(); for (const r of sonuclar) if (r[alan]) m.set(r[alan], (m.get(r[alan]) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
  for (const [baslik, alan, secim] of [["B2B:", "b2b", secB2B], ["Marka:", "marka", secMarka]]) {
    const satir = document.createElement("div");
    satir.className = "satir-f";
    satir.innerHTML = `<b>${baslik}</b>`;
    for (const [deger, adet] of say(alan)) {
      const b = document.createElement("button");
      b.className = "f" + (secim.has(deger) ? " secili" : "");
      b.textContent = `${deger} ${adet}`;
      b.onclick = () => { secim.has(deger) ? secim.delete(deger) : secim.add(deger); ciz(); };
      satir.appendChild(b);
    }
    kutu.appendChild(satir);
  }
}

function gorunenler() {
  const stokta = $("#stoktakiler").checked;
  return sonuclar.filter(r => r.fiyat > 0 &&
    (!stokta || r.stokVar) && (!secB2B.size || secB2B.has(r.b2b)) && (!secMarka.size || secMarka.has(r.marka)));
}

function ciz() {
  durumCiz();
  const liste = gorunenler();
  filtreCiz(liste);
  const parca = $("#parca").value.trim();
  const bekleyen = Object.values(durumlar).some(d => d.durum === "bekle");
  const sure = $("#bilgi").dataset.sure;
  $("#bilgi").textContent = sonuclar.length || !bekleyen
    ? `"${parca}" için ${liste.length} sonuç — ucuzdan pahalıya sıralı${!bekleyen && sure ? ` · toplam ${sure} sn` : ""} · satıra çift tıklayın: o B2B sekmesine gider`
    : "";
  const tb = $("#tablo tbody");
  tb.innerHTML = "";
  $("#tablo").hidden = !liste.length;
  // Eslesme gruplari: 1 = parca kodu/OEM tam ayni, 2 = aranan metin icinde geciyor, 3 = sitenin getirdigi diger benzerler
  const q = kodNorm(parca);
  for (const r of liste) r.grup = eslesmeGrubu(r, q);
  liste.sort((a, b) => (a.grup - b.grup) || (a.fiyat - b.fiyat));
  const GRUP_ADI = { 1: "✓ Kodu tam eşleşenler", 2: "≈ Kodun içinde geçtiği ürünler", 3: "Diğer benzer sonuçlar" };
  let sonGrup = 0;
  liste.forEach((r, i) => {
    if (r.grup !== sonGrup) {
      sonGrup = r.grup;
      const adet = liste.filter(x => x.grup === r.grup).length;
      const bas = document.createElement("tr");
      bas.className = "grup-baslik g" + r.grup;
      bas.innerHTML = `<td colspan="11">${GRUP_ADI[r.grup]} <span>(${adet})</span></td>`;
      tb.appendChild(bas);
    }
    const tr = document.createElement("tr");
    tr.className = "g" + r.grup;
    const foto = r.resim ? `<img src="${kacis(r.resim)}" data-buyuk="${kacis(r.resimBuyuk || r.resim)}" loading="lazy">` : `<span class="bos"></span>`;
    const normal = r.normalFiyat != null ? `Normal (vadeli) fiyat: ${para(r.normalFiyat)} net / ${para(r.normalKdvli)} KDV dahil` : "";
    if (r.kampanya) tr.classList.add("kmp-satir");
    const alimVar = alimlar.length && alimBul(r).length > 0;
    if (alimVar || normal) {
      tr.onmousemove = e => { if (!e.target.closest("td.foto")) alimPopup(r, e, normal); };
      tr.onmouseleave = () => { $("#alimPopup").style.display = "none"; };
    }
    tr.innerHTML = `<td>${alimVar ? `<span class="no-alim" title="Bu firmadan alım geçmişi var">${i + 1}</span>` : i + 1}</td><td class="foto">${foto}</td><td>${kacis(r.b2b)}</td><td><b>${kacis(r.kod)}</b></td>
      <td>${kacis(r.marka)}</td><td class="ad">${kacis(r.ad)}</td>
      <td class="sayi"><b>${para(r.fiyat)}</b>${r.normalFiyat != null ? `<div class="eski">${para(r.normalFiyat)}</div>` : ""}</td>
      <td class="sayi">${para(r.fiyatKdvli)}${r.normalKdvli != null ? `<div class="eski">${para(r.normalKdvli)}</div>` : ""}</td>
      ${stokHucre(r)}
      <td class="kmp">${r.kampanya ? `<span class="kmp-rozet" title="${kacis(normal || "Kampanyalı ürün")}">KAMPANYA</span>` : ""}</td>
      <td class="oem">${kacis(r.oem)}</td>`;
    tr.ondblclick = () => sekmeyeGit(r.sekmeId);
    const img = tr.querySelector("img");
    if (img) {
      img.onerror = () => { img.replaceWith(Object.assign(document.createElement("span"), { className: "bos" })); };
      img.onmouseenter = e => onizle(img.dataset.buyuk, e);
      img.onmouseleave = () => { $("#onizleme").style.display = "none"; };
    }
    tb.appendChild(tr);
  });
  if (!liste.length && !bekleyen && Object.keys(durumlar).length) {
    $("#bilgi").textContent = `"${parca}" için sonuç bulunamadı.`;
  }
}

function onizle(src, e) {
  const o = $("#onizleme");
  o.querySelector("img").src = src;
  o.style.display = "block";
  o.style.left = Math.min(e.clientX + 20, innerWidth - 380) + "px";
  o.style.top = Math.min(e.clientY - 20, innerHeight - 380) + "px";
}

async function sekmeyeGit(id) {
  if (!id) return;
  try {
    const t = await chrome.tabs.update(id, { active: true });
    await chrome.windows.update(t.windowId, { focused: true });
  } catch (e) { }
}

// ------------------------------------------------------------------ stok hucresi: Var yesil, Az mor, Yok ve ? kirmizi (hepsi kalin)
function stokHucre(r) {
  const y = String(r.stok || "").trim();
  if (r.stokVar && /(^|\s)az(\s|$)|kritik|sınırlı|sinirli/i.test(y)) return `<td class="stok az">Az</td>`;
  if (r.stokVar) return `<td class="stok var">${kacis(y || "Var")}</td>`;
  if (r.stokVar === false) return `<td class="stok yok">Yok</td>`;
  return `<td class="stok yok">?</td>`;
}

// ------------------------------------------------------------------ eslesme gruplari
const kodNorm = t => String(t || "").toLocaleUpperCase("tr-TR").replace(/[^0-9A-ZÇĞİÖŞÜ]/g, "");
function eslesmeGrubu(r, q) {
  if (!q) return 3;
  // Parca no ve OEM kodlarini parcalara ayir ("58101-4FA00 / MD 997249", "SGS-SP1174" gibi)
  const kodlar = [];
  for (const alan of [r.kod, r.oem]) {
    for (const p of String(alan || "").split(/[\/,;|]+/)) {
      if (!p.trim()) continue;
      kodlar.push(kodNorm(p));
      const onek = /^\s*[0-9A-Za-zÇĞİÖŞÜçğıöşü]{1,5}[-.\s_]+(.+)$/.exec(p);   // marka onekli kod: "SGS-SP1174", "SNG.SP1174" -> "SP1174"
      if (onek) kodlar.push(kodNorm(onek[1]));
      for (const k of p.trim().split(/\s+/)) kodlar.push(kodNorm(k));
    }
  }
  if (kodlar.includes(q)) return 1;
  if (q.length >= 3 && (kodlar.some(k => k.includes(q)) || kodNorm(r.ad).includes(q))) return 2;
  return 3;
}

// ------------------------------------------------------------------ kisayol ile acma
// PROGRAM OLANLAR klasorundeki kisayollari "b2bac:" adresiyle acar (B2B_Kisayol_Kur.bat bir kez calistirilmali)
let kontrolZamanlayici = [];
function kisayolAc(siteler) {
  const adlar = siteler.map(kisayolAdi).filter(Boolean);
  if (!adlar.length) return;
  location.href = "b2bac:" + encodeURIComponent(adlar.join("|"));
  // Acilan sekmeleri sirayla yakala (arama surerken durumlari bozma)
  kontrolZamanlayici.forEach(clearTimeout);
  const sure = Math.max(30, adlar.length * 25);
  kontrolZamanlayici = [10, 20, 35, 60, 90, 120, 180, 240, 300].filter(s => s <= sure + 30).map(s => setTimeout(() => {
    if (!Object.values(durumlar).some(d => d.durum === "bekle")) kontrol();
  }, s * 1000));
}
async function kapalilariAc() {
  const kapali = [];
  for (const site of SITELER) if ((site.acilis || site.kisayol) && !(await sekmeBul(site))) kapali.push(site);
  if (!kapali.length) { alert("Bütün B2B sekmeleri zaten açık."); return; }
  if (!confirm(`${kapali.length} kapalı B2B açılacak:\n\n${kapali.map(s => s.ad).join(", ")}\n\nAçılırken fare ve klavyeye dokunmayın. Devam?`)) return;
  // Adresi olan siteler yeni sekmede açılır; yalnız kısayolu olanlar masaüstünden açılır
  // TEST: acilisYontemi kararina gore (chrome -> sekme, pencere -> kisayol)
  for (const site of kapali.filter(s => s.acilis && acilisYontemi(s) === "chrome")) await chrome.tabs.create({ url: site.acilis, active: false });
  const kisayollu = kapali.filter(s => s.kisayol && !(s.acilis && acilisYontemi(s) === "chrome"));
  if (kisayollu.length) kisayolAc(kisayollu);
}

// ------------------------------------------------------------------ sekme kontrolu, disa aktarma
async function kontrol() {
  durumlar = {};
  for (const site of SITELER) {
    const s = await sekmeBul(site);
    durumlar[site.ad] = s ? { durum: "acik", sekmeId: s.id } : { durum: "yok", mesaj: "Sekme açık değil" };
  }
  durumCiz();
}

function disaAktar() {
  const liste = gorunenler();
  if (!liste.length) return;
  const q = kodNorm($("#parca").value);
  const GRUP = { 1: "Tam", 2: "İçinde geçen", 3: "Benzer" };
  liste.forEach(r => r.grup = eslesmeGrubu(r, q));
  liste.sort((a, b) => (a.grup - b.grup) || (a.fiyat - b.fiyat));
  const sat = r => [GRUP[r.grup], r.kampanya ? "Kampanya" : "", r.normalFiyat != null ? String(r.normalFiyat).replace(".", ",") : "", r.b2b, r.kod, r.marka, r.oem, r.ad, r.stokVar == null ? "?" : (r.stokVar ? r.stok : "Yok"),
  (r.fiyat ?? "").toString().replace(".", ","), (r.fiyatKdvli ?? "").toString().replace(".", ",")];
  const metin = [["Eşleşme", "Kampanya", "Normal net", "B2B", "Parça No", "Marka", "OEM", "Ürün Adı", "Stok", "Net (KDV hariç)", "KDV dahil"], ...liste.map(sat)]
    .map(s => s.map(h => `"${String(h).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + metin], { type: "text/csv;charset=utf-8" }));
  a.download = `b2b_${$("#parca").value.trim() || "arama"}.csv`;
  a.click();
}

$("#ara").onclick = ara;
$("#parca").addEventListener("keydown", e => { if (e.key === "Enter") ara(); });
$("#stoktakiler").onchange = ciz;
$("#disaAktar").onclick = disaAktar;
$("#kontrol").onclick = kontrol;
$("#kapalilariAc").onclick = kapalilariAc;
$("#kisayolTara").onclick = () => { location.href = "b2bac:tara"; };

// ------------------------------------------------------------------ kisayol eslesmesi (bu bilgisayar icin)
// Kullanici, kisayol klasorundeki gercek dosya adini burada kaydeder. Bos ise siteler.js'deki ad kullanilir.
let kisayolHaritasi = {};
chrome.storage.local.get("kisayolEslesme").then(v => { kisayolHaritasi = v.kisayolEslesme || {}; });
// TEST: bu bilgisayar icin acilis tercihi ("chrome" | "pencere" | bos = otomatik)
let acilisTercih = {};
chrome.storage.local.get("acilisTercih").then(v => { acilisTercih = v.acilisTercih || {}; });
function acilisYontemi(site) {
  const t = acilisTercih[site.ad];
  if (t === "pencere" && site.kisayol) return "pencere";
  if (t === "chrome" && site.acilis) return "chrome";
  if (!t && kisayolHaritasi[site.ad]) return "pencere";   // otomatik: eşleşmiş kısayol varsa masaüstü
  return site.acilis ? "chrome" : "pencere";              // otomatik: adres varsa Chrome
}
function kisayolAdi(site) { return kisayolHaritasi[site.ad] || site.kisayol; }

// Klasor secilir, icindeki kisayol dosyalari okunur; her site icin listeden secim yapilir
function kisayolAdiAra(t) {
  return String(t).replace(/\([^)]*\)/g, "").replace(/[İIı]/g, "i").toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
}
function kisayolEslesik(ad, dosyalar) {
  const n = kisayolAdiAra(ad);
  return dosyalar.find(d => kisayolAdiAra(d) === n)
    || dosyalar.find(d => { const m = kisayolAdiAra(d); return m && n && (m.includes(n) || n.includes(m)); })
    || "";
}

$("#kisayolEkle").onclick = () => { $("#klasorSecici").value = ""; $("#klasorSecici").click(); };
$("#klasorSecici").onchange = () => {
  const dosyaListesi = [...$("#klasorSecici").files];
  if (!dosyaListesi.length) return;
  const klasorAdi = dosyaListesi[0].webkitRelativePath.split("/")[0];
  const dosyalar = [];
  for (const f of dosyaListesi) {
    if (f.webkitRelativePath.split("/").length !== 2) continue;   // yalnizca secilen klasorun ust duzeyi
    const m = /\.(lnk|url|appref-ms)$/i.exec(f.name);
    if (m) dosyalar.push(f.name.slice(0, -m[0].length));
  }
  dosyalar.sort((a, b) => a.localeCompare(b, "tr"));
  $("#kisayolSayi").textContent = dosyalar.length + " kısayol dosyası bulundu (" + klasorAdi + ")";
  const yer = $("#kisayolSatirlar");
  yer.innerHTML = "";
  for (const s of SITELER.filter(x => x.kisayol)) {
    const satir = document.createElement("div");
    satir.style.cssText = "display:flex;gap:8px;align-items:center;margin:4px 0";
    const etiket = document.createElement("span");
    etiket.style.cssText = "width:200px;font-size:13px";
    etiket.textContent = s.ad;
    const secim = document.createElement("select");
    secim.style.cssText = "flex:1;padding:4px";
    secim.dataset.ad = s.ad;
    secim.appendChild(new Option("(boş)", ""));
    for (const d of dosyalar) secim.appendChild(new Option(d, d));
    secim.value = kisayolHaritasi[s.ad] || kisayolEslesik(s.kisayol, dosyalar);
    // TEST: acilis tercihi (bu bilgisayar icin)
    const acSecim = document.createElement("select");
    acSecim.style.cssText = "width:130px;padding:4px";
    acSecim.dataset.acilis = s.ad;
    acSecim.appendChild(new Option("Otomatik", ""));
    acSecim.appendChild(new Option("Chrome", "chrome"));
    acSecim.appendChild(new Option("Pencere", "pencere"));
    acSecim.value = acilisTercih[s.ad] || "";
    satir.append(etiket, secim, acSecim);
    yer.appendChild(satir);
  }
  $("#kisayolPanel").hidden = false;
};
$("#kisayolKapat").onclick = () => { $("#kisayolPanel").hidden = true; };
$("#kisayolIptal").onclick = () => { $("#kisayolPanel").hidden = true; };
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#kisayolPanel").hidden) $("#kisayolPanel").hidden = true; });
$("#kisayolKaydet").onclick = async () => {
  const harita = {};
  document.querySelectorAll("#kisayolSatirlar select[data-ad]").forEach(g => { if (g.value) harita[g.dataset.ad] = g.value; });
  kisayolHaritasi = harita;
  // TEST: acilis tercihleri
  const tercih = {};
  document.querySelectorAll("#kisayolSatirlar select[data-acilis]").forEach(g => { if (g.value) tercih[g.dataset.acilis] = g.value; });
  acilisTercih = tercih;
  await chrome.storage.local.set({ kisayolEslesme: harita, acilisTercih: tercih });
  $("#kisayolPanel").hidden = true;
  alert("Kaydedildi.");
};
$("#panoDugme").onclick = () => { panoAcik = $("#pano").hidden; panoCiz(); };
$("#inceleKopyala").onclick = async () => { await navigator.clipboard.writeText($("#inceleMetin").value); $("#inceleKopyala").textContent = "Kopyalandı ✓"; setTimeout(() => $("#inceleKopyala").textContent = "Kopyala", 1500); };
$("#inceleKapat").onclick = () => { $("#incelePanel").hidden = true; };
// Ilk acilista kullanici adi sorulur (yonetici panelinde bu isimle gorunur)
chrome.storage.local.get("kullaniciAdi").then(v => {
  if (v.kullaniciAdi) return;
  const ad = prompt("Adınızı yazın (yönetici panelinde bu isimle görünürsünüz):");
  if (ad && ad.trim()) chrome.storage.local.set({ kullaniciAdi: ad.trim() });
});
kontrol();
izinBandi();
panoCiz();
