# -*- coding: utf-8 -*-
"""Giris SONRASI sayfa ve ag incelemesi.
1) Sayfayi acar. 2) Siz KENDINIZ giris yapar, bir parca ararsiniz.
3) Konsolda Enter'a basarsiniz. Betik: sayfadaki alanlari ve arama sirasinda yapilan
   istekleri (adres, yontem, gonderilen veri, cevabin basi) dosyaya yazar.
Guvenlik: sifre iceren istekler kaydedilmez; cerez ve basliklar hic yazilmaz."""
import sys, os, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://web.lepar.com.tr"
ETIKET = sys.argv[2] if len(sys.argv) > 2 else "lepar"
KLASOR = os.path.dirname(os.path.abspath(__file__))
TXT = os.path.join(KLASOR, f"sonra_{ETIKET}.txt")
HTML = os.path.join(KLASOR, f"sonra_{ETIKET}.html")
AG = os.path.join(KLASOR, f"ag_{ETIKET}.txt")

GIZLI = ("pass", "sifre", "şifre", "parola", "txtpassword", "tbpassword")
istekler = []


def gizli_mi(veri):
    v = (veri or "").lower()
    return any(g in v for g in GIZLI)


def cevap(c):
    try:
        r = c.request
        if r.resource_type not in ("xhr", "fetch", "document"):
            return
        govde = r.post_data or ""
        kayit = {"yontem": r.method, "adres": c.url[:300], "tur": r.resource_type,
                 "durum": c.status, "icerik": c.headers.get("content-type", "")}
        if gizli_mi(govde) or gizli_mi(c.url):
            kayit["gonderilen"] = "(giris istegi - kaydedilmedi)"
            kayit["cevap"] = ""
        else:
            kayit["gonderilen"] = govde[:1500]
            try:
                kayit["cevap"] = c.text()[:3000]
            except Exception:
                kayit["cevap"] = "(okunamadi)"
        istekler.append(kayit)
    except Exception:
        pass


with sync_playwright() as p:
    tarayici = None
    for kanal in ("chrome", "msedge"):
        try:
            tarayici = p.chromium.launch(channel=kanal, headless=False)
            break
        except Exception:
            continue
    if tarayici is None:
        tarayici = p.chromium.launch(headless=False)
    sayfa = tarayici.new_page()
    sayfa.on("response", cevap)
    sayfa.goto(URL, wait_until="domcontentloaded", timeout=45000)

    print("1) Acilan pencerede KENDINIZ giris yapin.")
    print("2) Urun arama kutusuna bir parca numarasi yazip aratin (ornek: 2091042).")
    print("3) Sonuclar gelince bu konsola donup Enter'a basin.")
    input("Hazir olunca Enter...")

    sayfa.wait_for_timeout(1000)
    alanlar = sayfa.eval_on_selector_all(
        "input, button, select, textarea",
        """els => els.map(e => ({
            tag: e.tagName, id: e.id, name: e.name, type: e.type,
            placeholder: (e.placeholder || '').slice(0, 40),
            text: (e.innerText || e.value || '').trim().slice(0, 40),
            visible: !!(e.offsetWidth || e.offsetHeight)
        })).filter(a => a.type !== 'password')""")

    with open(TXT, "w", encoding="utf-8") as f:
        f.write(f"URL: {sayfa.url}\nBaslik: {sayfa.title()}\n\n")
        for a in alanlar:
            f.write(json.dumps(a, ensure_ascii=False) + "\n")
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(sayfa.content())
    with open(AG, "w", encoding="utf-8") as f:
        for k in istekler:
            f.write(json.dumps(k, ensure_ascii=False) + "\n\n")
    print("kaydedildi:", len(alanlar), "alan,", len(istekler), "istek")
    tarayici.close()
