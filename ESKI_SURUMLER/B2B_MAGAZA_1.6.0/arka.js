// Eklenti simgesine tiklaninca arama sayfasini acar (aciksa one getirir).
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("arama.html");
  const [acik] = await chrome.tabs.query({ url });
  if (acik) {
    await chrome.tabs.update(acik.id, { active: true });
    await chrome.windows.update(acik.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});

// ------------------------------------------------------------------ kalp atisi (yonetici paneli)
// Yalniz kurulum kimligi, kullanici adi ve surum gonderilir. Arama terimi, fiyat, musteri veya sifre GONDERILMEZ.
// KALP_URL: Google Apps Script web uygulamasi adresi (Panel kurulumundan sonra buraya yazilir). Bos ise kalp atisi kapali.
const KALP_URL = "";
const KALP_ARALIK_DK = 5;

async function kalpAt() {
  if (!KALP_URL) return;
  const v = await chrome.storage.local.get(["kurulumKimligi", "kullaniciAdi"]);
  let kimlik = v.kurulumKimligi;
  if (!kimlik) {
    kimlik = crypto.randomUUID();
    await chrome.storage.local.set({ kurulumKimligi: kimlik });
  }
  const p = new URLSearchParams({
    kimlik,
    ad: v.kullaniciAdi || "",
    surum: chrome.runtime.getManifest().version,
  });
  try { await fetch(KALP_URL + "?" + p.toString(), { method: "GET", cache: "no-store" }); } catch (e) {}
}

function kalpBaslat() {
  chrome.alarms.create("kalp", { periodInMinutes: KALP_ARALIK_DK });
  kalpAt();
}
chrome.runtime.onInstalled.addListener(kalpBaslat);
chrome.runtime.onStartup.addListener(kalpBaslat);
chrome.alarms.onAlarm.addListener(a => { if (a.name === "kalp") kalpAt(); });
