# ==========================================================
#  b2bac: adres isleyicisi (v1.5.0)
#  Eklentideki "kapali - ac" / "Kapalilari ac" dugmeleri bu dosyayi cagirir.
#  Adres: b2bac:<kisayol>|<kisayol>|...   veya   b2bac:tara
#  - Kisayol adlari buyuk/kucuk harf, (coşkun) gibi sonekler ve Turkce harfler
#    yok sayilarak eslestirilir.
#  - Eslesmeyen ya da hic eslesmeyen istekler sessizce kapanmaz: log yazilir
#    ve uyari gosterilir.
#  - "tara" komutu: siteler.js ile klasordeki kisayollari karsilastirip
#    kisayol_listesi.txt yazar ve acar.
#  Guvenlik: yalniz bu klasorde GERCEKTEN bulunan .lnk / .url / .appref-ms
#  kisayollari acilir; baska hicbir dosya veya komut calistirilmaz.
# ==========================================================
param([string]$Adres = '')

Add-Type -AssemblyName System.Windows.Forms

$Klasor    = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogKlasor = Join-Path $Klasor 'log'
New-Item -ItemType Directory -Force -Path $LogKlasor | Out-Null

function Norm([string]$s) {
    # Ad karsilastirma anahtari: parantez sonekini at, Turkce I/i farkini kapat, harf-rakam disindakileri at
    $s = $s -replace '\\u00a0', ' '
    $s = $s -replace '\([^)]*\)', ''
    $s = $s.Replace([string][char]0x0130, 'i').Replace([string][char]0x0131, 'i').Replace('I', 'i')
    $s = $s.ToLowerInvariant()
    return -join ($s.ToCharArray() | Where-Object { [char]::IsLetterOrDigit($_) })
}

function Coz([string]$istek, $liste) {
    # Istegi klasordeki gercek kisayol adina cevirir. Yoksa $null.
    $n = Norm $istek
    if (-not $n) { return $null }
    $tam = @($liste | Where-Object { (Norm $_.BaseName) -eq $n })
    if ($tam.Count -ge 1) { return $tam[0].BaseName }
    $ic = @($liste | Where-Object { $m = Norm $_.BaseName; $m -and ($m.Contains($n) -or $n.Contains($m)) })
    if ($ic.Count -eq 1) { return $ic[0].BaseName }
    return $null
}

$ham = ($Adres -replace '^b2bac:(//)?', '').TrimEnd('/')
$cozulmus = [System.Uri]::UnescapeDataString($ham).Trim()

$mevcut = @(Get-ChildItem -Path $Klasor -File | Where-Object { $_.Extension.ToLower() -in '.lnk', '.url', '.appref-ms' })

# ---------------- TARA: siteler.js ile klasoru karsilastir ----------------
if ($cozulmus -eq 'tara') {
    $rapor = @()
    $rapor += "B2B KISAYOL TARAMASI - " + (Get-Date -Format 'dd.MM.yyyy HH:mm')
    $rapor += "Klasor: $Klasor"
    $rapor += ""
    $rapor += "SITE                 ->  KLASORDEKI KISAYOL"
    $kullanilan = @()
    $siteDosya = Join-Path $Klasor 'B2B_EKLENTI\siteler.js'
    if (Test-Path -LiteralPath $siteDosya) {
        foreach ($l in (Get-Content -LiteralPath $siteDosya -Encoding UTF8)) {
            if ($l -notmatch 'ad: "' -or $l -notmatch 'kisayol: "') { continue }
            $ad = if ($l -match 'ad: "([^"]+)"') { $matches[1] } else { '?' }
            $k  = if ($l -match 'kisayol: "([^"]+)"') { $matches[1] } else { '' }
            $bul = Coz $k $mevcut
            if ($bul) {
                $kullanilan += $bul
                $rapor += ("{0,-20} ->  {1}" -f $ad, $bul)
            } else {
                $rapor += ("{0,-20} ->  BULUNAMADI  (aranan: {1})" -f $ad, $k)
            }
        }
    } else {
        $rapor += "UYARI: B2B_EKLENTI\siteler.js bulunamadi; yalnizca klasor listelenecek."
    }
    $rapor += ""
    $rapor += "Klasorde olup hicbir siteye eslesmeyen kisayollar:"
    foreach ($f in $mevcut) { if ($kullanilan -notcontains $f.BaseName) { $rapor += "  " + $f.BaseName } }
    $hedef = Join-Path $Klasor 'kisayol_listesi.txt'
    Set-Content -LiteralPath $hedef -Value $rapor -Encoding UTF8
    Start-Process notepad.exe -ArgumentList "`"$hedef`""
    exit 0
}

# ---------------- AC ----------------
$adlar = @()
$bulunamayan = @()
foreach ($a in ($cozulmus -split '\|')) {
    $a = $a.Trim()
    if (-not $a) { continue }
    if ($a -match '[\\/:*?"<>]') { continue }          # yol / ozel karakter kabul edilmez
    $b = Coz $a $mevcut
    if ($b) { if ($adlar -notcontains $b) { $adlar += $b } }
    else { $bulunamayan += $a }
}

$log = Join-Path $LogKlasor ("eklenti_" + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss') + ".txt")
Add-Content -LiteralPath $log -Encoding UTF8 -Value ("Istek: " + $cozulmus)
Add-Content -LiteralPath $log -Encoding UTF8 -Value ("Bulunan: " + ($adlar -join ' | '))
Add-Content -LiteralPath $log -Encoding UTF8 -Value ("Bulunamayan: " + ($bulunamayan -join ' | '))

if ($adlar.Count -eq 0) {
    $mesaj = "Bu kisayollar klasorde bulunamadi:`n`n" + ($bulunamayan -join "`n") +
             "`n`nKisayol listesi icin eklentide 'Kisayollari tara' dugmesine basin."
    [void][System.Windows.Forms.MessageBox]::Show($mesaj, 'B2B Ortak Arama',
        [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
    exit 0
}

& (Join-Path $Klasor 'B2B_Ac.ps1') -Sadece ($adlar -join '|')
