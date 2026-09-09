# ============================================================
# RPG Maker MZ Quest ID Scanner
# Version 22.0 Stable
# QuestSystem_MZ_Core
# PowerShell 5.1+
#
# v22.0 修正：
# 1. 同一 Event 不同 Page 的相同 Quest ID 不再誤判為重複
# 2. 同一 Event + 同一 Page 出現兩次才算重複
# 3. 不同 Event 使用相同 Quest ID 仍會判定為真正重複
# 4. AddQuestProgress / CompleteQuest / TrackQuest 等相關指令
#    不會被當成新的任務定義
# 5. 保留 TXT / CSV / HTML 報告
# ============================================================

$ErrorActionPreference = "Continue"

# ============================================================
# PATH
# ============================================================

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$DataPath = Join-Path $Root "data"

$HtmlPath = Join-Path $Root "QuestID_Report.html"
$CsvPath  = Join-Path $Root "QuestID_Report.csv"
$TxtPath  = Join-Path $Root "QuestID_Report.txt"

$Utf8 = New-Object System.Text.UTF8Encoding($false)

# ============================================================
# HEADER
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " RPG Maker MZ 任務掃描器"
Write-Host " QuestIDScanner_MZ v22.0"
Write-Host " QuestSystem_MZ_Core"
Write-Host "============================================================"
Write-Host ""

# ============================================================
# CHECK DATA
# ============================================================

if (-not (Test-Path -LiteralPath $DataPath)) {

    Write-Host "錯誤：找不到 data 資料夾。" -ForegroundColor Red
    Write-Host ""
    Write-Host "目前程式位置："
    Write-Host $Root
    Write-Host ""
    Write-Host "應該存在："
    Write-Host $DataPath
    Write-Host ""

    Read-Host "按 Enter 結束"
    exit
}

# ============================================================
# ARRAYS
# ============================================================

$QuestList = New-Object System.Collections.ArrayList
$RelatedList = New-Object System.Collections.ArrayList

$MapNames = @{}

# ============================================================
# SAFE STRING
# ============================================================

function Safe-String {

    param(
        $Value
    )

    if ($null -eq $Value) {
        return ""
    }

    try {
        return [string]$Value
    }
    catch {
        return ""
    }
}

# ============================================================
# HTML ENCODE
# ============================================================

function Html-Encode {

    param(
        $Value
    )

    $Text = Safe-String $Value

    if ([string]::IsNullOrEmpty($Text)) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode($Text)
}

# ============================================================
# GET PROPERTY
# ============================================================

function Get-Prop {

    param(
        $Object,
        [string]$Name
    )

    if ($null -eq $Object) {
        return ""
    }

    try {

        $Property = $Object.PSObject.Properties[$Name]

        if ($null -ne $Property) {
            return Safe-String $Property.Value
        }

    }
    catch {
    }

    return ""
}

# ============================================================
# PARSE JSON OBJECT
# ============================================================

function Parse-JsonObject {

    param(
        $Value
    )

    if ($null -eq $Value) {
        return $null
    }

    if ($Value -is [System.Management.Automation.PSCustomObject]) {
        return $Value
    }

    $Text = Safe-String $Value

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    $Text = $Text.Trim()

    if (-not $Text.StartsWith("{")) {
        return $null
    }

    try {
        return ($Text | ConvertFrom-Json)
    }
    catch {
        return $null
    }
}

# ============================================================
# GET QUEST COMMAND
# ============================================================

