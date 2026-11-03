@echo off
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if defined PY set "PY=%PY:"=%"
if not defined PY set "PY=python"
echo Lepar testi basliyor...
echo.
"%PY%" lepar_test.py
if exist lepar_test_sonuc.txt start "" notepad lepar_test_sonuc.txt
echo.
echo Bitti. Kapatmak icin bir tusa basin.
pause >nul
