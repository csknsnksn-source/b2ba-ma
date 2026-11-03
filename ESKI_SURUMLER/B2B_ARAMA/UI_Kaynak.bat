@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Altay Firefox sayfasinin kaynagi kopyalanacak. Yaklasik 15 saniye klavye ve fareye dokunmayin.
timeout /t 2 >nul
"%PY%" ui_kaynak.py
echo.
echo Bitti. ui_kaynak.txt ve ui_kaynak.html olusturuldu.
pause
