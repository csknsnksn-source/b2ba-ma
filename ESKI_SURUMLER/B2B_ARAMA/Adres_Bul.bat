@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Masaustu B2B programlarinin web adresleri gecmis dosyalarindan okunuyor...
echo (Hicbir program acilmaz, hicbir dosya degistirilmez.)
echo.
set "PY="
if exist "python_yolu.txt" set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
"%PY%" servis_bul.py
echo.
echo Bitti. Sonuc: adresler.txt
pause
