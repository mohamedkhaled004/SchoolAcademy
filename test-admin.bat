@echo off
echo 🚀 Starting Admin API Test...
echo.

echo 📋 Step 1: Testing server connectivity...
curl -s -X GET "http://localhost:3001/api/stats/students" -H "Content-Type: application/json"
if %errorlevel% neq 0 (
    echo ❌ Server not accessible
    pause
    exit /b 1
)
echo ✅ Server is running
echo.

echo 🔑 Step 2: Getting admin token...
for /f "tokens=*" %%i in ('curl -s -X POST "http://localhost:3001/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"Admin12345!\"}"') do set "loginResponse=%%i"
echo Login response: %loginResponse%
echo.

echo 🌐 Step 3: Testing /api/admin/students endpoint...
echo Note: You'll need to manually extract the token from the login response above
echo and use it in the following command:
echo.
echo curl -X GET "http://localhost:3001/api/admin/students" ^
echo   -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
echo   -H "Content-Type: application/json"
echo.

echo ✅ Test script completed
echo 🏁 Script finished
pause 