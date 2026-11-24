@echo off
setlocal
cd /d "%~dp0"
 
title DEP Employee Dashboard
 
echo ==========================================
echo       DEP EMPLOYEE DASHBOARD
echo ==========================================
echo.
 
REM ------------------------------------------
REM STEP 1: CHECK PYTHON
REM ------------------------------------------
 
echo Checking Python installation...
 
where python >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
    goto PYTHON_FOUND
)
 
where py >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py"
    goto PYTHON_FOUND
)
 
echo.
echo ERROR: Python is not installed or not available in PATH.
echo.
echo Please install Python from:
echo https://www.python.org/downloads/windows/
echo.
echo During installation, check:
echo Add Python to PATH
echo.
pause
exit /b 1
 
:PYTHON_FOUND
echo Python found.
echo.
 
REM ------------------------------------------
REM STEP 2: CREATE VIRTUAL ENVIRONMENT
REM ------------------------------------------
 
if not exist ".venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    %PYTHON_CMD% -m venv .venv
 
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
)
 
echo Virtual environment ready.
echo.
 
REM ------------------------------------------
REM STEP 3: INSTALL REQUIREMENTS
REM ------------------------------------------
 
echo Installing or checking required packages...
 
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found.
    pause
    exit /b 1
)
 
.venv\Scripts\python.exe -m pip install --upgrade pip
 
if errorlevel 1 (
    echo ERROR: Failed to update pip.
    pause
    exit /b 1
)
 
.venv\Scripts\python.exe -m pip install -r requirements.txt
 
if errorlevel 1 (
    echo.
    echo ERROR: Package installation failed.
    pause
    exit /b 1
)
 
echo.
echo Packages installed successfully.
echo.
 
REM ------------------------------------------
REM STEP 4: CREATE LOGIN IF .ENV IS MISSING
REM ------------------------------------------
 
if not exist ".env" (
    echo ==========================================
    echo Create your private dashboard login now.
    echo ==========================================
    echo.
 
    if not exist "setup_login.py" (
        echo ERROR: setup_login.py not found.
        pause
        exit /b 1
    )
 
    .venv\Scripts\python.exe setup_login.py
 
    if errorlevel 1 (
        echo.
        echo ERROR: Login setup failed.
        pause
        exit /b 1
    )
)
 
REM ------------------------------------------
REM STEP 5: START DASHBOARD
REM ------------------------------------------
 
echo.
echo ==========================================
echo Starting DEP Employee Dashboard...
echo ==========================================
echo.
echo Dashboard URL:
echo http://127.0.0.1:8000/login
echo.
echo Press CTRL+C to stop the dashboard.
echo.
 
start "" "http://127.0.0.1:8000/login"
 
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
 
echo.
echo Dashboard stopped.
pause