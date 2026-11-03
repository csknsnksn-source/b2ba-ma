@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PY="
if exist python_yolu.txt set /p PY=<python_yolu.txt
if not defined PY set "PY=py"
echo Askar giris sayfasi acilacak ve incelenecek. Acilan pencereye dokunmayin, birkac saniye bekleyin.
"%PY%" giris_incele.py https://b2b.askarauto.com/login.aspx askar
echo.
echo Bitti. giris_askar.txt olusturuldu.
pause
