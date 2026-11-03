# -*- coding: utf-8 -*-
"""Altay masaustu programinin dosyalarini incelemek icin inceleme\\altay klasorune KOPYALAR (orijinale dokunmaz)."""
import os, shutil
KLASOR = os.path.dirname(os.path.abspath(__file__))
APPS = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Apps", "2.0")
HEDEF = os.path.join(KLASOR, "inceleme", "altay")
aday = []
for kok, _, dosyalar in os.walk(APPS):
    for d in dosyalar:
        if d.lower() == "altayotob4b.exe":
            p = os.path.join(kok, d); aday.append((os.path.getmtime(p), p))
aday.sort(reverse=True)
if not aday:
    print("Altay programi bulunamadi"); raise SystemExit
kaynak = os.path.dirname(aday[0][1])
os.makedirs(HEDEF, exist_ok=True)
n = 0
for d in os.listdir(kaynak):
    if d.lower().endswith((".exe", ".dll", ".config", ".xml", ".json", ".manifest")):
        shutil.copy2(os.path.join(kaynak, d), HEDEF); n += 1
print(f"{n} dosya kopyalandi: {HEDEF}")