function Get-QuestCommand {

    param(
        $Command
    )

    if ($null -eq $Command) {
        return $null
    }

    $Code = 0

    try {
        $Code = [int]$Command.code
    }
    catch {
        return $null
    }

    # RPG Maker MZ Plugin Command
    if ($Code -ne 357) {
        return $null
    }

    $Parameters = @()

    try {
        $Parameters = @($Command.parameters)
    }
    catch {
        return $null
    }

    if ($Parameters.Count -lt 2) {
        return $null
    }

    $PluginName = Safe-String $Parameters[0]
    $CommandName = Safe-String $Parameters[1]

    # ========================================================
    # 支援：
    # QuestSystem_MZ_Core
    # QuestSystem_MZ
    # ========================================================

    $IsQuestPlugin = $false

    if (
        $PluginName.Equals(
            "QuestSystem_MZ_Core",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $IsQuestPlugin = $true
    }

    if (
        $PluginName.Equals(
            "QuestSystem_MZ",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $IsQuestPlugin = $true
    }

    if (-not $IsQuestPlugin) {
        return $null
    }

    # ========================================================
    # RPG Maker MZ parameters[2] 通常是 JSON 字串
    # ========================================================

    $Arguments = $null

    if ($Parameters.Count -ge 3) {

        foreach ($Parameter in $Parameters) {

            $Object = Parse-JsonObject $Parameter

            if ($null -ne $Object) {

                $Arguments = $Object
                break
            }
        }
    }

    return [PSCustomObject]@{
        PluginName = $PluginName
        CommandName = $CommandName
        Arguments = $Arguments
        Parameters = $Parameters
    }
}

# ============================================================
# GET QUEST ID
# ============================================================

function Get-QuestId {

    param(
        $Arguments
    )

    if ($null -eq $Arguments) {
        return ""
    }

    $Value = Get-Prop $Arguments "questId"

    if ([string]::IsNullOrWhiteSpace($Value)) {
        $Value = Get-Prop $Arguments "id"
    }

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }

    $Text = $Value.Trim()

    # 001 / 002 / 009 / 12
    if ($Text -match '^\d+$') {

        try {
            return ([int]$Text).ToString("000")
        }
        catch {
            return ""
        }
    }

    # 如果前面有文字，抓第一組數字
    if ($Text -match '(\d+)') {

        try {
            return ([int]$Matches[1]).ToString("000")
        }
        catch {
            return ""
        }
    }

    return ""
}

# ============================================================
# GET RELATED ID
# ============================================================

function Get-RelatedId {

    param(
        $Arguments
    )

    if ($null -eq $Arguments) {
        return ""
    }

    return Get-QuestId $Arguments
}

# ============================================================
# MAP INFOS
# ============================================================

$MapInfosPath = Join-Path $DataPath "MapInfos.json"

if (Test-Path -LiteralPath $MapInfosPath) {

    try {

        $MapInfoText = Get-Content `
            -LiteralPath $MapInfosPath `
            -Raw `
            -Encoding UTF8

        $MapInfoData = $MapInfoText | ConvertFrom-Json

        foreach ($Info in @($MapInfoData)) {

            if ($null -eq $Info) {
                continue
            }

            try {

                $MapId = [int]$Info.id
                $MapName = Safe-String $Info.name

                if ($MapId -gt 0) {
                    $MapNames[$MapId] = $MapName
                }

            }
            catch {
            }
        }

    }
    catch {

        Write-Host ""
        Write-Host "警告：MapInfos.json 無法讀取。" -ForegroundColor Yellow
        Write-Host ""
    }
}

# ============================================================
# GET MAP NAME
# ============================================================

function Get-MapName {

    param(
        [int]$MapId
    )

    if ($MapNames.ContainsKey($MapId)) {

        $Name = Safe-String $MapNames[$MapId]

        if (-not [string]::IsNullOrWhiteSpace($Name)) {
            return $Name
        }
    }

    return (
        "Map " +
        $MapId.ToString("000")
    )
}

# ============================================================
# FIND MAP FILES
# ============================================================

$MapFiles = @()

try {

    $MapFiles = @(
        Get-ChildItem `
            -LiteralPath $DataPath `
            -Filter "Map*.json" `
            -File |
        Where-Object {
            $_.BaseName -match '^Map\d+$'
        } |
        Sort-Object Name
    )

}
catch {

    Write-Host ""
    Write-Host "錯誤：無法讀取 Map JSON。" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""

}

Write-Host (
    "找到 Map 檔案：" +
    $MapFiles.Count
)

Write-Host ""

# ============================================================
# SCAN MAPS
# ============================================================

foreach ($MapFile in $MapFiles) {

    $MapIdText = $MapFile.BaseName.Substring(3)
    $MapId = 0

    if (
        -not [int]::TryParse(
            $MapIdText,
            [ref]$MapId
        )
    ) {
        continue
    }

    if ($MapId -le 0) {
        continue
    }

    $MapName = Get-MapName $MapId

    Write-Host "------------------------------------------------------------"

    Write-Host (
        "[Map " +
        $MapId.ToString("000") +
        "] " +
        $MapName
    )

    # ========================================================
    # READ MAP JSON
    # ========================================================

    try {

        $MapText = Get-Content `
            -LiteralPath $MapFile.FullName `
            -Raw `
            -Encoding UTF8

        $MapData = $MapText | ConvertFrom-Json

    }
    catch {

        Write-Host ""
        Write-Host "JSON ERROR：" -ForegroundColor Red
        Write-Host $MapFile.FullName -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""

        continue
    }

    if ($null -eq $MapData.events) {

        Write-Host "沒有事件。"
        continue
    }

    $StartCount = 0
    $RelatedCount = 0

    # ========================================================
    # EVENTS
    # ========================================================

    foreach ($Event in @($MapData.events)) {

        if ($null -eq $Event) {
            continue
        }

        $EventId = 0

        try {
            $EventId = [int]$Event.id
        }
        catch {
            continue
        }

        if ($EventId -le 0) {
            continue
        }

        $EventName = Safe-String $Event.name

        $PageNumber = 0

        # ====================================================
        # EVENT PAGES
        # ====================================================

        foreach ($Page in @($Event.pages)) {

            $PageNumber++

            if ($null -eq $Page) {
                continue
            }

            if ($null -eq $Page.list) {
                continue
            }

            $CommandIndex = -1

            # =================================================
            # EVENT COMMANDS
            # =================================================

            foreach ($Command in @($Page.list)) {

                $CommandIndex++

                $QuestCommand = Get-QuestCommand $Command

                if ($null -eq $QuestCommand) {
                    continue
                }

                $CommandName = Safe-String $QuestCommand.CommandName
                $Arguments = $QuestCommand.Arguments

                # =================================================
                # START QUEST
                # =================================================

                if (
                    $CommandName.Equals(
                        "StartQuest",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {

                    $QuestId = Get-QuestId $Arguments

                    $QuestName = Get-Prop `
                        $Arguments `
                        "questName"

                    $Description = Get-Prop `
                        $Arguments `
                        "description"

                    $Objective = Get-Prop `
                        $Arguments `
                        "objective"

                    $Type = Get-Prop `
                        $Arguments `
                        "type"

                    $Target = Get-Prop `
                        $Arguments `
                        "target"

                    $Amount = Get-Prop `
                        $Arguments `
                        "amount"

                    $Category = Get-Prop `
                        $Arguments `
                        "category"

                    $StartSwitch = Get-Prop `
                        $Arguments `
                        "startSwitch"

                    $CompleteSwitch = Get-Prop `
                        $Arguments `
                        "completeSwitch"

                    # =================================================
                    # 建立任務資料
                    # =================================================

                    $Record = [PSCustomObject]@{

                        ID = $QuestId

                        QuestName = $QuestName

                        Description = $Description

                        Objective = $Objective

                        Type = $Type

                        Target = $Target

                        Amount = $Amount

                        Category = $Category

                        StartSwitch = $StartSwitch

                        CompleteSwitch = $CompleteSwitch

                        MapID = $MapId

                        MapName = $MapName

                        MapFile = $MapFile.Name

                        EventID = $EventId

                        EventName = $EventName

                        EventX = $Event.x

                        EventY = $Event.y

                        Page = $PageNumber

                        CommandIndex = $CommandIndex

                        PluginCommand = $CommandName

                    }

                    [void]$QuestList.Add($Record)

                    $StartCount++

                    Write-Host (
                        "  StartQuest -> ID " +
                        $QuestId +
                        " | " +
                        $QuestName +
                        " | Event " +
                        $EventId +
                        " | Page " +
                        $PageNumber
                    ) -ForegroundColor Green

                    continue
                }

                # =================================================
                # RELATED COMMAND
                # =================================================

                $IsRelated = $false

                if (
                    $CommandName.Equals(
                        "AddQuestProgress",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {
                    $IsRelated = $true
                }

                if (
                    $CommandName.Equals(
                        "AddItemProgress",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {
                    $IsRelated = $true
                }

                if (
                    $CommandName.Equals(
                        "CompleteQuest",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {
                    $IsRelated = $true
                }

                if (
                    $CommandName.Equals(
                        "TrackQuest",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {
                    $IsRelated = $true
                }

                if (
                    $CommandName.Equals(
                        "UntrackQuest",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {
                    $IsRelated = $true
                }

                if ($IsRelated) {

                    $RelatedId = Get-RelatedId $Arguments

                    $RelatedAmount = Get-Prop `
                        $Arguments `
                        "amount"

                    if (
                        [string]::IsNullOrWhiteSpace(
                            $RelatedAmount
                        )
                    ) {

                        $RelatedAmount = Get-Prop `
                            $Arguments `
                            "value"
                    }

                    $RelatedRecord = [PSCustomObject]@{

                        ID = $RelatedId

                        Command = $CommandName

                        Amount = $RelatedAmount

                        MapID = $MapId

                        MapName = $MapName

                        MapFile = $MapFile.Name

                        EventID = $EventId

                        EventName = $EventName

                        EventX = $Event.x

                        EventY = $Event.y

                        Page = $PageNumber

                        CommandIndex = $CommandIndex
                    }

                    [void]$RelatedList.Add(
                        $RelatedRecord
                    )

                    $RelatedCount++
                }
            }
        }
    }

    Write-Host (
        "  StartQuest：" +
        $StartCount +
        " | 相關指令：" +
        $RelatedCount
    )
}

# ============================================================
# SORT
# ============================================================

$SortedQuests = @(
    $QuestList |
    Sort-Object ID, MapID, EventID, Page, CommandIndex
)

$SortedRelated = @(
    $RelatedList |
    Sort-Object ID, MapID, EventID, Page, CommandIndex
)

# ============================================================
# DUPLICATE QUEST IDS
#
# v22.0 核心修正
#
# 規則：
#
# 1. 同一 ID + 同一 Event + 不同 Page
#    → 不算重複
#
# 2. 同一 ID + 同一 Event + 同一 Page
#    出現兩次以上
#    → 算重複
#
# 3. 同一 ID 出現在不同 Event
#    → 算重複
#
# 這樣可以避免：
#
# Event 5 / Page 1 / ID 006
# Event 5 / Page 3 / ID 006
#
# 被錯誤判定為重複。
# ============================================================

$DuplicateGroups = New-Object System.Collections.ArrayList

$QuestGroups = @(
    $SortedQuests |
    Where-Object {
        -not [string]::IsNullOrWhiteSpace($_.ID)
    } |
    Group-Object ID
)

foreach ($Group in $QuestGroups) {

    $Items = @($Group.Group)

    if ($Items.Count -le 1) {
        continue
    }

    # ========================================================
    # 判斷是否真的重複
    # ========================================================

    $IsDuplicate = $false

    # --------------------------------------------------------
    # A. 不同 Event 使用相同 Quest ID
    # --------------------------------------------------------

    $EventKeys = @(
        $Items |
        ForEach-Object {
            (
                $_.MapID.ToString("000") +
                "|" +
                $_.EventID.ToString()
            )
        } |
        Sort-Object -Unique
    )

    if ($EventKeys.Count -gt 1) {
        $IsDuplicate = $true
    }

    # --------------------------------------------------------
    # B. 同一 Event + 同一 Page 使用相同 Quest ID
    # --------------------------------------------------------

    if (-not $IsDuplicate) {

        $PageGroups = @(
            $Items |
            Group-Object {
                (
                    $_.MapID.ToString("000") +
                    "|" +
                    $_.EventID.ToString() +
                    "|" +
                    $_.Page.ToString()
                )
            }
        )

        foreach ($PageGroup in $PageGroups) {

            if ($PageGroup.Count -gt 1) {

                $IsDuplicate = $true
                break
            }
        }
    }

    # --------------------------------------------------------
    # C. 真正重複才加入報告
    # --------------------------------------------------------

    if ($IsDuplicate) {

        [void]$DuplicateGroups.Add(
            [PSCustomObject]@{
                Name = $Group.Name
                Count = $Items.Count
                Group = $Items
            }
        )
    }
}

$DuplicateGroups = @(
    $DuplicateGroups |
    Sort-Object Name
)

# ============================================================
# USED IDS
# ============================================================

$UsedIds = @{}
$MaxId = 0

foreach ($Quest in $SortedQuests) {

    if (
        [string]::IsNullOrWhiteSpace(
            $Quest.ID
        )
    ) {
        continue
    }

    try {

        $Number = [int]$Quest.ID

        if ($Number -gt 0) {

            $UsedIds[$Number] = $true

            if ($Number -gt $MaxId) {
                $MaxId = $Number
            }
        }

    }
    catch {
    }
}

# ============================================================
# UNUSED IDS
# ============================================================

$UnusedIds = New-Object System.Collections.ArrayList

if ($MaxId -gt 0) {

    for (
        $i = 1;
        $i -le $MaxId;
        $i++
    ) {

        if (
            -not $UsedIds.ContainsKey($i)
        ) {

            [void]$UnusedIds.Add(
                $i.ToString("000")
            )
        }
    }
}

# ============================================================
# CONSOLE SUMMARY
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " 掃描完成"
Write-Host "============================================================"

Write-Host (
    "任務數量：" +
    $SortedQuests.Count
) -ForegroundColor Green

Write-Host (
    "最大 ID ：" +
    $MaxId.ToString("000")
)

Write-Host (
    "真正重複 ID ：" +
    $DuplicateGroups.Count
)

Write-Host (
    "未使用 ID：" +
    $UnusedIds.Count
)

Write-Host ""

# ============================================================
# TXT REPORT
# ============================================================

$TxtLines = New-Object System.Collections.ArrayList

[void]$TxtLines.Add(
    "RPG Maker MZ 任務 ID 掃描報告"
)

[void]$TxtLines.Add(
    "QuestIDScanner_MZ v22.0"
)

[void]$TxtLines.Add(
    "QuestSystem_MZ_Core"
)

[void]$TxtLines.Add(
    "============================================================"
)

[void]$TxtLines.Add(
    "任務數量：" +
    $SortedQuests.Count
)

[void]$TxtLines.Add(
    "最大 ID：" +
    $MaxId.ToString("000")
)

[void]$TxtLines.Add(
    "真正重複 ID：" +
    $DuplicateGroups.Count
)

[void]$TxtLines.Add(
    "未使用 ID：" +
    $UnusedIds.Count
)

[void]$TxtLines.Add("")

[void]$TxtLines.Add(
    "============================================================"
)

[void]$TxtLines.Add(
    "任務列表"
)

[void]$TxtLines.Add(
    "============================================================"
)

foreach ($Quest in $SortedQuests) {

    $Line =
        "ID " +
        $Quest.ID +
        " | " +
        $Quest.QuestName +
        " | Map " +
        $Quest.MapID.ToString("000") +
        " " +
        $Quest.MapName +
        " | Event " +
        $Quest.EventID +
        " " +
        $Quest.EventName +
        " | Page " +
        $Quest.Page

    [void]$TxtLines.Add($Line)
}

[void]$TxtLines.Add("")

[void]$TxtLines.Add(
    "============================================================"
)

[void]$TxtLines.Add(
    "真正重複任務 ID"
)

[void]$TxtLines.Add(
    "============================================================"
)

if ($DuplicateGroups.Count -eq 0) {

    [void]$TxtLines.Add(
        "沒有真正重複任務 ID。"
    )

}
else {

    foreach ($Group in $DuplicateGroups) {

        [void]$TxtLines.Add(
            "ID " +
            $Group.Name +
            " 重複 " +
            $Group.Count +
            " 次"
        )

        foreach ($Quest in $Group.Group) {

            [void]$TxtLines.Add(
                "  Map " +
                $Quest.MapID.ToString("000") +
                " / " +
                $Quest.MapName +
                " / Event " +
                $Quest.EventID +
                " / " +
                $Quest.EventName +
                " / Page " +
                $Quest.Page
            )
        }
    }
}

[void]$TxtLines.Add("")

[void]$TxtLines.Add(
    "============================================================"
)

[void]$TxtLines.Add(
    "未使用任務 ID"
)

[void]$TxtLines.Add(
    "============================================================"
)

if ($UnusedIds.Count -eq 0) {

    [void]$TxtLines.Add(
        "沒有未使用 ID。"
    )

}
else {

    [void]$TxtLines.Add(
        ($UnusedIds -join ", ")
    )
}

[System.IO.File]::WriteAllLines(
    $TxtPath,
    $TxtLines,
    $Utf8
)

Write-Host ""
Write-Host "TXT 已建立：" -ForegroundColor Green
Write-Host $TxtPath

# ============================================================
# CSV REPORT
# ============================================================

$CsvRows = @()

foreach ($Quest in $SortedQuests) {

    $CsvRows += [PSCustomObject]@{

        ID = $Quest.ID

        QuestName = $Quest.QuestName

        Description = $Quest.Description

        Objective = $Quest.Objective

        Type = $Quest.Type

        Target = $Quest.Target

        Amount = $Quest.Amount

        Category = $Quest.Category

        StartSwitch = $Quest.StartSwitch

        CompleteSwitch = $Quest.CompleteSwitch

        Map = $Quest.MapName

        MapID = $Quest.MapID.ToString("000")

        MapFile = $Quest.MapFile

        Event = $Quest.EventName

        EventID = $Quest.EventID

        EventX = $Quest.EventX

        EventY = $Quest.EventY

        Page = $Quest.Page

        Command = $Quest.PluginCommand
    }
}

if ($CsvRows.Count -gt 0) {

    $CsvRows |
        Export-Csv `
            -LiteralPath $CsvPath `
            -NoTypeInformation `
            -Encoding UTF8
}

Write-Host ""
Write-Host "CSV 已建立：" -ForegroundColor Green
Write-Host $CsvPath

# ============================================================
# HTML REPORT
# ============================================================

$Html = New-Object System.Text.StringBuilder

# ============================================================
# HTML HEADER
# ============================================================

[void]$Html.AppendLine(
    '<!DOCTYPE html>'
)

[void]$Html.AppendLine(
    '<html lang="zh-Hant">'
)

[void]$Html.AppendLine(
    '<head>'
)

[void]$Html.AppendLine(
    '<meta charset="UTF-8">'
)

[void]$Html.AppendLine(
    '<meta name="viewport" content="width=device-width, initial-scale=1">'
)

[void]$Html.AppendLine(
    '<title>RPG Maker MZ 任務 ID 掃描報告</title>'
)

[void]$Html.AppendLine(
    '<style>'
)

[void]$Html.AppendLine(
    'body{font-family:"Microsoft JhengHei",Arial,sans-serif;background:#eef2f4;margin:0;padding:20px;color:#222;}'
)

[void]$Html.AppendLine(
    '.box{background:#fff;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:auto;}'
)

[void]$Html.AppendLine(
    'h1{margin-top:0;}'
)

[void]$Html.AppendLine(
    'h2{margin-top:0;}'
)

[void]$Html.AppendLine(
    '.stats{display:flex;gap:12px;flex-wrap:wrap;}'
)

[void]$Html.AppendLine(
    '.stat{background:#f3f6f7;padding:14px 20px;border-radius:8px;}'
)

[void]$Html.AppendLine(
    'table{width:100%;border-collapse:collapse;}'
)

[void]$Html.AppendLine(
    'th{background:#405762;color:#fff;padding:10px;text-align:left;}'
)

[void]$Html.AppendLine(
    'td{padding:10px;border-bottom:1px solid #ddd;vertical-align:top;}'
)

[void]$Html.AppendLine(
    '.id{color:#06c;text-decoration:underline;cursor:pointer;font-weight:bold;font-size:17px;}'
)

[void]$Html.AppendLine(
    '.detail{display:none;background:#f7fafb;}'
)

[void]$Html.AppendLine(
    '.dup{background:#fff0f0;border:1px solid #d99;padding:12px;border-radius:7px;margin:8px 0;}'
)

[void]$Html.AppendLine(
    '.unused{display:inline-block;background:#fff0b5;padding:5px 9px;border-radius:5px;margin:3px;}'
)

[void]$Html.AppendLine(
    '.ok{color:#168348;font-weight:bold;}'
)

[void]$Html.AppendLine(
    '.rule{background:#edf7ff;border-left:5px solid #4285c5;padding:12px;margin:10px 0;}'
)

[void]$Html.AppendLine(
    '.search{width:100%;padding:11px;box-sizing:border-box;border:1px solid #bbb;border-radius:6px;font-size:16px;}'
)

[void]$Html.AppendLine(
    '.cmd{background:#e5f1ff;padding:4px 8px;border-radius:5px;}'
)

[void]$Html.AppendLine(
    '</style>'
)

# ============================================================
# JAVASCRIPT
# ============================================================

[void]$Html.AppendLine(
    '<script>'
)

[void]$Html.AppendLine(
    'function toggleDetail(id){'
)

[void]$Html.AppendLine(
    'var row=document.getElementById(id);'
)

[void]$Html.AppendLine(
    'if(!row)return;'
)

[void]$Html.AppendLine(
    'row.style.display=(row.style.display==="table-row")?"none":"table-row";'
)

[void]$Html.AppendLine(
    '}'
)

[void]$Html.AppendLine(
    'function searchQuest(){'
)

[void]$Html.AppendLine(
    'var q=document.getElementById("searchBox").value.toLowerCase();'
)

[void]$Html.AppendLine(
    'var rows=document.getElementsByClassName("questrow");'
)

[void]$Html.AppendLine(
    'for(var i=0;i<rows.length;i++){'
)

[void]$Html.AppendLine(
    'var text=rows[i].innerText.toLowerCase();'
)

[void]$Html.AppendLine(
    'rows[i].style.display=text.indexOf(q)>=0?"":"none";'
)

[void]$Html.AppendLine(
    '}'
)

[void]$Html.AppendLine(
    '}'
)

[void]$Html.AppendLine(
    '</script>'
)

[void]$Html.AppendLine(
    '</head>'
)

[void]$Html.AppendLine(
    '<body>'
)

# ============================================================
# TITLE
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<h1>RPG Maker MZ 任務 ID 掃描報告</h1>'
)

[void]$Html.AppendLine(
    '<p>QuestIDScanner_MZ v22.0</p>'
)

[void]$Html.AppendLine(
    '<div class="rule">'
)

[void]$Html.AppendLine(
    '<b>重複判定規則：</b><br>'
)

[void]$Html.AppendLine(
    '同一 Event 不同 Page 的相同 Quest ID 不算重複。<br>'
)

[void]$Html.AppendLine(
    '同一 Event + 同一 Page 出現相同 Quest ID 兩次以上，才算重複。<br>'
)

[void]$Html.AppendLine(
    '不同 Event 使用相同 Quest ID，算真正重複。'
)

[void]$Html.AppendLine(
    '</div>'
)

[void]$Html.AppendLine(
    '<div class="stats">'
)

[void]$Html.AppendLine(
    (
        '<div class="stat">任務數量：<b>' +
        $SortedQuests.Count +
        '</b></div>'
    )
)

[void]$Html.AppendLine(
    (
        '<div class="stat">最大 ID：<b>' +
        $MaxId.ToString("000") +
        '</b></div>'
    )
)

[void]$Html.AppendLine(
    (
        '<div class="stat">真正重複 ID：<b>' +
        $DuplicateGroups.Count +
        '</b></div>'
    )
)

[void]$Html.AppendLine(
    (
        '<div class="stat">未使用 ID：<b>' +
        $UnusedIds.Count +
        '</b></div>'
    )
)

[void]$Html.AppendLine(
    '</div>'
)

[void]$Html.AppendLine(
    '</div>'
)

# ============================================================
# SEARCH
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<h2>搜尋任務</h2>'
)

