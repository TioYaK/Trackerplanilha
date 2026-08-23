const fs = require('fs');
const path = require('path');
const content = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run "cmd.exe /c cd /d ""D:\\projeto mirror\\TrackerPlanilhado\\scraper-worker"" && npm run dev", 0, False`;
const target = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'StartAuroriaWorker.vbs');
fs.writeFileSync(target, content);
console.log("Startup script created at:", target);
