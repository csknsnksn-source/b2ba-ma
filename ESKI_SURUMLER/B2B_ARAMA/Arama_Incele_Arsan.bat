@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Arsan sayfasi acilacak. Giris bilgilerinizi KENDINIZ girip arama sayfasina gelin.
echo Sonra bu pencereye Enter basin.
"%PY%" arama_incele.py https://b2b.arsanmotor.com.tr arsan
echo.
echo Bitti. sonra_arsan.txt olusturuldu.
pause
