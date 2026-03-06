@echo off
setlocal
set VERSION=2.0.0
set RELEASE_DIR=C:\Ezan_Vakti_Plus_Releases\%VERSION%

echo ====================================================
echo Ezan Vakti Plus v%VERSION% Release Build Basliyor...
echo ====================================================
echo.

if exist "%RELEASE_DIR%" (
    echo [BILGI] Eski surum klasoru tespit edildi. Siliniyor...
    rmdir /s /q "%RELEASE_DIR%"
)

echo [BILGI] electron-builder ile derleme basliyor...
call npx electron-builder --win --x64 -c.directories.output="%RELEASE_DIR%"

echo.
echo ====================================================
echo [BASARILI] Derleme tamamlandi! 
echo Ciktilar su klasore kaydedildi: %RELEASE_DIR%
echo ====================================================
pause
