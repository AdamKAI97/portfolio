@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Nastroyka - Finansoviy bot

echo.
echo ==============================================
echo   НАСТРОЙКА ФИНАНСОВОГО БОТА
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto nonode

node setup.mjs
echo.
echo Готово. Теперь закройте это окно и запустите файл: 2-ЗАПУСК-Windows.bat
echo.
pause
exit /b 0

:nonode
echo Node.js не найден на компьютере.
echo.
echo Откройте сайт nodejs.org, скачайте версию LTS, установите её,
echo перезагрузите компьютер и запустите этот файл снова.
echo.
pause
exit /b 1
