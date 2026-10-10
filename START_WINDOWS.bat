@echo off
setlocal
cd /d "%~dp0"
title Piano Play Lab - Local Server
where powershell.exe >nul 2>&1
if errorlevel 1 (
  echo Windows PowerShell was not found.
  echo Alternative: run py -3 -m http.server 8000 --bind 127.0.0.1
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\local-server.ps1"
if errorlevel 1 (
  echo.
  echo Could not start the built-in server. The full instructions are in README.md.
  pause
)
