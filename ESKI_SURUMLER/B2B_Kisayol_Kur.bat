@echo off
rem ==========================================================
rem  B2B eklentisinin masaustu kisayollarini acabilmesi icin
rem  "b2bac:" adresini bu klasordeki B2B_Protokol.ps1 dosyasina baglar.
rem  Yalniz sizin Windows kullaniciniz icin kaydedilir (yonetici gerekmez).
rem  Bir kez calistirmaniz yeterli. Klasoru tasirsaniz tekrar calistirin.
rem  Kaldirmak icin: B2B_Kisayol_Kaldir.bat
rem ==========================================================
set "PS1=%~dp0B2B_Protokol.ps1"
if not exist "%PS1%" (
  echo B2B_Protokol.ps1 bulunamadi. Bu dosya ile ayni klasorde olmali.
  pause
  exit /b 1
)
reg add "HKCU\Software\Classes\b2bac" /ve /d "URL:B2B Kisayol Ac" /f >nul
reg add "HKCU\Software\Classes\b2bac" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\b2bac\shell\open\command" /ve /d "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File \"%PS1%\" \"%%1\"" /f >nul
if errorlevel 1 (
  echo Kayit yapilamadi.
) else (
  echo Tamam. B2B Arama ekranindaki "kapali - ac" ve "Kapalilari ac" dugmeleri artik kisayollari acar.
  echo Chrome ilk seferde "B2B Kisayol Ac acilsin mi?" diye soracak: "Her zaman izin ver" isaretleyip Ac deyin.
)
pause
