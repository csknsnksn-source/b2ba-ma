# -*- coding: utf-8 -*-
"""Chrome'da ZATEN ACIK ve GIRIS YAPILMIS bir B2B sekmesini inceler.
Kullanim: python sekme_incele.py <sekme_anahtari> <parca> <etiket>
1) Chrome pencerelerinde adinda anahtar gecen sekmeyi bulur ve one getirir.
2) Sayfadaki arama kutusuna parcayi yazip Enter'a basar.
3) Sonuc sayfasinin yapisini (kontrol tipi, ad, AutomationId) dosyaya yazar.
Sifre girmez; yalnizca arama kutusuna parca numarasi yazar."""
import sys, os, time, subprocess
def kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkg])
kur("uiautomation")
import uiautomation as auto

ANAHTAR = (sys.argv[1] if len(sys.argv) > 1 else "Lepar").lower()
PARCA = sys.argv[2] if len(sys.argv) > 2 else "2091042"
ETIKET = sys.argv[3] if len(sys.argv) > 3 else "lepar"
KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, f"sekme_{ETIKET}.txt")
f = open(CIKTI, "w", encoding="utf-8")
def log(s): f.write(str(s) + "\n"); f.flush()
log(f"=== Sekme inceleme {time.strftime('%H:%M')} anahtar={ANAHTAR} parca={PARCA} ===")


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


def belgeler(ctrl, maks=14):
    """Penceredeki tum DocumentControl'leri toplar (Chrome arka sekmeleri de verebilir)."""
    out = []
    def g(c, k=0):
        if k > maks: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if x.ControlTypeName == "DocumentControl":
                    out.append(x)
                    continue
            except Exception: pass
            g(x, k + 1)
    g(ctrl)
    return out


def dogru_belge(pencere):
    """Adi sekme anahtarini iceren belgeyi secer; yoksa None."""
    tum_b = belgeler(pencere)
    log("Penceredeki belgeler: " + " | ".join((b.Name or "?")[:50] for b in tum_b))
    for b in tum_b:
        if ANAHTAR in (b.Name or "").lower():
            return b
    return None


# 1) Sekmeyi bul ve sec
pencere, sekme = None, None
for w in auto.GetRootControl().GetChildren():
    if "chrome" not in (w.Name or "").lower():
        continue
    t = bul(w, lambda c: c.ControlTypeName == "TabItemControl" and ANAHTAR in (c.Name or "").lower(), maks=10)
    if t:
        pencere, sekme = w, t
        break
if not sekme:
    log("Sekme bulunamadi"); f.close(); print("sekme yok"); sys.exit()
log(f"Sekme: {sekme.Name}")
try: pencere.SetActive(); pencere.SetFocus()
except Exception: pass
try:
    sekme.GetSelectionItemPattern().Select()
except Exception:
    try: sekme.Click(simulateMove=False)
    except Exception as e: log(f"sekme secilemedi: {e}")
time.sleep(2)
log(f"Pencere basligi (secimden sonra): {pencere.Name}")
if ANAHTAR not in (pencere.Name or "").lower():
    log("UYARI: pencere basligi sekmeyle eslesmiyor, sekme degismemis olabilir")

doc = None
for _ in range(4):
    doc = dogru_belge(pencere)
    if doc: break
    time.sleep(1.5)
if not doc:
    log("Sekmenin sayfasi bulunamadi (baska sekmenin sayfasi okunmasin diye durduruldu)"); f.close(); print("doc yok"); sys.exit()
try: log(f"Sayfa: {doc.Name}")
except Exception: pass


def tum(ctrl, maks=45):
    out = []
    def g(c, k=0):
        if k > maks: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                ad = (x.Name or "").strip().replace("\n", " ")[:120]
                aid = x.AutomationId or ""
                out.append((k, x.ControlTypeName, ad, aid))
            except Exception: pass
            g(x, k + 1)
    g(ctrl)
    return out


# 2) Arama kutusu
def arama_mi(c):
    if c.ControlTypeName != "EditControl":
        return False
    ad = (c.Name or "").lower()
    aid = (c.AutomationId or "").lower()
    return any(k in ad or k in aid for k in ("ara", "search", "urun", "ürün", "stok", "kod"))

kutu = bul(doc, arama_mi, maks=45)
if not kutu:
    log("Arama kutusu bulunamadi. Sayfadaki giris alanlari:")
    for k, t, ad, aid in tum(doc):
        if t in ("EditControl", "ButtonControl", "ComboBoxControl"):
            log(f"  [{t}] '{ad}' id={aid}")
    f.close(); print("kutu yok"); sys.exit()
log(f"Arama kutusu: '{kutu.Name}' id={kutu.AutomationId}")

try: kutu.Click(simulateMove=False)
except Exception as e: log(f"kutu tiklama hata: {e}")
time.sleep(0.3)
auto.SendKeys("{Ctrl}a{Delete}"); time.sleep(0.2)
auto.SendKeys(PARCA, interval=0.04); time.sleep(0.3)
auto.SendKeys("{Enter}")
log("arama gonderildi, 8 sn bekleniyor")
time.sleep(8)

# 3) Sonuc sayfasi yapisi (sayfa yenilenmis olabilir; dokumani tekrar bul)
doc = dogru_belge(pencere) or doc
try: log(f"Sonuc sayfasi: {doc.Name}")
except Exception: pass
liste = tum(doc)
log(f"--- SAYFA YAPISI ({len(liste)} oge) ---")
for k, t, ad, aid in liste[:2500]:
    if not ad and not aid:
        continue
    log(f"{'  ' * min(k, 20)}[{t}] {ad}" + (f"  #{aid}" if aid else ""))
print("bitti:", len(liste))
f.close()
