# -*- coding: utf-8 -*-
"""DENEME 4: Altay Firefox'ta 'Ara..' kutusuna parca yazar, sonuc satirlarini ayristirip ui_sonuc.txt'ye (TSV) yazar.
Ham metin ui_test.txt'e de yazilir."""
import sys, os, time, subprocess
def kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable,"-m","pip","install","--quiet","--disable-pip-version-check",pkg])
kur("uiautomation")
import uiautomation as auto

PARCA = sys.argv[1] if len(sys.argv) > 1 else "2091042"
KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "ui_test.txt")
SONUC = os.path.join(KLASOR, "ui_sonuc.txt")
f = open(CIKTI, "w", encoding="utf-8")
def log(s): f.write(str(s) + "\n"); f.flush()
log(f"=== UI deneme 4 {time.strftime('%H:%M')} - parca={PARCA} ===")

ff = None
for w in auto.GetRootControl().GetChildren():
    ad = (w.Name or "")
    if "Firefox" in ad and ("altay" in ad.lower() or "b4b" in ad.lower()):
        ff = w; break
if not ff:
    for w in auto.GetRootControl().GetChildren():
        if "Mozilla Firefox" in (w.Name or ""): ff = w; break
if not ff:
    log("Firefox yok"); f.close(); print("firefox yok"); sys.exit()
log(f"Pencere: {ff.Name}")
try: ff.SetActive(); ff.SetFocus()
except Exception as e: log(f"SetActive hata: {e}")
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

kutu = bul(doc, lambda c: c.ControlTypeName == "EditControl" and (c.Name or "").strip().lower().startswith("ara"), maks=30)
if not kutu:
    log("'Ara..' kutusu bulunamadi"); f.close(); print("kutu yok"); sys.exit()
log("'Ara..' kutusu bulundu")

try: kutu.Click(simulateMove=False)
except Exception as e: log(f"Click hata: {e}")
time.sleep(0.4)
auto.SendKeys("{Ctrl}a{Delete}")
time.sleep(0.2)
auto.SendKeys(PARCA, interval=0.05)
time.sleep(0.3)
auto.SendKeys("{Enter}")
log("arama gonderildi, sonuc bekleniyor...")

# Sonuc satirlari (DataItem, '+' isaretli baslangic) gelene kadar bekle, en fazla 15 sn
def satirlari_topla():
    """Doc agacindan DataItemControl adlarini sirayla toplar."""
    liste = []
    def gez(ctrl, k=0):
        if k > 40: return
        try: cocuklar = ctrl.GetChildren()
        except Exception: return
        for c in cocuklar:
            try:
                if c.ControlTypeName == "DataItemControl":
                    liste.append((c.Name or "").strip())
            except Exception: pass
            gez(c, k + 1)
    gez(doc)
    return liste

def satirlari_ayristir(liste):
    """'+' ile biten DataItem her satirin basini gosterir. Ilk isaretten sonrasi satir verisidir."""
    satirlar, aktif = [], None
    for ad in liste:
        if ad.endswith("+"):
            if aktif: satirlar.append(aktif)
            aktif = []
            continue
        if aktif is not None and ad:
            aktif.append(ad)
    if aktif: satirlar.append(aktif)
    return satirlar

bekle = 0
while bekle < 15:
    time.sleep(1)
    bekle += 1
    try:
        if len(satirlari_ayristir(satirlari_topla())) > 0 and bekle >= 3: break
    except Exception: pass
log(f"bekleme: {bekle} sn")

liste = satirlari_topla()
satirlar = satirlari_ayristir(liste)
log(f"DataItem sayisi: {len(liste)}, satir sayisi: {len(satirlar)}")

# Ham metin (kesim yok)
log("--- HAM DATAITEM ---")
for ad in liste: log(ad)

# Tablo cikisi: her satir bir TSV satiri
with open(SONUC, "w", encoding="utf-8") as g:
    g.write(f"parca={PARCA}\n")
    g.write("\t".join(["Satir", "Hucreler(kodu|adi|uretici|uretici kodu|birim|fiyat|Kocaeli|Diger|adet...)"]) + "\n")
    for i, s in enumerate(satirlar, 1):
        g.write(f"{i}\t" + " | ".join(s) + "\n")
print("bitti, satir:", len(satirlar))
f.close()
