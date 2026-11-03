# -*- coding: utf-8 -*-
"""Chrome'da ZATEN ACIK ve GIRIS YAPILMIS B2B sekmelerinden arama yapar (Windows UI otomasyonu).
Kullanim:
  python chrome_ui.py ara <sekme_anahtari> <parca> <okuyucu>  -> tek satir JSON
  python chrome_ui.py one <sekme_anahtari>                    -> sekmeyi one getirir
Sekme acmaz, sifre girmez. Yalnizca arama kutusuna parca yazar ve sonuclari okur."""
import sys, os, time, json, re, subprocess

def _kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkg])
_kur("uiautomation")
import uiautomation as auto

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

PARA = re.compile(r"(\d{1,3}(?:\.\d{3})*,\d{2})\s*TL")
PARA_TL = re.compile(r"(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺)")
STOK = {"var", "yok", "az var", "az", "kritik", "yolda", "sipariş üzerine", "siparis uzerine"}


def cikti(obj):
    print(json.dumps(obj, ensure_ascii=False)); sys.stdout.flush()


def temiz(s):
    return re.sub(r"[-]", "", (s or "").replace("\xa0", " ")).strip()


def sayi(s):
    m = PARA.search(s or "")
    if not m: return None
    return float(m.group(1).replace(".", "").replace(",", "."))


# ---- HIZLI ERISIM: Windows'un kendi arama fonksiyonlari (FindAll/FindFirst) + toplu ozellik okuma
try:
    UIA = auto._AutomationClient.instance().IUIAutomation
    _ONB = UIA.CreateCacheRequest()
    for _pid in (auto.PropertyId.NameProperty, auto.PropertyId.AutomationIdProperty, auto.PropertyId.ControlTypeProperty):
        _ONB.AddProperty(_pid)
    _TIP_ADI = dict(getattr(auto, "ControlTypeNames", {}))
except Exception:
    UIA = None


def _kontrol(e):
    return auto.Control.CreateControlFromElement(e) if e else None


def hizli_id(ctrl, aid):
    """AutomationId'si verilen ilk ogeyi yerel aramayla bulur."""
    if UIA is None:
        return bul(ctrl, lambda c: (c.AutomationId or "") == aid, maks=60)
    try:
        kosul = UIA.CreatePropertyCondition(auto.PropertyId.AutomationIdProperty, aid)
        return _kontrol(ctrl.Element.FindFirst(auto.TreeScope.Descendants, kosul))
    except Exception:
        return bul(ctrl, lambda c: (c.AutomationId or "") == aid, maks=60)


def hizli_tip(ctrl, tip_id):
    """Belirli tipteki tum alt ogeleri yerel aramayla bulur (Control listesi)."""
    if UIA is None:
        return None
    try:
        kosul = UIA.CreatePropertyCondition(auto.PropertyId.ControlTypeProperty, tip_id)
        dizi = ctrl.Element.FindAll(auto.TreeScope.Descendants, kosul)
        return [_kontrol(dizi.GetElement(i)) for i in range(dizi.Length)]
    except Exception:
        return None


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
    hz = hizli_tip(ctrl, auto.ControlType.DocumentControl)
    if hz is not None:
        return hz
    out = []
    def g(c, k=0):
        if k > maks: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if x.ControlTypeName == "DocumentControl":
                    out.append(x); continue
            except Exception: pass
            g(x, k + 1)
    g(ctrl)
    return out


def belge_eslesir(b, anahtar):
    """Belgenin basligi veya ADRESI (URL) anahtari iceriyor mu?"""
    if anahtar in (b.Name or "").lower():
        return True
    try:
        return anahtar in (b.GetValuePattern().Value or "").lower()
    except Exception:
        return False


