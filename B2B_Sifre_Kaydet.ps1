# ==========================================================
#  B2B SIFRE KAYDETME
#  Sifreler Windows'un kendi sifrelemesiyle (DPAPI) saklanir.
#  Sadece bu bilgisayarda, bu Windows kullanicisiyla okunabilir.
# ==========================================================
$Klasor      = Split-Path -Parent $MyInvocation.MyCommand.Path
$SifreKlasor = Join-Path $Klasor 'sifreler'
New-Item -ItemType Directory -Force -Path $SifreKlasor | Out-Null

$dosyalar = @(Get-ChildItem -Path $Klasor -File |
              Where-Object { $_.Extension.ToLower() -in '.lnk', '.url', '.appref-ms' } |
              Sort-Object Name)

while ($true) {
    Write-Host ""
    Write-Host "=== B2B PROGRAMLARI ==="
    for ($i = 0; $i -lt $dosyalar.Count; $i++) {
        $ad  = $dosyalar[$i].BaseName
        $var = if (Test-Path -LiteralPath (Join-Path $SifreKlasor ($ad + '.sifre'))) { '[sifre kayitli]' } else { '' }
        Write-Host ("{0,3}) {1}  {2}" -f ($i + 1), $ad, $var)
    }
    Write-Host ""
    $sec = Read-Host "Sifresini kaydetmek istediginiz programin numarasi (cikmak icin bos birakip Enter)"
    if ([string]::IsNullOrWhiteSpace($sec)) { break }

    $n = 0
    if (-not [int]::TryParse($sec, [ref]$n) -or $n -lt 1 -or $n -gt $dosyalar.Count) {
        Write-Host "Gecersiz numara." -ForegroundColor Red
        continue
    }
    $ad = $dosyalar[$n - 1].BaseName
    $ss = Read-Host "$ad icin sifre" -AsSecureString
    $ss | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $SifreKlasor ($ad + '.sifre'))
    Write-Host "Kaydedildi (sifreli)." -ForegroundColor Green
}
