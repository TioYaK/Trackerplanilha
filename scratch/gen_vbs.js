import fs from 'fs';
import path from 'path';

const appData = process.env.APPDATA;
const workDir = path.join(appData, 'AuroriaWorker');
const workerPath = path.join(workDir, 'scraper-worker');

if (fs.existsSync(workerPath)) {
  const loopBatLines = [
    '@echo off',
    ':loop',
    `git -C "${workDir}" fetch --all`,
    `git -C "${workDir}" reset --hard origin/main`,
    `git -C "${workDir}" clean -fd -e .env -e loop.bat -e run_worker.vbs`,
    `node "${path.join(workerPath, 'src', 'index.js')}"`,
    'ping 127.0.0.1 -n 15 > nul',
    'goto loop'
  ];
  const loopBatPath = path.join(workerPath, 'loop.bat');
  fs.writeFileSync(loopBatPath, loopBatLines.join('\r\n'));
  console.log('Created loop.bat at:', loopBatPath);

  const vbsLines = [
    'Set WshShell = CreateObject("WScript.Shell")',
    `WshShell.Run "cmd.exe /c """"${loopBatPath}"""", 0, False`
  ];
  const vbsPath = path.join(workerPath, 'run_worker.vbs');
  fs.writeFileSync(vbsPath, vbsLines.join('\r\n'));
  console.log('Created run_worker.vbs at:', vbsPath);
}
