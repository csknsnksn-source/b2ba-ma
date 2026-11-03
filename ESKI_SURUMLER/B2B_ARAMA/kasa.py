# -*- coding: utf-8 -*-
"""
Giris bilgilerini Windows'un kendi sifrelemesiyle (DPAPI) saklar.
Dosyalar sadece bu bilgisayarda, ayni Windows kullanicisiyla cozulebilir.
"""
import ctypes
import ctypes.wintypes as wt
import json
import os
import re

KASA_KLASOR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sifreler")


class _BLOB(ctypes.Structure):
    _fields_ = [("cbData", wt.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]


def _dpapi(veri: bytes, sifrele: bool) -> bytes:
    crypt32 = ctypes.windll.crypt32
    kernel32 = ctypes.windll.kernel32
    tampon = ctypes.create_string_buffer(veri, len(veri))
    giris = _BLOB(len(veri), ctypes.cast(tampon, ctypes.POINTER(ctypes.c_char)))
    cikis = _BLOB()
    if sifrele:
        fn = crypt32.CryptProtectData
        fn.argtypes = [ctypes.POINTER(_BLOB), wt.LPCWSTR, ctypes.c_void_p, ctypes.c_void_p,
                       ctypes.c_void_p, wt.DWORD, ctypes.POINTER(_BLOB)]
        ok = fn(ctypes.byref(giris), "B2B", None, None, None, 0, ctypes.byref(cikis))
    else:
        fn = crypt32.CryptUnprotectData
        fn.argtypes = [ctypes.POINTER(_BLOB), ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p,
                       ctypes.c_void_p, wt.DWORD, ctypes.POINTER(_BLOB)]
        ok = fn(ctypes.byref(giris), None, None, None, None, 0, ctypes.byref(cikis))
    if not ok:
        raise ctypes.WinError()
    try:
        return ctypes.string_at(cikis.pbData, cikis.cbData)
    finally:
        kernel32.LocalFree.argtypes = [ctypes.c_void_p]
        kernel32.LocalFree(ctypes.cast(cikis.pbData, ctypes.c_void_p))


def _dosya(site_adi: str) -> str:
    guvenli = re.sub(r'[\\/:*?"<>|]+', "_", site_adi)
    return os.path.join(KASA_KLASOR, guvenli + ".giris")


def kaydet(site_adi: str, musteri: str, kullanici: str, sifre: str):
    os.makedirs(KASA_KLASOR, exist_ok=True)
    veri = json.dumps({"musteri": musteri, "kullanici": kullanici, "sifre": sifre}).encode("utf-8")
    with open(_dosya(site_adi), "wb") as f:
        f.write(_dpapi(veri, True))


def oku(site_adi: str):
    """Kayit yoksa None doner."""
    yol = _dosya(site_adi)
    if not os.path.exists(yol):
        return None
    with open(yol, "rb") as f:
        return json.loads(_dpapi(f.read(), False).decode("utf-8"))


def var_mi(site_adi: str) -> bool:
    return os.path.exists(_dosya(site_adi))


def sil(site_adi: str):
    yol = _dosya(site_adi)
    if os.path.exists(yol):
        os.remove(yol)
