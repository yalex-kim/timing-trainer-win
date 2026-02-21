@echo off
echo 모든 프로세스 종료 중...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo 빌드 캐시 삭제 중...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist .vite rmdir /s /q .vite

echo Electron 앱 데이터 캐시 삭제 중...
if exist "%APPDATA%\timing-trainer-win" rmdir /s /q "%APPDATA%\timing-trainer-win"

echo 개발 서버 시작 중...
npm run dev