def sekme_sec(anahtar):
    """Kullanicinin Chrome'unda adinda anahtar gecen sekmeyi (veya uygulama penceresini) bulur ve one getirir.
    Programin kendi penceresi ("B2B Ortak Arama") atlanir. (pencere, belge) dondurur."""
    anahtar = anahtar.lower()
    pencereler = auto.GetRootControl().GetChildren()
    # 1) Uygulama olarak acilmis pencere (sekmesiz Chrome penceresi, basliginda site adi)
    for w in pencereler:
        try: sinif = w.ClassName
        except Exception: sinif = ""
        ad = (w.Name or "").lower()
        if sinif == "Chrome_WidgetWin_1" and anahtar in ad and "google chrome" not in ad:
            try: w.SetActive(); w.SetFocus()
            except Exception: pass
            for _ in range(20):
                for b in belgeler(w):
                    return w, b
                time.sleep(0.2)
            return w, None
    # 2) Normal Chrome penceresindeki sekme
    for w in pencereler:
        ad = (w.Name or "").lower()
        if "chrome" not in ad or "b2b ortak arama" in ad:
            continue
        sekmeler = hizli_tip(w, auto.ControlType.TabItemControl)
        if sekmeler is None:
            tab = bul(w, lambda c: c.ControlTypeName == "TabItemControl" and anahtar in (c.Name or "").lower(), maks=10)
        else:
            tab = next((t for t in sekmeler if anahtar in (t.Name or "").lower()), None)
        if not tab:
            continue
        try: w.SetActive()
        except Exception: pass
        try: tab.GetSelectionItemPattern().Select()
        except Exception:
            try: tab.Click(simulateMove=False)
            except Exception: pass
        for _ in range(25):
            for b in belgeler(w):
                if belge_eslesir(b, anahtar):
                    return w, b
            time.sleep(0.2)
        return w, None          # emin olunamadi: baska sekmenin sayfasina dokunma
    return None, None


def duz_liste(kok, maks=45):
    """Kok altindaki ogeleri sirayla (tip, ad, id) olarak toplar. Once hizli yol, olmazsa yavas yol."""
    if UIA is not None and _TIP_ADI:
        try:
            dizi = kok.Element.FindAllBuildCache(auto.TreeScope.Descendants, UIA.CreateTrueCondition(), _ONB)
            hz = []
            for i in range(dizi.Length):
                e = dizi.GetElement(i)
                hz.append((_TIP_ADI.get(e.CachedControlType, ""), temiz(e.CachedName), e.CachedAutomationId or ""))
            if hz:
                return hz
        except Exception:
            pass
    out = []
    def g(c, k=0):
        if k > maks: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try: out.append((x.ControlTypeName, temiz(x.Name), x.AutomationId or ""))
            except Exception: pass
            g(x, k + 1)
    g(kok)
    return out


# ------------------------------------------------------------------ OKUYUCULAR
ATIK = {"Kampanyalı Ürün", "Resim", "Sepete Ekle", "Sepete At", "Detay", "-", "✖", "Açıklama"}
YUZDE = re.compile(r"^%\s*\d+([.,]\d+)?$")

def _alan(baslik):
    """Sutun basligini alan adina cevirir."""
    b = baslik.replace("İ", "i").replace("I", "ı").lower().replace("ı", "i").strip()
    if "kdv'li" in b or "kdvli" in b or "kdv dahil" in b: return "kdvli"
    if "kdv'siz" in b or "kdvsiz" in b or "net" in b: return "net"
    if "liste" in b or b in ("fiyat", "fiyati"): return "liste"
    if ("kmp" in b or "kampanya" in b) and ("fyt" in b or "fiyat" in b): return "kampanya"
    if "isk" in b: return "isk"
    if "üretici kodu" in b or "uretici kodu" in b or "oem" in b or "orjinal" in b or "orijinal" in b: return "oem"
    if "araç" in b or "arac" in b: return "arac"
    if b.startswith("kod"): return "kod"
    if b in ("adi", "ad", "urun adi", "ürün adi", "stok adi"): return "ad"
    if "üretici" in b or "uretici" in b or "marka" in b or "menşei" in b or "mensei" in b: return "marka"
    if "birim" in b: return "birim"
    if b in ("drm", "durum", "stok"): return "stok"
    return None


