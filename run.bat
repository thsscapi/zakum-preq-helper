@echo off
cd /d "%~dp0dist"
echo Starting Zakum Prequest Helper...
start "" http://localhost:4173
"%~dp0caddy.exe" file-server --listen :4173
