@echo off
title CloudSentinel - Stopping...
echo Stopping CloudSentinel services...
taskkill /f /fi "WINDOWTITLE eq CloudSentinel Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq CloudSentinel Frontend" >nul 2>&1
echo [OK] CloudSentinel stopped.
timeout /t 2 /nobreak >nul
