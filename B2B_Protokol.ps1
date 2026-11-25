# ==========================================================
#  b2bac: adres isleyicisi (v1.6.0)
#  Eklentideki "kapali - ac" / "Kapalilari ac" dugmeleri bu dosyayi cagirir.
#  Adres: b2bac:<kisayol>|<kisayol>|...   veya   b2bac:tara   veya   b2bac:esle
#  - Kisayol adlari buyuk/kucuk harf, (coşkun) gibi sonekler ve Turkce harfler
#    yok sayilarak eslestirilir.
#  - Eslesmeyen ya da hic eslesmeyen istekler sessizce kapanmaz: log yazilir
#    ve uyari gosterilir.
#  - "tara" komutu: siteler.js ile klasordeki kisayollari karsilastirip
#    kisayol_listesi.txt yazar ve acar.
#  - "esle" komutu: bu bilgisayardaki kisayollari sitelere ve yeni adlara tek ekranda baglar.
#  Guvenlik: yalniz bu klasorde GERCEKTEN bulunan .lnk / .url / .appref-ms
#  kisayollari acilir; baska hicbir dosya veya komut calistirilmaz.
# ==========================================================
param([string]$Adres = '')

Add-Type -AssemblyName System.Windows.Forms

$Klasor    = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogKlasor = Join-Path $Klasor 'log'
New-Item -ItemType Directory -Force -Path $LogKlasor | Out-Null

# Kisayollarin klasoru: bu bilgisayarda bir kez secilip kisayol_ayar.json icinde hatirlanir (yoksa bu dosyanin klasoru)
$AyarJson = Join-Path $Klasor 'kisayol_ayar.json'
$KisayolKlasor = $Klasor
if (Test-Path -LiteralPath $AyarJson) {
    try {
        $ayarNesne = Get-Content -LiteralPath $AyarJson -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($ayarNesne.klasor -and (Test-Path -LiteralPath $ayarNesne.klasor)) { $KisayolKlasor = [string]$ayarNesne.klasor }
    } catch { }
}

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

function Eslesme-Oku {
    # Bu bilgisayara ozel eslesme: site kisayol adi -> kisayol dosya adi ("" = bu sitede kisayol yok)
    $h = @{}
    $p = Join-Path $Klasor 'kisayol_eslesme.json'
    if (Test-Path -LiteralPath $p) {
        try {
            $o = Get-Content -LiteralPath $p -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($pr in $o.PSObject.Properties) { $h[$pr.Name] = [string]$pr.Value }
        } catch { }
    }
    return $h
}

function Eslesme-Yaz([hashtable]$h) {
    $p = Join-Path $Klasor 'kisayol_eslesme.json'
    ($h | ConvertTo-Json) | Set-Content -LiteralPath $p -Encoding UTF8
}

function Json-Oku([string]$dosya) {
    # Klasordeki bir JSON dosyasini sozluge cevirir (yoksa bos)
    $h = @{}
    $p = Join-Path $Klasor $dosya
    if (Test-Path -LiteralPath $p) {
        try {
            $o = Get-Content -LiteralPath $p -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($pr in $o.PSObject.Properties) { $h[$pr.Name] = [string]$pr.Value }
        } catch { }
    }
    return $h
}

function Json-Yaz([string]$dosya, [hashtable]$h) {
    $p = Join-Path $Klasor $dosya
    ($h | ConvertTo-Json) | Set-Content -LiteralPath $p -Encoding UTF8
}

function Kisayol-Sor([string]$istek) {
    # Kisayol bulunamadiginda bir kez dosya sec penceresi acar. Iptal = bu sitede kisayol yok.
    $owner = New-Object System.Windows.Forms.Form
    $owner.TopMost = $true
    $owner.ShowInTaskbar = $true
    $owner.Text = 'B2B Ortak Arama'
    $owner.StartPosition = 'CenterScreen'
    $owner.Show()
    $dlg = New-Object System.Windows.Forms.OpenFileDialog
    $dlg.InitialDirectory = $KisayolKlasor
    $dlg.Filter = 'Kisayollar (*.lnk;*.url;*.appref-ms)|*.lnk;*.url;*.appref-ms'
    $dlg.Title = "'$istek' icin masaustu kisayolunu secin (iptal = bu sitede kisayol yok)"
    $secilen = ''
    if ($dlg.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) {
        $f = Get-Item -LiteralPath $dlg.FileName
        if ((Split-Path -Parent $f.FullName) -eq $KisayolKlasor) { $secilen = $f.BaseName }
    }
    $owner.Close(); $owner.Dispose()
    return $secilen
}

$ham = ($Adres -replace '^b2bac:(//)?', '').TrimEnd('/')
$cozulmus = [System.Uri]::UnescapeDataString($ham).Trim()

