@echo off
echo 🚀 Starting FitTracker servers...
echo.

echo 📡 Starting backend server on port 5000...
start "Backend Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo 🎨 Starting frontend server on port 8081...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Both servers are starting up!
echo 🌐 Frontend: http://localhost:8081
echo 🔧 Backend: http://localhost:5000
echo 📊 Health Check: http://localhost:5000/api/health
echo.
pause
