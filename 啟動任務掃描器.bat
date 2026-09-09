@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================================
echo          RPG Maker MZ 任務 ID 掃描器
echo          QuestIDScanner_MZ
echo ============================================================
echo.

echo 正在啟動任務掃描器...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QuestIDScanner_MZ.ps1"

echo.
echo ============================================================
echo          任務掃描完成
echo ============================================================
echo.

pause