$mevcut = @(Get-ChildItem -Path $KisayolKlasor -File | Where-Object { $_.Extension.ToLower() -in '.lnk', '.url', '.appref-ms' })

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
            $eslesmeT = Eslesme-Oku
            $bul = $null
            if ($eslesmeT.ContainsKey($k) -and $eslesmeT[$k] -and ($mevcut.BaseName -contains $eslesmeT[$k])) { $bul = $eslesmeT[$k] }
            else { $bul = Coz $k $mevcut }
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

# ---------------- ESLE: siteleri ve eslesmeyen kisayollari tek ekranda bagla ----------------
if ($cozulmus -eq 'esle') {
    # 1) Kisayollarin klasorunu sec (ayri pencere; kapaninca ana ekran acilir)
    $fb = New-Object System.Windows.Forms.FolderBrowserDialog
    $fb.Description = 'Masaustu kisayollarinizin bulundugu klasoru secin'
    $fb.ShowNewFolderButton = $false
    if (Test-Path -LiteralPath $KisayolKlasor) { $fb.SelectedPath = $KisayolKlasor }
    if ($fb.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $KisayolKlasor = $fb.SelectedPath
        $ayarYaz = @{ klasor = $KisayolKlasor }
        ($ayarYaz | ConvertTo-Json) | Set-Content -LiteralPath $AyarJson -Encoding UTF8
        $mevcut = @(Get-ChildItem -Path $KisayolKlasor -File | Where-Object { $_.Extension.ToLower() -in '.lnk', '.url', '.appref-ms' })
    }
    $fb.Dispose()

    $satirlar = @()
    $siteDosya = Join-Path $Klasor 'B2B_EKLENTI\siteler.js'
    foreach ($l in (Get-Content -LiteralPath $siteDosya -Encoding UTF8)) {
        if ($l -notmatch 'ad: "' -or $l -notmatch 'kisayol: "') { continue }
        $ad = if ($l -match 'ad: "([^"]+)"') { $matches[1] } else { '?' }
        $k  = if ($l -match 'kisayol: "([^"]+)"') { $matches[1] } else { '' }
        if ($k) { $satirlar += ,@($ad, $k) }
    }
    $eslesme = Eslesme-Oku
    $ozel = Json-Oku 'kisayol_ozel.json'
    $ozelTers = @{}   # kisayol dosya adi -> yeni ad
    foreach ($ok in $ozel.Keys) { if ($ozel[$ok]) { $ozelTers[$ozel[$ok]] = $ok } }
    $dosyaSecenekleri = @('') + @($mevcut | ForEach-Object { $_.BaseName } | Sort-Object)
    $siteAdSecenekleri = @('') + @($satirlar | ForEach-Object { $_[0] })

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'B2B kisayol eslestirme'
    $form.Width = 760; $form.Height = 720; $form.StartPosition = 'CenterScreen'; $form.TopMost = $true
    $panel = New-Object System.Windows.Forms.Panel
    $panel.Dock = 'Top'; $panel.Height = 600; $panel.AutoScroll = $true
    $form.Controls.Add($panel)

    # Once hangi dosyalarin bir siteye eslestigini bul
    $eslesenDosyalar = @()
    foreach ($s in $satirlar) {
        if ($eslesme.ContainsKey($s[1])) { $on0 = $eslesme[$s[1]] } else { $on0 = Coz $s[1] $mevcut }
        if ($on0 -and ($mevcut.BaseName -contains $on0)) { $eslesenDosyalar += $on0 }
    }
    $eslesmeyenListe = @($mevcut | Where-Object { $eslesenDosyalar -notcontains $_.BaseName } | ForEach-Object { $_.BaseName } | Sort-Object)

    # 1) ESLESMEYENLER en ustte (kaydirma gerektirmeden gorunur)
    $y = 10
    $baslik2 = New-Object System.Windows.Forms.Label
    $baslik2.Text = 'ESLESMEYEN KISAYOLLAR: ' + $eslesmeyenListe.Count + ' adet. Yanina bir site secin ya da yeni bir ad yazin (bos birakirsaniz kaydedilmez).'
    $baslik2.Left = 10; $baslik2.Top = $y; $baslik2.Width = 680
    $panel.Controls.Add($baslik2); $y += 28

    $ustler = @()
    foreach ($d in $eslesmeyenListe) {
        $lbl = New-Object System.Windows.Forms.Label
        $lbl.Text = $d; $lbl.Left = 10; $lbl.Top = $y + 4; $lbl.Width = 220
        $tb = New-Object System.Windows.Forms.ComboBox
        $tb.DropDownStyle = 'DropDown'; $tb.Left = 240; $tb.Top = $y; $tb.Width = 440
        [void]$tb.Items.AddRange($siteAdSecenekleri)
        if ($ozelTers.ContainsKey($d)) { $tb.Text = $ozelTers[$d] } else { $tb.Text = '' }
        $panel.Controls.AddRange(@($lbl, $tb))
        $ustler += ,@($d, $tb)
        $y += 30
    }

    # 2) SITELER (asagida, kaydirilabilir)
    $y += 20
    $baslik1 = New-Object System.Windows.Forms.Label
    $baslik1.Text = 'SITELER (her site icin listeden kisayolunu secin)'
    $baslik1.Left = 10; $baslik1.Top = $y; $baslik1.Width = 660
    $panel.Controls.Add($baslik1); $y += 28

    $combolar = @()
    foreach ($s in $satirlar) {
        $lbl = New-Object System.Windows.Forms.Label
        $lbl.Text = $s[0]; $lbl.Left = 10; $lbl.Top = $y + 4; $lbl.Width = 220
        $cb = New-Object System.Windows.Forms.ComboBox
        $cb.DropDownStyle = 'DropDownList'; $cb.Left = 240; $cb.Top = $y; $cb.Width = 440
        [void]$cb.Items.AddRange($dosyaSecenekleri)
        if ($eslesme.ContainsKey($s[1])) { $on = $eslesme[$s[1]] } else { $on = Coz $s[1] $mevcut }
        $cb.SelectedIndex = [Math]::Max(0, $cb.Items.IndexOf([string]$on))
        $panel.Controls.AddRange(@($lbl, $cb))
        $combolar += ,@($s[1], $cb)
        $y += 30
    }

    $kaydet = New-Object System.Windows.Forms.Button
    $kaydet.Text = 'Kaydet'; $kaydet.Left = 240; $kaydet.Top = 620; $kaydet.Width = 120
    $kaydet.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.Controls.Add($kaydet)
    $form.AcceptButton = $kaydet

    $iptal = New-Object System.Windows.Forms.Button
    $iptal.Text = 'Iptal'; $iptal.Left = 370; $iptal.Top = 620; $iptal.Width = 120
    $iptal.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($iptal)
    $form.CancelButton = $iptal

    if ($form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $yeniMap = @{}
        foreach ($c in $combolar) { $yeniMap[$c[0]] = [string]$c[1].SelectedItem }
        $yeniOzel = @{}
        foreach ($u in $ustler) {
            $t = $u[1].Text.Trim()
            if (-not $t) { continue }
            $site = @($satirlar | Where-Object { $_[0] -eq $t })[0]
            if ($site) { $yeniMap[$site[1]] = $u[0] }     # bir siteye atandi
            else { $yeniOzel[$t] = $u[0] }                 # yeni ad olarak kaydedildi
        }
        Eslesme-Yaz $yeniMap
        Json-Yaz 'kisayol_ozel.json' $yeniOzel
        [void][System.Windows.Forms.MessageBox]::Show('Eslestirme kaydedildi.', 'B2B Ortak Arama')
    }
    $form.Dispose()
    exit 0
}

