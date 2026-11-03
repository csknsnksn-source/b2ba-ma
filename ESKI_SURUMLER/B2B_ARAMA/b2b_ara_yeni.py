# -*- coding: utf-8 -*-
"""
B2B ORTAK ARAMA
- Kendi Chrome profiliyle B2B sitelerini sekmelerde acar (giris bir kez yapilir, hatirlanir)
- Tek arama ekranindan parca numarasini tum B2B'lerde arar
- Sonuclari KDV haric net fiyata gore ucuzdan pahaliya listeler
- Hatalari log klasorune yazar
"""
import asyncio
import json
import os
import sys
import time
import traceback
import urllib.parse
from datetime import datetime

from playwright.async_api import async_playwright

import kasa
import ayarlar

KLASOR = os.path.dirname(os.path.abspath(__file__))
PROFIL = os.path.join(KLASOR, "profil")
PROFIL_FF = os.path.join(KLASOR, "profil_firefox")
LOG_KLASOR = os.path.join(KLASOR, "log")
SITE_DOSYA = os.path.join(KLASOR, "siteler.json")
ARAYUZ = os.path.join(KLASOR, "arama.html")

os.makedirs(LOG_KLASOR, exist_ok=True)


# ------------------------------------------------------------------ LOG
def log(mesaj):
    satir = f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {mesaj}"
    print(satir, flush=True)
    dosya = os.path.join(LOG_KLASOR, f"arama_{datetime.now():%Y-%m-%d}.txt")
    with open(dosya, "a", encoding="utf-8") as f:
        f.write(satir + "\n")


class GirisGerekli(Exception):
    def __init__(self, mesaj="Giriş yapılmamış"):
        super().__init__(mesaj)


# ------------------------------------------------------------------ GRUP A
# Basbug, Dinamik, Martas, Rotas, Sayim Rulman ... (".../web/b2b/search" altyapisi)

def kod_coz(kod):
    """Sitenin sifreli urun kodunu cozer: hex -> XOR 0x72 -> hex -> URL kodlu metin."""
    try:
        ara = bytes(b ^ 0x72 for b in bytes.fromhex(kod)).decode("ascii")
        return urllib.parse.unquote(bytes.fromhex(ara).decode("ascii")).strip()
    except Exception:
        return kod or ""


def a_cevap_coz(govde):
    """ProductSearch / RemainingProducts cevabini sozluge cevirir."""
    dis = json.loads(govde)
    for anahtar, deger in dis.items():
        if anahtar.endswith("Result"):
            return json.loads(deger) if isinstance(deger, str) else deger
    return dis


def a_satirlar(site_adi, veri):
    """Grup A cevabindaki urunleri ortak satir bicimine cevirir."""
    depolar = {}
    for d in veri.get("WarehouseList") or []:
        depolar[d.get("WarehouseID")] = (d.get("ColumnName") or str(d.get("WarehouseID")), d.get("ShowCartSummary", True))

    satirlar = []
    for u in veri.get("ResultDetailed") or []:
        fiyat = u.get("NetPriceWoVat")
        if fiyat is None or float(fiyat) <= 0:
            continue
        kdvli = u.get("NetPriceWVat")
        stok_parca = []
        toplam = 0
        for a in u.get("Availability") or []:
            adi, sayilir = depolar.get(a.get("WarehouseID"), (str(a.get("WarehouseID")), True))
            miktar = a.get("Amount") or 0
            if miktar and sayilir:
                stok_parca.append(f"{adi} {miktar}")
                toplam += miktar
        satirlar.append({
            "b2b": site_adi,
            "kod": kod_coz(u.get("ProductCode", "")),
            "marka": u.get("Brand") or "",
            "oem": u.get("OemNr") or "",
            "ad": u.get("Name_PType") or "",
            "fiyat": round(float(fiyat), 2),
            "fiyatKdvli": round(float(kdvli), 2) if kdvli else None,
            "stok": ", ".join(stok_parca),
            "stokVar": toplam > 0,
            "resim": f"/Service/Thumb/{u['ID']}.res" if u.get("PictureExists") and u.get("ID") else None,
            "resimBuyuk": f"/Service/Res/{u['ID']}.res" if u.get("PictureExists") and u.get("ID") else None,
        })
    return satirlar


async def giris_grup_a(site, sayfa):
    """Giris sayfasindaysa kayitli bilgilerle otomatik giris yapar."""
    if "/web/login" not in sayfa.url:
        return True
    try:
        bilgi = kasa.oku(site["ad"])
    except Exception as e:
        raise GirisGerekli(f"Kayıtlı şifre okunamadı: {e}")
    if not bilgi:
        raise GirisGerekli("Giriş yapılmamış (şifre kayıtlı değil)")
    log(f"   {site['ad']}: otomatik giris yapiliyor")
    form = sayfa.locator("input[name=username]")
    await form.wait_for(state="visible", timeout=15000)
    if bilgi.get("musteri"):
        await sayfa.fill("input[name=customercode]", bilgi["musteri"])
    await sayfa.fill("input[name=username]", bilgi["kullanici"])
    await sayfa.fill("input[name=password]", bilgi["sifre"])
    dugme = sayfa.locator("button[type=submit].loginBtn", has_text="Giriş")
    if await dugme.count():
        await dugme.first.click(timeout=10000)
    else:
        await sayfa.press("input[name=password]", "Enter")
    for _ in range(40):
        await sayfa.wait_for_timeout(500)
        if "/web/login" not in sayfa.url:
            log(f"   {site['ad']}: otomatik giris basarili")
            return True
    raise GirisGerekli("Otomatik giriş başarısız (şifre yanlış veya site uyarı veriyor)")


