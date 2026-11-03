@echo off
chcp 65001 >nul
setlocal
set "DIR=%~dp0"

echo Bu klasordeki B2B programlari sirayla acilacak.
echo Her programda giris yapin, sonra bu pencereye donup Enter'a basin.
echo.

for %%E in (lnk url appref-ms) do (
  for %%F in ("%DIR%*.%%E") do (
    if /I not "%%~nxF"=="B2B_hepsini_ac.bat" (
      echo Aciliyor: %%~nF
      start "" "%%~fF"
      pause
    )
  )
)

echo.
echo Tum programlar acildi.
pause