# ---------------- AC ----------------
$adlar = @()
$bulunamayan = @()
$eslesme = Eslesme-Oku
$eslesmeDegisti = $false
foreach ($a in ($cozulmus -split '\|')) {
    $a = $a.Trim()
    if (-not $a) { continue }
    if ($a -match '[\\/:*?"<>]') { continue }          # yol / ozel karakter kabul edilmez
    # 1) Bu bilgisayar icin daha once kaydedilmis eslesme
    if ($eslesme.ContainsKey($a)) {
        $kayitli = $eslesme[$a]
        if (-not $kayitli) { continue }                 # daha once "yok" secildi, tekrar sorma
        if ($mevcut.BaseName -contains $kayitli) { if ($adlar -notcontains $kayitli) { $adlar += $kayitli }; continue }
    }
    # 2) Ad benzerligiyle bul
    $b = Coz $a $mevcut
    # 3) Hic bulunamadiysa bir kez dosya sec, sonucu bu bilgisayar icin kaydet
    if (-not $b) {
        $b = Kisayol-Sor $a
        $eslesme[$a] = $b
        $eslesmeDegisti = $true
        if (-not $b) { continue }
    }
    if ($b) { if ($adlar -notcontains $b) { $adlar += $b } }
    else { $bulunamayan += $a }
}
if ($eslesmeDegisti) { Eslesme-Yaz $eslesme }

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

& (Join-Path $Klasor 'B2B_Ac.ps1') -Sadece ($adlar -join '|') -KisayolKlasor $KisayolKlasor
