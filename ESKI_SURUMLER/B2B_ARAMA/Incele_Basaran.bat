@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Chrome daki Basaran sekmesinde 2091042 aranacak. 15 saniye dokunmayin.
timeout /t 2 >nul
"%PY%" toplu_incele.py 2091042 basaran
echo.
echo Bitti.
pause
