@echo off
rem Doble clic: apaga backend, frontend y túneles
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0compartir.ps1" -Detener
pause
