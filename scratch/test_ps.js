import fs from 'fs';
import { execSync } from 'child_process';

const psCode = `
$LoopBat = "C:\\Users\\YaKe\\AppData\\Roaming\\AuroriaWorker\\scraper-worker\\loop.bat"
$vbsContent = 'Set WshShell = CreateObject("WScript.Shell")' + "\r\n" + 'WshShell.Run "cmd.exe /c ""' + $LoopBat + '""", 0, False'
Write-Host $vbsContent
`;

fs.writeFileSync('scratch/test_ps.ps1', psCode);
const output = execSync('powershell -NoProfile -ExecutionPolicy Bypass -File scratch/test_ps.ps1').toString();
console.log('Output from PS:\n' + output);
