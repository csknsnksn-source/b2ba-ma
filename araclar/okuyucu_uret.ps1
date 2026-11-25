# B2B firma arama kodu ureticisi (ASCII; Turkce karakter yok, veri dosyalardan okunur)
# Uretir:
#   B2B_EKLENTI_TEST\okuyucular\<firma>.js   (ortak okuyucunun birebir kopyasi, b2b_<firma>_* adlariyla)
#   B2B_EKLENTI_TEST\siteler.js              (okuyucu = firma kodu, tur = eski ortak tur)
#   B2B_EKLENTI_TEST\arama.html              (firma script etiketleri)
#   .claude\skills\firma-<firma>\SKILL.md    (her firma icin)
# Kullanim:
#   powershell -NoProfile -ExecutionPolicy Bypass -File araclar\okuyucu_uret.ps1           (uretir)
#   powershell -NoProfile -ExecutionPolicy Bypass -File araclar\okuyucu_uret.ps1 -Kontrol  (denetler, yazmaz)

param([switch]$Kontrol)
$ErrorActionPreference = 'Stop'

$kok    = Split-Path -Parent $PSScriptRoot
$ekl    = Join-Path $kok 'B2B_EKLENTI_TEST'
$notDir = Join-Path $kok 'FIRMALAR\firmalar'
$skDir  = Join-Path $kok '.claude\skills'
$utf8   = New-Object System.Text.UTF8Encoding($false)

# Turkce harf -> ASCII (kod kimligi icin)
$trMap = @(
    @([string][char]0x0131, 'i'), @([string][char]0x0130, 'i'),
    @([string][char]0x015F, 's'), @([string][char]0x015E, 's'),
    @([string][char]0x011F, 'g'), @([string][char]0x011E, 'g'),
    @([string][char]0x00FC, 'u'), @([string][char]0x00DC, 'u'),
    @([string][char]0x00F6, 'o'), @([string][char]0x00D6, 'o'),
    @([string][char]0x00E7, 'c'), @([string][char]0x00C7, 'c')
)

function Slug([string]$s) {
    foreach ($p in $trMap) { $s = $s.Replace($p[0], $p[1]) }
    $s = $s.ToLowerInvariant()
    return ([regex]::Replace($s, '[^a-z0-9]+', '_')).Trim('_')
}
function Oku([string]$yol) { return ,([IO.File]::ReadAllLines($yol, $utf8)) }
function Metin($satirlar) { return ((@($satirlar)) -join "`n") + "`n" }

# Fonksiyonu kopyalar: ilk satirdaki adi yenisiyle degistirir, govdeye dokunmaz
function Yeniden($satirlar, [string]$eski, [string]$yeni) {
    $out = @($satirlar)
    $out[0] = [regex]::Replace($out[0], '^(async\s+)?function\s+' + [regex]::Escape($eski) + '\s*\(', ('${1}function ' + $yeni + '('))
    return ,$out
}
function Kopya([string]$eski, [string]$yeni) {
    if (-not $fn.ContainsKey($eski)) { throw "Fonksiyon bulunamadi: $eski" }
    return (Yeniden $fn[$eski] $eski $yeni)
}

# ---- 1) okuyucular.js: ust duzey fonksiyonlar ve adlar
$okL = Oku (Join-Path $ekl 'okuyucular.js')
$fn = @{}
$topAd = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $okL.Count; $i++) {
    $l = $okL[$i]
    if ($l -match '^(?:async\s+)?function\s+(\w+)\s*\(') {
        $ad = $matches[1]
        $topAd.Add($ad)
        $acik = ([regex]::Matches($l, '\{')).Count
        $kapali = ([regex]::Matches($l, '\}')).Count
        $j = $i
        if ($acik -ne $kapali -or $acik -eq 0) {
            $j = $i + 1
            while ($j -lt $okL.Count -and $okL[$j] -notmatch '^\}') { $j++ }
        }
        $fn[$ad] = @($okL[$i..$j])
        $i = $j
    } elseif ($l -match '^(?:const|let|var)\s+(\w+)') {
        $topAd.Add($matches[1])
    }
}

