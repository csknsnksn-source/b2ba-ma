# B2B açılış yöntemi tespiti (yalnızca okur, açma yapmaz).
# Kısayol klasöründeki her .lnk dosyasının hedefine bakar:
#   hedef chrome.exe / msedge.exe ise  -> "chrome"
#   başka bir .exe ise                 -> "pencere" (masaüstü programı)
# Sonucu bu betiğin klasöründe acilis_ayar.json olarak yazar (git'e girmez).
# Önceden elle verilmiş "elle" alanı varsa tespit onu ezmez.
#
# Kullanım:  powershell -NoProfile -ExecutionPolicy Bypass -File B2B_Acilis_Tespit.ps1 [-Klasor "yol"]

param([string]$Klasor = "")

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$cikti = Join-Path $base 'acilis_ayar.json'

if (-not $Klasor) {
    $ayar = Join-Path $base 'kisayol_ayar.json'
    if (Test-Path -LiteralPath $ayar) {
        $Klasor = (Get-Content -LiteralPath $ayar -Raw -Encoding UTF8 | ConvertFrom-Json).klasor
    }
}
if (-not $Klasor -or -not (Test-Path -LiteralPath $Klasor)) { $Klasor = $base }

# Önceki elle düzeltmeleri koru
$elle = @{}
if (Test-Path -LiteralPath $cikti) {
    try {
        foreach ($e in (Get-Content -LiteralPath $cikti -Raw -Encoding UTF8 | ConvertFrom-Json)) {
            if ($e.elle) { $elle[$e.kisayol] = $e.elle }
        }
    } catch { }
}

$wsh = New-Object -ComObject WScript.Shell
$liste = @()
foreach ($f in Get-ChildItem -LiteralPath $Klasor -Filter *.lnk) {
    $s = $wsh.CreateShortcut($f.FullName)
    $hedef = [string]$s.TargetPath
    $arg = [string]$s.Arguments
    $url = ''
    if ($arg -match 'https?://\S+') { $url = $matches[0] }

    # chrome_proxy.exe / msedge_proxy.exe: Chrome/Edge uygulama (PWA) kısayolları
    if ($hedef -match '(chrome|msedge)(_proxy)?\.exe$') { $yontem = 'chrome' } else { $yontem = 'pencere' }
    $ad = $f.BaseName
    if ($elle.ContainsKey($ad)) { $eleAlan = $elle[$ad] } else { $eleAlan = '' }
    # Elle verilen yöntem tespitin önüne geçer
    if ($eleAlan -in @('chrome', 'pencere')) { $yontem = $eleAlan }

    $liste += [pscustomobject]@{
        kisayol = $ad
        yontem  = $yontem
        url     = $url
        elle    = $eleAlan
    }
}

$liste | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $cikti -Encoding UTF8
Write-Output ("{0} kısayol tarandı -> {1}" -f $liste.Count, $cikti)
