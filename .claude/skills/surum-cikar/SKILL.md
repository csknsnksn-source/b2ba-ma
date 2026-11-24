---
name: surum-cikar
description: Eklentinin yeni sürümünü hazırlar (manifest sürümü, mağaza paketi, KURULUM.md). Mağazaya yükleme ve inceleme kullanıcı tarafından yapılır. Kullanıcı "yeni sürüm çıkar", "mağazaya güncelleme" dediğinde kullan.
---

# Sürüm çıkarma

Eklenti Chrome Web Mağazası'nda **liste dışı** yayınlanıyor. Güncellemeler orada tutuluyor.

## Adımlar
1. Değişiklik gerçekten eklenti kodunda mı, kontrol edilir. Yalnızca belge veya `.ps1` değişikliği sürüm gerektirmez.
2. `B2B_EKLENTI/manifest.json` içindeki `version` artırılır. `KURULUM.md`'nin başlığı ve sürüm notu güncellenir.
3. Paket: `B2B_EKLENTI` içeriği zip'lenir (`B2B_MAGAZA_x.y.z.zip`). Zip `.gitignore`'da, git'e girmez.
4. Mağazaya yükleme ve inceleme gönderimi kullanıcı tarafından yapılır. Bu adım bu skill'de otomatikleşmez.
5. Sürüm sonucu (kabul/red) kullanıcıdan alınıp bu dosyaya not edilir.

## Dikkat
- `.pem` ve `.crx` git'e ve pakete girmez.
- Sürüm artırmadan yapılan kod değişikliği mağazaya gitmez. Kullanıcıya hangi sürümün yüklendiği bildirilir.
