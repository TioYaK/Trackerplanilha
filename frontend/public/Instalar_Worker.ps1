# ==============================================================
#  AURORIA WORKER - Instalador em 1 clique (PowerShell)
#  Versao 1.6 - Fail-safe & Robusto
# ==============================================================
param()

# Desbloqueia execucao de scripts na sessao atual do PowerShell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue

# Solicita admin se necessario
If (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    if ($MyInvocation.MyCommand.Path) {
        Start-Process PowerShell -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -File `"" + $MyInvocation.MyCommand.Path + "`"")
    } else {
        Start-Process PowerShell -Verb RunAs -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -Command `"irm https://trackerplanilha.vercel.app/Instalar_Worker.ps1 | iex`"")
    }
    Exit
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   AURORIA WORKER - Instalador e Gerenciador de Robo" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ---- [0/4] Busca credenciais ----
Write-Host "[0/4] Obtendo credenciais seguras do servidor..." -ForegroundColor Gray
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    $configUrl = "https://trackerplanilha.vercel.app/api/worker-config"
    $config = Invoke-RestMethod -Uri $configUrl -Method GET -TimeoutSec 15
    $SUPABASE_URL = $config.url
    $SUPABASE_KEY = $config.key
    $GUILD_NAME   = $config.guild
} catch {
    Write-Host "ERRO: Nao foi possivel obter as credenciais do servidor." -ForegroundColor Red
    Write-Host "Verifique sua conexao com a internet e tente novamente." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    Exit
}
Write-Host "  -> Credenciais obtidas com sucesso!" -ForegroundColor Green

# ---- [1/4] Pre-requisitos ----
Write-Host ""
Write-Host "[1/4] Verificando pre-requisitos (Node.js e Git)..." -ForegroundColor Yellow

function Refresh-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path","Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path","User")
    $env:PATH = "$machinePath;$userPath"
    if (Test-Path "C:\Program Files\nodejs") {
        $env:PATH = "C:\Program Files\nodejs;$env:PATH"
    }
    if (Test-Path "C:\Program Files\Git\cmd") {
        $env:PATH = "$env:PATH;C:\Program Files\Git\cmd"
    }
}
Refresh-Path

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  -> Node.js nao encontrado. Instalando via winget..." -ForegroundColor Gray
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e
    Refresh-Path
} else {
    Write-Host "  -> Node.js: OK" -ForegroundColor Green
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  -> Git nao encontrado. Instalando via winget..." -ForegroundColor Gray
    winget install --id Git.Git --accept-source-agreements --accept-package-agreements -e
    Refresh-Path
} else {
    Write-Host "  -> Git: OK" -ForegroundColor Green
}

# ---- [2/4] Baixa o codigo ----
$WorkDir = Join-Path $env:APPDATA "AuroriaWorker"
$WorkerPath = Join-Path $WorkDir "scraper-worker"
Write-Host ""
Write-Host "[2/4] Baixando a ultima versao do robo..." -ForegroundColor Yellow

