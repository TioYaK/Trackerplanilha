const fs = require('fs');
let code = fs.readFileSync('build_installer.js', 'utf8');
const replacement = `
            Console.WriteLine("\\nLimpando instancias antigas presas na memoria...");
            RunCommand("taskkill", "/F /IM node.exe /T");
            RunCommand("taskkill", "/F /IM wscript.exe /T");
            Console.WriteLine("\\nVerificando pre-requisitos do sistema...");
`;
code = code.replace('Console.WriteLine("\\nVerificando pre-requisitos do sistema...");', replacement);
fs.writeFileSync('build_installer.js', code);
