@echo off
title Desinstalador - Tracker Planilhado
color 0C

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
wmic process where "name='cscript.exe' and commandline like '%%StartAuroriaWorker.vbs%%'" call terminate >nul 2>&1
wmic process where "name='cmd.exe' and commandline like '%%loop.bat%%'" call terminate >nul 2>&1
wmic process where "name='node.exe' and commandline like '%%src/index.js%%'" call terminate >nul 2>&1
:: Mata processos do Chrome invisiveis que podem ter ficado orfaos (Puppeteer)
wmic process where "name='chrome.exe' and commandline like '%%--remote-debugging-port%%'" call terminate >nul 2>&1

echo [2/3] Removendo o auto-iniciar do Windows...
del /F /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\StartAuroriaWorker.vbs" >nul 2>&1

echo [3/3] Apagando arquivos e pasta do Tracker...
rmdir /S /Q "%APPDATA%\AuroriaWorker" >nul 2>&1

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