# ---- 2) OKUYUCULAR kayit tablosu (tur -> gonder/oku/cfg veya duz fonksiyon)
$regBas = -1; $regSon = -1
for ($i = 0; $i -lt $okL.Count; $i++) {
    if ($regBas -lt 0 -and $okL[$i] -match '^const OKUYUCULAR\s*=') { $regBas = $i; continue }
    if ($regBas -ge 0 -and $okL[$i] -match '^\};') { $regSon = $i; break }
}
if ($regBas -lt 0 -or $regSon -lt 0) { throw 'OKUYUCULAR kaydi bulunamadi' }
$reg = @{}
for ($i = $regBas + 1; $i -lt $regSon; $i++) {
    $l = ($okL[$i] -replace '\s+//.*$', '').TrimEnd()
    if ($l -match '^\s{2}(\w+):\s*(\w+),?$') {
        $reg[$matches[1]] = @{ tek = $matches[2]; g = $null; o = $null; cfg = $null }
        continue
    }
    if ($l -match '^\s{2}(\w+):\s*\{\s*gonder:\s*(\w+),\s*oku:\s*(\w+)(.*)\}\s*,?$') {
        $k = $matches[1]; $g = $matches[2]; $o = $matches[3]; $kalan = $matches[4]
        $cfg = $null
        if ($kalan -match '^,\s*cfg:\s*(\{.*\})\s*$') { $cfg = $matches[1] }
        $reg[$k] = @{ tek = $null; g = $g; o = $o; cfg = $cfg }
    }
}

# ---- 3) siteler.js: firma listesi; okuyucu = firma kodu, tur = eski tur
$siL = Oku (Join-Path $ekl 'siteler.js')
$firmalar = New-Object System.Collections.Generic.List[object]
for ($i = 0; $i -lt $siL.Count; $i++) {
    $l = $siL[$i]
    if ($l -notmatch '^\s*\{ ad: "') { continue }
    $ad = [regex]::Match($l, 'ad: "([^"]+)"').Groups[1].Value
    $v  = [regex]::Match($l, 'okuyucu: "([^"]+)"').Groups[1].Value
    $tm = [regex]::Match($l, 'tur: "([^"]+)"')
    if ($tm.Success) { $t = $tm.Groups[1].Value } else { $t = $v }
    if ($v -eq 'eryaz_b2b_adres') { $t = 'eryaz_b2b' }
    $slug = Slug $ad
    if (-not $tm.Success -and $t -ne 'hazirlaniyor') {
        $siL[$i] = $l -replace 'okuyucu: "[^"]+"', ('okuyucu: "' + $slug + '", tur: "' + $t + '"')
    }
    $oz = $null
    if ($slug -eq 'basdas') { $oz = '{ adresleAra: true }' }
    $firmalar.Add([pscustomobject]@{
        ad      = $ad
        slug    = $slug
        tur     = $t
        ozelCfg = $oz
        desen   = [regex]::Match($l, 'desen: "([^"]+)"').Groups[1].Value
        kisayol = [regex]::Match($l, 'kisayol: "([^"]+)"').Groups[1].Value
        acilis  = [regex]::Match($l, 'acilis: "([^"]+)"').Groups[1].Value
        baslik  = [regex]::Match($l, 'baslik: "([^"]+)"').Groups[1].Value
        ayar    = [regex]::Match($l, 'ayar: (\{[^}]*\})').Groups[1].Value
    })
}

# ---- 4) plan: yazilacak tum dosyalar
$plan = New-Object System.Collections.Generic.List[object]
$uyarilar = New-Object System.Collections.Generic.List[string]
$jsListe = New-Object System.Collections.Generic.List[string]
$sirali = @($firmalar | Sort-Object slug)

