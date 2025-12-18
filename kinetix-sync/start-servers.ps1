# FitTracker Server Startup Script
# This script starts both the backend and frontend servers

Write-Host "🚀 Starting FitTracker servers..." -ForegroundColor Green

# Start backend server
Write-Host "📡 Starting backend server on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "🎨 Starting frontend server on port 8081..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host "✅ Both servers are starting up!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:8081" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
