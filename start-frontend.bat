@echo off
echo Starting NEXORA Frontend Web Portal on Port 5173...
cd /d "%~dp0frontend"
npm run dev
pause
