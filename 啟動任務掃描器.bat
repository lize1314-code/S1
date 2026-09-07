@echo off
chcp 65001 >nul
title RPG Maker MZ 任務掃描器

echo.
echo ==============================================
echo   RPG Maker MZ 任務掃描器
echo   QuestIDScanner_MZ v20.0
echo ==============================================
echo.
echo 正在啟動任務掃描器...
echo.

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QuestIDScanner_MZ.ps1"

echo.
echo ==============================================
echo   任務掃描完成
echo ==============================================
echo.
echo 報告檔案：
echo   QuestID_Report.html
echo   QuestID_Report.csv
echo   QuestID_Report.txt
echo.

pause