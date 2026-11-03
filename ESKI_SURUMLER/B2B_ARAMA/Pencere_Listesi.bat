@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Acik pencereler ve sekmeler listeleniyor (hicbir seye tiklanmaz)...
"%PY%" pencere_listesi.py
echo.
echo Bitti. acik_pencereler.txt olusturuldu.
pause
