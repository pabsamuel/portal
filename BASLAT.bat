@echo off
title Portal
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8080/
  node tools\serve.mjs 8080
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1 -Port 8080
)
pause
