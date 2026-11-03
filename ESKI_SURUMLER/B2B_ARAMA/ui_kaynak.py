# -*- coding: utf-8 -*-
"""DENEME 6: Altay Firefox'ta acik sayfanin kaynagini (Ctrl+U) panoya kopyalar,
ui_kaynak.html olarak kaydeder ve fiyat/KDV metinlerini sayar. Ardindan kaynak sekmesini kapatir."""
import sys, os, time, subprocess
def kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable,"-m","pip","install","--quiet","--disable-pip-version-check",pkg])
kur("uiautomation")
import uiautomation as auto

KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "ui_kaynak.txt")
HTML = os.path.join(KLASOR, "ui_kaynak.html")
f = open(CIKTI, "w", encoding="utf-8")
def log(s): f.write(str(s) + "\n"); f.flush()
log(f"=== UI kaynak deneme 6 {time.strftime('%H:%M')} ===")

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

# Kaynak gorunumu (view-source) yeni sekmede acilir
auto.SendKeys("{Ctrl}u")
time.sleep(3)
auto.SendKeys("{Ctrl}a")
time.sleep(0.3)
auto.SendKeys("{Ctrl}c")
time.sleep(1.0)

# Panodan oku (UTF-8)
try:
    cikti = subprocess.run(
        ["powershell", "-NoProfile", "-Command",
         "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard -Raw"],
        capture_output=True, timeout=60)
    metin = cikti.stdout.decode("utf-8", errors="replace")
except Exception as e:
    metin = ""
    log(f"pano okunamadi: {e}")

with open(HTML, "w", encoding="utf-8") as g:
    g.write(metin)
log(f"kaynak uzunlugu: {len(metin)} karakter")

# Sayimlar
for anahtar in ["KDV Hariç", "KDV Dahil", "NET FİYAT", "2.373,75", "548,89", "2091042", "MHR-22778", "NGK-77286", "MND-DN2091042D00", "₺"]:
    log(f"{anahtar!r}: {metin.count(anahtar)} kez")

# Kaynak sekmesini kapat (Ctrl+W), arama sekmesine don
auto.SendKeys("{Ctrl}w")
time.sleep(1)
log("kaynak sekmesi kapatildi")
print("bitti, uzunluk:", len(metin))
f.close()
