@echo off
reg delete "HKCU\Software\Classes\b2bac" /f >nul 2>&1
echo b2bac: adresi kaldirildi.
pause
