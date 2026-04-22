@echo off
echo ============================================================
echo   Starting OA Detection System
echo ============================================================
echo.

echo [1/4] Starting Flask Backend on port 5000...
start "Flask Backend" cmd /k "cd /d c:\Users\chatu\OneDrive\Desktop\Project\backend && python app.py"

echo [2/4] Starting Next.js Frontend on port 3000...
start "Next.js Frontend" cmd /k "cd /d c:\Users\chatu\OneDrive\Desktop\Project\frontend && npm run dev"

echo [3/4] Starting Expo Mobile App...
start "Expo Mobile" cmd /k "cd /d c:\Users\chatu\OneDrive\Desktop\Project\mobile && npx expo start -c"

echo [4/4] Starting LocalTunnel for Mobile API...
start "LocalTunnel" cmd /k "npx localtunnel --port 5000 --subdomain honest-buckets-tap"

echo.
echo ============================================================
echo   All four services starting in separate windows!
echo   Backend:     http://localhost:5000
echo   Frontend:    http://localhost:3000
echo   Mobile API:  https://honest-buckets-tap.loca.lt
echo   Mobile App:  Scan QR code in Expo Go app
echo ============================================================
echo.
echo Wait ~10 seconds, then open http://localhost:3000 in your browser.
echo For mobile, scan the QR code shown in the Expo terminal.
pause