async def ara_grup_a(site, sayfa, metin):
    if "/web/b2b/search" not in sayfa.url:
        await sayfa.goto(site["url"], wait_until="domcontentloaded")
        await sayfa.wait_for_timeout(1500)
    if "/web/login" in sayfa.url:
        await giris_grup_a(site, sayfa)
        if "/web/b2b/search" not in sayfa.url:
            await sayfa.goto(site["url"], wait_until="domcontentloaded")
            await sayfa.wait_for_timeout(1500)

    kutu = sayfa.locator("#searchInput")
    try:
        await kutu.wait_for(state="visible", timeout=15000)
    except Exception:
        if "/web/login" in sayfa.url:
            raise GirisGerekli()
        raise Exception("Arama kutusu bulunamadi (site tasarimi degismis olabilir)")

    gelen = []
    gorulen = []

    yeni_istekler = set()   # sadece bu aramadan sonra gonderilen istekler

    def istek(r):
        yeni_istekler.add(r)

    def yakala(cevap):
        if cevap.request in yeni_istekler and cevap.request.resource_type in ("xhr", "fetch"):
            gelen.append(cevap)
            gorulen.append(f"{cevap.status} {cevap.request.method} {cevap.url[:150]}")

    await kutu.fill(metin)
    sayfa.on("request", istek)
    sayfa.on("response", yakala)
    try:
        await kutu.press("Enter")

        satirlar = []
        islenen = 0
        bitis = time.time() + site.get("zaman_asimi", 30)
        ana_geldi = False
        bekleyen_var = True
        while time.time() < bitis:
            while islenen < len(gelen):
                c = gelen[islenen]
                islenen += 1
                if c.status in (401, 403):
                    raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
                if c.status != 200:
                    continue
                try:
                    govde = await c.text()
                except Exception:
                    continue
                if "ResultDetailed" not in govde:
                    continue  # urun listesi olmayan diger istekler
                veri = a_cevap_coz(govde)
                if "ResultDetailed" not in veri:
                    continue
                satirlar += a_satirlar(site["ad"], veri)
                if "remaining" not in c.url.lower():
                    ana_geldi = True
                bekleyen_var = bool(veri.get("RemainingProductIds"))
            if ana_geldi and not bekleyen_var:
                return satirlar
            if "/web/login" in sayfa.url:
                raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
            await asyncio.sleep(0.3)

        if ana_geldi:
            return satirlar  # kalan urunler gelmedi ama ana sonuc var
        log(f"   {site['ad']}: TANI - sayfa: {sayfa.url}")
        for g in gorulen[:25]:
            log(f"   {site['ad']}: TANI - istek: {g}")
        raise Exception("Zaman asimi: site cevap vermedi")
    finally:
        sayfa.remove_listener("response", yakala)
        sayfa.remove_listener("request", istek)


# ------------------------------------------------------------------ ERYAZ WEB (B4B)
# Intermobil (ioto) ... Next.js arayuzu, /api/Search/SearchOptimizedHydrated

async def giris_eryaz_web(site, sayfa):
    if "/login" not in sayfa.url:
        return True
    try:
        bilgi = kasa.oku(site["ad"])
    except Exception as e:
        raise GirisGerekli(f"Kayıtlı şifre okunamadı: {e}")
    if not bilgi:
        raise GirisGerekli("Giriş yapılmamış (şifre kayıtlı değil)")
    log(f"   {site['ad']}: otomatik giris yapiliyor")
    kul = sayfa.locator("input[type=text]").first
    await kul.wait_for(state="visible", timeout=15000)
    await kul.fill(bilgi["kullanici"])
    await sayfa.locator("input[type=password]").first.fill(bilgi["sifre"])
    dugme = sayfa.locator("button[type=submit]")
    if await dugme.count():
        await dugme.first.click(timeout=10000)
    else:
        await sayfa.locator("input[type=password]").first.press("Enter")
    for _ in range(40):
        await sayfa.wait_for_timeout(500)
        if "/login" not in sayfa.url:
            log(f"   {site['ad']}: otomatik giris basarili")
            return True
    raise GirisGerekli("Otomatik giriş başarısız (şifre yanlış veya site uyarı veriyor)")


def eryaz_web_satirlar(site_adi, veri):
    satirlar = []
    for u in ((veri.get("data") or {}).get("items") or []):
        fiyat = u.get("finalUnitPrice")
        if fiyat is None or float(fiyat) <= 0:
            continue
        oemler = u.get("oems") or []
        oem = next((o.get("oemCode") for o in oemler if o.get("isDefault")), None) or (oemler[0].get("oemCode") if oemler else "")
        stok = u.get("stock") or {}
        durum = ((stok.get("stockDisplay") or {}).get("status") or "").lower()
        stok_var = bool(durum) and not any(x in durum for x in ("unavail", "out", "none", "nostock", "no_stock"))
        depolar = []
        for d in stok.get("items") or []:
            sd = d.get("stockDisplay") or {}
            ds = (sd.get("status") or "").lower()
            if ds and not any(x in ds for x in ("unavail", "out", "none", "nostock", "no_stock")):
                miktar = sd.get("exactQuantity")
                depolar.append(f"{d.get('warehouseName', '')} {miktar if miktar is not None else sd.get('localizedLabel', '')}".strip())
        kdvli = u.get("finalUnitPriceWithVat")
        satirlar.append({
            "b2b": site_adi,
            "kod": u.get("code") or "",
            "marka": u.get("manufacturerName") or "",
            "oem": oem or "",
            "ad": (u.get("name") or "") + (" – " + u["description"] if u.get("description") else ""),
            "fiyat": round(float(fiyat), 2),
            "fiyatKdvli": round(float(kdvli), 2) if kdvli else None,
            "stok": ", ".join(depolar),
            "stokVar": stok_var,
            "resim": u.get("thumbnailUrl") or None,
        })
    return satirlar


async def ara_eryaz_web(site, sayfa, metin):
    if "/search" not in sayfa.url:
        await sayfa.goto(site["url"], wait_until="domcontentloaded")
        await sayfa.wait_for_timeout(2000)
    if "/login" in sayfa.url:
        await giris_eryaz_web(site, sayfa)
        await sayfa.goto(site["url"], wait_until="domcontentloaded")
        await sayfa.wait_for_timeout(2000)
        if "/login" in sayfa.url:
            raise GirisGerekli("Oturum açılamadı")

    kutu = sayfa.locator('input[placeholder="Ara.."]').first
    try:
        await kutu.wait_for(state="visible", timeout=15000)
    except Exception:
        raise Exception("Arama kutusu bulunamadi (site tasarimi degismis olabilir)")

    gelen = []
    yeni_istekler = set()

    def istek(r):
        yeni_istekler.add(r)

    def yakala(c):
        if c.request in yeni_istekler and "/api/Search/SearchOptimized" in c.url:
            gelen.append(c)

    await kutu.fill("")
    sayfa.on("request", istek)
    sayfa.on("response", yakala)
    try:
        await kutu.fill(metin)
        await kutu.press("Enter")
        bitis = time.time() + site.get("zaman_asimi", 30)
        while time.time() < bitis:
            for c in list(gelen):
                q = urllib.parse.parse_qs(urllib.parse.urlparse(c.url).query).get("q", [""])[0]
                if q.strip().lower() != metin.strip().lower():
                    continue
                if c.status in (401, 403):
                    raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
                if c.status != 200:
                    raise Exception(f"Site hata dondu: HTTP {c.status}")
                return eryaz_web_satirlar(site["ad"], json.loads(await c.text()))
            if "/login" in sayfa.url:
                raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
            await asyncio.sleep(0.3)
        raise Exception("Zaman asimi: site cevap vermedi")
    finally:
        sayfa.remove_listener("response", yakala)
        sayfa.remove_listener("request", istek)