def eryaz_b2b_sonuc(belge):
    """Eryaz B2B (WebForms) sonuc tablosu: #searchReaultPanel basliklari + #gvResult satirlari.
    Lepar, Basaran ve ayni altyapidaki siteler."""
    panel = hizli_id(belge, "searchReaultPanel")
    tablo = hizli_id(belge, "gvResult")
    if not tablo:
        return None
    # Basliklar (gvResult'tan once gelen, adi olan GroupControl'ler)
    basliklar = []
    if panel:
        for tip, ad, aid in duz_liste(panel):
            if aid == "gvResult":
                break
            if tip == "GroupControl" and ad and (not basliklar or basliklar[-1] != ad):
                basliklar.append(ad)
    alanlar = [_alan(x) for x in basliklar]
    metin_sira = [a for a in alanlar if a in ("kod", "oem", "arac", "ad", "marka", "birim")]
    fiyat_sira = [a for a in alanlar if a in ("liste", "net", "kdvli", "kampanya")]
    if not metin_sira: metin_sira = ["kod", "oem", "arac", "ad", "marka"]
    if not fiyat_sira: fiyat_sira = ["liste"]

    # Satirlar: "Detay" baglantisi satiri bitirir
    satirlar, aktif = [], {"T": [], "ID": ""}
    for tip, ad, aid in duz_liste(tablo):
        if tip == "EditControl" and aid.startswith("qty"):
            aktif["ID"] = aid[3:]
        elif tip == "TextControl" and ad:
            aktif["T"].append(ad)
        elif tip == "HyperlinkControl" and ad == "Detay":
            satirlar.append(aktif); aktif = {"T": [], "ID": ""}
    if aktif["T"]:
        satirlar.append(aktif)

    sonuc = []
    for s in satirlar:
        u = {"id": s["ID"], "stok": "", "isk": 0.0}
        fiyatlar, metinler = [], []
        for m in s["T"]:
            if m in ATIK:
                continue
            if sayi(m) is not None:
                fiyatlar.append(sayi(m)); continue
            if YUZDE.match(m):
                if "iskv" not in u:
                    u["iskv"] = True
                    try: u["isk"] = float(m.strip("% ").replace(",", "."))
                    except Exception: pass
                continue
            if m.lower() in STOK:
                if not u["stok"]: u["stok"] = m
                continue
            if m.isdigit():          # koli adedi, siparis miktari vb.
                continue
            metinler.append(m)
        for alan, deger in zip(metin_sira, metinler):
            u[alan] = deger
        for alan, deger in zip(fiyat_sira, fiyatlar):
            u[alan] = deger
        u.pop("iskv", None)
        if u.get("liste") or u.get("net"):
            sonuc.append(u)
    return sonuc


def a_grup_imza(belge):
    """A grubu (Basbug, Martas, Dinamik, Rotas, Sayim): satir kimlikleri + 'Sonuc bulunamadi'."""
    parcalar = []
    for tip, ad, aid in duz_liste(belge, maks=60):
        if aid.startswith("purch-"):
            parcalar.append(aid)
        elif ad == "Sonuç bulunamadı":
            parcalar.append("YOK")
    return "|".join(parcalar)


def a_grup_sonuc(belge):
    """Satir: DataItem(kod) > Group #purch-<kod>, sonra Ref.No, Marka, Urun Adi, Br., Liste, KDV'siz, KDV'li, Iskonto."""
    satirlar, aktif = [], None
    for tip, ad, aid in duz_liste(belge, maks=60):
        if tip == "GroupControl" and aid.startswith("purch-"):
            kod = aid[6:]
            if aktif:
                # yeni satirin kod hucresi, onceki satirin sonuna dusmus olur: geri al
                if aktif["T"] and aktif["T"][-1] == kod:
                    aktif["T"].pop()
                satirlar.append(aktif)
            aktif = {"kod": kod, "T": []}
            continue
        if aktif is not None and tip == "DataItemControl" and ad:
            aktif["T"].append(ad)
    if aktif: satirlar.append(aktif)
    sonuc = []
    for s in satirlar:
        u = {"kod": s["kod"], "stok": ""}
        fiyat, metin = [], []
        for m in s["T"]:
            p = PARA_TL.search(m)
            if p:
                fiyat.append(float(p.group(1).replace(".", "").replace(",", "."))); continue
            if m.startswith("%"):
                u.setdefault("iskmetin", m); continue
            metin.append(m)
        for alan, deger in zip(("oem", "marka", "ad", "birim"), metin):
            u[alan] = deger
        for alan, deger in zip(("liste", "net", "kdvli"), fiyat):
            u[alan] = deger
        if u.get("net") or u.get("liste"):
            sonuc.append(u)
    return sonuc


OKUYUCULAR = {
    "eryaz_b2b": {"kutu": "tbGeneralSearch", "sonuc": eryaz_b2b_sonuc, "tablo": "gvResult"},
    "lepar": {"kutu": "tbGeneralSearch", "sonuc": eryaz_b2b_sonuc, "tablo": "gvResult"},
    "a_grup": {"kutu": "searchInput", "sonuc": a_grup_sonuc, "imza": a_grup_imza},
}


