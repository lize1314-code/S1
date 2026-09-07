# ============================================================
# RPG Maker MZ Quest ID Scanner
# Version 20.0
# 支援 QuestSystem_MZ_Core / QuestSystem_MZ
# PowerShell 5.1
# ============================================================

$ErrorActionPreference = "Stop"

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
# CHECK DATA
# ============================================================

if (-not (Test-Path $DataPath)) {

    Write-Host ""
    Write-Host "找不到 data 資料夾！" -ForegroundColor Red
    Write-Host ""
    Write-Host "請把本程式放在 RPG Maker MZ 遊戲專案根目錄。"
    Write-Host ""

    Read-Host "Press Enter to exit"
    exit
}

# ============================================================
# ARRAYS
# ============================================================

$QuestList = New-Object System.Collections.ArrayList
$RelatedList = New-Object System.Collections.ArrayList

# ============================================================
# SAFE STRING
# ============================================================

function Safe-String {
    param($Value)

    if ($null -eq $Value) {
        return ""
    }

    return [string]$Value
}

# ============================================================
# HTML ENCODE
# ============================================================

function Html-Encode {
    param([string]$Value)

    if ($null -eq $Value) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode(
        [string]$Value
    )
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
    param($Value)

    if ($null -eq $Value) {
        return $null
    }

    $Text = Safe-String $Value

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    try {
        return $Text | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

# ============================================================
# GET PLUGIN ARGUMENTS
# ============================================================

function Get-PluginArguments {
    param($Command)

    if ($null -eq $Command) {
        return $null
    }

    $Parameters = @($Command.parameters)

    # MZ Plugin Command:
    #
    # parameters[0] = Plugin Name
    # parameters[1] = Command Name
    # parameters[2] = JSON Arguments
    #

    if ($Parameters.Count -ge 3) {

        $Arguments = Parse-JsonObject $Parameters[2]

        if ($null -ne $Arguments) {
            return $Arguments
        }
    }

    # 相容某些舊格式
    foreach ($Parameter in $Parameters) {

        $Arguments = Parse-JsonObject $Parameter

        if ($null -ne $Arguments) {
            return $Arguments
        }
    }

    return $null
}

# ============================================================
# GET QUEST COMMAND
# ============================================================

function Get-QuestCommand {
    param($Command)

    if ($null -eq $Command) {
        return $null
    }

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

    $Parameters = @($Command.parameters)

    if ($Parameters.Count -lt 2) {
        return $null
    }

    $PluginName =
        Safe-String $Parameters[0]

    $CommandName =
        Safe-String $Parameters[1]

    # ========================================================
    # ★ 重要修正
    #
    # 現在遊戲使用：
    # QuestSystem_MZ_Core
    #
    # 同時保留舊版：
    # QuestSystem_MZ
    # ========================================================

    $IsQuestPlugin =

        $PluginName.Equals(
            "QuestSystem_MZ_Core",
            [StringComparison]::OrdinalIgnoreCase
        ) -or

        $PluginName.Equals(
            "QuestSystem_MZ",
            [StringComparison]::OrdinalIgnoreCase
        )

    if (-not $IsQuestPlugin) {
        return $null
    }

    $Arguments =
        Get-PluginArguments $Command

    return [PSCustomObject]@{

        PluginName =
            $PluginName

        CommandName =
            $CommandName

        Arguments =
            $Arguments

        Parameters =
            $Parameters
    }
}

# ============================================================
# NORMALIZE QUEST ID
# ============================================================

function Normalize-QuestId {
    param($Value)

    $Text =
        Safe-String $Value

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return ""
    }

    $Text =
        $Text.Trim()

    # 取得開頭數字
    if ($Text -match '^\d+') {

        try {

            return (
                [int]$Matches[0]
            ).ToString("000")

        }
        catch {
        }
    }

    return $Text
}

# ============================================================
# GET QUEST ID
# ============================================================

function Get-IdFromArguments {
    param($Arguments)

    if ($null -eq $Arguments) {
        return ""
    }

    $Value =
        Get-Prop $Arguments "questId"

    if ([string]::IsNullOrWhiteSpace($Value)) {

        $Value =
            Get-Prop $Arguments "id"
    }

    return Normalize-QuestId $Value
}

# ============================================================
# MAP NAME
# ============================================================

function Get-MapName {
    param([int]$MapId)

    $MapInfoPath =
        Join-Path `
            $DataPath `
            "MapInfos.json"

    if (-not (Test-Path $MapInfoPath)) {
        return ""
    }

    try {

        $Text =
            Get-Content `
                -LiteralPath $MapInfoPath `
                -Raw `
                -Encoding UTF8

        $Infos =
            $Text | ConvertFrom-Json

        $Info =
            $Infos[$MapId]

        if ($null -ne $Info) {

            return (
                Safe-String $Info.name
            )
        }
    }
    catch {
    }

    return ""
}

# ============================================================
# GET MAP FILES
# ============================================================

$MapFiles =
    Get-ChildItem `
        -LiteralPath $DataPath `
        -Filter "Map*.json" `
        -File |
    Where-Object {
        $_.Name -match '^Map\d{3}\.json$'
    } |
    Sort-Object Name

Write-Host ""
Write-Host "=============================================="
Write-Host " RPG Maker MZ Quest ID Scanner v20.0"
Write-Host "=============================================="
Write-Host ""

Write-Host "資料夾："
Write-Host $DataPath
Write-Host ""

Write-Host "開始掃描 Map..."
Write-Host ""

# ============================================================
# SCAN MAPS
# ============================================================

foreach ($MapFile in $MapFiles) {

    $MapIdText =
        $MapFile.BaseName.Substring(3)

    try {

        $MapId =
            [int]$MapIdText

    }
    catch {

        continue
    }

    if ($MapId -le 0) {
        continue
    }

    $MapName =
        Get-MapName $MapId

    Write-Host "----------------------------------------------"

    Write-Host (
        "[Map " +
        $MapId.ToString("000") +
        "] " +
        $MapName
    )

    # ========================================================
    # READ MAP
    # ========================================================

    try {

        $MapText =
            Get-Content `
                -LiteralPath $MapFile.FullName `
                -Raw `
                -Encoding UTF8

        $MapData =
            $MapText | ConvertFrom-Json

    }
    catch {

        Write-Host ""
        Write-Host "JSON ERROR" -ForegroundColor Red
        Write-Host $MapFile.FullName -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""

        continue
    }

    if ($null -eq $MapData.events) {
        continue
    }

    # ========================================================
    # EVENTS
    # ========================================================

    foreach ($Event in @($MapData.events)) {

        if ($null -eq $Event) {
            continue
        }

        try {

            $EventId =
                [int]$Event.id

        }
        catch {

            continue
        }

        if ($EventId -le 0) {
            continue
        }

        $EventName =
            Safe-String $Event.name

        $PageNumber = 0

        # ====================================================
        # PAGES
        # ====================================================

        foreach ($Page in @($Event.pages)) {

            $PageNumber++

            if ($null -eq $Page.list) {
                continue
            }

            $CommandIndex = -1

            # =================================================
            # EVENT COMMANDS
            # =================================================

            foreach ($Command in @($Page.list)) {

                $CommandIndex++

                $QuestCommand =
                    Get-QuestCommand $Command

                if ($null -eq $QuestCommand) {
                    continue
                }

                $CommandName =
                    Safe-String `
                        $QuestCommand.CommandName

                $Arguments =
                    $QuestCommand.Arguments

                # =================================================
                # START QUEST
                # =================================================

                if (
                    $CommandName.Equals(
                        "StartQuest",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {

                    $QuestId =
                        Get-IdFromArguments `
                            $Arguments

                    $QuestName =
                        Get-Prop `
                            $Arguments `
                            "questName"

                    $Description =
                        Get-Prop `
                            $Arguments `
                            "description"

                    $Objective =
                        Get-Prop `
                            $Arguments `
                            "objective"

                    $Type =
                        Get-Prop `
                            $Arguments `
                            "type"

                    $Target =
                        Get-Prop `
                            $Arguments `
                            "target"

                    $Amount =
                        Get-Prop `
                            $Arguments `
                            "amount"

                    $Category =
                        Get-Prop `
                            $Arguments `
                            "category"

                    $StartSwitch =
                        Get-Prop `
                            $Arguments `
                            "startSwitch"

                    $CompleteSwitch =
                        Get-Prop `
                            $Arguments `
                            "completeSwitch"

                    # =================================================
                    # 建立任務資料
                    # =================================================

                    $Record =
                        [PSCustomObject]@{

                            ID =
                                $QuestId

                            QuestName =
                                $QuestName

                            Description =
                                $Description

                            Objective =
                                $Objective

                            Type =
                                $Type

                            Target =
                                $Target

                            Amount =
                                $Amount

                            Category =
                                $Category

                            StartSwitch =
                                $StartSwitch

                            CompleteSwitch =
                                $CompleteSwitch

                            MapID =
                                $MapId

                            MapName =
                                $MapName

                            EventID =
                                $EventId

                            EventName =
                                $EventName

                            Page =
                                $PageNumber

                            CommandIndex =
                                $CommandIndex
                        }

                    [void]
                        $QuestList.Add(
                            $Record
                        )

                    Write-Host (
                        "  [找到任務] ID " +
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
                # RELATED COMMANDS
                # =================================================

                $IsRelated = $false

                switch -Regex ($CommandName) {

                    '^AddQuestProgress$' {
                        $IsRelated = $true
                        break
                    }

                    '^AddItemProgress$' {
                        $IsRelated = $true
                        break
                    }

                    '^CompleteQuest$' {
                        $IsRelated = $true
                        break
                    }

                    '^TrackQuest$' {
                        $IsRelated = $true
                        break
                    }

                    '^UntrackQuest$' {
                        $IsRelated = $true
                        break
                    }

                    '^HideTracker$' {
                        $IsRelated = $true
                        break
                    }

                    '^ShowTracker$' {
                        $IsRelated = $true
                        break
                    }
                }

                if ($IsRelated) {

                    $RelatedId =
                        Get-IdFromArguments `
                            $Arguments

                    $RelatedAmount =
                        Get-Prop `
                            $Arguments `
                            "amount"

                    if (
                        [string]::IsNullOrWhiteSpace(
                            $RelatedAmount
                        )
                    ) {

                        $RelatedAmount =
                            Get-Prop `
                                $Arguments `
                                "value"
                    }

                    $RelatedRecord =
                        [PSCustomObject]@{

                            ID =
                                $RelatedId

                            Command =
                                $CommandName

                            Amount =
                                $RelatedAmount

                            MapID =
                                $MapId

                            MapName =
                                $MapName

                            EventID =
                                $EventId

                            EventName =
                                $EventName

                            Page =
                                $PageNumber

                            CommandIndex =
                                $CommandIndex
                        }

                    [void]
                        $RelatedList.Add(
                            $RelatedRecord
                        )
                }
            }
        }
    }
}

# ============================================================
# SORT QUEST
# ============================================================

$SortedQuests =
    @(
        $QuestList |
        Sort-Object `
            @{Expression={
                try {
                    [int]$_.ID
                }
                catch {
                    999999
                }
            }},
            MapID,
            EventID,
            Page
    )

$SortedRelated =
    @(
        $RelatedList |
        Sort-Object `
            @{Expression={
                try {
                    [int]$_.ID
                }
                catch {
                    999999
                }
            }},
            MapID,
            EventID,
            Page
    )

# ============================================================
# MAX ID
# ============================================================

$MaxId = 0

foreach ($Quest in $SortedQuests) {

    try {

        $Number =
            [int]$Quest.ID

        if ($Number -gt $MaxId) {
            $MaxId = $Number
        }

    }
    catch {
    }
}

# ============================================================
# USED IDS
# ============================================================

$UsedIds =
    @{}

foreach ($Quest in $SortedQuests) {

    if (
        -not [string]::IsNullOrWhiteSpace(
            $Quest.ID
        )
    ) {

        if (
            -not $UsedIds.ContainsKey(
                $Quest.ID
            )
        ) {

            $UsedIds[$Quest.ID] = 0
        }

        $UsedIds[$Quest.ID]++
    }
}

# ============================================================
# DUPLICATES
# ============================================================

$DuplicateGroups =
    @(
        $SortedQuests |
        Where-Object {
            -not [string]::IsNullOrWhiteSpace(
                $_.ID
            )
        } |
        Group-Object ID |
        Where-Object {
            $_.Count -gt 1
        }
    )

# ============================================================
# UNUSED IDS
# ============================================================

$UnusedIds =
    New-Object System.Collections.ArrayList

if ($MaxId -gt 0) {

    for (
        $i = 1;
        $i -le $MaxId;
        $i++
    ) {

        $Id =
            $i.ToString("000")

        if (
            -not $UsedIds.ContainsKey(
                $Id
            )
        ) {

            [void]
                $UnusedIds.Add(
                    $Id
                )
        }
    }
}

# ============================================================
# CONSOLE SUMMARY
# ============================================================

Write-Host ""
Write-Host "=============================================="
Write-Host " SCAN COMPLETE"
Write-Host "=============================================="

Write-Host (
    "Quest count : " +
    $SortedQuests.Count
) -ForegroundColor Green

Write-Host (
    "Duplicate   : " +
    $DuplicateGroups.Count
)

Write-Host (
    "Unused      : " +
    $UnusedIds.Count
)

Write-Host ""

# ============================================================
# TXT REPORT
# ============================================================

$TxtLines =
    New-Object System.Collections.ArrayList

[void]
$TxtLines.Add(
    "RPG Maker MZ Quest ID Report"
)

[void]
$TxtLines.Add(
    "QuestIDScanner_MZ v20.0"
)

[void]
$TxtLines.Add(
    "Plugin: QuestSystem_MZ_Core / QuestSystem_MZ"
)

[void]
$TxtLines.Add(
    "=============================================="
)

[void]
$TxtLines.Add(
    "Quest count: " +
    $SortedQuests.Count
)

[void]
$TxtLines.Add(
    "Duplicate IDs: " +
    $DuplicateGroups.Count
)

[void]
$TxtLines.Add(
    "Unused IDs: " +
    $UnusedIds.Count
)

[void]
$TxtLines.Add("")

[void]
$TxtLines.Add(
    "QUEST LIST"
)

[void]
$TxtLines.Add(
    "=============================================="
)

foreach ($Quest in $SortedQuests) {

    [void]
    $TxtLines.Add(

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
    )
}

[void]
$TxtLines.Add("")

[void]
$TxtLines.Add(
    "DUPLICATE IDS"
)

[void]
$TxtLines.Add(
    "=============================================="
)

if ($DuplicateGroups.Count -eq 0) {

    [void]
    $TxtLines.Add(
        "None"
    )

}
else {

    foreach ($Group in $DuplicateGroups) {

        [void]
        $TxtLines.Add(
            "ID " +
            $Group.Name +
            " duplicated " +
            $Group.Count +
            " times"
        )

        foreach ($Quest in $Group.Group) {

            [void]
            $TxtLines.Add(

                "Map " +
                $Quest.MapID.ToString("000") +
                " " +
                $Quest.MapName +
                " / Event " +
                $Quest.EventID +
                " " +
                $Quest.EventName +
                " / Page " +
                $Quest.Page
            )
        }
    }
}

[void]
$TxtLines.Add("")

[void]
$TxtLines.Add(
    "UNUSED IDS"
)

[void]
$TxtLines.Add(
    "=============================================="
)

if ($UnusedIds.Count -eq 0) {

    [void]
    $TxtLines.Add("None")

}
else {

    [void]
    $TxtLines.Add(
        $UnusedIds -join ", "
    )
}

[System.IO.File]::WriteAllLines(
    $TxtPath,
    $TxtLines,
    $Utf8
)

# ============================================================
# CSV REPORT
# ============================================================

$CsvRows = @()

foreach ($Quest in $SortedQuests) {

    $CsvRows +=
        [PSCustomObject]@{

            ID =
                $Quest.ID

            QuestName =
                $Quest.QuestName

            Description =
                $Quest.Description

            Objective =
                $Quest.Objective

            Type =
                $Quest.Type

            Target =
                $Quest.Target

            Amount =
                $Quest.Amount

            Category =
                $Quest.Category

            StartSwitch =
                $Quest.StartSwitch

            CompleteSwitch =
                $Quest.CompleteSwitch

            MapID =
                $Quest.MapID.ToString("000")

            Map =
                $Quest.MapName

            EventID =
                $Quest.EventID

            Event =
                $Quest.EventName

            Page =
                $Quest.Page
        }
}

if ($CsvRows.Count -gt 0) {

    $CsvRows |
        Export-Csv `
            -LiteralPath $CsvPath `
            -NoTypeInformation `
            -Encoding UTF8
}

# ============================================================
# HTML
# ============================================================

$Html =
    New-Object System.Collections.ArrayList

function Add-Html {
    param([string]$Text)

    [void]
        $script:Html.Add(
            $Text
        )
}

# ============================================================
# HTML HEAD
# ============================================================

Add-Html '<!DOCTYPE html>'
Add-Html '<html lang="zh-Hant">'
Add-Html '<head>'
Add-Html '<meta charset="UTF-8">'
Add-Html '<meta name="viewport" content="width=device-width, initial-scale=1">'
Add-Html '<title>RPG Maker MZ 任務掃描報告</title>'

Add-Html '<style>'

Add-Html '
body{
font-family:"Microsoft JhengHei",Arial,sans-serif;
background:#eef2f4;
margin:0;
padding:20px;
color:#222;
}
'

Add-Html '
.box{
background:#fff;
border-radius:10px;
padding:20px;
margin-bottom:20px;
box-shadow:0 2px 8px rgba(0,0,0,.08);
overflow:auto;
}
'

Add-Html '
h1,h2{
margin-top:0;
}
'

Add-Html '
.stats{
display:flex;
gap:12px;
flex-wrap:wrap;
}
'

Add-Html '
.stat{
background:#f3f6f7;
padding:14px 20px;
border-radius:8px;
}
'

Add-Html '
table{
width:100%;
border-collapse:collapse;
}
'

Add-Html '
th{
background:#405762;
color:#fff;
padding:10px;
text-align:left;
}
'

Add-Html '
td{
padding:10px;
border-bottom:1px solid #ddd;
vertical-align:top;
}
'

Add-Html '
.id{
color:#06c;
text-decoration:underline;
cursor:pointer;
font-weight:bold;
font-size:17px;
}
'

Add-Html '
.detail{
display:none;
background:#f7fafb;
}
'

Add-Html '
.cmd{
background:#e5f1ff;
padding:5px 9px;
border-radius:5px;
}
'

Add-Html '
.dup{
background:#fff0f0;
border:1px solid #d99;
padding:12px;
border-radius:7px;
margin:8px 0;
}
'

Add-Html '
.unused{
display:inline-block;
background:#fff0b5;
padding:5px 9px;
border-radius:5px;
margin:3px;
}
'

Add-Html '
.ok{
color:#168348;
font-weight:bold;
}
'

Add-Html '
.search{
width:100%;
padding:11px;
box-sizing:border-box;
border:1px solid #bbb;
border-radius:6px;
font-size:16px;
}
'

Add-Html '</style>'

# ============================================================
# HTML JAVASCRIPT
# ============================================================

Add-Html '<script>'

Add-Html '
function toggleDetail(id){
var row=document.getElementById(id);
if(!row){return;}
if(row.style.display==="table-row"){
row.style.display="none";
}else{
row.style.display="table-row";
}
}
'

Add-Html '
function searchQuest(){
var box=document.getElementById("searchBox");
var q=box.value.toLowerCase();
var rows=document.getElementsByClassName("questrow");

for(var i=0;i<rows.length;i++){
var text=rows[i].innerText.toLowerCase();

if(text.indexOf(q)>=0){
rows[i].style.display="";
}else{
rows[i].style.display="none";
}
}
}
'

Add-Html '</script>'
Add-Html '</head>'
Add-Html '<body>'

# ============================================================
# TITLE
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h1>RPG Maker MZ 任務 ID 掃描報告</h1>'

Add-Html '<p>QuestIDScanner_MZ v20.0</p>'

Add-Html '<p>支援：QuestSystem_MZ_Core / QuestSystem_MZ</p>'

Add-Html '<div class="stats">'

Add-Html (
    '<div class="stat">任務數量：<b>' +
    $SortedQuests.Count +
    '</b></div>'
)

Add-Html (
    '<div class="stat">最大 ID：<b>' +
    $MaxId.ToString("000") +
    '</b></div>'
)

Add-Html (
    '<div class="stat">重複 ID：<b>' +
    $DuplicateGroups.Count +
    '</b></div>'
)

Add-Html (
    '<div class="stat">未使用 ID：<b>' +
    $UnusedIds.Count +
    '</b></div>'
)

Add-Html '</div>'
Add-Html '</div>'

# ============================================================
# SEARCH
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>搜尋任務</h2>'

Add-Html '
<input
id="searchBox"
class="search"
onkeyup="searchQuest()"
placeholder="搜尋 ID、任務名稱、Map、Event..."
>
'

Add-Html '</div>'

# ============================================================
# UNUSED IDS
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>未使用任務 ID</h2>'

if ($UnusedIds.Count -eq 0) {

    Add-Html (
        '<div class="ok">沒有未使用 ID。</div>'
    )

}
else {

    foreach ($Id in $UnusedIds) {

        Add-Html (
            '<span class="unused">' +
            (Html-Encode $Id) +
            '</span>'
        )
    }
}

Add-Html '</div>'

# ============================================================
# DUPLICATES
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>重複任務 ID</h2>'

if ($DuplicateGroups.Count -eq 0) {

    Add-Html (
        '<div class="ok">沒有重複任務 ID。</div>'
    )

}
else {

    foreach ($Group in $DuplicateGroups) {

        Add-Html '<div class="dup">'

        Add-Html (
            '<b>ID ' +
            (Html-Encode $Group.Name) +
            ' 重複 ' +
            $Group.Count +
            ' 次</b>'
        )

        foreach ($Quest in $Group.Group) {

            Add-Html (

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
        }

        Add-Html '</div>'
    }
}

Add-Html '</div>'

# ============================================================
# QUEST LIST
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>任務清單</h2>'

Add-Html '<p>點擊藍色 ID 可展開任務詳細資料。</p>'

Add-Html '<table>'

Add-Html '<thead>'

Add-Html '<tr>'

Add-Html '<th>ID</th>'
Add-Html '<th>任務名稱</th>'
Add-Html '<th>Map</th>'
Add-Html '<th>Event</th>'
Add-Html '<th>Page</th>'
Add-Html '<th>Type</th>'
Add-Html '<th>Target</th>'
Add-Html '<th>Amount</th>'

Add-Html '</tr>'

Add-Html '</thead>'

Add-Html '<tbody>'

$DetailIndex = 0

foreach ($Quest in $SortedQuests) {

    $DetailIndex++

    $DetailId =
        "detail_" +
        $DetailIndex

    # ========================================================
    # MAIN ROW
    # ========================================================

    Add-Html '<tr class="questrow">'

    Add-Html (

        '<td>' +

        '<span class="id" onclick="toggleDetail(''' +
        $DetailId +
        ''')">' +

        (Html-Encode $Quest.ID) +

        '</span>' +

        '</td>'
    )

    Add-Html (
        '<td>' +
        (Html-Encode $Quest.QuestName) +
        '</td>'
    )

    Add-Html (

        '<td>' +

        'Map ' +
        $Quest.MapID.ToString("000") +

        '<br><small>' +

        (Html-Encode $Quest.MapName) +

        '</small>' +

        '</td>'
    )

    Add-Html (

        '<td>' +

        'Event ' +
        $Quest.EventID +

        '<br><small>' +

        (Html-Encode $Quest.EventName) +

        '</small>' +

        '</td>'
    )

    Add-Html (
        '<td>' +
        $Quest.Page +
        '</td>'
    )

    Add-Html (
        '<td>' +
        (Html-Encode $Quest.Type) +
        '</td>'
    )

    Add-Html (
        '<td>' +
        (Html-Encode $Quest.Target) +
        '</td>'
    )

    Add-Html (
        '<td>' +
        (Html-Encode $Quest.Amount) +
        '</td>'
    )

    Add-Html '</tr>'

    # ========================================================
    # DETAIL
    # ========================================================

    Add-Html (

        '<tr id="' +
        (Html-Encode $DetailId) +
        '" class="detail">'
    )

    Add-Html '<td colspan="8">'

    Add-Html (
        '<b>任務 ID：</b>' +
        (Html-Encode $Quest.ID) +
        '<br>'
    )

    Add-Html (
        '<b>任務名稱：</b>' +
        (Html-Encode $Quest.QuestName) +
        '<br>'
    )

    Add-Html (
        '<b>任務描述：</b>' +
        (Html-Encode $Quest.Description) +
        '<br>'
    )

    Add-Html (
        '<b>任務目標：</b>' +
        (Html-Encode $Quest.Objective) +
        '<br>'
    )

    Add-Html (
        '<b>Type：</b>' +
        (Html-Encode $Quest.Type) +
        '<br>'
    )

    Add-Html (
        '<b>Target：</b>' +
        (Html-Encode $Quest.Target) +
        '<br>'
    )

    Add-Html (
        '<b>Amount：</b>' +
        (Html-Encode $Quest.Amount) +
        '<br>'
    )

    Add-Html (
        '<b>Category：</b>' +
        (Html-Encode $Quest.Category) +
        '<br>'
    )

    Add-Html (
        '<b>開始任務開關：</b>' +
        (Html-Encode $Quest.StartSwitch) +
        '<br>'
    )

    Add-Html (
        '<b>完成任務開關：</b>' +
        (Html-Encode $Quest.CompleteSwitch) +
        '<br>'
    )

    Add-Html (
        '<b>Map：</b>' +
        $Quest.MapID.ToString("000") +
        ' / ' +
        (Html-Encode $Quest.MapName) +
        '<br>'
    )

    Add-Html (
        '<b>Event：</b>' +
        $Quest.EventID +
        ' / ' +
        (Html-Encode $Quest.EventName) +
        '<br>'
    )

    Add-Html (
        '<b>Page：</b>' +
        $Quest.Page
    )

    Add-Html '</td>'
    Add-Html '</tr>'
}

if ($SortedQuests.Count -eq 0) {

    Add-Html (

        '<tr>' +
        '<td colspan="8">' +
        '沒有找到 QuestSystem_MZ_Core / QuestSystem_MZ 的 StartQuest 指令。' +
        '</td>' +
        '</tr>'
    )
}

Add-Html '</tbody>'
Add-Html '</table>'
Add-Html '</div>'

# ============================================================
# RELATED COMMANDS
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>任務相關指令</h2>'

Add-Html (
    '<p>包含增加任務進度、增加物品進度、完成任務、追蹤任務、取消追蹤等。</p>'
)

Add-Html '<table>'

Add-Html '<thead>'

Add-Html '<tr>'

Add-Html '<th>ID</th>'
Add-Html '<th>指令</th>'
Add-Html '<th>Map</th>'
Add-Html '<th>Event</th>'
Add-Html '<th>Page</th>'
Add-Html '<th>Amount</th>'

Add-Html '</tr>'

Add-Html '</thead>'

Add-Html '<tbody>'

foreach ($Related in $SortedRelated) {

    $DisplayId =
        $Related.ID

    if (
        [string]::IsNullOrWhiteSpace(
            $DisplayId
        )
    ) {

        $DisplayId =
            "NOT_FOUND"
    }

    $CommandChinese =
        $Related.Command

    switch -Regex ($Related.Command) {

        '^AddQuestProgress$' {
            $CommandChinese =
                "增加任務進度"
            break
        }

        '^AddItemProgress$' {
            $CommandChinese =
                "增加物品進度"
            break
        }

        '^CompleteQuest$' {
            $CommandChinese =
                "完成任務"
            break
        }

        '^TrackQuest$' {
            $CommandChinese =
                "追蹤任務"
            break
        }

        '^UntrackQuest$' {
            $CommandChinese =
                "取消追蹤"
            break
        }

        '^HideTracker$' {
            $CommandChinese =
                "隱藏任務追蹤"
            break
        }

        '^ShowTracker$' {
            $CommandChinese =
                "顯示任務追蹤"
            break
        }
    }

    Add-Html '<tr>'

    Add-Html (
        '<td><b>' +
        (Html-Encode $DisplayId) +
        '</b></td>'
    )

    Add-Html (
        '<td><span class="cmd">' +
        (Html-Encode $CommandChinese) +
        '</span></td>'
    )

    Add-Html (

        '<td>' +
        'Map ' +
        $Related.MapID.ToString("000") +
        '<br><small>' +
        (Html-Encode $Related.MapName) +
        '</small>' +
        '</td>'
    )

    Add-Html (

        '<td>' +
        'Event ' +
        $Related.EventID +
        '<br><small>' +
        (Html-Encode $Related.EventName) +
        '</small>' +
        '</td>'
    )

    Add-Html (
        '<td>' +
        $Related.Page +
        '</td>'
    )

    Add-Html (
        '<td>' +
        (Html-Encode $Related.Amount) +
        '</td>'
    )

    Add-Html '</tr>'
}

if ($SortedRelated.Count -eq 0) {

    Add-Html (

        '<tr>' +
        '<td colspan="6">' +
        '沒有找到任務相關指令。' +
        '</td>' +
        '</tr>'
    )
}

Add-Html '</tbody>'
Add-Html '</table>'
Add-Html '</div>'

# ============================================================
# SCAN INFORMATION
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>掃描方式</h2>'

Add-Html (
    '<p>掃描 RPG Maker MZ 的 data/MapXXX.json。</p>'
)

Add-Html (
    '<p>Plugin：QuestSystem_MZ_Core / QuestSystem_MZ</p>'
)

Add-Html (
    '<p>主要指令：StartQuest</p>'
)

Add-Html (
    '<p>相關指令：CompleteQuest、AddQuestProgress、TrackQuest、UntrackQuest</p>'
)

Add-Html '</div>'

# ============================================================
# CLOSE HTML
# ============================================================

Add-Html '</body>'
Add-Html '</html>'

# ============================================================
# SAVE HTML
# ============================================================

$HtmlText =
    $Html -join [Environment]::NewLine

[System.IO.File]::WriteAllText(
    $HtmlPath,
    $HtmlText,
    $Utf8
)

# ============================================================
# FINISH
# ============================================================

Write-Host ""
Write-Host "=============================================="
Write-Host " ALL REPORTS CREATED"
Write-Host "=============================================="

Write-Host ""
Write-Host "任務數量：" $SortedQuests.Count
Write-Host "重複 ID：" $DuplicateGroups.Count
Write-Host "未使用 ID：" $UnusedIds.Count

Write-Host ""
Write-Host "HTML：" -ForegroundColor Green
Write-Host $HtmlPath

Write-Host ""
Write-Host "CSV：" -ForegroundColor Green
Write-Host $CsvPath

Write-Host ""
Write-Host "TXT：" -ForegroundColor Green
Write-Host $TxtPath

Write-Host ""

# ============================================================
# OPEN HTML
# ============================================================

try {

    Start-Process `
        -FilePath $HtmlPath

}
catch {

    Write-Host ""
    Write-Host "無法自動開啟 HTML。" `
        -ForegroundColor Yellow
}

Write-Host ""

Read-Host "Press Enter to exit"