# ------------------------------------------------------------------ ERYAZ B2B v4 (eski web surumu)
# Vahdet Tiryakioglu ... /Search?text=..., POST /Search/SearchProduct

def _tl_sayi(metin):
    """'1.439,30&nbsp;<i ...>' -> 1439.30"""
    import re as _re
    m = _re.search(r"[\d.]+,\d+|\d+", metin or "")
    if not m:
        return None
    return float(m.group(0).replace(".", "").replace(",", "."))


_DONANIM = None

def _donanim_bilgisi():
    """Bu makinenin donanim kimligi (Eryaz lisans dogrulamasi icin).
    Masaustu program bu makinede lisanslidir; ayni degerleri gonderince lisans gecer."""
    global _DONANIM
    if _DONANIM is not None:
        return _DONANIM
    d = {"pBoardSN": "", "pBiosSN": "", "pHddModel": "", "pHddSN": "",
         "pCpuID": "", "pCpuName": "", "pArchitecture": "", "pServicePack": "",
         "pComputerName": "", "pLoginName": "", "pCaption": "", "pIpAddress": ""}
    try:
        import subprocess
        ps = (
            "$ErrorActionPreference='SilentlyContinue';"
            "$bb=Get-CimInstance Win32_BaseBoard;"
            "$bi=Get-CimInstance Win32_BIOS;"
            "$dd=Get-CimInstance Win32_DiskDrive | Where-Object {$_.DeviceID -like '*PHYSICALDRIVE0'} | Select-Object -First 1;"
            "if(-not $dd){$dd=Get-CimInstance Win32_DiskDrive | Select-Object -First 1}"
            "$cp=Get-CimInstance Win32_Processor | Select-Object -First 1;"
            "$os=Get-CimInstance Win32_OperatingSystem;"
            "$ip=(Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object {$_.IPEnabled -eq $true} | Select-Object -First 1).IPAddress;"
            "if($ip -is [array]){$ip=$ip[0]}"
            "[pscustomobject]@{"
            "pBoardSN=$bb.SerialNumber;pBiosSN=$bi.SerialNumber;"
            "pHddModel=$dd.Model;pHddSN=$dd.SerialNumber;"
            "pCpuID=$cp.ProcessorId;pCpuName=$cp.Name;"
            "pArchitecture=$os.OSArchitecture;pServicePack=$os.CSDVersion;"
            "pCaption=$os.Caption;pComputerName=$env:COMPUTERNAME;"
            "pLoginName=$env:USERNAME;pIpAddress=$ip} | ConvertTo-Json -Compress"
        )
        cikti = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
            capture_output=True, text=True, timeout=25,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        veri = json.loads(cikti.stdout.strip())
        for k in d:
            v = veri.get(k)
            d[k] = ("" if v is None else str(v)).strip()
        log(f"   donanim kimligi okundu (anakart={d['pBoardSN'][:12]}, cpu={d['pCpuID'][:12]})")
    except Exception as e:
        log(f"   donanim kimligi okunamadi -> {e}")
    _DONANIM = d
    return d


def _acik_tarayici_guid(domain):
    """Masaustu programin actigi tarayici penceresinin adresinden (.../Login/sLogin?Session={guid})
    oturum kodunu okur. Program tarayiciyi --app=.../sLogin?Session=... ile acar."""
    import subprocess, re as _re
    try:
        ps = ("Get-CimInstance Win32_Process -Filter \"Name='chrome.exe' or Name='firefox.exe' "
              "or Name='msedge.exe'\" | Select-Object -ExpandProperty CommandLine")
        cikti = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
            capture_output=True, text=True, timeout=20,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        metin = cikti.stdout or ""
    except Exception as e:
        log(f"   calisan tarayici okunamadi -> {e}")
        return None
    # domain'e ait sLogin?Session=guid ara
    kalip = _re.compile(
        _re.escape(domain) + r"[^\s\"']*[?&]Session=([0-9a-fA-F-]{36})", _re.I)
    m = kalip.search(metin)
    if m:
        return m.group(1)
    # domain gecmese bile bir sLogin?Session yakala (tek B2B acikken ise yarar)
    m = _re.search(r"sLogin\?Session=([0-9a-fA-F-]{36})", metin, _re.I)
    return m.group(1) if m else None


async def _oturumu_dene(sayfa, kok, guid):
    """Verilen oturum koduyla siteye girmeyi dener; giris ekrani kalkarsa basarili."""
    try:
        await sayfa.goto(f"{kok}/Login/sLogin?Session={guid}",
                         wait_until="domcontentloaded", timeout=45000)
        await sayfa.wait_for_timeout(600)
        return not await sayfa.locator("#Password").count()
    except Exception:
        return False


