---
name: yeni-b2b-bildirim-akisi
description: TASLAK. Yeni bir B2B eklendiğinde program yapıcısına bildirim gider, site test edilir, eksikse yeni-firma-ekle akışı başlatılır. Yalnızca tasarım.
---

# Yeni B2B bildirim akışı (TASLAK)

Durum: tasarım aşaması. Bildirim kanalı (panel `KALP_URL` veya e-posta) uygulama aşamasında seçilecek.

## Akış
1. Kullanıcı yeni siteyi bildirir (adres, kısayol varsa adı).
2. Program yapıcısı siteyi test eder: okuyucu çalışıyor mu, fiyat ve stok okunuyor mu.
3. Skill'lerde (`yeni-firma-ekle`, firma notu, KONTROL_TABLOSU) yoksa eklenmesi istenir.
4. Test sonucu `ARAMA_KAYITLARI.md`'ye yazılır.
