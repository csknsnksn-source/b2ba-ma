@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Altay penceresinde arama denenecek (2091042). Baska sey yapmayin, pencereler oynayabilir.
timeout /t 2 >nul
"%PY%" ui_test.py 2091042
echo.
echo Bitti. ui_test.txt olusturuldu.
pause
