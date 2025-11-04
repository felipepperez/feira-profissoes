@echo off
REM Script para iniciar o servidor em modo desenvolvimento no Windows

echo ========================================
echo  Desenvolvimento - Iniciando Servidor
echo ========================================
echo.

REM Carregar variáveis de ambiente do arquivo .env
if exist .env (
    echo [INFO] Carregando configurações do arquivo .env
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        set "%%a=%%b"
    )
) else (
    echo [INFO] Criando .env com valores de desenvolvimento...
    echo LOCAL_IP=192.168.0.103 > .env
    echo PORT=3001 >> .env
    echo ENABLE_DNS=false >> .env
    echo NODE_ENV=development >> .env
)

REM Configurar variáveis de ambiente para desenvolvimento
if not defined PORT set PORT=3001
if not defined ENABLE_DNS set ENABLE_DNS=false
if not defined NODE_ENV set NODE_ENV=development

REM Definir variáveis de ambiente para o Node.js
set PORT=%PORT%
set ENABLE_DNS=%ENABLE_DNS%
set NODE_ENV=%NODE_ENV%

echo [INFO] Configuracoes:
echo   - Porta: %PORT%
echo   - DNS: %ENABLE_DNS%
echo   - Ambiente: %NODE_ENV%
echo.

echo [INFO] Iniciando servidor em modo desenvolvimento...
echo.

REM Iniciar o servidor Node.js
node server/index.js

