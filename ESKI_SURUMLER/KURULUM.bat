@echo off
rem ==========================================================
rem  B2B ORTAK ARAMA - KURULUM (yeni bilgisayar icin)
rem  Bu dosyayi, B2B kisayollarinin bulundugu klasore (orn. Masaustu\PROGRAM OLANLAR)
rem  zip'in icindekilerle birlikte cikartip calistirin.
rem ==========================================================
setlocal
set "KLASOR=%~dp0"
set "EKLENTI=%KLASOR%B2B_EKLENTI"
echo.
echo  B2B ORTAK ARAMA KURULUMU
echo  Klasor: %KLASOR%
echo.
if not exist "%EKLENTI%\manifest.json" (
  echo  HATA: B2B_EKLENTI klasoru bulunamadi. Zip'in tamamini bu klasore cikartin.
  pause
  exit /b 1
)
set "KISAYOL="
for %%F in ("%KLASOR%*.lnk" "%KLASOR%*.appref-ms" "%KLASOR%*.url") do set "KISAYOL=1"
if not defined KISAYOL (
  echo  UYARI: Bu klasorde B2B kisayolu yok. "Kapali - ac" dugmeleri calismaz.
  echo  Dosyalari B2B kisayollarinin oldugu klasore tasiyip tekrar calistirmaniz onerilir.
  echo.
)
rem --- 1) Kisayol acma adresi (b2bac:) - yalniz bu Windows kullanicisi icin
reg add "HKCU\Software\Classes\b2bac" /ve /d "URL:B2B Kisayol Ac" /f >nul
reg add "HKCU\Software\Classes\b2bac" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\b2bac\shell\open\command" /ve /d "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File \"%KLASOR%B2B_Protokol.ps1\" \"%%1\"" /f >nul
echo  [1/3] Kisayol acma ozelligi kuruldu.
rem --- 2) Eklenti klasorunun yolunu panoya kopyala
<nul set /p "=%EKLENTI%" | clip
echo  [2/3] Eklenti klasorunun yolu panoya kopyalandi:
echo        %EKLENTI%
rem --- 3) Chrome uzanti sayfasini ac
start "" chrome "chrome://extensions/"
echo  [3/3] Chrome'da Uzantilar sayfasi acildi. Simdi sunlari yapin:
echo.
echo     a) Sag ustte "Gelistirici modu"nu ACIN.
echo     b) Sol ustte "Paketlenmemis oge yukle"ye basin.
echo     c) Acilan pencerede ust adres kutusuna Ctrl+V yapip Enter'a basin,
echo        sonra "Klasor sec"e basin.
echo     d) Yapboz simgesinden "B2B Ortak Arama"yi raptiye ile sabitleyin.
echo.
echo  Not: Eklentiyi, B2B sitelerine giris yaptiginiz Chrome PROFILINE kurun.
echo  Chrome acilmadiysa adres cubuguna chrome://extensions yazin.
echo  Ayrintilar: KURULUM.md
echo.
pause
