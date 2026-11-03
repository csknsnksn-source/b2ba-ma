# -*- coding: utf-8 -*-
"""
Ayarlar ekrani islemleri:
- B2B listesi / giris bilgileri (kasa ile sifreli)
- Excel sablonundan toplu sifre girisi (girildikten sonra Excel'deki sifreler silinir)
- Ana sifreli yedek dosyasi (baska bilgisayara tasimak icin)
"""
import base64
import json
import os
from datetime import datetime

import kasa

KLASOR = os.path.dirname(os.path.abspath(__file__))
SITE_DOSYA = os.path.join(KLASOR, "siteler.json")
EXCEL_DOSYA = os.path.join(KLASOR, "B2B_Sifreler.xlsx")
YEDEK_DOSYA = os.path.join(KLASOR, "B2B_Yedek.b2bk")

BASLIKLAR = ["B2B", "Müşteri Kodu", "Kullanıcı Adı", "Şifre", "Durum"]


# ------------------------------------------------------------------ site listesi
def siteleri_oku():
    with open(SITE_DOSYA, encoding="utf-8") as f:
        return json.load(f)


def siteleri_yaz(siteler):
    txt = "[\n" + ",\n".join("  " + json.dumps(s, ensure_ascii=False) for s in siteler) + "\n]\n"
    with open(SITE_DOSYA, "w", encoding="utf-8") as f:
        f.write(txt)


def liste():
    """Ayarlar ekrani icin B2B listesi (sifre hic gonderilmez)."""
    sonuc = []
    for s in siteleri_oku():
        bilgi = None
        try:
            bilgi = kasa.oku(s["ad"])
        except Exception:
            pass
        sonuc.append({
            "ad": s["ad"],
            "tip": s.get("tip", ""),
            "aktif": s.get("aktif", True),
            "kayitli": bool(bilgi and bilgi.get("sifre")),
            "musteri": (bilgi or {}).get("musteri", ""),
            "kullanici": (bilgi or {}).get("kullanici", ""),
        })
    return sonuc


def aktif_yap(ad, aktif):
    siteler = siteleri_oku()
    for s in siteler:
        if s["ad"] == ad:
            s["aktif"] = bool(aktif)
    siteleri_yaz(siteler)
    return True


# ------------------------------------------------------------------ giris bilgileri
def giris_kaydet(ad, musteri, kullanici, sifre):
    """Sifre bos birakilirsa eski sifre korunur."""
    musteri = (musteri or "").strip()
    kullanici = (kullanici or "").strip()
    sifre = sifre or ""
    if not sifre:
        eski = kasa.oku(ad)
        if not eski or not eski.get("sifre"):
            return {"ok": False, "mesaj": "Şifre girilmedi."}
        sifre = eski["sifre"]
    if not kullanici:
        return {"ok": False, "mesaj": "Kullanıcı adı boş olamaz."}
    kasa.kaydet(ad, musteri, kullanici, sifre)
    kontrol = kasa.oku(ad)
    if not kontrol or kontrol.get("sifre") != sifre:
        return {"ok": False, "mesaj": "Kaydedildi ama doğrulanamadı."}
    return {"ok": True, "mesaj": f"{ad}: kaydedildi."}


def giris_sil(ad):
    kasa.sil(ad)
    return {"ok": True, "mesaj": f"{ad}: giriş bilgisi silindi."}


