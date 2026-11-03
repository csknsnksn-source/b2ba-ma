# -*- coding: utf-8 -*-
"""Chrome'da ACIK ve GIRISLI B2B sekmelerini sirayla inceler.
Her sekmede: sekmeyi one getirir, arama kutusunu bulur, parcayi aratir, sonuc sayfasinin
yapisini sekmeler\\<ad>.txt dosyasina yazar. Ozet: toplu_ozet.txt
Guvenlik: sayfada sifre kutusu varsa (giris ekrani) HICBIR SEY YAZMAZ, atlar."""
import sys, os, time, subprocess
def kur(pkg):
    try: __import__(pkg)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check", pkg])
kur("uiautomation")
import uiautomation as auto

PARCA = sys.argv[1] if len(sys.argv) > 1 else "2091042"
KLASOR = os.path.dirname(os.path.abspath(__file__))
CIKTI_KLASOR = os.path.join(KLASOR, "sekmeler")
os.makedirs(CIKTI_KLASOR, exist_ok=True)
OZET = os.path.join(KLASOR, "toplu_ozet.txt")

# (dosya adi, sekme adinda gecen ifade)
SITELER = [
    ("abs", "ABS OTOMOTİV"), ("akay", "Akay Otomotiv"), ("arkas", "ARKAS OTOMOTİV"),
    ("askar", "ASKAR OTOMOTİV"), ("aslan", "ASLAN KARDEŞLER"), ("asin", "AŞİN OTOMOTİV"),
    ("basaran", "BAŞARAN OTOMOTİV"), ("carpar", "CARPAR"), ("citak", "ÇITAK YEDEK"),
    ("dega", "DE-GA"), ("ekici", "EKİCİ OTOMOTİV"), ("ergin", "Ergin Otomotiv"),
    ("glopar", "GloPar"), ("kolas", "Kolaş Motor"), ("grupisik", "Grup Işık"),
    ("guneybaglilar", "Güneybağlılar"), ("hiska", "HİS-KA"), ("hyk", "HYK Automotive"),
    ("ilsem", "İlsem Otomotiv"), ("intur", "İNTUR OTOMOTİV"), ("jetpar", "JETPAR"),
    ("karakas", "Karakaş Toptan"), ("karpart", "Karpart Otomotiv"), ("korea", "KOREA OTOMOTİV"),
    ("kortas", "Kortaş Otomotiv"), ("kraw", "KRAW"), ("merkez", "Merkez Oto"),
    ("mete", "METE OTOMOTİV"), ("meydan", "MEYDAN IO"), ("motorasin", "Motor Aşin"),
    ("murat", "MURAT OTOMOTİV"), ("mydpar", "Mydpar"), ("nes", "NES OTO"),
    ("orient", "Orient Ekspres"), ("otorulman", "Oto Rulman"), ("sahinoglu", "ŞAHİNOĞLU"),
    ("sayili", "SAYILI OTOMOTIV"), ("sayiner", "Sayıner Otomotiv"), ("fcs", "siparis.fcs"),
    ("sahinler", "Şahinler"), ("senbay", "Şenbay"), ("teknopar", "Teknopar"),
    ("tok", "TOK OTOMOTİV"), ("universal", "UNIVERSAL OTOMOTİV"), ("waha", "Waha Otomotiv"),
    ("yedekci", "YEDEKÇİ OTOMOTİV"), ("yenialka", "Yeni Alka"),
]
PROGRAM_SITELERI = [
    ("basbug", "BASBUG OTOMOTIV"), ("martas", "Martaş Otomotiv"), ("dinamik", "Dinamik Otomotiv"),
    ("rotas", "Rotas Otomotiv"), ("sayim", "Sayim Rulman"), ("intermobil", "İntermobil"),
    ("vahdet", "vahdettiryakioglu"), ("mest", "Mest Otomotiv"),
]
SITELER = SITELER + PROGRAM_SITELERI
# Tek bir site denemek icin: python toplu_incele.py 2091042 ergin
if len(sys.argv) > 2:
    SITELER = [s for s in SITELER if s[0] in sys.argv[2:]]

ozet = open(OZET, "w", encoding="utf-8")
def oz(s):
    ozet.write(s + "\n"); ozet.flush(); print(s)


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


def hepsi(ctrl, pred, maks=45):
    out = []
    def g(c, k=0):
        if k > maks: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if pred(x): out.append(x)
            except Exception: pass
            g(x, k + 1)
    g(ctrl)
    return out


def belgeler(w):
    out = []
    def g(c, k=0):
        if k > 14: return
        try: cocuklar = c.GetChildren()
        except Exception: return
        for x in cocuklar:
            try:
                if x.ControlTypeName == "DocumentControl":
                    out.append(x); continue
            except Exception: pass
            g(x, k + 1)
    g(w)
    return out


def chrome_pencereleri():
    return [w for w in auto.GetRootControl().GetChildren() if "chrome" in (w.Name or "").lower()]


def belge_eslesir(b, anahtar):
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
            for _ in range(6):
                for b in belgeler(w):
                    return w, b
                time.sleep(0.7)
            return w, None
    # 2) Normal Chrome penceresindeki sekme
    for w in pencereler:
        ad = (w.Name or "").lower()
        if "chrome" not in ad or "b2b ortak arama" in ad:
            continue
        tab = bul(w, lambda c: c.ControlTypeName == "TabItemControl" and anahtar in (c.Name or "").lower(), maks=10)
        if not tab:
            continue
        try: w.SetActive(); w.SetFocus()
        except Exception: pass
        try: tab.GetSelectionItemPattern().Select()
        except Exception:
            try: tab.Click(simulateMove=False)
            except Exception: pass
        for _ in range(8):
            time.sleep(0.7)
            for b in belgeler(w):
                if belge_eslesir(b, anahtar):
                    return w, b
        return w, None
    return None, None


