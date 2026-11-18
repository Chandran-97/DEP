@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv .venv
)
echo Installing or checking required packages...
.venv\Scripts\python.exe -m pip install -r requirements.txt
if not exist ".env" (
  echo.
  echo Create your private dashboard login now.
  .venv\Scripts\python.exe setup_login.py
)
echo.
echo Opening dashboard at http://127.0.0.1:8000/login
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