# ------------------------------------------------------------------ Excel
def _excel_sablon_olustur():
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.worksheet.datavalidation import DataValidation  # noqa: F401

    wb = Workbook()
    ws = wb.active
    ws.title = "Şifreler"
    ince = Side(style="thin", color="BFBFBF")
    kenar = Border(left=ince, right=ince, top=ince, bottom=ince)
    ws.append(BASLIKLAR)
    for c in ws[1]:
        c.font = Font(name="Arial", bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F4E78")
        c.border = kenar
        c.alignment = Alignment(vertical="center")
    sari = PatternFill("solid", fgColor="FFF2CC")
    for s in siteleri_oku():
        bilgi = None
        try:
            bilgi = kasa.oku(s["ad"])
        except Exception:
            pass
        durum = "Kayıtlı (değiştirmek için şifreyi yazın)" if bilgi else ""
        ws.append([s["ad"], (bilgi or {}).get("musteri", ""), (bilgi or {}).get("kullanici", ""), "", durum])
        r = ws.max_row
        for col in range(1, 6):
            c = ws.cell(r, col)
            c.font = Font(name="Arial")
            c.border = kenar
            if col in (2, 3, 4):
                c.fill = sari
    for col, w in zip("ABCDE", [24, 16, 22, 22, 42]):
        ws.column_dimensions[col].width = w
    ws.freeze_panes = "A2"
    n = ws.max_row + 2
    notlar = [
        "NASIL DOLDURULUR:",
        "1) Sarı hücreleri doldurun. Müşteri kodu olmayan B2B'lerde boş bırakın.",
        "2) Dosyayı kaydedip KAPATIN.",
        "3) Programda Ayarlar > 'Excel'den içe aktar' düğmesine basın.",
        "4) Program şifreleri şifreleyip saklar ve bu dosyadaki Şifre sütununu SİLER.",
    ]
    for i, t in enumerate(notlar):
        c = ws.cell(n + i, 1, t)
        c.font = Font(name="Arial", bold=(i == 0), italic=(i > 0), color="595959")
    wb.save(EXCEL_DOSYA)


def excel_ac():
    if not os.path.exists(EXCEL_DOSYA):
        _excel_sablon_olustur()
    os.startfile(EXCEL_DOSYA)  # noqa  (Windows)
    return {"ok": True, "mesaj": "Excel dosyası açıldı. Doldurup KAYDEDİN ve KAPATIN, sonra 'Excel'den içe aktar'a basın."}


def excel_sablon_yenile():
    try:
        _excel_sablon_olustur()
    except PermissionError:
        return {"ok": False, "mesaj": "Excel dosyası açık. Önce Excel'i kapatın."}
    os.startfile(EXCEL_DOSYA)  # noqa
    return {"ok": True, "mesaj": "Şablon yenilendi ve açıldı (B2B listesi güncel)."}


def excel_ice_aktar():
    from openpyxl import load_workbook

    if not os.path.exists(EXCEL_DOSYA):
        return {"ok": False, "mesaj": "Excel dosyası yok. Önce 'Excel şablonunu aç' ile oluşturun."}
    # Excel aciksa dosyaya yazamayiz; once kontrol et ki sifreler Excel'de kalmasin
    try:
        with open(EXCEL_DOSYA, "r+b"):
            pass
    except PermissionError:
        return {"ok": False, "mesaj": "Excel dosyası açık. Lütfen Excel'i kaydedip KAPATIN, sonra tekrar deneyin."}

    wb = load_workbook(EXCEL_DOSYA)
    ws = wb.active
    basliklar = [str(c.value or "").strip().lower() for c in ws[1]]

    def sutun(*adlar):
        for a in adlar:
            if a in basliklar:
                return basliklar.index(a) + 1
        return None

    c_b2b = sutun("b2b")
    c_mus = sutun("müşteri kodu", "musteri kodu")
    c_kul = sutun("kullanıcı adı", "kullanici adi", "kullanıcı kodu")
    c_sif = sutun("şifre", "sifre", "parola")
    c_dur = sutun("durum")
    if not (c_b2b and c_kul and c_sif):
        return {"ok": False, "mesaj": "Excel'de 'B2B', 'Kullanıcı Adı' ve 'Şifre' sütunları bulunamadı."}

    site_adlari = {s["ad"].lower(): s["ad"] for s in siteleri_oku()}
    kaydedilen, hatali = [], []
    zaman = datetime.now().strftime("%d.%m.%Y %H:%M")
    for r in range(2, ws.max_row + 1):
        ad = str(ws.cell(r, c_b2b).value or "").strip()
        sifre = ws.cell(r, c_sif).value
        if not ad or sifre in (None, ""):
            continue
        sifre = str(sifre)
        gercek_ad = site_adlari.get(ad.lower())
        if not gercek_ad:
            hatali.append(f"{ad}: listede böyle bir B2B yok")
            ws.cell(r, c_sif).value = None
            if c_dur:
                ws.cell(r, c_dur).value = "HATA: B2B adı tanınmadı"
            continue
        musteri = str(ws.cell(r, c_mus).value or "").strip() if c_mus else ""
        kullanici = str(ws.cell(r, c_kul).value or "").strip()
        sonuc = giris_kaydet(gercek_ad, musteri, kullanici, sifre)
        ws.cell(r, c_sif).value = None          # sifreyi Excel'den sil
        if sonuc["ok"]:
            kaydedilen.append(gercek_ad)
            if c_dur:
                ws.cell(r, c_dur).value = f"Kaydedildi {zaman}"
        else:
            hatali.append(f"{gercek_ad}: {sonuc['mesaj']}")
            if c_dur:
                ws.cell(r, c_dur).value = f"HATA: {sonuc['mesaj']}"
    wb.save(EXCEL_DOSYA)

    if not kaydedilen and not hatali:
        return {"ok": False, "mesaj": "Excel'de şifre yazılı satır bulunamadı."}
    mesaj = f"{len(kaydedilen)} B2B kaydedildi"
    if kaydedilen:
        mesaj += ": " + ", ".join(kaydedilen)
    mesaj += ". Excel'deki şifreler silindi."
    if hatali:
        mesaj += " Sorunlu satırlar: " + "; ".join(hatali)
    return {"ok": not hatali, "mesaj": mesaj}


# ------------------------------------------------------------------ ana sifreli yedek
def _anahtar(ana_sifre, tuz):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=tuz, iterations=390000)
    return base64.urlsafe_b64encode(kdf.derive(ana_sifre.encode("utf-8")))