def sifre_var(belge):
    def p(c):
        if c.ControlTypeName != "EditControl": return False
        try:
            if c.IsPassword: return True
        except Exception: pass
        return any(k in ((c.Name or "") + " " + (c.AutomationId or "")).lower() for k in ("şifre", "sifre", "password", "parola"))
    return bool(bul(belge, p, maks=45))


ANAHTARLAR = ("ara", "search", "kelime", "urun", "ürün", "stok", "kod", "quick", "parca", "parça", "keyword", "query")

# Siteye ozel arama kutusu (AutomationId)
KUTU_ID = {"basbug": "searchInput", "martas": "searchInput", "dinamik": "searchInput",
           "rotas": "searchInput", "sayim": "searchInput"}
ETIKET_SIMDIKI = [""]


def arama_kutusu(belge):
    kutular = hepsi(belge, lambda c: c.ControlTypeName == "EditControl")
    ozel = KUTU_ID.get(ETIKET_SIMDIKI[0])
    if ozel:
        for k in kutular:
            if (k.AutomationId or "") == ozel:
                return k, kutular
    puanli = []
    for k in kutular:
        metin = ((k.Name or "") + " " + (k.AutomationId or "")).lower()
        puan = sum(2 if a in ("ara", "search") else 1 for a in ANAHTARLAR if a in metin)
        if any(x in metin for x in ("araç", "arac", "üretici", "uretici", "marka", "model")):
            puan -= 4
        if any(x in metin for x in ("adet", "qty", "miktar", "quantity")):
            puan -= 5
        try:
            r = k.BoundingRectangle
            if r.right - r.left <= 0: puan -= 3   # gorunmuyor
        except Exception: pass
        puanli.append((puan, k))
    puanli.sort(key=lambda x: -x[0])
    if puanli and puanli[0][0] > 0:
        return puanli[0][1], kutular
    return None, kutular


def yapi(belge, dosya):
    satir = 0
    with open(dosya, "a", encoding="utf-8") as f:
        def g(c, k=0):
            nonlocal satir
            if k > 45 or satir > 3000: return
            try: cocuklar = c.GetChildren()
            except Exception: return
            for x in cocuklar:
                try:
                    ad = (x.Name or "").strip().replace("\n", " ")[:120]
                    aid = x.AutomationId or ""
                    if ad or aid:
                        f.write(f"{'  ' * min(k, 20)}[{x.ControlTypeName}] {ad}" + (f"  #{aid}" if aid else "") + "\n")
                        satir += 1
                except Exception: pass
                g(x, k + 1)
        g(belge)
    return satir


oz(f"=== Toplu inceleme {time.strftime('%H:%M')} parca={PARCA} - {len(SITELER)} site ===")
for etiket, anahtar in SITELER:
    dosya = os.path.join(CIKTI_KLASOR, f"{etiket}.txt")
    with open(dosya, "w", encoding="utf-8") as f:
        f.write(f"=== {etiket} / '{anahtar}' / parca={PARCA} ===\n")
    ETIKET_SIMDIKI[0] = etiket
    try:
        try:
            w, belge = sekme_sec(anahtar)
        except Exception:
            time.sleep(2)
            w, belge = sekme_sec(anahtar)     # gecici Windows hatasinda bir kez daha
        sekme_adi = anahtar
        if not w:
            oz(f"{etiket:14} SEKME YOK"); continue
        if not belge:
            oz(f"{etiket:14} SAYFA OKUNAMADI ({sekme_adi})"); continue
        if sifre_var(belge):
            yapi(belge, dosya)
            oz(f"{etiket:14} GIRIS EKRANI - atlandi (sifre kutusu var)"); continue
        kutu, kutular = arama_kutusu(belge)
        if not kutu:
            with open(dosya, "a", encoding="utf-8") as f:
                f.write("Arama kutusu bulunamadi. Kutular:\n")
                for k in kutular:
                    f.write(f"  '{k.Name}' #{k.AutomationId}\n")
            yapi(belge, dosya)
            oz(f"{etiket:14} ARAMA KUTUSU YOK ({len(kutular)} kutu)"); continue
        with open(dosya, "a", encoding="utf-8") as f:
            f.write(f"Arama kutusu: '{kutu.Name}' #{kutu.AutomationId}\n")
        try: kutu.Click(simulateMove=False)
        except Exception: pass
        time.sleep(0.3)
        auto.SendKeys("{Ctrl}a{Delete}"); time.sleep(0.2)
        auto.SendKeys(PARCA, interval=0.03); time.sleep(0.2)
        auto.SendKeys("{Enter}")
        time.sleep(8)
        for b in belgeler(w):
            if belge_eslesir(b, anahtar.lower()):
                belge = b; break
        n = yapi(belge, dosya)
        oz(f"{etiket:14} OK  kutu=#{kutu.AutomationId or kutu.Name} - {n} satir yapi")
    except Exception as e:
        oz(f"{etiket:14} HATA {e}")
oz("=== bitti ===")
ozet.close()
