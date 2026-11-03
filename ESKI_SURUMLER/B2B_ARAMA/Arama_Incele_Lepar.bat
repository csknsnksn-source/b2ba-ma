@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Lepar sayfasi acilacak.
echo 1) Giris bilgilerinizi KENDINIZ girin.
echo 2) Urun arama kutusunda bir parca aratin.
echo 3) Sonuclar gelince bu pencereye donup Enter basin.
"%PY%" arama_incele.py https://web.lepar.com.tr lepar
echo.
echo Bitti.
pause
