@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Chrome daki Lepar sekmesi one getirilip 2091042 aranacak. Yaklasik 15 saniye fare ve klavyeye dokunmayin.
timeout /t 2 >nul
"%PY%" sekme_incele.py Lepar 2091042 lepar
echo.
echo Bitti. sekme_lepar.txt olusturuldu.
pause
