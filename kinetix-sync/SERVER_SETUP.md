# FitTracker Server Setup Guide

## 🚀 Quick Start

### Option 1: Use the Startup Scripts
- **Windows**: Double-click `start-servers.bat`
- **PowerShell**: Run `.\start-servers.ps1`

### Option 2: Manual Setup

#### 1. Start Backend Server
```bash
cd kinetix-sync/server
npm install
npm run dev
```
Backend will run on: `http://localhost:5000`

#### 2. Start Frontend Server
```bash
cd kinetix-sync
npm install
npm run dev
```
Frontend will run on: `http://localhost:8081`

## 🔧 Server Endpoints

### Health Check
- **GET** `http://localhost:5000/api/health`
- Returns: `{"status":"ok"}`

### Authentication
- **POST** `http://localhost:5000/api/auth/login`
- **POST** `http://localhost:5000/api/auth/register`

### Other Endpoints
- **Workouts**: `/api/workouts`
- **Nutrition**: `/api/nutrition`
- **Analytics**: `/api/analytics`
- **Meal Planning**: `/api/meal-planning`
- **AI Recommendations**: `/api/ai-recommendations`

## 🗄️ Database

The server uses MongoDB. Make sure MongoDB is running on your system:
- Default connection: `mongodb://127.0.0.1:27017/kinetix_sync`

## 🐛 Troubleshooting

### Connection Refused Error
1. Make sure both servers are running
2. Check if ports 5000 and 8081 are available
3. Verify MongoDB is running

### Check Server Status
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check if frontend is running
curl http://localhost:8081
```

### Port Conflicts
If ports are in use, you can change them:
- Backend: Set `PORT` environment variable
- Frontend: Vite will automatically find the next available port

## 📝 Environment Variables

Create a `.env` file in the server directory if needed:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kinetix_sync
JWT_SECRET=your-secret-key
```

## ✅ Success Indicators

- Backend: `Server running on http://localhost:5000`
- Frontend: `Local: http://localhost:8081/`
- Health check returns: `{"status":"ok"}`
- No connection refused errors in browser console
