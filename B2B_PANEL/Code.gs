// B2B Ortak Arama - Yonetici paneli (Google Apps Script)
// Kalp atislari bu e-tabloya yazilir, panel sayfasi kim hangi surumde ve acik mi gosterir.

const PANEL_SIFRE = "BURAYA-BIR-SIFRE-YAZIN";   // panel adresine ?sifre=... ile girilir. Mutlaka degistirin.
const SON_SURUM = "1.7.0";                       // yeni surum yayinlayinca burayi guncelleyin
const CEVRIMICI_DK = 15;                         // bu sureden yeni kalp atisi olanlar "acik" sayilir
const SAYFA_ADI = "Kurulumlar";

function kurulumSayfasi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SAYFA_ADI);
  if (!s) {
    s = ss.insertSheet(SAYFA_ADI);
    s.appendRow(["kimlik", "ad", "surum", "son_gorulme"]);
  }
  return s;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.kimlik) {
    kalpYaz(p);
    return ContentService.createTextOutput("ok");
  }
  if (p.sifre !== PANEL_SIFRE) {
    return ContentService.createTextOutput("Yetkisiz");
  }
  return HtmlService.createHtmlOutput(panelHtml());
}

function kalpYaz(p) {
  const s = kurulumSayfasi();
  const veri = s.getDataRange().getValues();
  const simdi = new Date();
  let satir = -1;
  for (let i = 1; i < veri.length; i++) {
    if (veri[i][0] === p.kimlik) { satir = i + 1; break; }
  }
  if (satir < 0) {
    s.appendRow([p.kimlik, p.ad || "", "'" + (p.surum || ""), simdi]);
    return;
  }
  const eskiAd = veri[satir - 1][1];
  s.getRange(satir, 2, 1, 3).setValues([[p.ad || eskiAd, "'" + (p.surum || ""), simdi]]);
}

function esc(t) {
  return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function panelHtml() {
  const veri = kurulumSayfasi().getDataRange().getValues().slice(1);
  const simdi = Date.now();
  const satirlar = veri.filter(r => r[0]).map(r => {
    const son = r[3] instanceof Date ? r[3].getTime() : 0;
    return {
      ad: r[1] || "(isimsiz)",
      surum: String(r[2] || ""),
      acik: simdi - son < CEVRIMICI_DK * 60000,
      guncel: String(r[2]) === SON_SURUM,
      son: son ? Utilities.formatDate(new Date(son), "Europe/Istanbul", "dd.MM.yyyy HH:mm") : "-"
    };
  }).sort((a, b) => (b.acik - a.acik) || a.ad.localeCompare(b.ad, "tr"));

  const acikSayi = satirlar.filter(s => s.acik).length;
  const tablo = satirlar.map(s =>
    "<tr><td>" + (s.acik ? '<span class="acik">● Açık</span>' : '<span class="kapali">● Kapalı</span>') + "</td>" +
    "<td>" + esc(s.ad) + "</td>" +
    "<td>" + esc(s.surum) + (s.guncel ? "" : ' <span class="eski">(eski)</span>') + "</td>" +
    "<td>" + s.son + "</td></tr>"
  ).join("");

  return '<!doctype html><html><head><meta charset="utf-8"><title>B2B Kurulumlar</title>' +
    '<style>body{font-family:Arial,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}' +
    'td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}' +
    '.acik{color:#1e7b34;font-weight:bold}.kapali{color:#8a96a3}.eski{color:#c62828}</style></head><body>' +
    '<h2>B2B Ortak Arama - Kurulumlar</h2>' +
    '<p>Toplam ' + satirlar.length + ' kurulum, şu an açık: ' + acikSayi + '. Son sürüm: ' + SON_SURUM + '</p>' +
    '<table><tr><th>Durum</th><th>Kullanıcı</th><th>Sürüm</th><th>Son görülme</th></tr>' + tablo + '</table>' +
    '</body></html>';
}
