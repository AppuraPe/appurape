@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "ADB_EXE=C:\Users\NAYCOLL\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "BACKEND_URL=http://127.0.0.1:5263/health"

echo.
echo === Appurape Android Local Dev ===
echo.

if not exist "%ADB_EXE%" (
  echo [ERROR] No se encontro adb en:
  echo %ADB_EXE%
  exit /b 1
)

echo [1/5] Verificando backend local...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing '%BACKEND_URL%'; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo [ERROR] El backend local no responde en %BACKEND_URL%
  echo Levantalo antes de continuar.
  exit /b 1
)

echo [2/5] Verificando dispositivo Android...
"%ADB_EXE%" devices
"%ADB_EXE%" get-state 1>nul 2>nul
if errorlevel 1 (
  echo [ERROR] No hay un dispositivo Android listo.
  echo Revisa el cable USB y la depuracion USB.
  exit /b 1
)

echo [3/5] Creando tunel adb reverse para el backend local...
"%ADB_EXE%" reverse tcp:5263 tcp:5263
if errorlevel 1 (
  echo [ERROR] No se pudo ejecutar adb reverse.
  exit /b 1
)

echo [4/5] Generando build web y sincronizando Android...
call npm run android:dev
if errorlevel 1 (
  echo [ERROR] Fallo npm run android:dev
  exit /b 1
)

echo [5/5] Instalando APK debug en el telefono...
pushd "%ROOT_DIR%android"
call gradlew.bat installDebug
set "GRADLE_EXIT=%ERRORLEVEL%"
popd

if not "%GRADLE_EXIT%"=="0" (
  echo [ERROR] Fallo la instalacion de la APK debug.
  exit /b %GRADLE_EXIT%
)

echo.
echo Listo. La APK debug ya usa la build web mas reciente y el backend local.
echo Puedes verificar el tunel con:
echo "%ADB_EXE%" reverse --list
echo.
exit /b 0
