@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Chrome daki TUM B2B sekmeleri sirayla incelenecek (yaklasik 12 dakika). Bu surede fare ve klavyeye dokunmayin.
timeout /t 3 >nul
"%PY%" toplu_incele.py 2091042
echo.
echo Bitti. Ozet: toplu_ozet.txt
pause
