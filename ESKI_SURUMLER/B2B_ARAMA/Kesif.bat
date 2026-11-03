@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Altay penceresi haritalaniyor...
"%PY%" kesif.py
echo.
echo Bitti. kesif_cikti.txt olusturuldu.
pause
