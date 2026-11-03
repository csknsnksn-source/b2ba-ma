@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Altay penceresinde 2091042 aranacak ve 13 satirin fiyat ustune gelinecek. Yaklasik 40 saniye fareye dokunmayin.
timeout /t 2 >nul
"%PY%" ui_fiyat_test.py 2091042 13
echo.
echo Bitti. ui_fiyat.txt olusturuldu.
pause
