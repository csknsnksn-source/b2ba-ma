# -*- coding: utf-8 -*-
"""Eryaz lisansli B2B'leri icin UI otomasyonu (Firefox penceresi, Windows).
Kullanim:
  python eryaz_ui.py ara <parca> <pencere_anahtari>   -> JSON satirlari (stdout)
  python eryaz_ui.py one <pencere_anahtari>           -> pencereyi one getirir
Cikti: tek satir JSON. Hata varsa {"hata": "..."} doner.
Bu betik sayfayi kendisi acmaz; yalnizca zaten acik olan Firefox penceresini kullanir."""
import sys, os, time, json, re, subprocess

def _kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkg])

_kur("uiautomation")
import uiautomation as auto

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

GORUNUR_ALT = 1030          # gorev cubugunun ustu
PARA = re.compile(r"^\d{1,3}(\.\d{3})*,\d{2}\s*(₺)?\s*$")
def temiz(s):
    """Ikon karakterlerini (ozel alan) ve sert boslugu temizler."""
    return re.sub(r"[\uE000-\uF8FF]", "", (s or "").replace("\xa0", " ")).strip()


PARA_GEV = re.compile(r"\d[\d.]*,\d{2}")
STOK = {"Var", "Az Var", "Yok", "Yolda", "Sipariş Üzerine", "Sipariş Üzerine"}


def cikti(obj):
    print(json.dumps(obj, ensure_ascii=False))
    sys.stdout.flush()


TARAYICILAR = ("firefox", "chrome", "edge", "opera", "brave", "mozilla")


def sekme_bul(anahtar):
    """Tarayici penceresindeki SEKMELERDE anahtari arar (Chrome/Edge sekmeleri).
    Bulursa o sekmeyi secer ve penceresini dondurur."""
    anahtar = anahtar.lower()
    for w in auto.GetRootControl().GetChildren():
        ad = (w.Name or "").lower()
        if not any(t in ad for t in TARAYICILAR):
            continue
        tab = bul(w, lambda c: c.ControlTypeName == "TabItemControl" and anahtar in (c.Name or "").lower(), maks=10)
        if tab:
            try:
                tab.GetSelectionItemPattern().Select()
            except Exception:
                try: tab.Click(simulateMove=False)
                except Exception: pass
            time.sleep(1.5)
            return w
    return None


def firefox_bul(anahtar):
    """Anahtar kelimeyi iceren tarayici penceresini bulur (Firefox, Chrome, Edge ...).
    Once pencere basliginda, sonra sekmelerde arar."""
    anahtar = anahtar.lower()
    yedek = None
    for w in auto.GetRootControl().GetChildren():
        ad = (w.Name or "").lower()
        if anahtar in ad:
            if any(t in ad for t in TARAYICILAR):
                return w
            if yedek is None:
                yedek = w
    if yedek:
        return yedek
    return sekme_bul(anahtar)


def pencere_adlari(anahtar):
    """Teshis icin: pencere adlari ve tarayici sekmeleri."""
    out = []
    for w in auto.GetRootControl().GetChildren():
        ad = (w.Name or "").strip()
        low = ad.lower()
        if ad and (anahtar.lower() in low or any(t in low for t in TARAYICILAR) or "b2b" in low):
            out.append(ad[:80])
        if any(t in low for t in TARAYICILAR):
            tablar = []
            def g(c, k=0):
                if k > 10: return
                try: cocuklar = c.GetChildren()
                except Exception: return
                for x in cocuklar:
                    try:
                        if x.ControlTypeName == "TabItemControl" and x.Name:
                            tablar.append(x.Name.strip()[:50])
                    except Exception: pass
                    g(x, k + 1)
            g(w)
            out.append("  sekmeler: " + " | ".join(tablar[:12]))
    return out[:20]


def bul(ctrl, pred, d=0, maks=12):
    if d > maks: return None
    try: cocuklar = ctrl.GetChildren()
    except Exception: return None
    for c in cocuklar:
        try:
            if pred(c): return c
        except Exception: pass
        r = bul(c, pred, d + 1, maks)
        if r: return r
    return None


def metinleri_topla(kok, maks=40):
    """Kok altindaki (DataItem/Text) metinleri sirayla toplar."""
    out = []
    def g(c, k=0):
        if k > maks: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if x.ControlTypeName in ("DataItemControl", "TextControl"):
                    n = temiz(x.Name)
                    if n: out.append(n)
            except Exception: pass
            g(x, k + 1)
    g(kok)
    return out


def satir_kontrolleri(doc):
    """DataItemControl'leri sirayla toplar; '+' ile biten DataItem satir basidir."""
    liste = []
    def g(c, k=0):
        if k > 40: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if x.ControlTypeName == "DataItemControl":
                    liste.append(x)
            except Exception: pass
            g(x, k + 1)
    g(doc)
    satirlar, aktif = [], None
    for x in liste:
        ad = (x.Name or "").strip()
        if ad.endswith("+"):
            if aktif: satirlar.append(aktif)
            aktif = []
            continue
        if aktif is not None and ad:
            aktif.append(x)
    if aktif: satirlar.append(aktif)
    return satirlar


