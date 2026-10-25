@echo off
echo ========================================================
echo   Launching AegisBank Full-Stack Application
echo ========================================================
echo.
echo Starting Backend API on http://localhost:3000...
start "AegisBank Backend" cmd /k "cd \"backend banking\" && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend on http://localhost:5173...
start "AegisBank Frontend" cmd /k "cd \"backend banking\frontend\" && npm run dev"

echo.
echo ========================================================
echo   AegisBank services are launching in separate windows.
echo   API: http://localhost:3000
echo   Web: http://localhost:5173
echo ========================================================
pause