def ara(anahtar, parca, okuyucu):
    oku = OKUYUCULAR.get(okuyucu)
    if not oku:
        return {"hata": "OKUYUCU_YOK", "mesaj": f"'{okuyucu}' icin okuyucu yok"}
    w, belge = sekme_sec(anahtar)
    if not w:
        return {"hata": "SEKME_YOK", "mesaj": f"Chrome'da '{anahtar}' sekmesi acik degil (B2B_Baslat ile acin ve giris yapin)."}
    if not belge:
        return {"hata": "SAYFA_YOK", "mesaj": f"'{anahtar}' sekmesinin sayfasi okunamadi."}

    kutu = hizli_id(belge, oku["kutu"])
    if not kutu:
        return {"hata": "GIRIS", "mesaj": "Arama kutusu yok; oturum kapanmis olabilir, sekmede tekrar giris yapin."}

    # Onceki sonucun imzasi (yeni sonucu ayirt etmek icin)
    def imza():
        if oku.get("imza"):
            return oku["imza"](belge)
        t = hizli_id(belge, oku["tablo"])
        if not t: return ""
        return "|".join(a for _, a, _ in duz_liste(t)[:60])
    eski = imza()

    try: kutu.Click(simulateMove=False)
    except Exception: pass
    time.sleep(0.15)
    auto.SendKeys("{Ctrl}a{Delete}", waitTime=0.05)
    auto.SendKeys(parca, interval=0.01, waitTime=0.05)
    auto.SendKeys("{Enter}", waitTime=0.05)

    # Ana sayfada (sonuc paneli yok) Enter aramayi baslatmaz; Ara dugmesine bas
    time.sleep(0.5)
    if not hizli_id(belge, "searchReaultPanel"):
        dugme = hizli_id(belge, "btnSearch")
        if dugme:
            try: dugme.Click(simulateMove=False)
            except Exception: pass

    # Sonucun gelmesini bekle (en fazla 15 sn): imza degisip iki okumada sabit kalinca
    son, sabit = None, 0
    for _ in range(60):
        time.sleep(0.25)
        # sayfa yenilenmis olabilir: belgeyi tekrar bul
        for b in belgeler(w):
            if belge_eslesir(b, anahtar.lower()):
                belge = b; break
        yeni = imza()
        if yeni and yeni != eski:
            if yeni == son:
                sabit += 1
                if sabit >= 2: break
            else:
                son, sabit = yeni, 0
    satirlar = oku["sonuc"](belge) or []
    return {"tamam": True, "satirlar": satirlar}


def coklu(parca, siteler):
    """siteler: [{"ad","anahtar","okuyucu"}]. Her site bitince bir JSON satiri yazar."""
    for st in siteler:
        bas = time.time()
        try:
            sonuc = ara(st["anahtar"], parca, st["okuyucu"])
        except Exception as e:
            sonuc = {"hata": "ISTISNA", "mesaj": str(e)}
        sonuc["ad"] = st["ad"]
        sonuc["sure"] = round(time.time() - bas, 1)
        cikti(sonuc)


def durum(anahtarlar):
    """Hangi sekmelerin acik oldugunu soyler; hicbir sekmeyi secmez, hicbir seye tiklamaz."""
    adlar = []
    for w in auto.GetRootControl().GetChildren():
        if "chrome" not in (w.Name or "").lower():
            continue
        def g(c, k=0):
            if k > 10: return
            try: cocuklar = c.GetChildren()
            except Exception: return
            for x in cocuklar:
                try:
                    if x.ControlTypeName == "TabItemControl" and x.Name:
                        adlar.append(x.Name.lower())
                except Exception: pass
                g(x, k + 1)
        g(w)
    acik = [a for a in anahtarlar if any(a.lower() in ad for ad in adlar)]
    return {"tamam": True, "acik": acik}


def one(anahtar):
    w, _ = sekme_sec(anahtar)
    return {"tamam": bool(w)}


if __name__ == "__main__":
    try:
        if len(sys.argv) >= 5 and sys.argv[1] == "ara":
            cikti(ara(sys.argv[2], sys.argv[3], sys.argv[4]))
        elif len(sys.argv) >= 4 and sys.argv[1] == "coklu":
            coklu(sys.argv[2], json.loads(sys.argv[3]))
        elif len(sys.argv) >= 2 and sys.argv[1] == "durum":
            cikti(durum(sys.argv[2:]))
        elif len(sys.argv) >= 3 and sys.argv[1] == "one":
            cikti(one(sys.argv[2]))
        else:
            cikti({"hata": "KULLANIM"})
    except Exception as e:
        cikti({"hata": "ISTISNA", "mesaj": str(e)})
