# -*- coding: utf-8 -*-
"""DENEME 5: Altay sonuc tablosunda fiyat hucresinin ustune gelince cikan net fiyat bilgisini okur.
Once aramayi yapar (ui_test ile ayni), sonra her satirin fiyat hucresine fare ile gider ve
ekranda beliren yeni metinleri (tooltip / acilir kutu) ui_fiyat.txt'ye yazar."""
import sys, os, time, subprocess
def kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable,"-m","pip","install","--quiet","--disable-pip-version-check",pkg])
kur("uiautomation")
import uiautomation as auto

PARCA = sys.argv[1] if len(sys.argv) > 1 else "2091042"
MAKS_SATIR = int(sys.argv[2]) if len(sys.argv) > 2 else 3
KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "ui_fiyat.txt")
f = open(CIKTI, "w", encoding="utf-8")
def log(s): f.write(str(s) + "\n"); f.flush()
log(f"=== UI fiyat deneme 5 {time.strftime('%H:%M')} - parca={PARCA} ===")

ff = None
for w in auto.GetRootControl().GetChildren():
    ad = (w.Name or "")
    if "Firefox" in ad and ("altay" in ad.lower() or "b4b" in ad.lower()):
        ff = w; break
if not ff:
    log("Firefox yok"); f.close(); print("firefox yok"); sys.exit()
try: ff.SetActive(); ff.SetFocus()
except Exception: pass
time.sleep(0.8)

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

doc = bul(ff, lambda c: c.ControlTypeName == "DocumentControl", maks=7)
if not doc:
    log("DocumentControl bulunamadi"); f.close(); print("doc yok"); sys.exit()

# Arama (ui_test ile ayni yontem) - sonuc zaten ekrandaysa atlanabilir
kutu = bul(doc, lambda c: c.ControlTypeName == "EditControl" and (c.Name or "").strip().lower().startswith("ara"), maks=30)
if kutu:
    try: kutu.Click(simulateMove=False)
    except Exception: pass
    time.sleep(0.4)
    auto.SendKeys("{Ctrl}a{Delete}"); time.sleep(0.2)
    auto.SendKeys(PARCA, interval=0.05); time.sleep(0.3)
    auto.SendKeys("{Enter}")
    time.sleep(5)
    log("arama yapildi")

# Fiyat hucrelerini bul: ekranda '2.084,47' gibi tutar iceren TextControl'ler
def fiyat_mi(s):
    s = s.strip()
    return len(s) >= 4 and "," in s and s.replace(".", "").replace(",", "").strip().isdigit()

fiyatlar = []
def gez(ctrl, k=0):
    if k > 40: return
    try: cocuklar = ctrl.GetChildren()
    except Exception: return
    for c in cocuklar:
        try:
            if c.ControlTypeName in ("DataItemControl", "TextControl") and fiyat_mi(c.Name or ""):
                fiyatlar.append(c)
        except Exception: pass
        gez(c, k + 1)
gez(doc)
log(f"fiyat hucresi sayisi: {len(fiyatlar)}")

# Ilk MAKS_SATIR fiyat hucresinin ustune gel, yeni acilan yazilari kaydet
def ekran_metinleri(kok):
    """Masaustundeki (top-level) pencerelerde gorunen metinleri toplar."""
    out = []
    def g(ctrl, k=0):
        if k > 8: return
        try: cocuklar = ctrl.GetChildren()
        except Exception: return
        for c in cocuklar:
            try:
                n = (c.Name or "").strip()
                if n: out.append(f"[{c.ControlTypeName}] {n}")
            except Exception: pass
            g(c, k + 1)
    g(kok)
    return out

def sayfa_metinleri(d):
    """Sayfa (DocumentControl) icindeki tum metinleri, derin olarak toplar."""
    out = []
    def g(ctrl, k=0):
        if k > 40: return
        try: cocuklar = ctrl.GetChildren()
        except Exception: return
        for c in cocuklar:
            try:
                n = (c.Name or "").strip()
                if n: out.append(f"[{c.ControlTypeName}] {n}")
            except Exception: pass
            g(c, k + 1)
    g(d)
    return out

kok = auto.GetRootControl()
ekran_w, ekran_h = auto.GetScreenSize()
log(f"ekran: {ekran_w}x{ekran_h}")
for i, h in enumerate(fiyatlar[:MAKS_SATIR], 1):
    try:
        r = h.BoundingRectangle
        log(f"satir {i} rect: L={r.left} T={r.top} R={r.right} B={r.bottom}")
        # Gorev cubugunun ustunde kalan alan: 1030 px. Altindaki satirlar icin sayfayi kaydir.
        GORUNUR_ALT = 1030
        if r.top < 0 or r.bottom > GORUNUR_ALT or r.left < 0 or r.right > ekran_w:
            try:
                # Tablonun disinda, sayfa icerigi uzerinde kaydir (fiyat hucresi uzerinde degil)
                auto.SetCursorPos(700, 600)
                time.sleep(0.3)
                auto.WheelDown(wheelTimes=8, interval=0.1)
            except Exception as e: log(f"kaydirma hata: {e}")
            time.sleep(1.2)
            r = h.BoundingRectangle
            log(f"  kaydirma sonrasi rect: L={r.left} T={r.top} R={r.right} B={r.bottom}")
        if r.top < 0 or r.bottom > GORUNUR_ALT or r.left < 0 or r.right > ekran_w:
            log("  hucre hala gorunur alanda degil, atlandi")
            continue
        onceki = set(ekran_metinleri(kok)) | set(sayfa_metinleri(doc))
        h.MoveCursorToMyCenter()
        time.sleep(1.5)
        yeni = [m for m in (ekran_metinleri(kok) + sayfa_metinleri(doc)) if m not in onceki]
        log(f"--- satir {i} fiyat={h.Name.strip()} ---")
        for m in yeni[:60]: log(m)
    except Exception as e:
        log(f"satir {i} hata: {e}")
    time.sleep(0.5)

auto.SendKeys("{Esc}")
print("bitti")
f.close()