[void]$Html.AppendLine(
    '<input id="searchBox" class="search" onkeyup="searchQuest()" placeholder="搜尋 ID、任務名稱、Map、Event...">'
)

[void]$Html.AppendLine(
    '</div>'
)

# ============================================================
# UNUSED IDS
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<h2>未使用任務 ID</h2>'
)

if ($UnusedIds.Count -eq 0) {

    [void]$Html.AppendLine(
        '<div class="ok">沒有未使用 ID。</div>'
    )

}
else {

    foreach ($Id in $UnusedIds) {

        [void]$Html.AppendLine(
            (
                '<span class="unused">' +
                (Html-Encode $Id) +
                '</span>'
            )
        )
    }
}

[void]$Html.AppendLine(
    '</div>'
)

# ============================================================
# DUPLICATES
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<h2>真正重複任務 ID</h2>'
)

if ($DuplicateGroups.Count -eq 0) {

    [void]$Html.AppendLine(
        '<div class="ok">沒有真正重複任務 ID。</div>'
    )

}
else {

    foreach ($Group in $DuplicateGroups) {

        [void]$Html.AppendLine(
            (
                '<div class="dup"><b>ID ' +
                (Html-Encode $Group.Name) +
                ' 重複 ' +
                $Group.Count +
                ' 次</b>'
            )
        )

        foreach ($Quest in $Group.Group) {

            [void]$Html.AppendLine(
                (
                    '<div style="margin-top:6px;">' +
                    'Map ' +
                    $Quest.MapID.ToString("000") +
                    ' / ' +
                    (Html-Encode $Quest.MapName) +
                    ' / Event ' +
                    $Quest.EventID +
                    ' / ' +
                    (Html-Encode $Quest.EventName) +
                    ' / Page ' +
                    $Quest.Page +
                    '</div>'
                )
            )
        }

        [void]$Html.AppendLine(
            '</div>'
        )
    }
}

