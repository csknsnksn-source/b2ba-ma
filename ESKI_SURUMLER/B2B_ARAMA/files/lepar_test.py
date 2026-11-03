# Lepar baglayici testi - b2b_ara.py'ye dokunmaz
import json, sys, traceback
from pathlib import Path
from urllib.parse import quote

KLASOR = Path(__file__).resolve().parent
PROFIL = KLASOR / "profil_lepar_test"
SITE = "https://web.lepar.com.tr"
SONUC = KLASOR / "lepar_test_sonuc.txt"
HAM = KLASOR / "lepar_ham.json"

def yaz(satirlar):
    SONUC.write_text("\n".join(satirlar), encoding="utf-8")

def sayi(x):
    try:
        return float(x)
    except Exception:
        return None

def tl(x):
    if x is None:
        return "-"
    s = f"{x:,.2f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".") + " TL"

def urunleri_al(veri):
    d = veri.get("d") if isinstance(veri, dict) else veri
    if isinstance(d, str):
        d = json.loads(d)
    return d or []

def main():
    parca = input("Parca kodu (bos birakirsaniz 2091042): ").strip() or "2091042"
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        try:
            ctx = p.chromium.launch_persistent_context(str(PROFIL), channel="chrome", headless=False)
        except Exception:
            ctx = p.chromium.launch_persistent_context(str(PROFIL), channel="msedge", headless=False)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        page.goto(SITE + "/Default.aspx")
        if "login" in page.url.lower():
            print()
            print(">>> Acilan pencerede Lepar'a kendiniz giris yapin.")
            print(">>> Giris bitince program kendisi devam eder (5 dk bekler).")
            page.wait_for_url(lambda u: "login" not in u.lower(), timeout=300000)
        print("Araniyor:", parca)
        with page.expect_response(lambda r: "SearchProduct" in r.url, timeout=60000) as c:
            page.goto(SITE + "/search.aspx?q=" + quote(parca))
        urunler = urunleri_al(c.value.json())
        HAM.write_text(json.dumps(urunler[:1], ensure_ascii=False, indent=2), encoding="utf-8")

        satir = []
        for u in urunler:
            net = sayi(u.get("Cost"))
            kdvli = sayi(u.get("CostWithVAT"))
            if kdvli is None and net is not None:
                kdvli = net * (1 + (sayi(u.get("TaxRate")) or 20) / 100)
            satir.append((net if net is not None else 9e18, u, net, kdvli))
        satir.sort(key=lambda t: t[0])

        cikti = [f"LEPAR - {parca} - {len(urunler)} sonuc", ""]
        for _, u, net, kdvli in satir:
            cikti += [
                f"Kod     : {u.get('Code')}",
                f"Ad      : {u.get('Name')}",
                f"Marka   : {u.get('Manufacturer')}",
                f"OEM     : {u.get('ManufacturerCode')}",
                f"Net     : {tl(net)}  (KDV haric)",
                f"KDV dah.: {tl(kdvli)}",
                f"Stok    : {u.get('AvailableText')} ({u.get('Quantity01')})",
                f"Foto    : {u.get('PicturePath')}",
                "",
            ]
        cikti.append("BASARILI")
        yaz(cikti)
        print("\n".join(cikti))
        ctx.close()

try:
    main()
except Exception:
    yaz(["HATA:", traceback.format_exc()])
    print(traceback.format_exc())
