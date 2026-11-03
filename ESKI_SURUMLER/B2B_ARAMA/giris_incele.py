# -*- coding: utf-8 -*-
"""Giris sayfasi inceleme: sayfayi acar, giris formundaki alanlarin id/name/tip degerlerini
ve tum HTML'i dosyaya yazar. Hicbir giris bilgisi girmez, hicbir butona basmaz."""
import sys, os, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://b2b.askarauto.com/login.aspx"
ETIKET = sys.argv[2] if len(sys.argv) > 2 else "askar"
KLASOR = os.path.dirname(os.path.abspath(__file__))
TXT = os.path.join(KLASOR, f"giris_{ETIKET}.txt")
HTML = os.path.join(KLASOR, f"giris_{ETIKET}.html")

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
    sayfa.goto(URL, wait_until="domcontentloaded", timeout=45000)
    sayfa.wait_for_timeout(3000)

    alanlar = sayfa.eval_on_selector_all(
        "input, button, select, a[href*='doPostBack'], a[onclick]",
        """els => els.map(e => ({
            tag: e.tagName, id: e.id, name: e.name, type: e.type,
            value: (e.value || '').slice(0, 30), text: (e.innerText || '').trim().slice(0, 40),
            onclick: (e.getAttribute('onclick') || '').slice(0, 80),
            href: (e.getAttribute('href') || '').slice(0, 80)
        }))""")

    with open(TXT, "w", encoding="utf-8") as f:
        f.write(f"URL: {URL}\nBaslik: {sayfa.title()}\n\n")
        for a in alanlar:
            f.write(json.dumps(a, ensure_ascii=False) + "\n")
    with open(HTML, "w", encoding="utf-8") as f:
        f.write(sayfa.content())

    print("bitti:", len(alanlar), "oge")
    sayfa.wait_for_timeout(2000)
    tarayici.close()
