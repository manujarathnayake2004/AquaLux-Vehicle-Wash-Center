@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title AquaLux Auto Spa

echo ==============================================
echo       Starting AquaLux Auto Spa System
echo ==============================================
echo.

set "AQUALUX_BASE_PYTHON="
where py >nul 2>&1
if not errorlevel 1 set "AQUALUX_BASE_PYTHON=py -3"
if defined AQUALUX_BASE_PYTHON goto python_found

where python >nul 2>&1
if not errorlevel 1 set "AQUALUX_BASE_PYTHON=python"
if defined AQUALUX_BASE_PYTHON goto python_found
goto python_missing

:python_found
set "AQUALUX_VENV_PYTHON=%CD%\.venv\Scripts\python.exe"

if not exist "%AQUALUX_VENV_PYTHON%" goto create_environment

rem A copied virtual environment can contain paths from another computer or
rem folder. Verify both Python and the complete pip command before using it.
"%AQUALUX_VENV_PYTHON%" -c "import sys; assert sys.prefix != sys.base_prefix" >nul 2>&1
if errorlevel 1 goto repair_environment
"%AQUALUX_VENV_PYTHON%" -m pip --version >nul 2>&1
if errorlevel 1 goto repair_environment
goto environment_ready

:repair_environment
echo The existing Python environment is incomplete or belongs to another folder.
echo Repairing it automatically...
rmdir /s /q ".venv" >nul 2>&1
if exist ".venv" goto environment_remove_error

:create_environment
echo Creating a fresh local Python environment...
%AQUALUX_BASE_PYTHON% -m venv ".venv"
if errorlevel 1 goto environment_create_error
if not exist "%AQUALUX_VENV_PYTHON%" goto environment_create_error

"%AQUALUX_VENV_PYTHON%" -m ensurepip --upgrade >nul 2>&1
if errorlevel 1 goto environment_create_error

:environment_ready
"%AQUALUX_VENV_PYTHON%" -c "import flask, werkzeug" >nul 2>&1
if not errorlevel 1 goto dependencies_ready

echo Installing AquaLux requirements for the first run...
echo An internet connection may be required for this step.
"%AQUALUX_VENV_PYTHON%" -m pip install --disable-pip-version-check -r "requirements.txt"
if errorlevel 1 goto dependency_error

"%AQUALUX_VENV_PYTHON%" -c "import flask, werkzeug" >nul 2>&1
if errorlevel 1 goto dependency_error

:dependencies_ready
"%AQUALUX_VENV_PYTHON%" -c "import json, urllib.request; data=json.load(urllib.request.urlopen('http://127.0.0.1:5000/api/health', timeout=1)); assert data.get('status') == 'online'" >nul 2>&1
if not errorlevel 1 goto already_running

echo.
echo Server address: http://127.0.0.1:5000
echo Keep this window open while using AquaLux.
echo Press Ctrl+C when you want to stop the system.
echo.
set "AQUALUX_OPEN_BROWSER=1"
"%AQUALUX_VENV_PYTHON%" "server.py"
if errorlevel 1 goto server_error
goto finished

:already_running
echo AquaLux is already running. Opening the login page...
start "" "http://127.0.0.1:5000/login.html"
exit /b 0

:python_missing
echo Python 3 was not found.
echo Install Python 3 from https://www.python.org/downloads/
echo During installation, select "Add python.exe to PATH".
goto failed

:environment_remove_error
echo AquaLux could not remove the damaged .venv folder.
echo Close Python, VS Code and any old AquaLux server windows, then try again.
goto failed

:environment_create_error
echo AquaLux could not create its local Python environment.
echo Confirm that Python 3 is installed correctly and try again.
goto failed

:dependency_error
echo AquaLux could not install Flask and its requirements.
echo Check the internet connection, then run START-AQUALUX.bat again.
goto failed

:server_error
echo The AquaLux server stopped because of an error shown above.
goto failed

:failed
echo.
pause
exit /b 1

:finished
echo.
echo AquaLux has stopped.
pause
exit /b 0