[void]$Html.AppendLine(
    '</div>'
)

# ============================================================
# QUEST LIST
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<h2>任務清單</h2>'
)

[void]$Html.AppendLine(
    '<p>點擊藍色 ID 可以展開任務詳細資料。</p>'
)

[void]$Html.AppendLine(
    '<table>'
)

[void]$Html.AppendLine(
    '<thead>'
)

[void]$Html.AppendLine(
    '<tr>'
)

[void]$Html.AppendLine(
    '<th>ID</th>'
)

[void]$Html.AppendLine(
    '<th>任務名稱</th>'
)

[void]$Html.AppendLine(
    '<th>Map</th>'
)

[void]$Html.AppendLine(
    '<th>Event</th>'
)

[void]$Html.AppendLine(
    '<th>Page</th>'
)

[void]$Html.AppendLine(
    '<th>Type</th>'
)

[void]$Html.AppendLine(
    '<th>Target</th>'
)

[void]$Html.AppendLine(
    '<th>Amount</th>'
)

[void]$Html.AppendLine(
    '</tr>'
)

[void]$Html.AppendLine(
    '</thead>'
)

[void]$Html.AppendLine(
    '<tbody>'
)

$DetailIndex = 0

foreach ($Quest in $SortedQuests) {

    $DetailIndex++

    $DetailId =
        "detail_" +
        $DetailIndex.ToString()

    # ========================================================
    # MAIN ROW
    # ========================================================

    [void]$Html.AppendLine(
        '<tr class="questrow">'
    )

    $JsDetailId =
        $DetailId.Replace(
            "'",
            "\'"
        )

    [void]$Html.AppendLine(
        (
            '<td><span class="id" onclick="toggleDetail(''' +
            $JsDetailId +
            ''')">' +
            (Html-Encode $Quest.ID) +
            '</span></td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Quest.QuestName) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>Map ' +
            $Quest.MapID.ToString("000") +
            '<br><small>' +
            (Html-Encode $Quest.MapName) +
            '</small></td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>Event ' +
            $Quest.EventID +
            '<br><small>' +
            (Html-Encode $Quest.EventName) +
            '</small></td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            $Quest.Page +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Quest.Type) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Quest.Target) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Quest.Amount) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        '</tr>'
    )

    # ========================================================
    # DETAIL ROW
    # ========================================================

    [void]$Html.AppendLine(
        (
            '<tr id="' +
            (Html-Encode $DetailId) +
            '" class="detail">'
        )
    )

    [void]$Html.AppendLine(
        '<td colspan="8">'
    )

    [void]$Html.AppendLine(
        (
            '<b>任務 ID：</b>' +
            (Html-Encode $Quest.ID) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>任務名稱：</b>' +
            (Html-Encode $Quest.QuestName) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>任務描述：</b>' +
            (Html-Encode $Quest.Description) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>任務目標：</b>' +
            (Html-Encode $Quest.Objective) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Type：</b>' +
            (Html-Encode $Quest.Type) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Target：</b>' +
            (Html-Encode $Quest.Target) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Amount：</b>' +
            (Html-Encode $Quest.Amount) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Category：</b>' +
            (Html-Encode $Quest.Category) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>開始任務開關：</b>' +
            (Html-Encode $Quest.StartSwitch) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>完成任務開關：</b>' +
            (Html-Encode $Quest.CompleteSwitch) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Map：</b>' +
            $Quest.MapID.ToString("000") +
            ' / ' +
            (Html-Encode $Quest.MapName) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Map 檔案：</b>' +
            (Html-Encode $Quest.MapFile) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Event：</b>' +
            $Quest.EventID +
            ' / ' +
            (Html-Encode $Quest.EventName) +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>座標：</b>X=' +
            $Quest.EventX +
            ' / Y=' +
            $Quest.EventY +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>事件頁：</b>' +
            $Quest.Page +
            '<br>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<b>Plugin Command：</b>' +
            '<span class="cmd">' +
            (Html-Encode $Quest.PluginCommand) +
            '</span>'
        )
    )

    [void]$Html.AppendLine(
        '</td>'
    )

    [void]$Html.AppendLine(
        '</tr>'
    )
}

if ($SortedQuests.Count -eq 0) {

    [void]$Html.AppendLine(
        '<tr><td colspan="8" class="ok">沒有找到 QuestSystem_MZ_Core 的 StartQuest。</td></tr>'
    )
}

[void]$Html.AppendLine(
    '</tbody>'
)

[void]$Html.AppendLine(
    '</table>'
)

[void]$Html.AppendLine(
    '</div>'
)

# ============================================================
# RELATED COMMANDS
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<h2>任務相關指令</h2>'
)

[void]$Html.AppendLine(
    '<table>'
)

[void]$Html.AppendLine(
    '<thead>'
)

[void]$Html.AppendLine(
    '<tr>'
)

[void]$Html.AppendLine(
    '<th>ID</th>'
)

[void]$Html.AppendLine(
    '<th>指令</th>'
)

[void]$Html.AppendLine(
    '<th>Amount</th>'
)

[void]$Html.AppendLine(
    '<th>Map</th>'
)

[void]$Html.AppendLine(
    '<th>Event</th>'
)

[void]$Html.AppendLine(
    '<th>Page</th>'
)

[void]$Html.AppendLine(
    '</tr>'
)

[void]$Html.AppendLine(
    '</thead>'
)

[void]$Html.AppendLine(
    '<tbody>'
)

foreach ($Related in $SortedRelated) {

    [void]$Html.AppendLine(
        '<tr>'
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Related.ID) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Related.Command) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            (Html-Encode $Related.Amount) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>Map ' +
            $Related.MapID.ToString("000") +
            '<br>' +
            (Html-Encode $Related.MapName) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>Event ' +
            $Related.EventID +
            '<br>' +
            (Html-Encode $Related.EventName) +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        (
            '<td>' +
            $Related.Page +
            '</td>'
        )
    )

    [void]$Html.AppendLine(
        '</tr>'
    )
}

if ($SortedRelated.Count -eq 0) {

    [void]$Html.AppendLine(
        '<tr><td colspan="6">沒有找到任務相關指令。</td></tr>'
    )
}

[void]$Html.AppendLine(
    '</tbody>'
)

[void]$Html.AppendLine(
    '</table>'
)

[void]$Html.AppendLine(
    '</div>'
)

# ============================================================
# FOOTER
# ============================================================

[void]$Html.AppendLine(
    '<div class="box">'
)

[void]$Html.AppendLine(
    '<b>掃描完成。</b><br>'
)

[void]$Html.AppendLine(
    '本報告由 QuestIDScanner_MZ v22.0 建立。<br>'
)

[void]$Html.AppendLine(
    '同一 Event 不同 Page 的相同 Quest ID 不視為重複。'
)

[void]$Html.AppendLine(
    '</div>'
)

[void]$Html.AppendLine(
    '</body>'
)

[void]$Html.AppendLine(
    '</html>'
)

# ============================================================
# WRITE HTML
# ============================================================

[System.IO.File]::WriteAllText(
    $HtmlPath,
    $Html.ToString(),
    $Utf8
)

Write-Host ""
Write-Host "HTML 已建立：" -ForegroundColor Green
Write-Host $HtmlPath

# ============================================================
# FINAL
# ============================================================

Write-Host ""
Write-Host "============================================================"
Write-Host " 任務掃描全部完成"
Write-Host "============================================================"
Write-Host ""

Write-Host (
    "任務數量：" +
    $SortedQuests.Count
) -ForegroundColor Green

Write-Host (
    "真正重複 ID：" +
    $DuplicateGroups.Count
)

Write-Host (
    "未使用 ID：" +
    $UnusedIds.Count
)

Write-Host ""

Write-Host "產生檔案："
Write-Host $HtmlPath
Write-Host $CsvPath
Write-Host $TxtPath

Write-Host ""
Write-Host "============================================================"

Read-Host "按 Enter 結束"