async def giris_eryaz_soap(site, sayfa):
    """Altay vb.: once masaustu programin acik tarayicisindan oturum kodunu yakalar,
    olmazsa loginservice.asmx'ten oturum almayi dener."""
    kok = site["url"].split("/Search")[0].rstrip("/")
    domain = urllib.parse.urlparse(kok).netloc
    # Zaten icerideyse (giris ekrani yoksa) bir sey yapma
    try:
        if "/login" not in sayfa.url.lower() and not await sayfa.locator("#Password").count():
            return True
    except Exception:
        pass

    # 1) Masaustu programin acik tarayicisindan oturum kodunu yakala
    guid = await asyncio.to_thread(_acik_tarayici_guid, domain)
    if guid:
        log(f"   {site['ad']}: acik tarayicidan oturum kodu bulundu")
        if await _oturumu_dene(sayfa, kok, guid):
            log(f"   {site['ad']}: otomatik giris basarili (acik oturum)")
            return True
        log(f"   {site['ad']}: bulunan oturum kodu gecersiz/dolmus")

    try:
        bilgi = kasa.oku(site["ad"])
    except Exception as e:
        raise GirisGerekli(f"Kayitli sifre okunamadi: {e}")
    if not bilgi:
        raise GirisGerekli(f"'{site['ad']}' once masaustu programindan acilmali (oturum bulunamadi)")
    log(f"   {site['ad']}: servisten oturum aliniyor (loginservice)")

    don = await asyncio.to_thread(_donanim_bilgisi)

    def zarf(tip, psource):
        import html as _h
        e = lambda x: _h.escape(str(x or ""))
        return (
            '<?xml version="1.0" encoding="utf-8"?>'
            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>'
            '<Login xmlns="http://tempuri.org/">'
            f'<type>{tip}</type>'
            f'<customerCode>{e(bilgi.get("musteri"))}</customerCode>'
            f'<code>{e(bilgi.get("kullanici"))}</code>'
            f'<password>{e(bilgi.get("sifre"))}</password>'
            f'<pBoardSN>{e(don["pBoardSN"])}</pBoardSN>'
            f'<pBiosSN>{e(don["pBiosSN"])}</pBiosSN>'
            f'<pHddModel>{e(don["pHddModel"])}</pHddModel>'
            f'<pHddSN>{e(don["pHddSN"])}</pHddSN>'
            f'<pCpuID>{e(don["pCpuID"])}</pCpuID>'
            f'<pCpuName>{e(don["pCpuName"])}</pCpuName>'
            f'<pSource>{psource}</pSource>'
            f'<pArchitecture>{e(don["pArchitecture"])}</pArchitecture>'
            f'<pServicePack>{e(don["pServicePack"])}</pServicePack>'
            f'<pComputerName>{e(don["pComputerName"])}</pComputerName>'
            f'<pLoginName>{e(don["pLoginName"])}</pLoginName>'
            f'<pCaption>{e(don["pCaption"])}</pCaption>'
            f'<pIpAddress>{e(don["pIpAddress"])}</pIpAddress>'
            '</Login></soap:Body></soap:Envelope>'
        )

    import re as _re
    son_mesaj = ""
    denemeler = [(2, 1), (2, 0), (1, 1), (2, 2), (0, 1)]
    for tip, psource in denemeler:
        try:
            c = await sayfa.context.request.post(
                f"{kok}/loginservice.asmx",
                headers={"Content-Type": "text/xml; charset=utf-8",
                         "SOAPAction": "http://tempuri.org/Login"},
                data=zarf(tip, psource), timeout=20000)
            govde = await c.text()
        except Exception as e:
            raise GirisGerekli(f"Login servisine ulasilamadi: {e}")
        durum = _re.search(r"<Status>(true|false)</Status>", govde, _re.I)
        sid = _re.search(r"<SessionId>([0-9a-fA-F-]{36})</SessionId>", govde)
        mesaj = _re.search(r"<Message>(.*?)</Message>", govde, _re.S)
        son_mesaj = (mesaj.group(1).strip() if mesaj else "")[:200]
        if durum and durum.group(1).lower() == "true" and sid:
            guid = sid.group(1)
            log(f"   {site['ad']}: oturum alindi (type={tip}, kaynak={psource})")
            await sayfa.goto(f"{kok}/Login/sLogin?Session={guid}",
                             wait_until="domcontentloaded", timeout=45000)
            await sayfa.wait_for_timeout(600)
            if not await sayfa.locator("#Password").count():
                log(f"   {site['ad']}: otomatik giris basarili")
                return True
        if son_mesaj:
            log(f"   {site['ad']}: servis yaniti (type={tip},kaynak={psource}): {son_mesaj}")
    if son_mesaj and ("lisans" in son_mesaj.lower() or "dolmu" in son_mesaj.lower()):
        raise GirisGerekli(f"Bu B2B'yi once masaustu programindan açın (lisans): {son_mesaj}")
    raise GirisGerekli(f"Otomatik giris basarisiz{': ' + son_mesaj if son_mesaj else ''}")


async def giris_eryaz_v4(site, sayfa):
    if not await sayfa.locator("#Password").count():
        return True
    try:
        bilgi = kasa.oku(site["ad"])
    except Exception as e:
        raise GirisGerekli(f"Kayıtlı şifre okunamadı: {e}")
    if not bilgi:
        raise GirisGerekli("Giriş yapılmamış (şifre kayıtlı değil)")
    log(f"   {site['ad']}: otomatik giris yapiliyor")
    if bilgi.get("musteri") and await sayfa.locator("#CustomerCode").count():
        await sayfa.fill("#CustomerCode", bilgi["musteri"])
    await sayfa.fill("#UserCode", bilgi["kullanici"])
    await sayfa.fill("#Password", bilgi["sifre"])
    if await sayfa.locator("#btnLogin").count():
        await sayfa.locator("#btnLogin").first.click(timeout=10000)
    else:
        await sayfa.press("#Password", "Enter")
    for _ in range(40):
        await sayfa.wait_for_timeout(500)
        if not await sayfa.locator("#Password").count():
            try:
                dolu = await sayfa.evaluate("document.body && document.body.innerText.trim().length > 20")
            except Exception:
                dolu = False   # sayfa yonleniyor
            if not dolu:
                continue
            log(f"   {site['ad']}: otomatik giris basarili")
            return True
    raise GirisGerekli("Otomatik giriş başarısız (şifre yanlış veya site uyarı veriyor)")


def eryaz_v4_satirlar(site_adi, liste):
    satirlar = []
    for u in liste or []:
        net = (u.get("PriceNetCustomer") or {}).get("ValueFinal")
        if net is None or float(net) <= 0:
            continue
        kampanya = _tl_sayi(u.get("CampaignPriceCustomerStr"))
        if kampanya and 0 < kampanya < float(net):
            net = kampanya
            kdvli = _tl_sayi(u.get("CampaignPriceWithVatCustomerStr"))
        else:
            kdvli = _tl_sayi(u.get("PriceNetWithVatCustomerStr"))
        durum = (u.get("AvailabilityText") or "").strip()
        miktar = u.get("TotalQuantity") or 0
        stok_var = durum.lower() in ("var", "az var") or miktar > 0
        notlar = (u.get("Notes") or "").strip()
        satirlar.append({
            "b2b": site_adi,
            "kod": u.get("Code") or "",
            "marka": u.get("Manufacturer") or "",
            "oem": u.get("Oem") or u.get("TecdocOemNumber") or "",
            "ad": (u.get("Name") or "").strip() + (" – " + notlar if notlar and notlar != "-" else ""),
            "fiyat": round(float(net), 2),
            "fiyatKdvli": round(kdvli, 2) if kdvli else None,
            "stok": durum if stok_var else "",
            "stokVar": stok_var,
            "resim": u.get("PicturePath") if u.get("HavePicture") else None,
        })
    return satirlar