if (Test-Path (Join-Path $WorkDir ".git")) {
    Write-Host "  -> Atualizando instalacao existente..." -ForegroundColor Gray
    git -C $WorkDir fetch --all
    git -C $WorkDir reset --hard origin/main
} else {
    if (Test-Path $WorkDir) { Remove-Item $WorkDir -Recurse -Force -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Path $WorkDir -Force | Out-Null
    git clone https://github.com/TioYaK/Trackerplanilha.git $WorkDir
}

# Garante que a pasta existe mesmo se o git clone falhar por algum motivo
New-Item -ItemType Directory -Path $WorkerPath -Force | Out-Null

# ---- [3/4] Credenciais ----
Write-Host ""
Write-Host "[3/4] Configurando credenciais..." -ForegroundColor Yellow
$ownerName = Read-Host "Digite seu nome (Discord ou Personagem) para credito no painel"
if ([string]::IsNullOrWhiteSpace($ownerName)) { $ownerName = "Anonimo" }

$envLines = @(
    "SUPABASE_URL=$SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_KEY",
    "GUILD_NAME=$GUILD_NAME",
    "WORKER_OWNER=$ownerName"
)
$envLines | Set-Content -Path (Join-Path $WorkerPath ".env") -Encoding UTF8
Write-Host "  -> Credenciais salvas." -ForegroundColor Green

if (Test-Path $WorkerPath) {
    Write-Host "  -> Instalando modulos do Node.js..." -ForegroundColor Gray
    Push-Location $WorkerPath
    Refresh-Path
    
    # Usa npm.cmd / cmd.exe para evitar bloqueio de ExecutionPolicy no npm.ps1 do PowerShell
    $npmCmd = "C:\Program Files\nodejs\npm.cmd"
    if (-not (Test-Path $npmCmd)) {
        $npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    }
    
    if ($npmCmd -and (Test-Path $npmCmd)) {
        & $npmCmd install --no-audit --no-fund
    } else {
        cmd.exe /c "npm install --no-audit --no-fund"
    }
    Pop-Location
}

# ---- [4/4] Auto-start via Task Scheduler ----
Write-Host ""
Write-Host "[4/4] Configurando inicializacao automatica com Windows..." -ForegroundColor Yellow

Refresh-Path
$NodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodeExe -or -not (Test-Path $NodeExe)) {
    if (Test-Path "C:\Program Files\nodejs\node.exe") {
        $NodeExe = "C:\Program Files\nodejs\node.exe"
    } else {
        $NodeExe = "node.exe"
    }
}

$IndexJs  = Join-Path $WorkerPath "src\index.js"
$VbsPath  = Join-Path $WorkerPath "run_worker.vbs"

# Remove loop.bat legado para evitar janelas CMD piscando no Windows
$oldLoopBat = Join-Path $WorkerPath "loop.bat"
if (Test-Path $oldLoopBat) { Remove-Item $oldLoopBat -Force -ErrorAction SilentlyContinue }

# Cria executor VBS 100% invisível (executa Node diretamente em background sem cmd.exe ou loops de bat)
$vbsContent = @(
    'Set WshShell = CreateObject("WScript.Shell")',
    "WshShell.CurrentDirectory = `"$WorkerPath`"",
    'Do',
    "    returnVal = WshShell.Run(`"`"`"$NodeExe`"`" `"`"$IndexJs`"`"`", 0, True)",
    '    WScript.Sleep 5000',
    'Loop'
) -join "`r`n"
$vbsContent | Set-Content -Path $VbsPath -Encoding ASCII

# Registra no Task Scheduler
$taskXml = @"
<?xml version='1.0' encoding='UTF-16'?>
<Task version='1.2' xmlns='http://schemas.microsoft.com/windows/2004/02/mit/task'>
  <Triggers><LogonTrigger><Enabled>true</Enabled></LogonTrigger></Triggers>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
  </Settings>
  <Actions>
    <Exec>
      <Command>wscript.exe</Command>
      <Arguments>"$VbsPath"</Arguments>
      <WorkingDirectory>$WorkerPath</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@
$TempXml = [System.IO.Path]::GetTempFileName() + ".xml"
[System.IO.File]::WriteAllText($TempXml, $taskXml, [System.Text.Encoding]::Unicode)
schtasks /Delete /TN "AuroriaWorker" /F 2>$null | Out-Null
schtasks /Create /TN "AuroriaWorker" /XML $TempXml | Out-Null
Remove-Item $TempXml -ErrorAction SilentlyContinue

# Inicia agora se o arquivo VBS existir
if (Test-Path $VbsPath) {
    Start-Process wscript.exe -ArgumentList ("`"" + $VbsPath + "`"") -WindowStyle Hidden
} else {
    Write-Host "AVISO: O arquivo VBS nao foi encontrado em $VbsPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "    SUCESSO! O ROBO FOI INSTALADO E ESTA RODANDO!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "- Rodando em segundo plano agora." -ForegroundColor White
Write-Host "- Liga automaticamente com o Windows (Task Scheduler)." -ForegroundColor White
Write-Host "- Auto-atualizacao via GitHub a cada reinicio." -ForegroundColor White
Write-Host ""
Read-Host "Pressione ENTER para fechar"
