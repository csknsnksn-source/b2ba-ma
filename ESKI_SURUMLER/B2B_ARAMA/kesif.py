# -*- coding: utf-8 -*-
"""Acik masaustu B2B programinin pencere yapisini (arama kutusu, buton, tablo) kesif_cikti.txt'ye dokar.
Hicbir sey degistirmez, sadece okur."""
import subprocess, sys, os, time

def kur(pkg):
    try:
        __import__(pkg)
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkg])

kur("uiautomation")
import uiautomation as auto

KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "kesif_cikti.txt")
out = open(CIKTI, "w", encoding="utf-8")
def w(s):
    out.write(s + "\n")

w(f"=== Kesif {time.strftime('%d.%m.%Y %H:%M')} ===\n")
w("--- Acik ust-duzey pencereler ---")
root = auto.GetRootControl()
adaylar = []
for win in root.GetChildren():
    try:
        ad = win.Name or ""
    except Exception:
        ad = ""
    cls = ""
    try:
        cls = win.ClassName or ""
    except Exception:
        pass
    if ad.strip() or "HwndWrapper" in cls:
        w(f"[{win.ControlTypeName}] Name='{ad}'  Class='{cls}'")
    dd = (ad + " " + cls).lower()
    if any(x in dd for x in ("altay", "b4b", "eryaz", "otob4b", "b2b")):
        adaylar.append(win)

if not adaylar:
    w("\n!!! Altay/B4B penceresi bulunamadi. Yukaridaki listeden pencere adini bana soyleyin.")
    out.close(); print("bitti (pencere bulunamadi)"); sys.exit()

def gez(ctrl, derin=0, mx=5):
    if derin > mx:
        return
    try:
        cocuklar = ctrl.GetChildren()
    except Exception as e:
        w("  " * derin + f"(cocuk hatasi: {e})"); return
    for c in cocuklar:
        try:
            ad = (c.Name or "")[:60]
            aid = c.AutomationId or ""
            cls = c.ClassName or ""
            w("  " * derin + f"[{c.ControlTypeName}] Name='{ad}' AutoId='{aid}' Class='{cls}'")
        except Exception as e:
            w("  " * derin + f"(hata: {e})")
        gez(c, derin + 1, mx)

for h in adaylar:
    w(f"\n=== PENCERE: '{h.Name}' ===")
    gez(h)

out.close()
print("bitti:", CIKTI)
