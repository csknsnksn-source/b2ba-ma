# -*- coding: utf-8 -*-
"""B2B giris bilgilerini (musteri kodu, kullanici, sifre) sifreli kaydeder."""
import getpass
import json
import os

import kasa

KLASOR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(KLASOR, "siteler.json"), encoding="utf-8") as f:
    siteler = [s["ad"] for s in json.load(f)]

while True:
    print("\n=== B2B GIRIS BILGILERI ===")
    for i, ad in enumerate(siteler, 1):
        print(f"{i:3}) {ad:20} {'[kayitli]' if kasa.var_mi(ad) else ''}")
    sec = input("\nKaydetmek istediginiz B2B'nin numarasi (cikmak icin bos birakip Enter): ").strip()
    if not sec:
        break
    if not sec.isdigit() or not 1 <= int(sec) <= len(siteler):
        print("Gecersiz numara.")
        continue
    ad = siteler[int(sec) - 1]
    print(f"\n--- {ad} ---")
    musteri = input("Musteri kodu: ").strip()
    kullanici = input("Kullanici adi: ").strip()
    sifre = getpass.getpass("Sifre (yazarken ekranda gorunmez): ")
    if not (kullanici and sifre):
        print("Kullanici adi ve sifre bos olamaz, kaydedilmedi.")
        continue
    try:
        kasa.kaydet(ad, musteri, kullanici, sifre)
        kontrol = kasa.oku(ad)
        if kontrol and kontrol["sifre"] == sifre:
            print(f"{ad}: kaydedildi ve dogrulandi (sifreli).")
        else:
            print(f"{ad}: kaydedildi ama dogrulanamadi!")
    except Exception as e:
        print(f"HATA: kaydedilemedi -> {e}")