foreach ($f in $sirali) {
    $r = $reg[$f.tur]
    if ($null -eq $r) { throw ("Kayitsiz okuyucu turu: {0} ({1})" -f $f.tur, $f.ad) }

    if ($f.tur -ne 'hazirlaniyor') {
        $satirlar = New-Object System.Collections.Generic.List[string]
        $satirlar.Add("// $($f.ad) arama kodu - otomatik uretildi (araclar/okuyucu_uret.ps1), tur: $($f.tur)")
        $satirlar.Add('// Bu dosya ortak okuyucunun BIREBIR kopyasidir. Duzeltme yalnizca bu firmaya yapilir.')
        $satirlar.Add('// Yukleme sirasi: okuyucular.js sonrasi, arama.js oncesi.')
        $satirlar.Add('')
        $sahip = New-Object System.Collections.Generic.List[string]

        if ($null -ne $r.tek) {
            $yeni = "b2b_$($f.slug)_tek"
            $govde = Kopya $r.tek $yeni
            $satirlar.AddRange([string[]]$govde)
            $satirlar.Add('')
            $satirlar.Add("OKUYUCULAR.$($f.slug) = $yeni;")
            $sahip.Add($yeni); $sahip.Add($r.tek)
        } else {
            $gE = "b2b_$($f.slug)_gonder"
            $oE = "b2b_$($f.slug)_oku"
            $satirlar.AddRange([string[]](Kopya $r.g $gE))
            $satirlar.Add('')
            $satirlar.AddRange([string[]](Kopya $r.o $oE))
            $satirlar.Add('')
            $cfgEff = $null
            if ($f.ozelCfg) { $cfgEff = $f.ozelCfg } elseif ($r.cfg) { $cfgEff = $r.cfg }
            $kayit = "OKUYUCULAR.$($f.slug) = { gonder: $gE, oku: $oE"
            if ($cfgEff) { $kayit += ", cfg: $cfgEff" }
            $kayit += ' };'
            $satirlar.Add($kayit)
            $sahip.Add($gE); $sahip.Add($oE); $sahip.Add($r.g); $sahip.Add($r.o)
        }

        $icerik = Metin $satirlar
        # Ortak ust duzey adlara referans var mi? (sayfaya tek basina serilestirilirse kirilir)
        foreach ($ad in ($topAd | Select-Object -Unique)) {
            if ($ad -eq 'OKUYUCULAR' -or $sahip -contains $ad) { continue }
            if ($icerik -match ('\b' + $ad + '\b')) { $uyarilar.Add("UYARI $($f.slug).js: ust duzey ada referans: $ad") }
        }
        $plan.Add(@{ yol = (Join-Path $ekl ('okuyucular\' + $f.slug + '.js')); icerik = $icerik })
        $jsListe.Add($f.slug)
    }

    # Firma skill'i
    $md = Join-Path $notDir ($f.slug + '.md')
    if (Test-Path -LiteralPath $md) { $mdSat = @(Oku $md | Select-Object -Skip 1) } else { $mdSat = @('(Firma notu yok)') }
    $fnTxt = '(yok - okuyucu yazilmadi)'
    $cfgTxt = '(yok)'
    if ($f.tur -ne 'hazirlaniyor') {
        if ($null -ne $r.tek) { $fnTxt = "b2b_$($f.slug)_tek" }
        else { $fnTxt = "b2b_$($f.slug)_gonder, b2b_$($f.slug)_oku" }
        $cE = $f.ozelCfg; if (-not $cE) { $cE = $r.cfg }
        if ($cE) { $cfgTxt = $cE }
    }
    $s = New-Object System.Collections.Generic.List[string]
    $s.Add('---')
    $s.Add("name: firma-$($f.slug)")
    $s.Add("description: $($f.ad) B2B arama kodu ve kurallari (kod dosyasi okuyucular/$($f.slug).js). $($f.ad) ile ilgili arama, fiyat, stok veya sayfa sorununda kullan.")
    $s.Add('---')
    $s.Add('')
    $s.Add("# $($f.ad)")
    $s.Add('')
    $s.Add("- Adres (desen): $($f.desen)")
    $s.Add("- Kisayol (klasordeki ad): $($f.kisayol)")
    $s.Add("- Acilis adresi: $($f.acilis)")
    $s.Add("- Baslik ile bulunur: $($f.baslik)")
    $s.Add("- Okuyucu turu (eski ortak): $($f.tur)")
    $s.Add("- Kod dosyasi: B2B_EKLENTI_TEST/okuyucular/$($f.slug).js")
    $s.Add("- Fonksiyonlar: $fnTxt")
    $s.Add("- Ayar (siteler.js): $($f.ayar)")
    $s.Add("- cfg: $cfgTxt")
    $s.Add('')
    $s.Add('## Firma notu (FIRMALAR/firmalar)')
    $s.AddRange([string[]]$mdSat)
    $s.Add('')
    $s.Add('## Kural')
    $s.Add("Bu firmanin arama kodu okuyucular/$($f.slug).js icindedir. Duzeltme yalnizca bu dosyaya ve bu skill'e yapilir.")
    $s.Add('Ortak okuyucu (okuyucular.js) diger firmalar icin degistirilmez.')
    if ($f.tur -eq 'hazirlaniyor') {
        $s.Add('Okuyucu henuz yazilmadi. Sitede bir parca arayip incele ciktisini al, sonra okuyucu yazilir.')
    } else {
        $s.Add('Sorun varsa incele ciktisini (ekran goruntusu) alip bu skill dosyasina not dus.')
    }
    $plan.Add(@{ yol = (Join-Path $skDir ('firma-' + $f.slug + '\SKILL.md')); icerik = (Metin $s) })
}

# siteler.js
$plan.Add(@{ yol = (Join-Path $ekl 'siteler.js'); icerik = (Metin $siL) })

# arama.html: firma script etiketleri (okuyucular.js sonrasi, arama.js oncesi)
$hL = Oku (Join-Path $ekl 'arama.html')
$yeniHL = New-Object System.Collections.Generic.List[string]
foreach ($h in $hL) {
    if ($h -match 'src="okuyucular/') { continue }
    $yeniHL.Add($h)
    if ($h -match '<script src="okuyucular\.js"></script>') {
        foreach ($s in ($jsListe | Sort-Object)) { $yeniHL.Add("<script src=""okuyucular/$s.js""></script>") }
    }
}
$plan.Add(@{ yol = (Join-Path $ekl 'arama.html'); icerik = (Metin $yeniHL) })

# ---- 5) yaz veya denetle
if (-not $Kontrol) {
    foreach ($p in $plan) {
        $dir = Split-Path -Parent $p.yol
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        [IO.File]::WriteAllText($p.yol, $p.icerik, $utf8)
    }
    Write-Output ("Yazildi: {0} dosya ({1} firma JS, {2} skill)" -f $plan.Count, $jsListe.Count, $sirali.Count)
} else {
    $hata = 0
    foreach ($p in $plan) {
        $rel = $p.yol.Substring($kok.Length + 1)
        if (-not (Test-Path -LiteralPath $p.yol)) { Write-Output "HATA eksik: $rel"; $hata++; continue }
        $disk = [IO.File]::ReadAllText($p.yol, $utf8)
        if ($disk -ne $p.icerik) { Write-Output "HATA elle degistirilmis (yeniden uret): $rel"; $hata++ }
    }
    foreach ($u in $uyarilar) { Write-Output $u }
    Write-Output ("Denetim: {0} dosya kontrol edildi, {1} hata, {2} uyari" -f $plan.Count, $hata, $uyarilar.Count)
    if ($hata -gt 0) { exit 1 }
}
