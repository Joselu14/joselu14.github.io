@echo off
rem ------------------------------------------------------------
rem  Downloads the public-domain plates from Wikimedia Commons
rem  into assets\img\plates (list: assets\img\plates\sources.txt).
rem  Images you already have are skipped, so it is safe to re-run.
rem  Double-click this file. Needs Windows 10 or newer.
rem ------------------------------------------------------------
cd /d "%~dp0"
if not exist "assets\img\plates" mkdir "assets\img\plates"
echo Downloading public-domain images from Wikimedia Commons...
for /f "usebackq eol=# tokens=1,2" %%A in ("assets\img\plates\sources.txt") do (
  if exist "assets\img\plates\%%A" (
    echo   %%A  already here
  ) else (
    echo   %%A
    curl.exe -sSL --fail -A "joselu14.github.io image fetch (https://github.com/Joselu14)" -o "assets\img\plates\%%A" "%%B"
  )
)
echo.
echo Done. Open index.html to check the site.
pause
