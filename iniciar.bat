@echo off
title Kuphassana — Servidores
color 0A

echo.
echo  ========================================
echo   Agencia Funeraria Kuphassana
echo   A iniciar servidores...
echo  ========================================
echo.

:: Backend
echo  [1/2] Backend (porta 3000)...
start "Backend - Kuphassana" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak >nul

:: Frontend
echo  [2/2] Frontend (porta 5500)...
start "Frontend - Kuphassana" cmd /k "cd /d "%~dp0frontend" && npx serve . -p 5500"

timeout /t 4 /nobreak >nul

:: Abrir browser
echo.
echo  Abrindo o browser...
start http://localhost:5500

echo.
echo  ========================================
echo   SISTEMA ACTIVO
echo   Website:  http://localhost:5500
echo   Backend:  http://localhost:3000
echo   Admin:    http://localhost:5500/pages/admin-login.html
echo  ========================================
echo.
echo  Credenciais admin:
echo    Email: admin@funeraria.pt
echo    Senha: password
echo.
pause
