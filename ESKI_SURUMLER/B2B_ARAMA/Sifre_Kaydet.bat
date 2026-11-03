@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
py -3 --version >nul 2>&1
if not errorlevel 1 set "PY=py -3"
if not defined PY (
  python --version >nul 2>&1
  if not errorlevel 1 set "PY=python"
)
if not defined PY (
  echo Python bulunamadi. Once kur.bat dosyasini calistirin.
  pause
  exit /b 1
)
%PY% sifre_kaydet.py
pause
