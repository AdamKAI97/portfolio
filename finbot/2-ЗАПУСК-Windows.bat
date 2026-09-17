@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Finansoviy bot - rabotaet

where node >nul 2>nul
if errorlevel 1 goto nonode
if not exist "backend\.env" goto nosetup

node dev.mjs
echo.
pause
exit /b 0

:nonode
echo Node.js не найден. Установите его с сайта nodejs.org и перезагрузите компьютер.
pause
exit /b 1

:nosetup
echo Сначала запустите файл 1-НАСТРОЙКА-Windows.bat
pause
exit /b 1
