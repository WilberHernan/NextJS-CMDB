@echo off
chcp 65001 >nul
title CMDB SENA — Inventario [CIUDAD JARDIN]
color 0A

echo ============================================================
echo   CMDB SENA — Inventario de Hardware
echo   Sede: CIUDAD JARDIN  ^|  v2.1.0
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PS1_FILE=%SCRIPT_DIR%inventarioWin.ps1"

if not exist "%PS1_FILE%" (
    echo [ERROR] No se encontro inventarioWin.ps1 en esta carpeta.
    echo         Coloca este .bat junto al script PowerShell.
    echo.
    pause
    exit /b 1
)

echo [1/3] Desbloqueando archivo descargado de internet...
powershell -NoProfile -Command "Unblock-File -Path '%PS1_FILE%'" 2>nul
echo       OK
echo.

echo [2/3] Ejecutando inventario (ExecutionPolicy Bypass)...
echo.
echo ------------------------------------------------------------
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1_FILE%"

if %errorlevel% NEQ 0 (
    echo.
    echo ------------------------------------------------------------
    echo [ERROR] El script termino con codigo %errorlevel%
    echo.
    echo Si aparece "ExecutionPolicy", ejecuta como administrador
    echo o contacta al area de sistemas.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ------------------------------------------------------------
echo [OK] Proceso completado.
echo.
pause
