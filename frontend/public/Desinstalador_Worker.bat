@echo off
echo.
echo  Desinstalando o Auroria Worker...
echo.

echo  [1/3] Parando o robo em execucao...
schtasks /End /TN "AuroriaWorker" 2>nul
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM wscript.exe /T 2>nul

echo  [2/3] Removendo tarefa do Windows...
schtasks /Delete /TN "AuroriaWorker" /F 2>nul

echo  [3/3] Removendo arquivos do robo...
set WORKERDIR=%APPDATA%\AuroriaWorker
if exist "%WORKERDIR%" (
    rd /s /q "%WORKERDIR%"
    echo  Pasta %WORKERDIR% removida.
) else (
    echo  Pasta do robo nao encontrada (ja desinstalado?).
)

echo.
echo  ======================================================
echo     DESINSTALADO COM SUCESSO! O robo foi removido.
echo  ======================================================
echo.
pause