async def ara_eryaz_v4(site, sayfa, metin):
    kok = site["url"].split("/Search")[0].rstrip("/")
    hedef = f"{kok}/Search?text={urllib.parse.quote(metin)}"

    gelen = []
    yeni_istekler = set()

    def istek(r):
        yeni_istekler.add(r)

    def yakala(c):
        if c.request in yeni_istekler and "/Search/SearchProduct" in c.url:
            gelen.append(c)

    sayfa.on("request", istek)
    sayfa.on("response", yakala)
    try:
        await sayfa.goto(hedef, wait_until="domcontentloaded", timeout=45000)
        await sayfa.wait_for_timeout(800)
        if await sayfa.locator("#Password").count():
            await GIRISLER[site["tip"]](site, sayfa)
            gelen.clear()
            await sayfa.goto(hedef, wait_until="domcontentloaded", timeout=45000)

        bitis = time.time() + site.get("zaman_asimi", 30)
        satirlar, gorulen_id, islenen, son_gelis = [], set(), 0, None
        while time.time() < bitis:
            while islenen < len(gelen):
                c = gelen[islenen]
                islenen += 1
                if c.status != 200:
                    continue
                try:
                    liste = json.loads(await c.text())
                except Exception:
                    continue
                if not isinstance(liste, list):
                    continue
                son_gelis = time.time()
                yeni = [u for u in liste if u.get("Id") not in gorulen_id]
                gorulen_id.update(u.get("Id") for u in liste)
                satirlar += eryaz_v4_satirlar(site["ad"], yeni)
            # ilk cevaptan sonra 1.5 sn baska cevap gelmezse bitti say
            if son_gelis and time.time() - son_gelis > 1.5:
                return satirlar
            if await sayfa.locator("#Password").count():
                raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
            await asyncio.sleep(0.3)
        if son_gelis:
            return satirlar
        raise Exception("Zaman asimi: site cevap vermedi")
    finally:
        sayfa.remove_listener("response", yakala)
        sayfa.remove_listener("request", istek)


# ------------------------------------------------------------------ DESISS BAYI PANELI
# Mest Otomotiv ... /urunler?arama=..., GET webbayiapi.../api/urunler/search?aramaTerimi=...

KDV_ORANI = 0.20


async def giris_desiss(site, sayfa):
    if "/login" not in sayfa.url:
        return True
    try:
        bilgi = kasa.oku(site["ad"])
    except Exception as e:
        raise GirisGerekli(f"Kayıtlı şifre okunamadı: {e}")
    if not bilgi:
        raise GirisGerekli("Giriş yapılmamış (şifre kayıtlı değil)")
    log(f"   {site['ad']}: otomatik giris yapiliyor")
    kul = sayfa.locator("input[name=kullaniciAdi], input[type=text]").first
    await kul.wait_for(state="visible", timeout=15000)
    await kul.fill(bilgi["kullanici"])
    await sayfa.locator("input[name=parola], input[type=password]").first.fill(bilgi["sifre"])
    await sayfa.locator("button[type=submit]").first.click(timeout=10000)
    for _ in range(40):
        await sayfa.wait_for_timeout(500)
        if "/login" not in sayfa.url:
            log(f"   {site['ad']}: otomatik giris basarili")
            return True
    raise GirisGerekli("Otomatik giriş başarısız (şifre yanlış veya site uyarı veriyor)")


def desiss_satirlar(site_adi, veri):
    satirlar = []
    for u in (veri or {}).get("items") or []:
        fiyat = u.get("fiyat")
        if fiyat is None or float(fiyat) <= 0:
            continue
        marka = (u.get("marka") or "").strip()
        if marka.lower() in ("seçiniz", "seciniz"):
            marka = ""
        depolar = []
        if u.get("merkezStoktaVar"):
            depolar.append("Merkez")
        if u.get("msAvrupaStoktaVar"):
            depolar.append("Avrupa")
        stok_var = bool(u.get("stoktaVar")) or bool(depolar)
        ek = " / ".join(x for x in (u.get("anaModel"), (f"Menşei {u['mensei']}" if u.get("mensei") else None)) if x)
        satirlar.append({
            "b2b": site_adi,
            "kod": u.get("oemNo") or u.get("parcaNo") or u.get("urunKod") or "",
            "marka": marka,
            "oem": u.get("oemNo") or "",
            "ad": (u.get("parcaAdi") or "").strip() + (f" – {ek}" if ek else ""),
            "fiyat": round(float(fiyat), 2),
            "fiyatKdvli": round(float(fiyat) * (1 + KDV_ORANI), 2),
            "stok": ", ".join(depolar) if depolar else ("Var" if stok_var else ""),
            "stokVar": stok_var,
            "resim": u.get("resimUrl") if u.get("resimUrl") and "resimyok" not in u.get("resimUrl", "") else None,
            "resimBuyuk": (u.get("resimUrl") or "").replace("/thumb/", "/") or None,
        })
    return satirlar


async def ara_desiss(site, sayfa, metin):
    kok = site["url"].split("/urunler")[0].rstrip("/")
    hedef = f"{kok}/urunler?arama={urllib.parse.quote(metin)}"

    gelen = []

    def yakala(c):
        if "/api/urunler/search" in c.url and "aramaTerimi=" in c.url:
            gelen.append(c)

    sayfa.on("response", yakala)
    try:
        await sayfa.goto(hedef, wait_until="domcontentloaded", timeout=45000)
        await sayfa.wait_for_timeout(1000)
        if "/login" in sayfa.url:
            await giris_desiss(site, sayfa)
            gelen.clear()
            await sayfa.goto(hedef, wait_until="domcontentloaded", timeout=45000)

        bitis = time.time() + site.get("zaman_asimi", 30)
        while time.time() < bitis:
            for c in list(gelen):
                q = urllib.parse.parse_qs(urllib.parse.urlparse(c.url).query).get("aramaTerimi", [""])[0]
                if q.strip().lower() != metin.strip().lower():
                    continue
                if c.status in (401, 403):
                    raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
                if c.status != 200:
                    raise Exception(f"Site hata dondu: HTTP {c.status}")
                return desiss_satirlar(site["ad"], json.loads(await c.text()))
            if "/login" in sayfa.url:
                raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
            await asyncio.sleep(0.3)
        raise Exception("Zaman asimi: site cevap vermedi")
    finally:
        sayfa.remove_listener("response", yakala)


# ------------------------------------------------------------------ LEPAR (ASP.NET WebMethod)
# web.lepar.com.tr ... /search.aspx?q=..., POST /Search.aspx/SearchProduct -> {"d": "<json metin>"}
# Giris: /Login.aspx  #tbB2bCode  #tbPassword  <a id=btnLogin> (__doPostBack)

def _lepar_kok(site):
    u = urllib.parse.urlparse(site["url"])
    return f"{u.scheme}://{u.netloc}"


