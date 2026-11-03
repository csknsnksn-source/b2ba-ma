# -*- coding: utf-8 -*-
"""
Masaustu B2B programlarinin (Eryaz, Yuce Yazilim vb. ClickOnce) icinde actiklari web adresini bulur.
Her programi WebView2 hata ayiklama portu acik sekilde baslatir, acilan sayfanin adresini okur, programi kapatir.
Sonuc: adresler.txt
"""
import glob, json, os, re, subprocess, sys, time, traceback, urllib.parse, urllib.request

KLASOR = os.path.dirname(os.path.abspath(__file__))
KISAYOL_KLASORU = os.path.dirname(KLASOR)            # PROGRAM OLANLAR
APPS = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Apps", "2.0")
CIKTI = os.path.join(KLASOR, "adresler.txt")
PORT_BAS = 9300


def yaz(s):
    with open(CIKTI, "a", encoding="utf-8") as f:
        f.write(s + "\n")
    try:
        print(s, flush=True)
    except Exception:
        pass


def iz(s):   # ayrintili ilerleme kaydi
    with open(CIKTI, "a", encoding="utf-8") as f:
        f.write("   . " + s + "\n")


def appref_oku(yol):
    ham = open(yol, "rb").read()
    for enc in ("utf-16", "utf-8-sig", "cp1254"):
        try:
            return ham.decode(enc)
        except Exception:
            pass
    return ""


def exe_bul(uygulama_adi):
    aday = []
    hedef = uygulama_adi.lower() + ".exe"
    for kok, _, dosyalar in os.walk(APPS):
        for d in dosyalar:
            if d.lower() == hedef:
                p = os.path.join(kok, d)
                aday.append((os.path.getmtime(p), p))
    aday.sort(reverse=True)
    return aday[0][1] if aday else None


def sayfalari_oku(port, sure):
    bitis = time.time() + sure
    son = []
    sayac = 0
    while time.time() < bitis:
        sayac += 1
        if sayac % 5 == 1:
            iz(f"port {port} bekleniyor ({sayac}. deneme)")
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=2) as r:
                sayfalar = json.loads(r.read().decode("utf-8"))
            son = [s.get("url", "") for s in sayfalar if s.get("type") == "page"]
            gercek = [u for u in son if u.startswith("http")]
            if gercek:
                time.sleep(4)   # giris sonrasi yonlendirme icin biraz bekle
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=2) as r:
                    sayfalar = json.loads(r.read().decode("utf-8"))
                return [s.get("url", "") for s in sayfalar if s.get("type") == "page"]
        except Exception:
            pass
        time.sleep(1)
    return son


def main():
    if os.path.exists(CIKTI):
        os.remove(CIKTI)
    kisayollar = sorted(glob.glob(os.path.join(KISAYOL_KLASORU, "*.appref-ms")))
    secim = [a.lower() for a in sys.argv[1:]]
    if secim:
        kisayollar = [k for k in kisayollar if any(s in os.path.basename(k).lower() for s in secim)]
    yaz(f"=== {len(kisayollar)} program denenecek ({time.strftime('%d.%m.%Y %H:%M')}) ===")
    for i, k in enumerate(kisayollar):
        try:
            tek(i, k)
        except Exception:
            yaz(f"{os.path.basename(k)} | HATA:\n" + traceback.format_exc())
    yaz("=== bitti ===")


def tek(i, k):
    if True:
        ad = os.path.splitext(os.path.basename(k))[0]
        icerik = appref_oku(k)
        m = re.search(r"/([^/#]+)\.application", icerik)
        if not m:
            yaz(f"{ad} | HATA: kisayol okunamadi")
            return
        uyg = urllib.parse.unquote(m.group(1))
        iz(f"{ad}: program adi {uyg}, dosya araniyor: {APPS}")
        exe = exe_bul(uyg)
        if not exe:
            yaz(f"{ad} | HATA: program dosyasi bulunamadi ({uyg}.exe)")
            return
        port = PORT_BAS + i
        ortam = dict(os.environ)
        ortam["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = f"--remote-debugging-port={port}"
        iz(f"{ad}: {exe} aciliyor (port {port})")
        try:
            BAGIMSIZ = 0x00000008 | 0x00000200 | 0x01000000   # DETACHED_PROCESS | NEW_PROCESS_GROUP | BREAKAWAY_FROM_JOB
            try:
                p = subprocess.Popen([exe], cwd=os.path.dirname(exe), env=ortam, creationflags=BAGIMSIZ,
                                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except OSError:
                p = subprocess.Popen([exe], cwd=os.path.dirname(exe), env=ortam, creationflags=0x00000008 | 0x00000200,
                                     stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            iz(f"{ad}: baslatildi, pid {p.pid}")
        except Exception as e:
            yaz(f"{ad} | HATA: baslatilamadi: {e}")
            return
        urller = sayfalari_oku(port, 35)
        iz(f"{ad}: okunan sayfalar: {urller}")
        subprocess.run(["taskkill", "/PID", str(p.pid), "/T", "/F"], capture_output=True)
        subprocess.run(["taskkill", "/IM", os.path.basename(exe), "/T", "/F"], capture_output=True)
        if urller:
            yaz(f"{ad} | {' ; '.join(urller)}")
        else:
            yaz(f"{ad} | BULUNAMADI (WebView2 degil ya da acilmadi) | {uyg}")
        time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        yaz("PROGRAM HATASI:\n" + traceback.format_exc())
