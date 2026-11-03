@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "LOG=%~dp0tani_lepar.txt"

echo ===== TANI %date% %time% ===== > "%LOG%"
echo Klasor: %cd% >> "%LOG%"

echo. >> "%LOG%"
echo ----- python_yolu.txt ----- >> "%LOG%"
if exist python_yolu.txt (type python_yolu.txt >> "%LOG%") else (echo YOK >> "%LOG%")

set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
set "PY=%PY:"=%"
if "%PY%"=="" set "PY=python"

echo. >> "%LOG%"
echo ----- Python surumu ----- >> "%LOG%"
"%PY%" --version >> "%LOG%" 2>&1
echo ----- Playwright ----- >> "%LOG%"
"%PY%" -m pip show playwright >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo ----- Klasordeki dosyalar ----- >> "%LOG%"
dir /b >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo ----- Arama_Incele_Lepar.bat icerigi ----- >> "%LOG%"
if exist Arama_Incele_Lepar.bat (type Arama_Incele_Lepar.bat >> "%LOG%") else (echo YOK >> "%LOG%")
echo ----- arama_incele.py ----- >> "%LOG%"
if exist arama_incele.py (echo VAR >> "%LOG%") else (echo YOK >> "%LOG%")

echo. >> "%LOG%"
echo ----- Calistirma ciktisi ----- >> "%LOG%"

echo.
echo  Lepar inceleme baslatiliyor...
echo  Chrome acilirsa: giris yapin, bir parca aratin,
echo  sonra BU siyah pencereye tiklayip Enter'a basin.
echo  (Bir sey yazmasa da Enter'a basin. Gerekirse iki kez.)
echo.

call Arama_Incele_Lepar.bat >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo ===== BITTI ===== >> "%LOG%"

echo.
echo  Bitti. tani_lepar.txt aciliyor, bu dosyayi Claude'a yukleyin.
start "" notepad "%LOG%"
pause
