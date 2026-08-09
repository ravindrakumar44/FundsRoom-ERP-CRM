@echo off
echo Generating Prisma Client and Starting NEXORA Backend API on Port 5000...
cd /d "%~dp0backend"
npx prisma generate
npm run dev
pause
