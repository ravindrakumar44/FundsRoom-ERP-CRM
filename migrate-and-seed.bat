@echo off
echo =========================================================
echo   NEXORA - PostgreSQL Database Migration & Seeding
echo =========================================================
echo Database: nexora (localhost:5432)
echo.

cd /d "%~dp0backend"

echo [1/3] Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo Error generating Prisma Client. Please check your Node/Prisma setup.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Applying Schema Tables to existing "nexora" database...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo Error pushing schema to PostgreSQL. Please check PostgreSQL is running on port 5432 with the password in backend/.env.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Seeding demo data (Ravindra Kumar Admin, Customers, Products, Challans)...
call npm run seed
if %ERRORLEVEL% neq 0 (
    echo Error during seeding.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =========================================================
echo   SUCCESS! "nexora" database is migrated and seeded!
echo =========================================================
pause
