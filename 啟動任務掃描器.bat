@echo off

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QuestIDScanner_MZ.ps1"

pause