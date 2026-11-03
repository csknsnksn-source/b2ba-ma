# ==========================================================
#  B2B OTOMATIK BASLATICI + OTOMATIK GIRIS
#  - Klasordeki .lnk / .url / .appref-ms dosyalarini sirayla acar
#  - Giris ekranina tuslari (Enter, kullanici, sifre) kendisi gonderir
#  - Acilamayan / giris yapilamayanlari log dosyasina yazar
#  Ayarlar: ayarlar.csv  (ilk calistirmada otomatik olusur)
#  Sifreler: B2B_Sifre_Kaydet.bat ile sifreli kaydedilir
# ==========================================================
param(
    [int]$AraBekleme = 3,  # iki program arasi ekstra bekleme (saniye)
    [string]$Sadece = ''   # bos degilse yalniz bu kisayollar acilir (ad|ad|ad, uzantisiz)
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Windows.Forms

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class B2BWin {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);

    public static string Title(IntPtr h) { var sb = new StringBuilder(512); GetWindowText(h, sb, 512); return sb.ToString(); }
    public static string Cls(IntPtr h)   { var sb = new StringBuilder(256); GetClassName(h, sb, 256); return sb.ToString(); }

    public static bool Focus(IntPtr h) {
        if (IsIconic(h)) ShowWindow(h, 9);
        IntPtr fg = GetForegroundWindow();
        uint pid;
        uint fgThread = GetWindowThreadProcessId(fg, out pid);
        uint me = GetCurrentThreadId();
        if (fgThread != 0 && fgThread != me) AttachThreadInput(me, fgThread, true);
        BringWindowToTop(h);
        SetForegroundWindow(h);
        if (fgThread != 0 && fgThread != me) AttachThreadInput(me, fgThread, false);
        return GetForegroundWindow() == h;
    }
}
"@

$Klasor      = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogKlasor   = Join-Path $Klasor 'log'
$SifreKlasor = Join-Path $Klasor 'sifreler'
$AyarDosya   = Join-Path $Klasor 'ayarlar.csv'
New-Item -ItemType Directory -Force -Path $LogKlasor | Out-Null
$LogDosya = Join-Path $LogKlasor ("B2B_" + (Get-Date -Format 'yyyy-MM-dd_HH-mm') + ".txt")

function Log([string]$m) {
    $s = "[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $m
    Write-Host $s
    Add-Content -Path $LogDosya -Value $s -Encoding UTF8
}

# Web sitesi ayakta mi? (401/403 gibi cevaplar = site calisiyor sayilir)
function SiteKontrol([string]$url) {
    try {
        Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 5 | Out-Null
        return $null
    } catch {
        if ($_.Exception.Response) { return $null }
        return $_.Exception.Message
    }
}

# Acik pencerelerin listesi (yeni acilan pencereyi bulmak icin)
function AcikPencereler {
    $liste = @()
    foreach ($p in (Get-Process -ErrorAction SilentlyContinue)) {
        try { if ($p.MainWindowHandle -ne [IntPtr]::Zero) { $liste += [int64]$p.MainWindowHandle } } catch {}
    }
    return $liste
}

# SendKeys ozel karakterlerini kacir (sifrede + ^ % ~ ( ) { } [ ] varsa)
function Kacis([string]$t) {
    if (-not $t) { return '' }
    return [regex]::Replace($t, '[+^%~(){}\[\]]', { param($m) '{' + $m.Value + '}' })
}

function SifreOku([string]$ad) {
    $yol = Join-Path $SifreKlasor ($ad + '.sifre')
    if (-not (Test-Path -LiteralPath $yol)) { return $null }
    $ss = (Get-Content -LiteralPath $yol -Raw).Trim() | ConvertTo-SecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ss)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

# Tus dizisini gonderir. [BEKLE3] = 3 saniye bekle
function TusGonder([string]$tuslar, [string]$kul, [string]$sif) {
    $parcalar = [regex]::Split($tuslar, '(\[BEKLE\d+\])')
    foreach ($p in $parcalar) {
        if (-not $p) { continue }
        if ($p -match '^\[BEKLE(\d+)\]$') { Start-Sleep -Seconds ([int]$matches[1]); continue }
        $s = $p.Replace('{KULLANICI}', (Kacis $kul)).Replace('{SIFRE}', (Kacis $sif))
        [System.Windows.Forms.SendKeys]::SendWait($s)
        Start-Sleep -Milliseconds 300
    }
}