async def _lepar_giris_sayfasi_mi(sayfa):
    if "login.aspx" in sayfa.url.lower():
        return True
    try:
        return bool(await sayfa.locator("#tbPassword").count())
    except Exception:
        return False


async def giris_lepar(site, sayfa):
    if not await _lepar_giris_sayfasi_mi(sayfa):
        return True
    try:
        bilgi = kasa.oku(site["ad"])
    except Exception as e:
        raise GirisGerekli(f"Kayıtlı şifre okunamadı: {e}")
    if not bilgi:
        raise GirisGerekli("Giriş yapılmamış (şifre kayıtlı değil)")
    kod = (bilgi.get("kullanici") or bilgi.get("musteri") or "").strip()
    if not kod:
        raise GirisGerekli("Kayıtlı kullanıcı kodu boş")
    log(f"   {site['ad']}: otomatik giris yapiliyor")
    await sayfa.locator("#tbB2bCode").wait_for(state="visible", timeout=15000)
    await sayfa.fill("#tbB2bCode", kod)
    await sayfa.fill("#tbPassword", bilgi["sifre"])
    await sayfa.locator("#btnLogin").first.click(timeout=10000)
    for _ in range(40):
        await sayfa.wait_for_timeout(500)
        if sayfa.is_closed():
            log(f"   {site['ad']}: giris sekmesi kapandi, sonraki aramada yeni sekme acilacak")
            return True
        try:
            if not await _lepar_giris_sayfasi_mi(sayfa):
                log(f"   {site['ad']}: otomatik giris basarili")
                return True
        except Exception:
            pass   # sayfa yonleniyor
    raise GirisGerekli("Otomatik giriş başarısız (kullanıcı kodu/şifre yanlış veya site uyarı veriyor)")


def _lepar_liste(govde):
    veri = json.loads(govde)
    if isinstance(veri, dict):
        veri = veri.get("d")
    if isinstance(veri, str):
        veri = json.loads(veri) if veri.strip() else []
    return veri if isinstance(veri, list) else []


def lepar_satirlar(site_adi, liste):
    satirlar = []
    for u in liste or []:
        if not isinstance(u, dict):
            continue
        try:
            net = float(u.get("Cost") or 0)
        except Exception:
            net = 0
        if net <= 0:
            net = (u.get("PriceNet") or {}).get("Value") if isinstance(u.get("PriceNet"), dict) else None
            net = float(net) if net else _tl_sayi(u.get("PriceNetTLStr"))
        if not net or net <= 0:
            continue
        try:
            kdvli = float(u.get("CostWithVAT") or 0) or None
        except Exception:
            kdvli = None
        if not kdvli:
            kdvli = _tl_sayi(u.get("PriceNetWithVatTLStr"))
        if not kdvli:
            oran = float(u.get("TaxRate") or 20) / 100
            kdvli = net * (1 + oran)
        durum = (u.get("AvailableText") or "").strip()
        miktar = 0
        for k in ("TotalQuantity", "Quantity01", "Quantity02", "Quantity03"):
            try:
                miktar = max(miktar, float(u.get(k) or 0))
            except Exception:
                pass
        stok_var = durum.lower() in ("var", "az var") or miktar > 0
        arac = (u.get("Notes3") or "").strip()
        ad = (u.get("Name") or "").strip()
        satirlar.append({
            "b2b": site_adi,
            "kod": u.get("Code") or "",
            "marka": (u.get("Manufacturer") or u.get("Notes1") or "").strip(),
            "oem": (u.get("ManufacturerCode") or u.get("Notes4") or "").strip(),
            "ad": ad + (" – " + arac if arac and arac != "-" else ""),
            "fiyat": round(net, 2),
            "fiyatKdvli": round(kdvli, 2) if kdvli else None,
            "stok": durum if stok_var else "",
            "stokVar": stok_var,
            "resim": u.get("PicturePath") if u.get("Picture") and u.get("PicturePath") else None,
        })
    return satirlar


async def ara_lepar(site, sayfa, metin):
    kok = _lepar_kok(site)
    hedef = f"{kok}/search.aspx?q={urllib.parse.quote(metin)}"

    gelen = []
    yeni_istekler = set()

    def istek(r):
        yeni_istekler.add(r)

    def yakala(c):
        if c.request in yeni_istekler and "/search.aspx/searchproduct" in c.url.lower():
            gelen.append(c)

    sayfa.on("request", istek)
    sayfa.on("response", yakala)
    try:
        await sayfa.goto(hedef, wait_until="domcontentloaded", timeout=45000)
        await sayfa.wait_for_timeout(800)
        if await _lepar_giris_sayfasi_mi(sayfa):
            await giris_lepar(site, sayfa)
            if sayfa.is_closed():
                raise Exception("Giriş sonrası sekme kapandı, tekrar arayın")
            gelen.clear()
            await sayfa.goto(hedef, wait_until="domcontentloaded", timeout=45000)

        bitis = time.time() + site.get("zaman_asimi", 30)
        elle_denendi = False
        bas = time.time()
        satirlar, gorulen_id, islenen, son_gelis = [], set(), 0, None
        while time.time() < bitis:
            while islenen < len(gelen):
                c = gelen[islenen]
                islenen += 1
                if c.status != 200:
                    continue
                try:
                    liste = _lepar_liste(await c.text())
                except Exception:
                    continue
                son_gelis = time.time()
                yeni = [u for u in liste if isinstance(u, dict) and u.get("Id") not in gorulen_id]
                gorulen_id.update(u.get("Id") for u in yeni)
                satirlar += lepar_satirlar(site["ad"], yeni)
            if son_gelis and time.time() - son_gelis > 1.5:
                return satirlar
            # sayfa kendiliginden aramazsa kutuya yazip Ara'ya bas
            if not son_gelis and not elle_denendi and time.time() - bas > 6:
                elle_denendi = True
                try:
                    kutu = sayfa.locator("input[placeholder*='Ara']").first
                    await kutu.fill(metin, timeout=5000)
                    await kutu.press("Enter")
                except Exception:
                    try:
                        await sayfa.evaluate("typeof Search === 'function' && Search(0)")
                    except Exception:
                        pass
            if await _lepar_giris_sayfasi_mi(sayfa):
                raise GirisGerekli("Oturum kapanmış, tekrar giriş gerekiyor")
            await asyncio.sleep(0.3)
        if son_gelis:
            return satirlar
        raise Exception("Zaman asimi: site cevap vermedi")
    finally:
        sayfa.remove_listener("response", yakala)
        sayfa.remove_listener("request", istek)


