@echo off
:: ==============================================================
::  AURORIA WORKER - Instalador em 1 clique (.bat)
:: ==============================================================
title Auroria Worker Installer
cls
echo.
echo ======================================================
echo    AURORIA WORKER - Instalador e Gerenciador de Robo
echo ======================================================
echo.
echo  Iniciando instalacao silenciosa... Aguarde.
echo.

set PS_SCRIPT=%TEMP%\Instalar_Worker.ps1
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://trackerplanilha.vercel.app/Instalar_Worker.ps1', '%PS_SCRIPT%')"

if exist "%PS_SCRIPT%" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
) else (
    echo [ERRO] Nao foi possivel baixar o script de instalacao.
    echo Verifique sua conexao de internet.
    pause
)
