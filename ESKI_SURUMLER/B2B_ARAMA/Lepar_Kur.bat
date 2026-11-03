@echo off
cd /d "%~dp0"
echo.
echo  LEPAR KURULUMU
echo  ==============
if not exist b2b_ara_yeni.py (echo  HATA: b2b_ara_yeni.py bu klasorde yok. & goto son)
if not exist siteler_yeni.json (echo  HATA: siteler_yeni.json bu klasorde yok. & goto son)
tasklist /fi "imagename eq python.exe" 2>nul | find /i "python.exe" >nul && echo  UYARI: Program acik gorunuyor. Once B2B Arama penceresini kapatin, sonra bir tusa basin. && pause >nul
echo  1) Yedek aliniyor...
copy /y b2b_ara.py b2b_ara_yedek_lepar_oncesi.py >nul
copy /y siteler.json siteler_yedek_lepar_oncesi.json >nul
echo  2) Yeni dosyalar yaziliyor...
copy /y b2b_ara_yeni.py b2b_ara.py >nul
copy /y siteler_yeni.json siteler.json >nul
timeout /t 3 /nobreak >nul
echo  3) Kontrol ediliyor...
fc /b b2b_ara.py b2b_ara_yeni.py >nul || (echo  b2b_ara.py geri donmus, tekrar yaziliyor & timeout /t 2 /nobreak >nul & copy /y b2b_ara_yeni.py b2b_ara.py >nul)
fc /b siteler.json siteler_yeni.json >nul || (echo  siteler.json geri donmus, tekrar yaziliyor & timeout /t 2 /nobreak >nul & copy /y siteler_yeni.json siteler.json >nul)
fc /b b2b_ara.py b2b_ara_yeni.py >nul && fc /b siteler.json siteler_yeni.json >nul && (echo. & echo  BITTI: Lepar programa eklendi. & echo  Simdi programi acin, Ayarlar ekranindan Lepar sifresini kaydedin.) || (echo. & echo  SORUN: Dosyalar yazilamadi. OneDrive senkronunu bekleyip tekrar deneyin.)
:son
echo.
pause
