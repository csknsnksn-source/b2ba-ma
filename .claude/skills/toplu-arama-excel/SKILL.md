---
name: toplu-arama-excel
description: TASLAK. Excel'deki parça listesini tüm B2B'lerde toplu arar ve sonuçları Excel çıktısı olarak üretir. Yalnızca tasarım; kod henüz yazılmadı.
---

# Toplu arama (TASLAK)

Durum: tasarım aşaması. Kod yazılmadı, bu skill çalıştırılmamalı.

## Hedef
- Girdi: parça numaralarının bulunduğu Excel (tek sütun).
- İşlem: her parça her firmada aranır. Açılış yöntemi bilgisayara göre (`acilis_ayar.json`).
- Çıktı: parça, firma, net fiyat, KDV dahil fiyat, stok, resim adresi (varsa), hata/uyarı notu.

## Açık sorular
- Toplu arama eklenti içinde mi yapılacak, yoksa PowerShell tarafında mı?
- Firma başına hata nasıl raporlanacak?
