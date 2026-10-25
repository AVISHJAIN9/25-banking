@echo off
echo ========================================================
echo   AegisBank - Installing All Dependencies
echo ========================================================
echo.

echo [1/2] Installing Backend Dependencies...
cd "backend banking"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend npm install failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Installing Frontend Dependencies...
cd "frontend"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend npm install failed.
    pause
    exit /b %ERRORLEVEL%
)

cd ..\..
echo.
echo ========================================================
echo   Dependencies Installed Successfully!
echo   Run 'start-project.bat' to launch AegisBank.
echo ========================================================
pause
