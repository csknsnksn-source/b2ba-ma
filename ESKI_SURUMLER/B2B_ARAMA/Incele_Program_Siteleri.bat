@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo ONCE B2B Arama programini KAPATIN.
echo Chrome daki Basbug, Martas, Dinamik, Rotas, Sayim, Intermobil, Vahdet ve Mest sekmeleri sirayla incelenecek.
echo Yaklasik 2 dakika fare ve klavyeye dokunmayin.
pause
"%PY%" toplu_incele.py 2091042 basbug martas dinamik rotas sayim intermobil vahdet mest
echo.
echo Bitti. Ozet: toplu_ozet.txt
pause
