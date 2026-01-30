@echo off
echo 清理端口和进程...

echo 结束所有Node.js进程...
taskkill /F /IM node.exe 2>nul

echo 等待进程清理...
timeout /t 2

echo 端口清理完成！
echo 现在可以重新启动服务了。
pause
