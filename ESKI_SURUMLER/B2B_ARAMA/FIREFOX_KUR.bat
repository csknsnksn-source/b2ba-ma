@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p PY=<python_yolu.txt
echo Firefox (Playwright) kuruluyor, birkac dakika surebilir...
"%PY%" -m playwright install firefox
if errorlevel 1 (echo HATA: Firefox kurulamadi) else (echo TAMAM: Firefox kuruldu. B2B Arama programini kapatip acin.)
pause