def yedek_al(ana_sifre):
    from cryptography.fernet import Fernet

    if not ana_sifre or len(ana_sifre) < 6:
        return {"ok": False, "mesaj": "Ana şifre en az 6 karakter olmalı."}
    girisler = {}
    for s in siteleri_oku():
        b = kasa.oku(s["ad"])
        if b:
            girisler[s["ad"]] = b
    if not girisler:
        return {"ok": False, "mesaj": "Yedeklenecek kayıtlı giriş bilgisi yok."}
    veri = json.dumps({"surum": 1, "tarih": datetime.now().isoformat(), "siteler": siteleri_oku(),
                       "girisler": girisler}, ensure_ascii=False).encode("utf-8")
    tuz = os.urandom(16)
    sifreli = Fernet(_anahtar(ana_sifre, tuz)).encrypt(veri)
    with open(YEDEK_DOSYA, "wb") as f:
        f.write(b"B2BK1" + tuz + sifreli)
    os.startfile(KLASOR)  # noqa
    return {"ok": True, "mesaj": f"{len(girisler)} B2B yedeklendi: B2B_Yedek.b2bk. "
                                 "Bu dosyayı diğer bilgisayarda program klasörüne kopyalayıp 'Yedekten yükle'ye basın."}


def yedek_yukle(ana_sifre):
    from cryptography.fernet import Fernet, InvalidToken

    if not os.path.exists(YEDEK_DOSYA):
        return {"ok": False, "mesaj": "B2B_Yedek.b2bk dosyası program klasöründe bulunamadı."}
    with open(YEDEK_DOSYA, "rb") as f:
        ham = f.read()
    if not ham.startswith(b"B2BK1"):
        return {"ok": False, "mesaj": "Yedek dosyası tanınmadı."}
    tuz, sifreli = ham[5:21], ham[21:]
    try:
        veri = json.loads(Fernet(_anahtar(ana_sifre or "", tuz)).decrypt(sifreli))
    except InvalidToken:
        return {"ok": False, "mesaj": "Ana şifre yanlış."}
    # site listesini birlestir (yeni B2B'ler eklenir, mevcutlar korunur)
    mevcut = siteleri_oku()
    adlar = {s["ad"] for s in mevcut}
    eklenen_site = [s for s in veri.get("siteler", []) if s["ad"] not in adlar]
    if eklenen_site:
        siteleri_yaz(mevcut + eklenen_site)
    n = 0
    for ad, b in (veri.get("girisler") or {}).items():
        kasa.kaydet(ad, b.get("musteri", ""), b.get("kullanici", ""), b.get("sifre", ""))
        n += 1
    return {"ok": True, "mesaj": f"{n} B2B'nin giriş bilgisi yüklendi"
                                 + (f", {len(eklenen_site)} yeni B2B listeye eklendi" if eklenen_site else "") + "."}


# ------------------------------------------------------------------ dagitim paketi
HARIC_KLASOR = {"profil", "profil_firefox", "sifreler", "log", "__pycache__"}
HARIC_DOSYA = {"B2B_Sifreler.xlsx", "B2B_Yedek.b2bk", "python_yolu.txt", "B2B_Arama_Kurulum.zip"}


def paket_olustur():
    """Baska bilgisayara kurmak icin zip olusturur (sifre, profil, log HARIC)."""
    import zipfile

    hedef = os.path.join(KLASOR, "B2B_Arama_Kurulum.zip")
    n = 0
    with zipfile.ZipFile(hedef, "w", zipfile.ZIP_DEFLATED) as z:
        for kok, klasorler, dosyalar in os.walk(KLASOR):
            klasorler[:] = [k for k in klasorler if k not in HARIC_KLASOR]
            for d in dosyalar:
                if d in HARIC_DOSYA or d.endswith((".pyc", ".tmp")) or d.startswith("~$"):
                    continue
                yol = os.path.join(kok, d)
                z.write(yol, os.path.join("B2B_ARAMA", os.path.relpath(yol, KLASOR)))
                n += 1
    os.startfile(KLASOR)  # noqa
    return {"ok": True, "mesaj": f"B2B_Arama_Kurulum.zip oluşturuldu ({n} dosya, şifreler ve kişisel veriler hariç). "
                                 "Diğer bilgisayarda zip'i açıp KURULUM.bat'a çift tıklayın."}
