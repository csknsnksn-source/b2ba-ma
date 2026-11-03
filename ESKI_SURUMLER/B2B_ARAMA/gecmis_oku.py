# -*- coding: utf-8 -*-
"""
Masaustu B2B programlarinin icindeki web goruntuleyicinin (WebView2 / Chromium) gecmis dosyalarindan
actiklari web adreslerini okur. Hicbir programi acmaz, hicbir dosyayi degistirmez.
Sonuc: adresler.txt
"""
import collections, os, shutil, sqlite3, tempfile, time, traceback, urllib.parse

KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI = os.path.join(KLASOR, "adresler.txt")
LOCAL = os.environ.get("LOCALAPPDATA", "")
ROAM = os.environ.get("APPDATA", "")
ARANACAK = [os.path.join(LOCAL, "Apps", "2.0"), os.path.join(ROAM, "Eryaz Software"),
            os.path.join(LOCAL, "Eryaz Software"), LOCAL, ROAM]
ATLA = ("google\\chrome", "microsoft\\edge\\user data", "bravesoftware", "mozilla", "\\packages\\",
        "microsoft\\teams", "microsoft\\olk", "spotify", "\\discord", "whatsapp")


def yaz(s):
    with open(CIKTI, "a", encoding="utf-8") as f:
        f.write(s + "\n")
    try:
        print(s, flush=True)
    except Exception:
        pass


def gecmis_dosyalari():
    bulunan = set()
    for kok in ARANACAK:
        if not os.path.isdir(kok):
            continue
        derinlik0 = kok.count(os.sep)
        for yol, klasorler, dosyalar in os.walk(kok):
            kucuk = yol.lower()
            if any(a in kucuk for a in ATLA):
                klasorler[:] = []
                continue
            if yol.count(os.sep) - derinlik0 > 9:
                klasorler[:] = []
                continue
            if "History" in dosyalar and ("ebwebview" in kucuk or "webview" in kucuk or "cef" in kucuk
                                          or "eryaz" in kucuk or "apps\\2.0" in kucuk):
                bulunan.add(os.path.join(yol, "History"))
    return sorted(bulunan)


def adresleri_oku(dosya):
    gecici = os.path.join(tempfile.gettempdir(), f"gecmis_{os.getpid()}.db")
    shutil.copy2(dosya, gecici)
    try:
        db = sqlite3.connect(gecici)
        satirlar = db.execute("SELECT url, visit_count FROM urls ORDER BY last_visit_time DESC LIMIT 400").fetchall()
        db.close()
    finally:
        try:
            os.remove(gecici)
        except Exception:
            pass
    sayac = collections.Counter()
    ornek = {}
    for url, n in satirlar:
        u = urllib.parse.urlparse(url)
        if u.scheme not in ("http", "https"):
            continue
        anahtar = f"{u.scheme}://{u.netloc}"
        sayac[anahtar] += (n or 1)
        ornek.setdefault(anahtar, f"{u.scheme}://{u.netloc}{u.path}")
    return sayac, ornek


def main():
    if os.path.exists(CIKTI):
        os.remove(CIKTI)
    yaz(f"=== Gecmis dosyalari taraniyor ({time.strftime('%d.%m.%Y %H:%M')}) ===")
    dosyalar = gecmis_dosyalari()
    yaz(f"{len(dosyalar)} gecmis dosyasi bulundu")
    for d in dosyalar:
        try:
            sayac, ornek = adresleri_oku(d)
            ust = ", ".join(f"{ornek[h]} ({n})" for h, n in sayac.most_common(4)) or "(adres yok)"
            yaz(f"{d} | {ust}")
        except Exception as e:
            yaz(f"{d} | OKUNAMADI: {e}")
    yaz("=== bitti ===")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        yaz("PROGRAM HATASI:\n" + traceback.format_exc())
