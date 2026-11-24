---
name: toplu-b2b-ac
description: TASLAK. Kullanıcının seçtiği B2B'leri toplu açar. Mevcut b2bac: ve B2B_Ac.ps1 -Sadece akışını kullanır. Yalnızca tasarım.
---

# Toplu B2B açma (TASLAK)

Durum: tasarım aşaması.

## Akış
1. Kullanıcı liste dışı bırakılmış firmalardan açmak istediklerini seçer.
2. Her firmanın açılış yöntemi `acilis_ayar.json`'dan okunur (`pencere` veya `chrome`).
3. Mevcut `B2B_Ac.ps1 -Sadece` çağrılır. Yeni kod gerekmez.
4. Sonuç özeti kullanıcıya verilir: açıldı, giriş yapıldı, hata var.
