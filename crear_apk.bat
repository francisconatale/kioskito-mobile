@echo off
set "SOURCE_DIR=%~dp0"
set "BUILD_DIR=C:\kioskito_build"

echo ========================================================
echo   GENERADOR DE APK - KIOSKITO
echo ========================================================
echo.
echo 1. Limpiando entorno de compilacion previo en %BUILD_DIR%...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

echo.
echo 2. Copiando proyecto a directorio raiz (para evitar errores de ruta larga)...
echo    Origen: %SOURCE_DIR%
echo    Destino: %BUILD_DIR%
echo    Por favor espere, copiando archivos...
rem Robocopy devuelve codigos de exito distintos a 0, asi que ignoramos errores menores
robocopy "%SOURCE_DIR%." "%BUILD_DIR%" /E /XD .git .gradle .expo android\build android\app\build > nul
if %ERRORLEVEL% GEQ 8 (
    echo Error critico al copiar archivos.
    pause
    exit /b
)

echo.
echo 3. Limpiando cache global de Gradle (Reparacion de error CorruptedCacheException)...
cd /d "%BUILD_DIR%\android"
call gradlew.bat --stop
if exist "%USERPROFILE%\.gradle\caches\journal-1" (
    echo    Eliminando archivo de cache corrupto...
    rmdir /s /q "%USERPROFILE%\.gradle\caches\journal-1"
)
if exist "%USERPROFILE%\.gradle\caches\transforms-3" (
    echo    Limpiando transforms...
    rmdir /s /q "%USERPROFILE%\.gradle\caches\transforms-3"
)

echo.
echo 4. Configurando Android SDK...
echo sdk.dir=C:\\Users\\franc\\AppData\\Local\\Android\\Sdk> "%BUILD_DIR%\android\local.properties"

echo.
echo 4. Iniciando la compilacion con Gradle...
echo    Esto puede tardar varios minutos (10-15 min aprox).
echo    Se ejecutara 'clean' y luego 'assembleRelease'.
echo.
cd /d "%BUILD_DIR%\android"
call gradlew.bat clean assembleRelease --no-daemon

echo.
echo ========================================================
if exist "%BUILD_DIR%\android\app\build\outputs\apk\release\app-release.apk" (
    echo [EXITO] APK generado correctamente.
    echo.
    echo Copiando APK a tu Escritorio como 'Kioskito_Release.apk'...
    copy "%BUILD_DIR%\android\app\build\outputs\apk\release\app-release.apk" "%USERPROFILE%\Desktop\Kioskito_Release.apk"
    echo.
    echo LISTO! Busca el archivo 'Kioskito_Release.apk' en tu escritorio.
    
    echo.
    echo Abriendo la carpeta del APK...
    start "" "%BUILD_DIR%\android\app\build\outputs\apk\release"
) else (
    echo [ERROR] No se pudo generar el APK.
    echo Revisa los mensajes de error anteriores.
)
echo ========================================================
pause
