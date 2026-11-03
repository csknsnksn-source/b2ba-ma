# -*- coding: utf-8 -*-
"""
Masaustu B2B programlarinin (ClickOnce, Apps\\2.0) baglandigi sunucu / servis adreslerini bulur.
Program dosyalarini ve .config dosyalarini SADECE OKUR. Sonuc: adresler.txt
"""
import collections, glob, os, re, time, traceback, urllib.parse

KLASOR = os.path.dirname(os.path.abspath(__file__))
KISAYOL_KLASORU = os.path.dirname(KLASOR)
APPS = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Apps", "2.0")
CIKTI = os.path.join(KLASOR, "adresler.txt")
URL_RE = re.compile(rb"https?://[A-Za-z0-9.\-_:]+(?:/[A-Za-z0-9._~%/\-]*)?")
URL_RE16 = re.compile(rb"h\x00t\x00t\x00p\x00s?\x00:\x00/\x00/\x00(?:[A-Za-z0-9.\-_:/~%]\x00){3,200}")
GURULTU = ("schemas.microsoft.com", "www.w3.org", "schemas.xmlsoap.org", "microsoft.com/", "crl.", "ocsp.",
           "digicert", "verisign", "symantec", "thawte", "globalsign", "sectigo", "usertrust", "comodo",
           "go.microsoft", "purl.org", "xmlns", "tempuri.org", "schemas.datacontract", "openxmlformats", "adobe.com",
           "msdn", "nuget", "github.com", "devexpress", "telerik", "infragistics", "dotnet", "w3.org", "example.")


def yaz(s):
    with open(CIKTI, "a", encoding="utf-8") as f:
        f.write(s + "\n")
    try:
        print(s, flush=True)
    except Exception:
        pass


def appref_oku(yol):
    ham = open(yol, "rb").read()
    for enc in ("utf-16", "utf-8-sig", "cp1254"):
        try:
            return ham.decode(enc)
        except Exception:
            pass
    return ""


def program_klasoru(uyg):
    hedef = uyg.lower() + ".exe"
    aday = []
    for kok, _, dosyalar in os.walk(APPS):
        for d in dosyalar:
            if d.lower() == hedef:
                p = os.path.join(kok, d)
                aday.append((os.path.getmtime(p), p))
    aday.sort(reverse=True)
    return aday[0][1] if aday else None


def urller(dosya):
    try:
        ham = open(dosya, "rb").read()
    except Exception:
        return []
    bulunan = [m.group(0).decode("ascii", "ignore") for m in URL_RE.finditer(ham)]
    bulunan += [m.group(0).replace(b"\x00", b"").decode("ascii", "ignore") for m in URL_RE16.finditer(ham)]
    return [u.rstrip("/.") for u in bulunan if not any(g in u.lower() for g in GURULTU)]


def main():
    if os.path.exists(CIKTI):
        os.remove(CIKTI)
    yaz(f"=== Servis adresleri taraniyor ({time.strftime('%d.%m.%Y %H:%M')}) ===")
    for k in sorted(glob.glob(os.path.join(KISAYOL_KLASORU, "*.appref-ms"))):
        ad = os.path.splitext(os.path.basename(k))[0]
        try:
            m = re.search(r"https?://[^#]+/([^/#]+)\.application", appref_oku(k))
            if not m:
                yaz(f"{ad} | kisayol okunamadi"); continue
            yayin = m.group(0).rsplit("/", 1)[0]
            uyg = urllib.parse.unquote(m.group(1))
            exe = program_klasoru(uyg)
            if not exe:
                yaz(f"{ad} | program dosyasi bulunamadi | yayin: {yayin}"); continue
            klasor = os.path.dirname(exe)
            sayac = collections.Counter()
            for d in os.listdir(klasor):
                if d.lower().endswith((".exe", ".dll", ".config", ".xml", ".json", ".ini", ".txt")):
                    for u in urller(os.path.join(klasor, d)):
                        sayac[u] += 1
            liste = [u for u, _ in sayac.most_common(12)]
            yaz(f"{ad} | {uyg} | " + (" ; ".join(liste) if liste else "adres bulunamadi"))
        except Exception:
            yaz(f"{ad} | HATA: " + traceback.format_exc().splitlines()[-1])
    yaz("=== bitti ===")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        yaz("PROGRAM HATASI:\n" + traceback.format_exc())
