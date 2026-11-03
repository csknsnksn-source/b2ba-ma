# ==========================================================
#  B2B ORTAK ARAMA - KURULUM
#  Python ve gerekli paketleri kurar, masaüstüne kısayol oluşturur.
# ==========================================================
$ErrorActionPreference = 'Continue'
$Klasor = Split-Path -Parent $MyInvocation.MyCommand.Path
$Host.UI.RawUI.WindowTitle = "B2B Ortak Arama - Kurulum"

function Baslik($t) { Write-Host ""; Write-Host "  $t" -ForegroundColor Cyan }
function Tamam($t)  { Write-Host "  [OK] $t" -ForegroundColor Green }
function Hata($t)   { Write-Host "  [HATA] $t" -ForegroundColor Red }

function PythonBul {
    $adaylar = @()
    try {
        $p = & py -3 -c "import sys;print(sys.executable)" 2>$null
        if ($LASTEXITCODE -eq 0 -and $p) { $adaylar += $p.Trim() }
    } catch {}
    $adaylar += Get-ChildItem "$env:LOCALAPPDATA\Programs\Python\Python3*\python.exe" -ErrorAction SilentlyContinue |
                Sort-Object FullName -Descending | ForEach-Object FullName
    $adaylar += Get-ChildItem "C:\Program Files\Python3*\python.exe" -ErrorAction SilentlyContinue |
                Sort-Object FullName -Descending | ForEach-Object FullName
    try {
        $w = (Get-Command python -ErrorAction SilentlyContinue).Source
        if ($w -and $w -notmatch 'WindowsApps') { $adaylar += $w }
    } catch {}
    foreach ($a in $adaylar) {
        if ($a -and (Test-Path $a)) {
            $v = & $a -c "import sys;print(sys.version_info[:2]>=(3,9))" 2>$null
            if ($v -eq 'True') { return $a }
        }
    }
    return $null
}

Clear-Host
Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Cyan
Write-Host "       B2B ORTAK ARAMA - KURULUM" -ForegroundColor Cyan
Write-Host "  ==============================================" -ForegroundColor Cyan

# ---------------------------------------------------------- 1) Python
Baslik "1/4  Python kontrol ediliyor..."
$py = PythonBul
if (-not $py) {
    Write-Host "  Python bulunamadı, kuruluyor (birkaç dakika sürebilir)..."
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        & winget install -e --id Python.Python.3.12 --scope user --silent --accept-package-agreements --accept-source-agreements
        $py = PythonBul
    }
    if (-not $py) {
        Hata "Python otomatik kurulamadı."
        Write-Host "  Açılan sayfadan Python'u indirip kurun. Kurulumda 'Add python.exe to PATH' kutusunu işaretleyin."
        Write-Host "  Sonra bu kurulumu tekrar çalıştırın."
        Start-Process "https://www.python.org/downloads/windows/"
        Read-Host "  Kapatmak için Enter"
        exit 1
    }
}
Tamam "Python: $py"

# ---------------------------------------------------------- 2) Paketler
Baslik "2/4  Gerekli paketler kuruluyor (playwright, openpyxl, cryptography, uiautomation)..."
& $py -m pip install --upgrade pip --quiet --disable-pip-version-check 2>$null
& $py -m pip install --upgrade playwright openpyxl cryptography uiautomation --quiet --disable-pip-version-check
if ($LASTEXITCODE -ne 0) {
    Hata "Paketler kurulamadı. İnternet bağlantısını kontrol edip kurulumu tekrar çalıştırın."
    Read-Host "  Kapatmak için Enter"
    exit 1
}
Tamam "Paketler kuruldu"
Write-Host "  Firefox bileşeni kuruluyor (bazı B2B'ler için)..."
& $py -m playwright install firefox
if ($LASTEXITCODE -eq 0) { Tamam "Firefox bileşeni kuruldu" } else { Hata "Firefox bileşeni kurulamadı (sonra FIREFOX_KUR.bat ile kurabilirsiniz)" }

# ---------------------------------------------------------- 3) Tarayıcı
Baslik "3/4  Tarayıcı kontrol ediliyor..."
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chrome) { Tamam "Google Chrome bulundu" }
else { Write-Host "  Chrome bulunamadı, Microsoft Edge kullanılacak." -ForegroundColor Yellow }

# ---------------------------------------------------------- 4) Kısayol
Baslik "4/4  Masaüstüne kısayol oluşturuluyor..."
$pyw = Join-Path (Split-Path $py) "pythonw.exe"
if (-not (Test-Path $pyw)) { $pyw = $py }
try {
    $ws = New-Object -ComObject WScript.Shell
    $masaustu = [Environment]::GetFolderPath('Desktop')
    $lnk = $ws.CreateShortcut((Join-Path $masaustu "B2B Arama.lnk"))
    $lnk.TargetPath = $pyw
    $lnk.Arguments = "`"$Klasor\b2b_ara.py`""
    $lnk.WorkingDirectory = $Klasor
    $lnk.IconLocation = "$Klasor\b2b.ico"
    $lnk.Description = "B2B Ortak Arama"
    $lnk.Save()
    Tamam "Masaüstünde 'B2B Arama' kısayolu oluşturuldu"
} catch {
    Hata "Kısayol oluşturulamadı: $_"
}
[IO.File]::WriteAllText((Join-Path $Klasor "python_yolu.txt"), $py)

Write-Host ""
Write-Host "  ==============================================" -ForegroundColor Green
Write-Host "   KURULUM TAMAMLANDI" -ForegroundColor Green
Write-Host "  ==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Programı masaüstündeki 'B2B Arama' simgesiyle açabilirsiniz."
Write-Host "  İlk açılışta Ayarlar ekranı gelir: B2B şifrelerini oradan"
Write-Host "  (Excel ile toplu ya da tek tek) girin."
Write-Host ""
$cevap = Read-Host "  Programı şimdi açmak ister misiniz? (E/H)"
if ($cevap -match '^[eEyY]') { Start-Process -FilePath $pyw -ArgumentList "`"$Klasor\b2b_ara.py`"" -WorkingDirectory $Klasor }
