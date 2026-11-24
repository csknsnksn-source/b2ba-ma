---
name: kisayol-esle
description: Site adları ile kısayol dosyalarını eşleştirir (tara ve esle akışı) ve makineye özel kisayol_eslesme.json'u günceller. Kullanıcı "kısayolları tara", "eşleşmeyen site var", "esle" dediğinde kullan.
---

# Kısayol eşleştirme

## Adımlar
1. `B2B_Protokol.ps1 tara` çalıştırılır. Çıktı `kisayol_listesi.txt`'dir. Eşleşmeyen siteler listelenir.
2. Eşleşmeyen site için kısayol adı kullanıcıya gösterilir. Kullanıcı `esle` ekranında doğru kısayolu seçer.
3. Sonuç `kisayol_eslesme.json` içine yazılır. Bu dosya makineye özeldir, git'e girmez.
4. Açılış yöntemi için `B2B_Acilis_Tespit.ps1` yeniden çalıştırılır.

## Dikkat
- Eşleşme büyük/küçük harf, Türkçe harf ve "(coşkun)" gibi sonekleri yok sayar.
- Klasör dışı yol ve özel karakter içeren ad reddedilir (`B2B_Protokol.ps1`).
