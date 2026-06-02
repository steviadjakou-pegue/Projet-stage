@echo off
title Demarrage du Bot Node.js
echo =========================================
echo Implementation et Lancement du Bot
echo =========================================
echo.
echo [1/2] Installation des dependances (npm install)...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] L'installation des dependances a echoue.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Lancement du bot (node bot.js)...
echo -----------------------------------------
node bot.js

if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le bot s'est arrete avec une erreur.
)

echo.
echo Le processus est termine.
pause