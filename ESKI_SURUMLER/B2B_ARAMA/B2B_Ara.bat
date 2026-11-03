@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Programi konsol penceresiyle acar (sorun ararken kullanin). Normal kullanim: masaustundeki "B2B Arama".
set "PY="
if exist "python_yolu.txt" set /p PY=<python_yolu.txt
if defined PY if not exist "%PY%" set "PY="
if not defined PY (
  py -3 --version >nul 2>&1
  if not errorlevel 1 set "PY=py -3"
)
if not defined PY (
  python --version >nul 2>&1
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo Python bulunamadi. Once KURULUM.bat dosyasini calistirin.
  pause
  exit /b 1
)
%PY% b2b_ara.py
if errorlevel 1 (
  echo.
  echo Program hata ile kapandi. Ayrinti icin log klasorune bakin.
  pause
)
