@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p PY=<python_yolu.txt
"%PY%" program_kopyala.py
pause
