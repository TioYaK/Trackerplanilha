@echo off
title Desinstalador - Tracker Planilhado
color 0C

:: Tenta escalar para Administrador automaticamente para matar processos fantasmas blindados
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando privilegios de Administrador para limpeza profunda...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo     DESINSTALADOR DO WORKER - BATTLESTORM TRACKER
echo ========================================================
echo.
echo Este script vai:
echo 1. Encerrar todos os robos (Workers) rodando em segundo plano.
echo 2. Remover a inicializacao automatica com o Windows.
echo 3. Apagar todos os codigos e pastas relacionados ao Tracker.
echo.
echo Pressione qualquer tecla para iniciar a desinstalacao...
pause >nul

echo.
echo [1/3] Encerrando processos do Worker...
powershell -Command "Get-CimInstance Win32_Process -Filter \"name='cscript.exe'\" | Where-Object { $_.CommandLine -match 'StartAuroriaWorker.vbs' } | Invoke-CimMethod -MethodName Terminate" >nul 2>&1
powershell -Command "Get-CimInstance Win32_Process -Filter \"name='cmd.exe'\" | Where-Object { $_.CommandLine -match 'loop.bat' } | Invoke-CimMethod -MethodName Terminate" >nul 2>&1
powershell -Command "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | Where-Object { $_.CommandLine -match 'src/index.js' -or $_.CommandLine -match 'AuroriaWorker' } | Invoke-CimMethod -MethodName Terminate" >nul 2>&1
:: Mata processos do Chrome invisiveis que podem ter ficado orfaos (Puppeteer) sem fechar o Chrome principal do usuario
powershell -Command "Get-CimInstance Win32_Process -Filter \"name='chrome.exe'\" | Where-Object { $_.CommandLine -match 'puppeteer' -or $_.CommandLine -match '--headless=new' } | Invoke-CimMethod -MethodName Terminate" >nul 2>&1

echo [2/3] Removendo o auto-iniciar do Windows...
del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\StartAuroriaWorker.vbs" >nul 2>&1

echo [3/3] Apagando arquivos e pasta do Tracker...
:: Tenta matar qualquer travamento remanescente antes de apagar a pasta
powershell -Command "Start-Sleep -Seconds 2"
powershell -Command "Remove-Item -Recurse -Force \"$env:APPDATA\AuroriaWorker*\" -ErrorAction SilentlyContinue" >nul 2>&1

echo.
echo ========================================================
echo     DESINSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================================
echo O Worker foi completamente removido do seu computador.
echo O Node.js e o Git permanecem intactos, pois podem ser
echo usados por outros programas do seu Windows.
echo.
echo Pressione qualquer tecla para sair.
pause >nul
exit
