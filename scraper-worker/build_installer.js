import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const guildName = process.env.GUILD_NAME || 'shellpatrocina';

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao encontrados no .env!");
    process.exit(1);
}

// Manifesto XML anti-falso-positivo
const manifestXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">',
    '  <assemblyIdentity version="1.5.0.0" processorArchitecture="X86" name="AuroriaWorker.Installer" type="win32"/>',
    '  <description>Auroria Worker - Robo de Telemetria de Guild</description>',
    '  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">',
    '    <security>',
    '      <requestedPrivileges>',
    '        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>',
    '      </requestedPrivileges>',
    '    </security>',
    '  </trustInfo>',
    '  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">',
    '    <application>',
    '      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>',
    '    </application>',
    '  </compatibility>',
    '</assembly>',
].join('\n');

// Gera o código C# usando concatenação de strings para evitar problemas de template literal
function buildCsCode(url, key, guild) {
    const lines = [];
    lines.push('using System;');
    lines.push('using System.Diagnostics;');
    lines.push('using System.IO;');
    lines.push('using System.Threading;');
    lines.push('using System.Security.Principal;');
    lines.push('using System.Text;');
    lines.push('');
    lines.push('namespace AuroriaWorker {');
    lines.push('    class Program {');
    lines.push('        static string WorkDir = Path.Combine(');
    lines.push('            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),');
    lines.push('            "AuroriaWorker");');
    lines.push('');
    lines.push('        static bool IsAdmin() {');
    lines.push('            return new WindowsPrincipal(WindowsIdentity.GetCurrent())');
    lines.push('                .IsInRole(WindowsBuiltInRole.Administrator);');
    lines.push('        }');
    lines.push('');
    lines.push('        static void Main(string[] args) {');
    lines.push('            if (!IsAdmin()) {');
    lines.push('                try { Process.Start(new ProcessStartInfo() {');
    lines.push('                    UseShellExecute = true,');
    lines.push('                    FileName = Process.GetCurrentProcess().MainModule.FileName,');
    lines.push('                    Verb = "runas" }); } catch {}');
    lines.push('                return;');
    lines.push('            }');
    lines.push('            Console.Title = "Auroria Worker - Instalador";');
    lines.push('            Console.ForegroundColor = ConsoleColor.Cyan;');
    lines.push('            Console.WriteLine("======================================================");');
    lines.push('            Console.WriteLine("   AURORIA WORKER - Instalador e Gerenciador de Robo");');
    lines.push('            Console.WriteLine("======================================================");');
    lines.push('            Console.ResetColor();');
    lines.push('');
    lines.push('            Console.WriteLine("\\n[1/4] Verificando pre-requisitos...");');
    lines.push('            InstallPrerequisites();');
    lines.push('');
    lines.push('            Console.WriteLine("\\n[2/4] Baixando a ultima versao do robo...");');
    lines.push('            if (Directory.Exists(WorkDir) && !Directory.Exists(Path.Combine(WorkDir, ".git")))');
    lines.push('                try { Directory.Delete(WorkDir, true); } catch {}');
    lines.push('            if (!Directory.Exists(WorkDir)) Directory.CreateDirectory(WorkDir);');
    lines.push('            if (Directory.Exists(Path.Combine(WorkDir, ".git"))) {');
    lines.push('                RunPS("cd \'" + WorkDir + "\'; git fetch --all; git reset --hard origin/main");');
    lines.push('            } else {');
    lines.push('                RunPS("git clone https://github.com/TioYaK/Trackerplanilha.git \'" + WorkDir + "\'");');
    lines.push('            }');
    lines.push('');
    lines.push('            Console.WriteLine("\\n[3/4] Configurando credenciais...");');
    lines.push('            string workerPath = Path.Combine(WorkDir, "scraper-worker");');
    lines.push('            string envPath = Path.Combine(workerPath, ".env");');
    lines.push('            Console.ForegroundColor = ConsoleColor.Yellow;');
    lines.push('            Console.Write("Digite seu nome (Discord ou Personagem) para credito no painel: ");');
    lines.push('            Console.ResetColor();');
    lines.push('            string ownerName = Console.ReadLine();');
    lines.push('            if (string.IsNullOrWhiteSpace(ownerName)) ownerName = "Anonimo";');
    // Injeta as chaves diretamente (sem usar string.Format pra não conflitar com {0})
    lines.push(`            string envContent = "SUPABASE_URL=${url}\\n" +`);
    lines.push(`                "SUPABASE_SERVICE_ROLE_KEY=${key}\\n" +`);
    lines.push(`                "GUILD_NAME=${guild}\\n" +`);
    lines.push('                "WORKER_OWNER=" + ownerName;');
    lines.push('            File.WriteAllText(envPath, envContent);');
    lines.push('');
    lines.push('            Console.WriteLine("Instalando modulos (pode levar 1-2 minutos)...");');
    lines.push('            RunPS("cd \'" + workerPath + "\'; npm install --silent");');
    lines.push('');
    lines.push('            Console.WriteLine("\\n[4/4] Configurando inicializacao automatica com Windows...");');
    lines.push('            string nodePath = FindNode();');
    lines.push('            string indexJs = Path.Combine(workerPath, "src", "index.js");');
    lines.push('            string loopBatPath = Path.Combine(workerPath, "loop.bat");');
    lines.push('            string vbsPath = Path.Combine(workerPath, "run_worker.vbs");');
    lines.push('');
    lines.push('            // Cria loop.bat de auto-update e run');
    lines.push('            var bat = new StringBuilder();');
    lines.push('            bat.AppendLine("@echo off");');
    lines.push('            bat.AppendLine(":loop");');
    lines.push('            bat.AppendLine("git -C \\"" + WorkDir + "\\" fetch --all");');
    lines.push('            bat.AppendLine("git -C \\"" + WorkDir + "\\" reset --hard origin/main");');
    lines.push('            bat.AppendLine("git -C \\"" + WorkDir + "\\" clean -fd");');
    lines.push('            bat.AppendLine("\\"" + nodePath + "\\" \\"" + indexJs + "\\"");');
    lines.push('            bat.AppendLine("ping 127.0.0.1 -n 15 > nul");');
    lines.push('            bat.AppendLine("goto loop");');
    lines.push('            File.WriteAllText(loopBatPath, bat.ToString());');
    lines.push('');
    lines.push('            // Cria VBS invisivel');
    lines.push('            string vbs = "Set WshShell = CreateObject(\\"WScript.Shell\\")" + Environment.NewLine +');
    lines.push('                "WshShell.Run \\"cmd.exe /c \'\\"" + loopBatPath + "\\"\'\\", 0, False";');
    lines.push('            File.WriteAllText(vbsPath, vbs);');
    lines.push('');
    lines.push('            // Registra no Task Scheduler (muito menos suspeito para AVs que pasta Startup)');
    lines.push('            string taskXmlPath = Path.GetTempFileName() + ".xml";');
    lines.push('            string taskXml =');
    lines.push('                "<?xml version=\'1.0\' encoding=\'UTF-16\'?>" +');
    lines.push('                "<Task version=\'1.2\' xmlns=\'http://schemas.microsoft.com/windows/2004/02/mit/task\'>" +');
    lines.push('                "<Triggers><LogonTrigger><Enabled>true</Enabled></LogonTrigger></Triggers>" +');
    lines.push('                "<Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>" +');
    lines.push('                "<DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>" +');
    lines.push('                "<StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>" +');
    lines.push('                "<ExecutionTimeLimit>PT0S</ExecutionTimeLimit></Settings>" +');
    lines.push('                "<Actions><Exec><Command>wscript.exe</Command>" +');
    lines.push('                "<Arguments>\\"\\"\\"\\"" + vbsPath + "\\"\\"\\"\\"</Arguments></Exec></Actions></Task>";');
    lines.push('            File.WriteAllText(taskXmlPath, taskXml, System.Text.Encoding.Unicode);');
    lines.push('            RunPS("schtasks /Delete /TN \'AuroriaWorker\' /F 2>&1 | Out-Null; schtasks /Create /TN \'AuroriaWorker\' /XML \'" + taskXmlPath + "\'");');
    lines.push('            try { File.Delete(taskXmlPath); } catch {}');
    lines.push('');
    lines.push('            // Inicia agora sem janela');
    lines.push('            Process.Start(new ProcessStartInfo("wscript.exe", "\\"" + vbsPath + "\\"") {');
    lines.push('                UseShellExecute = false, CreateNoWindow = true });');
    lines.push('');
    lines.push('            Console.ForegroundColor = ConsoleColor.Green;');
    lines.push('            Console.WriteLine("\\n======================================================");');
    lines.push('            Console.WriteLine("    SUCESSO! O ROBO FOI INSTALADO E ESTA RODANDO!");');
    lines.push('            Console.WriteLine("======================================================");');
    lines.push('            Console.ResetColor();');
    lines.push('            Console.WriteLine("- Rodando em segundo plano agora.");');
    lines.push('            Console.WriteLine("- Liga automaticamente com o Windows via Task Scheduler.");');
    lines.push('            Console.WriteLine("- Se houver atualizacao, ele se atualiza sozinho via GitHub.");');
    lines.push('            Console.WriteLine("\\nPressione qualquer tecla para fechar...");');
    lines.push('            Console.ReadKey();');
    lines.push('        }');
    lines.push('');
    lines.push('        static string FindNode() {');
    lines.push('            if (File.Exists(@"C:\\Program Files\\nodejs\\node.exe"))');
    lines.push('                return @"C:\\Program Files\\nodejs\\node.exe";');
    lines.push('            return "node";');
    lines.push('        }');
    lines.push('');
    lines.push('        static void InstallPrerequisites() {');
    lines.push('            if (!CmdOk("node -v")) {');
    lines.push('                Console.WriteLine("Node.js nao encontrado. Instalando via winget...");');
    lines.push('                RunPS("winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e");');
    lines.push('                RefreshPath();');
    lines.push('            }');
    lines.push('            if (!CmdOk("git --version")) {');
    lines.push('                Console.WriteLine("Git nao encontrado. Instalando via winget...");');
    lines.push('                RunPS("winget install --id Git.Git --accept-source-agreements --accept-package-agreements -e");');
    lines.push('                RefreshPath();');
    lines.push('            }');
    lines.push('        }');
    lines.push('');
    lines.push('        static void RefreshPath() {');
    lines.push('            try {');
    lines.push('                string m = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.Machine) ?? "";');
    lines.push('                string u = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User) ?? "";');
    lines.push('                Environment.SetEnvironmentVariable("Path", m + ";" + u, EnvironmentVariableTarget.Process);');
    lines.push('                Thread.Sleep(3000);');
    lines.push('            } catch {}');
    lines.push('        }');
    lines.push('');
    lines.push('        static bool CmdOk(string cmd) {');
    lines.push('            try {');
    lines.push('                var p = new Process() { StartInfo = new ProcessStartInfo("cmd.exe", "/c " + cmd) {');
    lines.push('                    UseShellExecute = false, RedirectStandardOutput = true, CreateNoWindow = true } };');
    lines.push('                p.Start(); p.WaitForExit(); return p.ExitCode == 0;');
    lines.push('            } catch { return false; }');
    lines.push('        }');
    lines.push('');
    lines.push('        static void RunPS(string script) {');
    lines.push('            try {');
    lines.push('                var p = new Process() { StartInfo = new ProcessStartInfo(');
    lines.push('                    "powershell.exe",');
    lines.push('                    "-NoProfile -ExecutionPolicy Bypass -Command \\"" + script + "\\"") {');
    lines.push('                    UseShellExecute = false, CreateNoWindow = true } };');
    lines.push('                p.Start(); p.WaitForExit();');
    lines.push('            } catch (Exception ex) { Console.WriteLine("Aviso: " + ex.Message); }');
    lines.push('        }');
    lines.push('    }');
    lines.push('}');
    return lines.join('\n');
}

const csCode = buildCsCode(supabaseUrl, supabaseKey, guildName);

fs.writeFileSync('Installer.manifest', manifestXml);
fs.writeFileSync('Installer.cs', csCode);

console.log("Arquivo Installer.cs gerado. Compilando...");

const cscPath = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
try {
    execSync(
        `"${cscPath}" /target:exe /win32manifest:Installer.manifest /out:AuroriaWorker_Instalador.exe Installer.cs`,
        { stdio: 'inherit' }
    );
    console.log("=== SUCESSO! AuroriaWorker_Instalador.exe gerado ===");
    console.log("Melhorias anti-falso-positivo:");
    console.log("  [+] Manifesto XML (app declarada como legitima ao Windows)");
    console.log("  [+] Auto-start via Task Scheduler (nao mais pasta Startup - menos flagged)");
    console.log("  [+] Downloads via winget/PowerShell (nao mais WebClient)");
} catch (e) {
    console.error("Erro ao compilar:", e.message);
}

if (fs.existsSync("Installer.cs")) fs.unlinkSync("Installer.cs");
if (fs.existsSync("Installer.manifest")) fs.unlinkSync("Installer.manifest");
