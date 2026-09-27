@echo off
:: ============================================================================
:: DAMA-CRM: Auto-Elevate & Configure Windows Hosts for *.dama.com
:: ============================================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [DAMA-CRM] Solicitando permisos de administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set HOSTS_FILE=%WINDIR%\System32\drivers\etc\hosts

echo.
echo ========================================================
echo   Configurando dominios locales para DAMA-CRM
echo ========================================================
echo.

findstr /C:"god.dama.com" "%HOSTS_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Los dominios de DAMA-CRM ya estan configurados en hosts.
) else (
    echo. >> "%HOSTS_FILE%"
    echo # DAMA-CRM Local Multi-Tenant Domains >> "%HOSTS_FILE%"
    echo 127.0.0.1 dama.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 god.dama.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 app.dama.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 ignacio-corp.dama.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 demo.dama.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 admin.dama.com >> "%HOSTS_FILE%"
    echo 127.0.0.1 damacrm.local >> "%HOSTS_FILE%"
    echo 127.0.0.1 god.damacrm.local >> "%HOSTS_FILE%"
    echo.
    echo [EXITO] Se han anadido los dominios a %HOSTS_FILE% correctamente.
)

ipconfig /flushdns >nul
echo [OK] Cache DNS de Windows purgada (ipconfig /flushdns).
echo.
echo Ahora puedes abrir en tu navegador:
echo   -> http://god.dama.com
echo   -> http://ignacio-corp.dama.com
echo   -> http://dama.com
echo.
pause