# ---------------- KISAYOLLAR ----------------
$dosyalar = @(Get-ChildItem -Path $Klasor -File |
              Where-Object { $_.Extension.ToLower() -in '.lnk', '.url', '.appref-ms' } |
              Sort-Object Name)
if ($Sadece) {
    $istenen = @($Sadece -split '\|' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $dosyalar = @($dosyalar | Where-Object { $istenen -contains $_.BaseName.Trim() })
}

# ---------------- AYARLAR ----------------
$ayarlar = @()
if (Test-Path -LiteralPath $AyarDosya) {
    $ayarlar = @(Import-Csv -LiteralPath $AyarDosya -Delimiter ';' -Encoding UTF8)
}
$eklendi = $false
foreach ($f in $dosyalar) {
    if (-not ($ayarlar | Where-Object { $_.Kisayol -eq $f.BaseName })) {
        $ayarlar += [pscustomobject]@{ Kisayol = $f.BaseName; Bekleme = '15'; Tuslar = '{ENTER}'; Kullanici = '' }
        $eklendi = $true
    }
}
if ($eklendi) {
    $ayarlar | Export-Csv -LiteralPath $AyarDosya -Delimiter ';' -Encoding UTF8 -NoTypeInformation
}

Log "=== B2B baslatma basladi - $($dosyalar.Count) kisayol bulundu ==="
Log "Klasor: $Klasor"
Log "NOT: Islem bitene kadar fare ve klavyeye dokunmayin."

$shell    = New-Object -ComObject WScript.Shell
$basarili = @()
$uyarili  = @()
$hatali   = @()

foreach ($f in $dosyalar) {
    $ad   = $f.BaseName
    $ayar = $ayarlar | Where-Object { $_.Kisayol -eq $ad } | Select-Object -First 1
    $bek  = 8; [void][int]::TryParse([string]$ayar.Bekleme, [ref]$bek)
    $tuslar = [string]$ayar.Tuslar

    Log "Aciliyor: $ad"
    try {
        $once = AcikPencereler
        $proc = $null

        # ---- 1) PROGRAMI AC ----
        switch ($f.Extension.ToLower()) {
            '.lnk' {
                $k = $shell.CreateShortcut($f.FullName)
                $hedef = $k.TargetPath
                if ([string]::IsNullOrWhiteSpace($hedef)) {
                    Start-Process -FilePath $f.FullName
                } else {
                    if (-not (Test-Path -LiteralPath $hedef)) {
                        throw "Kisayolun hedefi bulunamadi (program silinmis/tasinmis olabilir): $hedef"
                    }
                    $p = @{ FilePath = $hedef; PassThru = $true }
                    if ($k.Arguments) { $p.ArgumentList = $k.Arguments }
                    if ($k.WorkingDirectory -and (Test-Path -LiteralPath $k.WorkingDirectory)) {
                        $p.WorkingDirectory = $k.WorkingDirectory
                    }
                    $proc = Start-Process @p
                }
            }
            '.url' {
                $satir = Get-Content -LiteralPath $f.FullName | Where-Object { $_ -match '^\s*URL=' } | Select-Object -First 1
                $url = ($satir -replace '^\s*URL=', '').Trim()
                if (-not $url) { throw ".url dosyasinda adres yok" }
                if ($url -match '^https?://') {
                    $hata = SiteKontrol $url
                    if ($hata) { throw "Siteye ulasilamadi ($url): $hata" }
                }
                Start-Process $url
            }
            '.appref-ms' {
                Start-Process -FilePath $f.FullName
            }
        }

        # ---- 2) GIRIS EKRANINI BEKLE ----
        Log "   Giris ekrani icin $bek sn bekleniyor..."
        Start-Sleep -Seconds $bek

        if ($proc -and $proc.HasExited -and $proc.ExitCode -ne 0) {
            throw "Program acildi ama hemen kapandi. Cikis kodu: $($proc.ExitCode)"
        }

        if ([string]::IsNullOrWhiteSpace($tuslar)) {
            Log "   OK  : $ad (tus gonderilmedi - ayarlarda Tuslar bos)"
            $basarili += $ad
            Start-Sleep -Seconds $AraBekleme
            continue
        }

        # ---- 3) PENCEREYI BUL ----
        $h = [IntPtr]::Zero
        if ($proc -and -not $proc.HasExited) {
            $proc.Refresh()
            if ($proc.MainWindowHandle -ne [IntPtr]::Zero) { $h = $proc.MainWindowHandle }
        }
        if ($h -eq [IntPtr]::Zero) {
            $yeni = AcikPencereler | Where-Object { $once -notcontains $_ } | Select-Object -Last 1
            if ($yeni) { $h = [IntPtr]$yeni }
        }
        if ($h -eq [IntPtr]::Zero) { $h = [B2BWin]::GetForegroundWindow() }

        $sinif  = [B2BWin]::Cls($h)
        $baslik = [B2BWin]::Title($h)
        if ($h -eq [IntPtr]::Zero -or $sinif -in 'Progman', 'WorkerW', 'Shell_TrayWnd' -or [string]::IsNullOrWhiteSpace($baslik)) {
            throw "Giris penceresi bulunamadi ($bek sn icinde acilmamis olabilir - ayarlar.csv'de Bekleme suresini artirin)"
        }
        Log "   Pencere: $baslik"

        if (-not [B2BWin]::Focus($h)) {
            throw "Pencere one getirilemedi: $baslik"
        }
        Start-Sleep -Milliseconds 500

        # ---- 4) KULLANICI / SIFRE / ENTER ----
        $kul = [string]$ayar.Kullanici
        $sif = $null
        if ($tuslar -match '\{SIFRE\}') {
            $sif = SifreOku $ad
            if (-not $sif) { throw "Sifre kayitli degil. B2B_Sifre_Kaydet.bat ile '$ad' icin sifre kaydedin." }
        }
        if ($tuslar -match '\{KULLANICI\}' -and -not $kul) {
            throw "ayarlar.csv'de '$ad' icin Kullanici bos."
        }
        TusGonder $tuslar $kul $sif
        $sif = $null

        # ---- 5) GIRIS OLDU MU? (pencere degisti mi) ----
        Start-Sleep -Seconds 5
        $sonra = if ([B2BWin]::IsWindow($h)) { [B2BWin]::Title($h) } else { '(giris penceresi kapandi)' }
        if ($sonra -eq $baslik) {
            Log "   UYARI: $ad -> Tuslar gonderildi ama pencere degismedi. Giris basarisiz olmus olabilir, kontrol edin."
            $uyarili += [pscustomobject]@{ Program = $ad; Hata = "Giris sonrasi pencere degismedi ($baslik)" }
        } else {
            Log "   OK  : $ad (giris yapildi -> $sonra)"
            $basarili += $ad
        }
    }
    catch {
        $msj = $_.Exception.Message
        Log "   HATA: $ad -> $msj"
        $hatali += [pscustomobject]@{ Program = $ad; Hata = $msj }
    }
    Start-Sleep -Seconds $AraBekleme
}

# ---------------- OZET ----------------
Log ""
Log "=== OZET ==="
Log "Basarili : $($basarili.Count)"
Log "Uyarili  : $($uyarili.Count)"
Log "Hatali   : $($hatali.Count)"
if ($uyarili.Count -gt 0) {
    Log "--- KONTROL EDILMESI GEREKENLER ---"
    foreach ($h in $uyarili) { Log (" - {0} : {1}" -f $h.Program, $h.Hata) }
}
if ($hatali.Count -gt 0) {
    Log "--- ACILAMAYANLAR ---"
    foreach ($h in $hatali) { Log (" - {0} : {1}" -f $h.Program, $h.Hata) }
}
Log "Log dosyasi: $LogDosya"
if ($hatali.Count -gt 0 -or $uyarili.Count -gt 0) {
    Start-Process notepad.exe -ArgumentList "`"$LogDosya`""
}
