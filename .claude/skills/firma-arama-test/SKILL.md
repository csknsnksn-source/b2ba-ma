---
name: firma-arama-test
description: Bir firmada parça aramasını test eder, eklentinin gösterdiği fiyatı sitedeki değerle karşılaştırır ve ARAMA_KAYITLARI.md'ye kayıt düşer. Kullanıcı "şu firmayı test et", "fiyat doğru mu" dediğinde kullan.
---

# Firma arama testi

## Adımlar
1. Parça numarası ve firma belirlenir. Sitede aranır, sonuç ve fiyat (liste, net, KDV dahil) not edilir.
2. Eklentide aynı parça aranır. Eklentinin gösterdiği net ve KDV dahil değerler not edilir.
3. Fark varsa: hangi sütunun okunduğu, KDV durumu ve iskonto kontrol edilir (`okuyucular.js`).
4. Kayıt `FIRMALAR/ARAMA_KAYITLARI.md` en üste eklenir: tarih, parça, firma, site değeri, eklenti değeri, sonuç, onay.
5. Onay kullanıcıdan alınır. Kullanıcı onaylamadan KONTROL_TABLOSU "ONAYLANDI" yapılmaz.
6. Firma notu ve KONTROL_TABLOSU güncellenir.

## Stok
- Her testte stok bilgisi de not edilir. Stok bulunamazsa "stok bilinmiyor" yazılır, boş bırakılmaz.
