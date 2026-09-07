import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const p = 'C:\\Users\\YaKe\\AppData\\Roaming\\AuroriaWorker\\scraper-worker\\loop.bat';
// In VBScript, we want: WshShell.Run "cmd.exe /c ""C:\path\loop.bat""", 0, False
const vbs = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run "cmd.exe /c ""${p}""", 0, False`;

fs.writeFileSync('scratch/test_script.vbs', vbs);
console.log('VBS Content:\n' + vbs);

try {
  const output = execSync('cscript //Nologo scratch/test_script.vbs').toString();
  console.log('CScript Output:', output);
  console.log('VBS EXECUTED WITH ZERO ERRORS!');
} catch (e) {
  console.error('CScript Error:', e.message);
}