def ara(parca, anahtar):
    ff = firefox_bul(anahtar)
    if not ff:
        benzer = pencere_adlari(anahtar)
        ek = f" Bulunan pencereler: {benzer}" if benzer else ""
        return {"hata": "PENCERE_YOK", "mesaj": f"'{anahtar}' tarayici penceresi acik degil.{ek} 🚀 B2B Kisayollari ile acin."}
    try: ff.SetActive(); ff.SetFocus()
    except Exception: pass
    time.sleep(0.6)

    doc = bul(ff, lambda c: c.ControlTypeName == "DocumentControl", maks=7)
    if not doc:
        return {"hata": "SAYFA_YOK", "mesaj": "Sayfa bulunamadi (pencere yuklenmemis olabilir)."}

    kutu = bul(doc, lambda c: c.ControlTypeName == "EditControl" and (c.Name or "").strip().lower().startswith("ara"), maks=30)
    if not kutu:
        return {"hata": "KUTU_YOK", "mesaj": "Arama kutusu bulunamadi."}
    try: kutu.Click(simulateMove=False)
    except Exception: pass
    time.sleep(0.3)
    auto.SendKeys("{Ctrl}a{Delete}"); time.sleep(0.2)
    auto.SendKeys(parca, interval=0.05); time.sleep(0.3)
    auto.SendKeys("{Enter}")

    # Sonuc satirlari gelene kadar bekle (en fazla 15 sn)
    for _ in range(15):
        time.sleep(1)
        if satir_kontrolleri(doc):
            time.sleep(2)
            break

    satirlar = satir_kontrolleri(doc)
    sonuc, net_yok, fiyatsiz = [], 0, 0
    kok = auto.GetRootControl()
    for hucreler in satirlar:
        adlar = [temiz(h.Name) for h in hucreler]
        # Brut fiyat hucresi
        pidx = next((i for i, a in enumerate(adlar) if PARA_GEV.search(a)), None)
        if pidx is None:
            fiyatsiz += 1
            continue
        kod = adlar[0]
        if kod.startswith("Campaign"):
            continue
        ad = adlar[1] if len(adlar) > 1 else ""
        marka = adlar[2] if len(adlar) > 2 else ""
        oem = adlar[3] if len(adlar) > 3 else ""
        brut = adlar[pidx]
        kocaeli = adlar[pidx + 1] if len(adlar) > pidx + 1 and adlar[pidx + 1] in STOK else ""
        diger = adlar[pidx + 2] if len(adlar) > pidx + 2 and adlar[pidx + 2] in STOK else ""

        # Net fiyat: fiyat hucresinin ustune gel, yeni cikan iki para degerini al
        fiyat_h = hucreler[pidx]
        r = fiyat_h.BoundingRectangle
        if not (r.top >= 0 and r.bottom <= GORUNUR_ALT and r.left >= 0 and r.right <= auto.GetScreenSize()[0]):
            net_yok += 1
            continue
        onceki = set(metinleri_topla(doc))
        fiyat_h.MoveCursorToMyCenter()
        time.sleep(1.5)
        yeni = [m for m in metinleri_topla(doc) if m not in onceki and PARA.match(m)]
        auto.SendKeys("{Esc}")
        time.sleep(0.2)
        if len(yeni) < 2:
            net_yok += 1
            continue
        kdv_haric = float(yeni[0].replace("₺", "").strip().replace(".", "").replace(",", "."))
        kdv_dahil = float(yeni[1].replace("₺", "").strip().replace(".", "").replace(",", "."))
        sonuc.append({
            "kod": kod, "ad": ad, "marka": marka, "oem": oem, "brut": brut,
            "kdvHaric": round(kdv_haric, 2), "kdvDahil": round(kdv_dahil, 2),
            "kocaeli": kocaeli, "diger": diger,
        })

    ornek = [[temiz(h.Name)[:20] for h in r][:14] for r in satirlar[:1]]
    return {"tamam": True, "satirlar": sonuc, "netYok": net_yok, "toplam": len(satirlar),
            "fiyatsiz": fiyatsiz, "ornek": ornek}


def one(anahtar):
    ff = firefox_bul(anahtar)
    if not ff:
        return {"hata": "PENCERE_YOK"}
    try: ff.SetActive(); ff.SetFocus()
    except Exception as e: return {"hata": str(e)}
    return {"tamam": True}


if __name__ == "__main__":
    try:
        if len(sys.argv) >= 4 and sys.argv[1] == "ara":
            cikti(ara(sys.argv[2], sys.argv[3]))
        elif len(sys.argv) >= 3 and sys.argv[1] == "one":
            cikti(one(sys.argv[2]))
        else:
            cikti({"hata": "KULLANIM"})
    except Exception as e:
        cikti({"hata": "ISTISNA", "mesaj": str(e)})
