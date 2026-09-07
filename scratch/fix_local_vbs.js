import fs from 'fs';
import path from 'path';

const appData = process.env.APPDATA;
const workDir = path.join(appData, 'AuroriaWorker');
const workerPath = path.join(workDir, 'scraper-worker');
const loopBatPath = path.join(workerPath, 'loop.bat');

const vbsLines = [
  'Set WshShell = CreateObject("WScript.Shell")',
  `WshShell.Run "cmd.exe /c ""${loopBatPath}""", 0, False`
];

const vbsPath = path.join(workerPath, 'run_worker.vbs');
fs.writeFileSync(vbsPath, vbsLines.join('\r\n'), 'utf8');

console.log('Fixed run_worker.vbs generated at:', vbsPath);
console.log('File Content:\n' + fs.readFileSync(vbsPath, 'utf8'));