BAGLAYICILAR = {
    "A": ara_grup_a,
    "ERYAZ_WEB": ara_eryaz_web,
    "ERYAZ_V4": ara_eryaz_v4,
    "ERYAZ_SOAP": ara_eryaz_v4,
    "DESISS": ara_desiss,
    "LEPAR": ara_lepar,
}

GIRISLER = {
    "A": giris_grup_a,
    "ERYAZ_WEB": giris_eryaz_web,
    "ERYAZ_V4": giris_eryaz_v4,
    "ERYAZ_SOAP": giris_eryaz_soap,
    "DESISS": giris_desiss,
    "LEPAR": giris_lepar,
}


# ------------------------------------------------------------------ ANA PROGRAM
class Uygulama:
    def __init__(self):
        self.siteleri_yukle()
        self.sekmeler = {}
        self.arayuz = None
        self.kilit = asyncio.Lock()
        self.resim_onbellek = {}
        self.ff = None            # Firefox baglami (sadece "tarayici": "firefox" olan siteler icin)
        self.ff_kilit = asyncio.Lock()
        self.resim_ff = set()     # resmi Firefox oturumuyla indirilecek sunucular

    def siteleri_yukle(self):
        with open(SITE_DOSYA, encoding="utf-8") as f:
            self.tum_siteler = json.load(f)
        self.siteler = [s for s in self.tum_siteler if s.get("aktif", True)]

    async def firefox(self):
        async with self.ff_kilit:
            if self.ff is None:
                try:
                    self.ff = await self.p.firefox.launch_persistent_context(
                        user_data_dir=PROFIL_FF, headless=False, no_viewport=True)
                except Exception as e:
                    log(f"Firefox acilamadi -> {e}")
                    raise Exception("Firefox kurulu değil: FIREFOX_KUR.bat dosyasını çalıştırın")
                log("Firefox penceresi acildi")
            return self.ff

    async def baglam_al(self, site):
        if (site.get("tarayici") or "").lower() == "firefox":
            return await self.firefox()
        return self.baglam

    async def sekme(self, site):
        s = self.sekmeler.get(site["ad"])
        if s is None or s.is_closed():
            baglam = await self.baglam_al(site)
            if baglam is not self.baglam and baglam.pages and not any(
                    x is baglam.pages[0] for x in self.sekmeler.values()):
                s = baglam.pages[0]       # Firefox'un ilk bos sekmesini kullan
            else:
                s = await baglam.new_page()
            self.sekmeler[site["ad"]] = s
            try:
                await s.goto(site["url"], wait_until="domcontentloaded", timeout=45000)
                await s.wait_for_timeout(1500)
                giris = GIRISLER.get(site["tip"])
                if giris and kasa.var_mi(site["ad"]):
                    await giris(site, s)
            except GirisGerekli as e:
                log(f"{site['ad']}: {e}")
            except Exception as e:
                log(f"{site['ad']}: sayfa acilamadi -> {e}")
        return s

    async def site_ara(self, site, metin):
        bas = time.time()
        try:
            baglayici = BAGLAYICILAR.get(site["tip"])
            if not baglayici:
                raise Exception(f"'{site['tip']}' tipi icin baglayici yok")
            sayfa = await self.sekme(site)
            satirlar = await baglayici(site, sayfa, metin)
            ff = (site.get("tarayici") or "").lower() == "firefox"
            for r in satirlar:   # goreli resim adreslerini tam adrese cevir
                for k in ("resim", "resimBuyuk"):
                    if r.get(k) and not r[k].startswith(("http://", "https://", "data:")):
                        r[k] = urllib.parse.urljoin(site["url"], r[k])
                    if ff and r.get(k):
                        self.resim_ff.add(urllib.parse.urlparse(r[k]).netloc)
            sure = time.time() - bas
            log(f"   OK  : {site['ad']} -> {len(satirlar)} sonuc ({sure:.1f} sn)")
            return satirlar, {"site": site["ad"], "durum": "ok", "adet": len(satirlar)}
        except GirisGerekli as e:
            log(f"   GIRIS: {site['ad']} -> {e}")
            return [], {"site": site["ad"], "durum": "giris", "mesaj": str(e)}
        except Exception as e:
            log(f"   HATA: {site['ad']} -> {e}")
            with open(os.path.join(LOG_KLASOR, f"hata_{datetime.now():%Y-%m-%d}.txt"), "a", encoding="utf-8") as f:
                f.write(f"\n[{datetime.now():%H:%M:%S}] {site['ad']} / '{metin}'\n{traceback.format_exc()}")
            return [], {"site": site["ad"], "durum": "hata", "mesaj": str(e)}

    async def ara(self, metin):
        metin = (metin or "").strip()
        if not metin:
            return {"sonuclar": [], "durumlar": []}
        if self.kilit.locked():
            log(f"ARAMA atlandi (onceki arama suruyor): '{metin}'")
            return {"mesgul": True, "sonuclar": [], "durumlar": []}
        async with self.kilit:
            return await self._ara(metin)

    async def _ara(self, metin):
        log(f"ARAMA: '{metin}'")
        isler = [self.site_ara(s, metin) for s in self.siteler]
        cikti = await asyncio.gather(*isler)
        sonuclar, durumlar = [], []
        for satirlar, durum in cikti:
            sonuclar += satirlar
            durumlar.append(durum)
        sonuclar.sort(key=lambda r: r["fiyat"])
        log(f"   TOPLAM: {len(sonuclar)} sonuc")
        try:
            await self.arayuz.bring_to_front()
        except Exception:
            pass
        return {"sonuclar": sonuclar, "durumlar": durumlar}

    async def sekmeye_git(self, site_adi):
        site = next((s for s in self.siteler if s["ad"] == site_adi), None)
        if site:
            sayfa = await self.sekme(site)
            await sayfa.bring_to_front()
        return True

    async def site_listesi(self):
        return [s["ad"] for s in self.siteler]

    # ---------- urun resmi (B2B oturum cerezleriyle indirilir, ekrana data: adresi olarak gider)
    async def resim(self, url):
        if not url:
            return None
        if url in self.resim_onbellek:
            return self.resim_onbellek[url]
        veri = None
        try:
            baglam = self.ff if (self.ff and urllib.parse.urlparse(url).netloc in self.resim_ff) else self.baglam
            c = await baglam.request.get(url, timeout=15000)
            tur = (c.headers.get("content-type") or "").split(";")[0].strip()
            govde = await c.body()
            if c.ok and govde and len(govde) < 3_000_000:
                if not tur.startswith("image/"):
                    tur = "image/png" if govde[:4] == b"\x89PNG" else "image/jpeg"
                import base64
                veri = f"data:{tur};base64," + base64.b64encode(govde).decode("ascii")
        except Exception as e:
            log(f"   resim alinamadi: {url[:100]} -> {e}")
        if len(self.resim_onbellek) > 500:
            self.resim_onbellek.clear()
        self.resim_onbellek[url] = veri
        return veri

    # ---------- satira cift tiklama: B2B sekmesini ac ve o parcayi orada ara
    async def goster(self, site_adi, kod):
        site = next((s for s in self.tum_siteler if s["ad"] == site_adi), None)
        if not site:
            return False
        sayfa = await self.sekme(site)
        await sayfa.bring_to_front()
        baglayici = BAGLAYICILAR.get(site["tip"])
        if baglayici and kod and not self.kilit.locked():
            try:
                await asyncio.wait_for(baglayici(site, sayfa, kod), timeout=30)
            except Exception as e:
                log(f"   {site_adi}: urune gidilemedi ({kod}) -> {e}")
        return True

    # ---------- B2B kisayollari (masaustu programlari / .lnk) - ust klasorden
    KISAYOL_UZANTI = (".appref-ms", ".lnk", ".url")

    def _kisayol_dosyalari(self):
        ust = os.path.dirname(KLASOR)
        sonuc = {}
        for f in os.listdir(ust):
            for u in self.KISAYOL_UZANTI:
                if f.lower().endswith(u):
                    ad = f[: -len(u)].replace("(coşkun)", "").strip(" .-")
                    sonuc[ad] = os.path.join(ust, f)
        return sonuc

    async def kisayollar(self):
        d = await asyncio.to_thread(self._kisayol_dosyalari)
        return sorted(d.keys(), key=lambda x: x.casefold())

    async def kisayol_ac(self, ad):
        d = await asyncio.to_thread(self._kisayol_dosyalari)
        yol = d.get(ad)
        if not yol:
            return {"ok": False, "mesaj": "Kısayol bulunamadı"}
        try:
            os.startfile(yol)  # noqa
            log(f"KISAYOL acildi: {ad}")
            return {"ok": True, "mesaj": f"{ad} açılıyor..."}
        except Exception as e:
            log(f"KISAYOL acilamadi: {ad} -> {e}")
            return {"ok": False, "mesaj": f"{ad} açılamadı: {e}"}

    # ---------- ayarlar ekrani
    async def ayar_liste(self):
        return await asyncio.to_thread(ayarlar.liste)

    async def ayar_giris_kaydet(self, ad, musteri, kullanici, sifre):
        return await asyncio.to_thread(ayarlar.giris_kaydet, ad, musteri, kullanici, sifre)

    async def ayar_giris_sil(self, ad):
        return await asyncio.to_thread(ayarlar.giris_sil, ad)

    async def ayar_aktif(self, ad, aktif):
        await asyncio.to_thread(ayarlar.aktif_yap, ad, aktif)
        self.siteleri_yukle()
        return True

    async def ayar_islem(self, islem, ana_sifre=None):
        try:
            if islem == "excel_ac":
                return await asyncio.to_thread(ayarlar.excel_ac)
            if islem == "excel_yenile":
                return await asyncio.to_thread(ayarlar.excel_sablon_yenile)
            if islem == "excel_ice_aktar":
                return await asyncio.to_thread(ayarlar.excel_ice_aktar)
            if islem == "yedek_al":
                return await asyncio.to_thread(ayarlar.yedek_al, ana_sifre)
            if islem == "yedek_yukle":
                s = await asyncio.to_thread(ayarlar.yedek_yukle, ana_sifre)
                self.siteleri_yukle()
                return s
            if islem == "paket":
                return await asyncio.to_thread(ayarlar.paket_olustur)
            if islem == "klasor_ac":
                os.startfile(KLASOR)  # noqa
                return {"ok": True, "mesaj": ""}
        except Exception as e:
            log(f"AYAR HATASI ({islem}):\n" + traceback.format_exc())
            return {"ok": False, "mesaj": f"Hata: {e}"}
        return {"ok": False, "mesaj": "Bilinmeyen işlem"}

    async def calistir(self):
        log("=== B2B ortak arama basladi ===")
        async with async_playwright() as p:
            self.p = p
            secenekler = dict(user_data_dir=PROFIL, headless=False, no_viewport=True,
                              chromium_sandbox=True,   # Chrome guvenlik yalitimi acik (--no-sandbox uyarisi cikmasin)
                              ignore_default_args=["--enable-automation", "--no-sandbox"],
                              args=["--start-maximized"])
            try:
                self.baglam = await p.chromium.launch_persistent_context(channel="chrome", **secenekler)
            except Exception:
                log("Chrome bulunamadi, Edge deneniyor")
                self.baglam = await p.chromium.launch_persistent_context(channel="msedge", **secenekler)

            self.arayuz = self.baglam.pages[0] if self.baglam.pages else await self.baglam.new_page()
            await self.arayuz.expose_function("pyAra", self.ara)
            await self.arayuz.expose_function("pySekme", self.sekmeye_git)
            await self.arayuz.expose_function("pySiteler", self.site_listesi)
            await self.arayuz.expose_function("pyResim", self.resim)
            await self.arayuz.expose_function("pyGoster", self.goster)
            await self.arayuz.expose_function("pyAyarListe", self.ayar_liste)
            await self.arayuz.expose_function("pyGirisKaydet", self.ayar_giris_kaydet)
            await self.arayuz.expose_function("pyGirisSil", self.ayar_giris_sil)
            await self.arayuz.expose_function("pyAktif", self.ayar_aktif)
            await self.arayuz.expose_function("pyAyarIslem", self.ayar_islem)
            await self.arayuz.expose_function("pyKisayollar", self.kisayollar)
            await self.arayuz.expose_function("pyKisayolAc", self.kisayol_ac)
            await self.arayuz.goto("file:///" + ARAYUZ.replace("\\", "/"))

            # B2B sekmelerini arka planda ac
            for s in self.siteler:
                try:
                    await self.sekme(s)
                except Exception as e:
                    log(f"{s['ad']}: sekme acilamadi -> {e}")
            await self.arayuz.bring_to_front()
            log(f"{len(self.siteler)} B2B sekmesi acildi")

            kapandi = asyncio.Event()
            self.arayuz.on("close", lambda _: kapandi.set())
            self.baglam.on("close", lambda _: kapandi.set())
            await kapandi.wait()
        log("=== Program kapatildi ===")


if __name__ == "__main__":
    try:
        asyncio.run(Uygulama().calistir())
    except Exception:
        log("PROGRAM HATASI:\n" + traceback.format_exc())
        sys.exit(1)
