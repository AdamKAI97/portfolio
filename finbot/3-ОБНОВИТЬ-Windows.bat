@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Obnovlenie proekta

where node >nul 2>nul
if errorlevel 1 goto nonode

node update.mjs
echo.
pause
exit /b 0

:nonode
echo Node.js не найден. Установите его с сайта nodejs.org и перезагрузите компьютер.
pause
exit /b 1
