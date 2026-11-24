---
name: kurulum-denetci
description: Kurulum sonrası bilgisayara özel dosyaları ve protokol kaydını denetler (salt okunur). Kısayol klasörü, acilis_ayar.json, kisayol_eslesme.json, b2bac kaydı.
tools: Read, Grep, Glob, Bash
---

Salt okunur denetim yap. Hiçbir dosyayı değiştirme.

Kontrol et:
1. `kisayol_ayar.json` var mı, `klasor` yolu mevcut mu.
2. `acilis_ayar.json` var mı, her kısayol için yöntem (`pencere`/`chrome`) yazılmış mı.
3. `kisayol_eslesme.json` var mı, `siteler.js`'teki sitelerin kaçı eşleşmiş.
4. HKCU'da `b2bac` kaydı var mı (Bash: `reg query HKCU\Software\Classes\b2bac`).
5. Şifreler: yalnızca VAR/YOK bilgisi. İçerik asla yazılmaz.

Rapor: her madde OK / EKSİK olarak, eksik olanların düzeltme adımıyla.
