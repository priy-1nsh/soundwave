@echo off
echo Starting Soundwave...
start "Soundwave Backend" cmd /k "cd /d "%~dp0server" && npm run dev"
timeout /t 2 /nobreak >nul
start "Soundwave Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
echo.
echo Both servers starting...
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
timeout /t 4 /nobreak >nul
start http://localhost:5173
