@echo off
echo ===================================================
echo   Starting NEXORA Operations Portal (Monorepo)
echo ===================================================
echo.

start "NEXORA Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && npx prisma generate && npm run dev"
start "NEXORA Frontend Web Portal (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend and Frontend have been launched in separate terminal windows!
echo - Frontend: http://localhost:5173 (or 5174 if 5173 is in use)
echo - Backend API: http://localhost:5000
echo ===================================================
pause
