@echo off
echo 启动HuanuCanvas服务...

echo 1. 启动后端API服务...
cd src\backend
start "Backend" cmd /k "npm start"

echo 等待后端启动...
timeout /t 3

echo 2. 启动前端开发服务器...
cd ..\..
start "Frontend" cmd /k "npm run dev"

echo 服务启动完成！
echo - 后端API: http://localhost:8766/
echo - 前端应用: 检查控制台输出中的URL
echo.
echo 按任意键退出...
pause >nul
