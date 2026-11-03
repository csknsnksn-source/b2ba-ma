# -*- coding: utf-8 -*-
"""Acik pencereleri ve tarayici sekmelerini listeler (yalnizca okur, hicbir seye tiklamaz).
Cikti: acik_pencereler.txt"""
import sys, os, subprocess
def kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkg])
kur("uiautomation")
import uiautomation as auto

KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "acik_pencereler.txt")
TARAYICI = ("firefox", "chrome", "edge", "opera", "brave")

def sekmeler(w):
    out = []
    def g(c, k=0):
        if k > 10: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if x.ControlTypeName == "TabItemControl" and x.Name:
                    out.append(x.Name.strip())
            except Exception: pass
            g(x, k + 1)
    g(w)
    return out

with open(CIKTI, "w", encoding="utf-8") as f:
    for w in auto.GetRootControl().GetChildren():
        ad = (w.Name or "").strip()
        if not ad:
            continue
        try: sinif = w.ClassName
        except Exception: sinif = ""
        try:
            r = w.BoundingRectangle
            konum = f"{r.left},{r.top} {r.right - r.left}x{r.bottom - r.top}"
        except Exception:
            konum = "?"
        f.write(f"PENCERE: {ad} | sinif={sinif} | {konum}\n")
        if any(t in ad.lower() for t in TARAYICI):
            for s in sekmeler(w):
                f.write(f"    sekme: {s}\n")
print("bitti")
