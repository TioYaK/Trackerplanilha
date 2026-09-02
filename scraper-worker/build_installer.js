import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Carrega as variáveis do .env local para injetar no C#
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const guildName = process.env.GUILD_NAME || 'shellpatrocina';

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env!");
    process.exit(1);
}

const csCode = `
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Security.Principal;

namespace AuroriaInstaller
{
    class Program
    {
        static bool IsAdministrator()
        {
            WindowsIdentity identity = WindowsIdentity.GetCurrent();
            WindowsPrincipal principal = new WindowsPrincipal(identity);
            return principal.IsInRole(WindowsBuiltInRole.Administrator);
        }

        static void Main(string[] args)
        {
            if (!IsAdministrator())
            {
                Console.WriteLine("Solicitando permissao de Administrador (Obrigatorio para instalacao silenciosa)...");
                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.UseShellExecute = true;
                startInfo.WorkingDirectory = Environment.CurrentDirectory;
                startInfo.FileName = Process.GetCurrentProcess().MainModule.FileName;
                startInfo.Verb = "runas";
                try {
                    Process.Start(startInfo);
                } catch {
                    Console.WriteLine("Permissao negada. O robo precisa de permissao para instalar o Node.js!");
                    Thread.Sleep(3000);
                }
                return;
            }

            // Forca TLS 1.2 para conseguir baixar do GitHub
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;

            Console.Title = "Auroria Worker - Instalador e Gerenciador";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("======================================================");
            Console.WriteLine("   BEM-VINDO AO AURORIA WORKER (Fazenda de Scrapers)");
            Console.WriteLine("======================================================");
            Console.ResetColor();
            Console.WriteLine("Iniciando instalacao em 1 clique...");
            
            string workDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "AuroriaWorker");

            // 1. Checa se o Node.js e Git estao instalados (requisitos para auto-updater)
            InstallPrerequisites();

            // 2. Cria a pasta do projeto e baixa o codigo fonte
            if (Directory.Exists(workDir) && !Directory.Exists(Path.Combine(workDir, ".git")))
            {
                Console.WriteLine("Limpando instalacao corrompida anterior...");
                try { Directory.Delete(workDir, true); } catch {}
                
                // Fallback de seguranca caso o Windows esteja travando a pasta
                if (Directory.Exists(workDir)) {
                    workDir = workDir + "_" + DateTime.Now.Ticks.ToString();
                }
            }

            if (!Directory.Exists(workDir))
            {
                Directory.CreateDirectory(workDir);
            }

            Console.WriteLine("\\n[1/3] Baixando a ultima versao do robo...");
            RunCommand("cmd.exe", string.Format("/c git clone https://github.com/TioYaK/Trackerplanilha.git \\"{0}\\" || (cd /d \\"{0}\\" && git pull)", workDir));

            // 3. Cria o arquivo .env automaticamente com as chaves injetadas do Admin!
            Console.WriteLine("[2/3] Configurando credenciais de banco de dados...");
            string envPath = Path.Combine(workDir, "scraper-worker", ".env");
            
            // O TS3 e opcional. Se a pessoa que rodar isso for o Admin, ele ja tem configurado.
            // Se for um amigo, ele nao precisa do TS3.
            string envContent = @"
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${supabaseKey}
GUILD_NAME=${guildName}
";
            File.WriteAllText(envPath, envContent.Trim());

            // 4. Instala dependencias
            Console.WriteLine("[3/3] Instala dependencias");
            Console.WriteLine("[3/3] Instalando modulos do robo (isso pode levar 1 minuto)...");
            string nodePathForNpm = @"C:\Program Files\nodejs\node.exe";
            if (!File.Exists(nodePathForNpm)) nodePathForNpm = "node";
            string npmCliPath = @"C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js";
            
            if (File.Exists(npmCliPath)) {
                RunCommand("cmd.exe", string.Format("/c cd /d \\\"{0}\\\" && \\\"{1}\\\" \\\"{2}\\\" install", Path.Combine(workDir, "scraper-worker"), nodePathForNpm, npmCliPath));
            } else {
                RunCommand("cmd.exe", string.Format("/c cd /d \\\"{0}\\\" && npm install", Path.Combine(workDir, "scraper-worker")));
            }

            // 5. Instala o script invisivel no Windows Startup
            Console.WriteLine("\\nConfigurando Auto-Boot invisivel do Windows...");
            string startupFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Microsoft\\\\Windows\\\\Start Menu\\\\Programs\\\\Startup");
            string vbsPath = Path.Combine(startupFolder, "StartAuroriaWorker.vbs");
            string workerPath = Path.Combine(workDir, "scraper-worker");
            
            // Cria um BAT de loop infinito imortal (agora blindado contra conflitos locais de git!)
            string loopBatPath = Path.Combine(workerPath, "loop.bat");
            string nodePath = @"C:\Program Files\nodejs\node.exe";
            if (!File.Exists(nodePath)) nodePath = "node";
            File.WriteAllText(loopBatPath, string.Format(":loop\\ngit fetch --all\\ngit reset --hard origin/main\\ngit clean -fd\\n\\\"{0}\\\" src/index.js\\nping 127.0.0.1 -n 15 > nul\\ngoto loop", nodePath));

            string vbsContent = string.Format(@"
Set WshShell = CreateObject(""WScript.Shell"")
WshShell.Run ""cmd.exe /c cd /d """"{0}"""" && loop.bat"", 0, False
", workerPath);
            File.WriteAllText(vbsPath, vbsContent.Trim());

            // 6. Finaliza e Lanca
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\\n======================================================");
            Console.WriteLine("    SUCESSO! O ROBO FOI INSTALADO E ESTA RODANDO!");
            Console.WriteLine("======================================================");
            Console.ResetColor();
            Console.WriteLine("Ele ja iniciou invisivel no fundo e vai ligar sozinho quando o PC ligar.");
            Console.WriteLine("Se houver alguma atualizacao, ele vai se auto-atualizar via GitHub.");
            
            // Inicia o worker agora
            Process.Start(new ProcessStartInfo()
            {
                FileName = "cscript.exe",
                Arguments = string.Format("\\"{0}\\"", vbsPath),
                UseShellExecute = false,
                CreateNoWindow = true
            });

            Console.WriteLine("\\nPressione qualquer tecla para sair...");
            Console.ReadKey();
        }

        static void DownloadAndInstallNode()
        {
            string msiUrl = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi";
            string msiPath = Path.Combine(Path.GetTempPath(), "node_installer.msi");
            Console.WriteLine("   -> Baixando instalador do Node.js (Aguarde alguns minutos)...");
            using (var client = new WebClient())
            {
                client.DownloadFile(msiUrl, msiPath);
            }
            Console.WriteLine("   -> Executando instalacao do Node.js silenciosamente...");
            RunCommand("msiexec.exe", "/i \\"" + msiPath + "\\" /qn /norestart");
        }

        static void DownloadAndInstallGit()
        {
            string exeUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe";
            string exePath = Path.Combine(Path.GetTempPath(), "git_installer.exe");
            Console.WriteLine("   -> Baixando instalador do Git (Aguarde alguns minutos)...");
            using (var client = new WebClient())
            {
                client.DownloadFile(exeUrl, exePath);
            }
            Console.WriteLine("   -> Executando instalacao do Git silenciosamente...");
            RunCommand(exePath, "/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /NOCANCEL /SP-");
        }

        static void RefreshEnvironment()
        {
            try
            {
                Console.WriteLine("Atualizando variaveis de ambiente do Windows...");
                string machinePath = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.Machine) ?? "";
                string userPath = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User) ?? "";
                Environment.SetEnvironmentVariable("Path", machinePath + ";" + userPath, EnvironmentVariableTarget.Process);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Aviso ao atualizar PATH: " + ex.Message);
            }
        }

        static bool IsNodeVersionAcceptable()
        {
            try
            {
                var process = new Process()
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c node -v",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };
                process.Start();
                string output = process.StandardOutput.ReadToEnd().Trim();
                process.WaitForExit();

                if (output.StartsWith("v"))
                {
                    int major = int.Parse(output.Substring(1).Split('.')[0]);
                    return major >= 22;
                }
            }
            catch {}
            return false;
        }

        static void InstallPrerequisites()
        {
            bool installedSomething = false;

            if (!IsNodeVersionAcceptable())
            {
                Console.WriteLine("Node.js ausente ou desatualizado (< v22). Iniciando atualizacao automatica...");
                DownloadAndInstallNode();
                installedSomething = true;
            }

            if (!IsCommandAvailable("git --version"))
            {
                Console.WriteLine("Git nao encontrado. Tentando instalar via Winget...");
                bool gitSuccess = RunCommand("winget", "install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements");
                if (!gitSuccess) {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine("Winget indisponivel no seu Windows. Iniciando Metodo de Download Direto (Fallback)...");
                    Console.ResetColor();
                    DownloadAndInstallGit();
                }
                installedSomething = true;
            }

            if (installedSomething)
            {
                RefreshEnvironment();
                // Pequeno delay para garantir que o SO registrou
                Thread.Sleep(2000); 
            }
        }

        static bool IsCommandAvailable(string command)
        {
            try
            {
                var process = new Process()
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = string.Format("/c {0}", command),
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                process.Start();
                process.WaitForExit();
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        static bool RunCommand(string filename, string arguments)
        {
            try
            {
                var process = new Process()
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = filename,
                        Arguments = arguments,
                        UseShellExecute = false,
                        CreateNoWindow = false
                    }
                };
                process.Start();
                process.WaitForExit();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
`;

fs.writeFileSync("Installer.cs", csCode);
console.log("Arquivo Installer.cs gerado. Compilando...");

const cscPath = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
try {
    execSync(`"${cscPath}" /target:exe /out:AuroriaWorker_Instalador.exe Installer.cs`, { stdio: 'inherit' });
    console.log("=== SUCESSO! Executável gerado: AuroriaWorker_Instalador.exe ===");
    console.log("Envie este .exe para seus amigos! Ele fará TUDO sozinho com 1 clique (Instalar Node, Git, baixar seu Repo, aplicar as chaves e rodar invisível).");
} catch (e) {
    console.error("Erro ao compilar C#:", e.message);
}
// Clean up
if (fs.existsSync("Installer.cs")) fs.unlinkSync("Installer.cs");
