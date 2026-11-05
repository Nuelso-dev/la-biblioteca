@echo off
rem Doble clic: levanta backend + frontend + túneles de Cloudflare
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0compartir.ps1" %*
pause
