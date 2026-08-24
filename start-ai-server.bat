@echo off
setlocal
cd /d "%~dp0"
title AquaLux AI Server

echo ==============================================
echo       Starting AquaLux Auto Spa System
echo ==============================================

where py >nul 2>&1
if %errorlevel%==0 (
  set "AQUALUX_PYTHON=py -3"
) else (
  where python >nul 2>&1
  if errorlevel 1 goto python_missing
  set "AQUALUX_PYTHON=python"
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating the Python environment...
  %AQUALUX_PYTHON% -m venv .venv
  if errorlevel 1 goto startup_error
)

set "AQUALUX_VENV_PYTHON=%CD%\.venv\Scripts\python.exe"
"%AQUALUX_VENV_PYTHON%" -c "import flask" >nul 2>&1
if errorlevel 1 (
  echo Installing Flask for the first run...
  "%AQUALUX_VENV_PYTHON%" -m pip install -r requirements.txt
  if errorlevel 1 goto startup_error
)

"%AQUALUX_VENV_PYTHON%" -c "import json,urllib.request; data=json.load(urllib.request.urlopen('http://127.0.0.1:5000/api/health',timeout=1)); assert data.get('status')=='online'" >nul 2>&1
if not errorlevel 1 (
  echo AquaLux is already running. Opening the secure login page...
  start "" "http://127.0.0.1:5000/login.html"
  exit /b 0
)

echo.
echo Server address: http://127.0.0.1:5000
echo Keep this window open while using AquaLux.
echo Press Ctrl+C when you want to stop the system.
echo.
set "AQUALUX_OPEN_BROWSER=1"
"%AQUALUX_VENV_PYTHON%" server.py
goto finished

:python_missing
echo.
echo Python 3 is not installed or is not available in PATH.
echo Install Python 3, select "Add Python to PATH", and run this file again.
pause
exit /b 1

:startup_error
echo.
echo AquaLux could not start. Check that Python is installed,
echo then run this file again while connected to the internet.
pause
exit /b 1

:finished
pause
