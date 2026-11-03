@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Chrome daki Lepar sekmesinde 2091042 aranacak. 15 saniye dokunmayin.
timeout /t 2 >nul
"%PY%" chrome_ui.py ara Lepar 2091042 lepar > chrome_ui_test.txt 2>&1
type chrome_ui_test.txt
echo.
echo Bitti.
pause
