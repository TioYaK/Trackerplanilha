@echo off
cd /d "D:\projeto mirror\TrackerPlanilhado\scraper-worker"
:loop
node src/index.js
goto loop
