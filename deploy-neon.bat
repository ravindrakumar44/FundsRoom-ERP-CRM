@echo off
setlocal enabledelayedexpansion

echo ===============================================================
echo   ☁️  NEXORA - NEON CLOUD DATABASE DEPLOYMENT & SYNC
echo ===============================================================
echo Local database (localhost:5432/nexora) will remain UNTOUCHED.
echo.

cd /d "%~dp0backend"

:: Extract NEON_DATABASE_URL from backend/.env
for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="NEON_DATABASE_URL" (
        set NEON_URL=%%B
    )
)

:: Remove enclosing quotes if present
set NEON_URL=%NEON_URL:"=%

if "%NEON_URL%"=="" (
    echo ❌ ERROR: NEON_DATABASE_URL is not set in backend/.env.
    echo 👉 Please open backend/.env and paste your Neon connection string into NEON_DATABASE_URL.
    echo.
    pause
    exit /b 1
)

echo 📡 Target Neon Database: %NEON_URL%
echo.

echo [1/3] Pushing Prisma Schema to Neon Cloud Database...
set DATABASE_URL=%NEON_URL%
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to push schema to Neon. Please verify your connection string and SSL settings.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Seeding demo dataset to Neon Cloud Database (Ravindra Kumar Admin, 16 Customers, Products, Challans)...
call npx tsx prisma/seed-neon.ts
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to seed Neon database.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Running Database Audit & Verification...
call npx tsx prisma/verify-neon.ts

echo.
echo ===============================================================
echo   ✅ SUCCESS! NEON CLOUD DATABASE IS FULLY POPULATED & AUDITED
echo ===============================================================
pause
