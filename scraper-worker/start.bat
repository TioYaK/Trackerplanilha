@echo off
cd /d "%~dp0"
:loop
git pull --autostash
node src/index.js
ping 127.0.0.1 -n 15 > nul
goto loop