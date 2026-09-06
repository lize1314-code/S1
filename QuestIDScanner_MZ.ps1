# ============================================================
# RPG Maker MZ Quest ID Scanner
# Version 19.3 Stable
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

if (-not (Test-Path -LiteralPath $DataPath)) {

    Write-Host ""
    Write-Host "ERROR: data folder not found." -ForegroundColor Red
    Write-Host ""
    Write-Host $DataPath
    Write-Host ""

    Read-Host "Press Enter to exit"
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
    param($Value)

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

        $P = $Object.PSObject.Properties[$Name]

        if ($null -ne $P) {
            return Safe-String $P.Value
        }

    }
    catch {
    }

    return ""
}

# ============================================================
# PARSE JSON STRING
# ============================================================

function Parse-JsonObject {
    param($Value)

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
# GET PLUGIN ARGUMENTS
# ============================================================

function Get-PluginArguments {
    param($Command)

    if ($null -eq $Command) {
        return $null
    }

    $Parameters = @($Command.parameters)

    foreach ($P in $Parameters) {

        $Object = Parse-JsonObject $P

        if ($null -ne $Object) {
            return $Object
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

    $PluginName = Safe-String $Parameters[0]
    $CommandName = Safe-String $Parameters[1]

    if (
        -not $PluginName.Equals(
            "QuestSystem_MZ",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        return $null
    }

    $Arguments = Get-PluginArguments $Command

    return [PSCustomObject]@{
        PluginName = $PluginName
        CommandName = $CommandName
        Arguments = $Arguments
        Parameters = $Parameters
    }
}

# ============================================================
# GET ID FROM ARGUMENTS
# ============================================================

function Get-IdFromArguments {
    param(
        $Arguments,
        $Parameters
    )

    $Value = ""

    if ($null -ne $Arguments) {

        $Value = Get-Prop $Arguments "questId"

        if ([string]::IsNullOrWhiteSpace($Value)) {
            $Value = Get-Prop $Arguments "id"
        }
    }

    if (
        [string]::IsNullOrWhiteSpace($Value)
    ) {

        return ""
    }

    $Text = $Value.Trim()

    $Digits = ""

    foreach ($C in $Text.ToCharArray()) {

        if ([char]::IsDigit($C)) {
            $Digits = $Digits + $C
        }
        else {
            break
        }
    }

    if ($Digits.Length -eq 0) {
        return ""
    }

    try {

        return ([int]$Digits).ToString("000")

    }
    catch {

        return ""
    }
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
                $Name = Safe-String $Info.name

                if ($MapId -gt 0) {

                    $MapNames[$MapId] = $Name
                }

            }
            catch {
            }
        }

    }
    catch {

        Write-Host ""
        Write-Host "WARNING: MapInfos.json could not be read." `
            -ForegroundColor Yellow
        Write-Host ""
    }
}

# ============================================================
# MAP NAME
# ============================================================

function Get-MapName {
    param([int]$MapId)

    if ($MapNames.ContainsKey($MapId)) {

        $Name = Safe-String $MapNames[$MapId]

        if (
            -not [string]::IsNullOrWhiteSpace($Name)
        ) {
            return $Name
        }
    }

    return (
        "Map " +
        $MapId.ToString("000")
    )
}

# ============================================================
# GET MAP FILES
# ============================================================

$MapFiles = @(
    Get-ChildItem `
        -LiteralPath $DataPath `
        -Filter "Map*.json" `
        -File |
    Where-Object {
        $_.BaseName -match "^Map[0-9]+$"
    } |
    Sort-Object Name
)

# ============================================================
# HEADER
# ============================================================

Write-Host ""
Write-Host "=============================================="
Write-Host " RPG Maker MZ Quest ID Scanner"
Write-Host " Version 19.3 Stable"
Write-Host "=============================================="
Write-Host ""

Write-Host (
    "Map files found: " +
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

    Write-Host "----------------------------------------------"

    Write-Host (
        "[Map " +
        $MapId.ToString("000") +
        "] " +
        $MapName
    )

    # --------------------------------------------------------
    # READ MAP JSON
    # --------------------------------------------------------

    try {

        $MapText = Get-Content `
            -LiteralPath $MapFile.FullName `
            -Raw `
            -Encoding UTF8

        $MapData = $MapText | ConvertFrom-Json

    }
    catch {

        Write-Host ""
        Write-Host "JSON ERROR:" -ForegroundColor Red
        Write-Host $MapFile.FullName -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""

        continue
    }

    $StartCount = 0

    if ($null -eq $MapData.events) {

        Write-Host "  No events."
        continue
    }

    # --------------------------------------------------------
    # EVENTS
    # --------------------------------------------------------

    foreach ($Event in @($MapData.events)) {

        if ($null -eq $Event) {
            continue
        }

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

        # ----------------------------------------------------
        # PAGES
        # ----------------------------------------------------

        foreach ($Page in @($Event.pages)) {

            $PageNumber++

            if ($null -eq $Page.list) {
                continue
            }

            $CommandIndex = -1

            # ------------------------------------------------
            # COMMANDS
            # ------------------------------------------------

            foreach ($Command in @($Page.list)) {

                $CommandIndex++

                $QuestCommand = Get-QuestCommand $Command

                if ($null -eq $QuestCommand) {
                    continue
                }

                $CommandName =
                    Safe-String $QuestCommand.CommandName

                $Arguments =
                    $QuestCommand.Arguments

                $Parameters =
                    $QuestCommand.Parameters

                # ==================================================
                # START QUEST
                # ==================================================

                if (
                    $CommandName.Equals(
                        "StartQuest",
                        [StringComparison]::OrdinalIgnoreCase
                    )
                ) {

                    $QuestId =
                        Get-IdFromArguments `
                            $Arguments `
                            $Parameters

                    $QuestName =
                        Get-Prop $Arguments "questName"

                    $Description =
                        Get-Prop $Arguments "description"

                    $Objective =
                        Get-Prop $Arguments "objective"

                    $Type =
                        Get-Prop $Arguments "type"

                    $Target =
                        Get-Prop $Arguments "target"

                    $Amount =
                        Get-Prop $Arguments "amount"

                    $Category =
                        Get-Prop $Arguments "category"

                    $StartSwitch =
                        Get-Prop $Arguments "startSwitch"

                    $CompleteSwitch =
                        Get-Prop $Arguments "completeSwitch"

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

                        EventID = $EventId

                        EventName = $EventName

                        Page = $PageNumber

                        CommandIndex = $CommandIndex
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
                }

                # ==================================================
                # RELATED COMMANDS
                # ==================================================

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

                    $RelatedId =
                        Get-IdFromArguments `
                            $Arguments `
                            $Parameters

                    $RelatedAmount =
                        Get-Prop $Arguments "amount"

                    if (
                        [string]::IsNullOrWhiteSpace(
                            $RelatedAmount
                        )
                    ) {

                        $RelatedAmount =
                            Get-Prop $Arguments "value"
                    }

                    $RelatedRecord =
                        [PSCustomObject]@{

                            ID = $RelatedId

                            Command = $CommandName

                            Amount = $RelatedAmount

                            MapID = $MapId

                            MapName = $MapName

                            EventID = $EventId

                            EventName = $EventName

                            Page = $PageNumber

                            CommandIndex = $CommandIndex
                        }

                    [void]$RelatedList.Add(
                        $RelatedRecord
                    )
                }
            }
        }
    }

    Write-Host (
        "  StartQuest found: " +
        $StartCount
    )
}

# ============================================================
# SORT
#
# IMPORTANT:
# Do NOT use:
# Sort-Object @{N=...}
#
# IDs are already 001,002,003...
# Therefore normal ID sorting is enough.
# ============================================================

$SortedQuests = @(
    $QuestList |
    Sort-Object ID, MapID, EventID, Page
)

$SortedRelated = @(
    $RelatedList |
    Sort-Object ID, MapID, EventID, Page
)

# ============================================================
# DUPLICATES
# ============================================================

$DuplicateGroups = @(
    $SortedQuests |
    Where-Object {
        -not [string]::IsNullOrWhiteSpace($_.ID)
    } |
    Group-Object ID |
    Where-Object {
        $_.Count -gt 1
    } |
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
# TXT
# ============================================================

$TxtLines = New-Object System.Collections.ArrayList

[void]$TxtLines.Add(
    "RPG Maker MZ Quest ID Report"
)

[void]$TxtLines.Add(
    "QuestIDScanner_MZ v19.3 Stable"
)

[void]$TxtLines.Add(
    "=============================================="
)

[void]$TxtLines.Add(
    "Quest count: " +
    $SortedQuests.Count
)

[void]$TxtLines.Add(
    "Duplicate IDs: " +
    $DuplicateGroups.Count
)

[void]$TxtLines.Add(
    "Unused IDs: " +
    $UnusedIds.Count
)

[void]$TxtLines.Add("")

[void]$TxtLines.Add(
    "QUEST LIST"
)

[void]$TxtLines.Add(
    "=============================================="
)

foreach ($Quest in $SortedQuests) {

    [void]$TxtLines.Add(
        (
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
    )
}

[void]$TxtLines.Add("")
[void]$TxtLines.Add("DUPLICATE IDS")
[void]$TxtLines.Add("==============================================")

if ($DuplicateGroups.Count -eq 0) {

    [void]$TxtLines.Add(
        "None"
    )

}
else {

    foreach ($Group in $DuplicateGroups) {

        [void]$TxtLines.Add(
            (
                "ID " +
                $Group.Name +
                " duplicated " +
                $Group.Count +
                " times"
            )
        )

        foreach ($Quest in $Group.Group) {

            [void]$TxtLines.Add(
                (
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
            )
        }
    }
}

[void]$TxtLines.Add("")
[void]$TxtLines.Add("UNUSED IDS")
[void]$TxtLines.Add("==============================================")

if ($UnusedIds.Count -eq 0) {

    [void]$TxtLines.Add("None")

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
Write-Host "TXT created:" -ForegroundColor Green
Write-Host $TxtPath

# ============================================================
# CSV
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

        Event = $Quest.EventName

        EventID = $Quest.EventID

        Page = $Quest.Page
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
Write-Host "CSV created:" -ForegroundColor Green
Write-Host $CsvPath

# ============================================================
# HTML
# ============================================================

$Html = New-Object System.Collections.ArrayList

function Add-Html {
    param([string]$Text)

    [void]$script:Html.Add($Text)
}

# ============================================================
# HTML HEADER
# ============================================================

Add-Html '<!DOCTYPE html>'
Add-Html '<html lang="zh-Hant">'
Add-Html '<head>'
Add-Html '<meta charset="UTF-8">'
Add-Html '<meta name="viewport" content="width=device-width, initial-scale=1">'
Add-Html '<title>&#20219;&#21209; ID &#25475;&#25551;&#22577;&#21578;</title>'

Add-Html '<style>'

Add-Html 'body{font-family:"Microsoft JhengHei",Arial,sans-serif;background:#eef2f4;margin:0;padding:20px;color:#222;}'

Add-Html '.box{background:#fff;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:auto;}'

Add-Html 'h1{margin-top:0;}'

Add-Html 'h2{margin-top:0;}'

Add-Html '.stats{display:flex;gap:12px;flex-wrap:wrap;}'

Add-Html '.stat{background:#f3f6f7;padding:14px 20px;border-radius:8px;}'

Add-Html 'table{width:100%;border-collapse:collapse;}'

Add-Html 'th{background:#405762;color:#fff;padding:10px;text-align:left;}'

Add-Html 'td{padding:10px;border-bottom:1px solid #ddd;vertical-align:top;}'

Add-Html '.id{color:#06c;text-decoration:underline;cursor:pointer;font-weight:bold;font-size:17px;}'

Add-Html '.detail{display:none;background:#f7fafb;}'

Add-Html '.cmd{background:#e5f1ff;padding:5px 9px;border-radius:5px;}'

Add-Html '.dup{background:#fff0f0;border:1px solid #d99;padding:12px;border-radius:7px;margin:8px 0;}'

Add-Html '.unused{display:inline-block;background:#fff0b5;padding:5px 9px;border-radius:5px;margin:3px;}'

Add-Html '.ok{color:#168348;font-weight:bold;}'

Add-Html '.search{width:100%;padding:11px;box-sizing:border-box;border:1px solid #bbb;border-radius:6px;font-size:16px;}'

Add-Html '</style>'

# ============================================================
# JAVASCRIPT
# ============================================================

Add-Html '<script>'

Add-Html 'function toggleDetail(id){'

Add-Html 'var row=document.getElementById(id);'

Add-Html 'if(!row){return;}'

Add-Html 'if(row.style.display==="table-row"){row.style.display="none";}else{row.style.display="table-row";}'

Add-Html '}'

Add-Html 'function searchQuest(){'

Add-Html 'var box=document.getElementById("searchBox");'

Add-Html 'var q=box.value.toLowerCase();'

Add-Html 'var rows=document.getElementsByClassName("questrow");'

Add-Html 'for(var i=0;i<rows.length;i++){'

Add-Html 'var text=rows[i].innerText.toLowerCase();'

Add-Html 'if(text.indexOf(q)>=0){rows[i].style.display="";}else{rows[i].style.display="none";}'

Add-Html '}'

Add-Html '}'

Add-Html '</script>'

Add-Html '</head>'

Add-Html '<body>'

# ============================================================
# TITLE
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h1>&#82;&#80;&#71; Maker MZ &#20219;&#21209; ID &#25475;&#25551;&#22577;&#21578;</h1>'

Add-Html '<p>QuestSystem_MZ &#20219;&#21209;&#25475;&#25551;&#22120; v19.3 Stable</p>'

Add-Html '<div class="stats">'

Add-Html (
    '<div class="stat">&#20219;&#21209;&#25976;&#37327;&#65306;<b>' +
    $SortedQuests.Count +
    '</b></div>'
)

Add-Html (
    '<div class="stat">&#26368;&#22823; ID&#65306;<b>' +
    $MaxId.ToString("000") +
    '</b></div>'
)

Add-Html (
    '<div class="stat">&#37325;&#35079; ID&#65306;<b>' +
    $DuplicateGroups.Count +
    '</b></div>'
)

Add-Html (
    '<div class="stat">&#26410;&#20351;&#29992; ID&#65306;<b>' +
    $UnusedIds.Count +
    '</b></div>'
)

Add-Html '</div>'
Add-Html '</div>'

# ============================================================
# SEARCH
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>&#25628;&#23563;&#20219;&#21209;</h2>'

Add-Html '<input id="searchBox" class="search" onkeyup="searchQuest()" placeholder="&#25628;&#23563; ID&#12289;&#20219;&#21209;&#21517;&#31281;&#12289;Map&#12289;Event...">'

Add-Html '</div>'

# ============================================================
# UNUSED
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>&#26410;&#20351;&#29992;&#20219;&#21209; ID</h2>'

if ($UnusedIds.Count -eq 0) {

    Add-Html (
        '<div class="ok">&#27809;&#26377;&#26410;&#20351;&#29992; ID&#12290;</div>'
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

Add-Html '<h2>&#37325;&#35079;&#20219;&#21209; ID</h2>'

if ($DuplicateGroups.Count -eq 0) {

    Add-Html (
        '<div class="ok">&#27809;&#26377;&#37325;&#35079;&#20219;&#21209; ID&#12290;</div>'
    )

}
else {

    foreach ($Group in $DuplicateGroups) {

        Add-Html '<div class="dup">'

        Add-Html (
            '<b>ID ' +
            (Html-Encode $Group.Name) +
            ' &#37325;&#35079; ' +
            $Group.Count +
            ' &#27425;</b>'
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

Add-Html '<h2>&#20219;&#21209;&#28165;&#21934;</h2>'

Add-Html '<p>&#40670;&#25802;&#34253;&#33394; ID &#21487;&#23637;&#38283;&#35443;&#32048;&#36039;&#26009;&#12290;</p>'

Add-Html '<table>'

Add-Html '<thead>'

Add-Html '<tr>'

Add-Html '<th>ID</th>'

Add-Html '<th>&#20219;&#21209;&#21517;&#31281;</th>'

Add-Html '<th>Map</th>'

Add-Html '<th>Event</th>'

Add-Html '<th>Page</th>'

Add-Html '<th>Type</th>'

Add-Html '<th>Amount</th>'

Add-Html '</tr>'

Add-Html '</thead>'

Add-Html '<tbody>'

$DetailIndex = 0

foreach ($Quest in $SortedQuests) {

    $DetailIndex++

    $DetailId =
        "detail_" +
        $DetailIndex.ToString()

    # --------------------------------------------------------
    # MAIN ROW
    # --------------------------------------------------------

    Add-Html '<tr class="questrow">'

    Add-Html (
        '<td>' +
        '<span class="id" onclick="toggleDetail(''' +
        $DetailId +
        ''')"">' +
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
        (Html-Encode $Quest.Amount) +
        '</td>'
    )

    Add-Html '</tr>'

    # --------------------------------------------------------
    # DETAIL
    # --------------------------------------------------------

    Add-Html (
        '<tr id="' +
        (Html-Encode $DetailId) +
        '" class="detail">'
    )

    Add-Html '<td colspan="7">'

    Add-Html (
        '<b>&#20219;&#21209; ID&#65306;</b>' +
        (Html-Encode $Quest.ID) +
        '<br>'
    )

    Add-Html (
        '<b>&#20219;&#21209;&#21517;&#31281;&#65306;</b>' +
        (Html-Encode $Quest.QuestName) +
        '<br>'
    )

    Add-Html (
        '<b>&#20219;&#21209;&#25551;&#36848;&#65306;</b>' +
        (Html-Encode $Quest.Description) +
        '<br>'
    )

    Add-Html (
        '<b>&#20219;&#21209;&#30446;&#27161;&#65306;</b>' +
        (Html-Encode $Quest.Objective) +
        '<br>'
    )

    Add-Html (
        '<b>Type&#65306;</b>' +
        (Html-Encode $Quest.Type) +
        '<br>'
    )

    Add-Html (
        '<b>Target&#65306;</b>' +
        (Html-Encode $Quest.Target) +
        '<br>'
    )

    Add-Html (
        '<b>Amount&#65306;</b>' +
        (Html-Encode $Quest.Amount) +
        '<br>'
    )

    Add-Html (
        '<b>Category&#65306;</b>' +
        (Html-Encode $Quest.Category) +
        '<br>'
    )

    Add-Html (
        '<b>Start Switch&#65306;</b>' +
        (Html-Encode $Quest.StartSwitch) +
        '<br>'
    )

    Add-Html (
        '<b>Complete Switch&#65306;</b>' +
        (Html-Encode $Quest.CompleteSwitch) +
        '<br>'
    )

    Add-Html (
        '<b>Map&#65306;</b>' +
        $Quest.MapID.ToString("000") +
        ' / ' +
        (Html-Encode $Quest.MapName) +
        '<br>'
    )

    Add-Html (
        '<b>Event&#65306;</b>' +
        $Quest.EventID +
        ' / ' +
        (Html-Encode $Quest.EventName) +
        '<br>'
    )

    Add-Html (
        '<b>Page&#65306;</b>' +
        $Quest.Page
    )

    Add-Html '</td>'

    Add-Html '</tr>'
}

if ($SortedQuests.Count -eq 0) {

    Add-Html (
        '<tr><td colspan="7">&#27809;&#26377;&#25214;&#21040; QuestSystem_MZ StartQuest &#25351;&#20196;&#12290;</td></tr>'
    )
}

Add-Html '</tbody>'
Add-Html '</table>'
Add-Html '</div>'

# ============================================================
# RELATED COMMANDS
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>&#20219;&#21209;&#30456;&#38364;&#25351;&#20196;</h2>'

Add-Html (
    '<p>&#21253;&#21547;&#65306;&#22686;&#21152;&#20219;&#21209;&#36914;&#24230;&#12289;&#22686;&#21152;&#29289;&#21697;&#36914;&#24230;&#12289;&#23436;&#25104;&#20219;&#21209;&#12289;&#36861;&#36452;&#20219;&#21209;&#12289;&#21462;&#28040;&#36861;&#36452;&#12290;</p>'
)

Add-Html '<table>'

Add-Html '<thead>'

Add-Html '<tr>'

Add-Html '<th>ID</th>'

Add-Html '<th>&#25351;&#20196;</th>'

Add-Html '<th>Map</th>'

Add-Html '<th>Event</th>'

Add-Html '<th>Page</th>'

Add-Html '<th>Amount</th>'

Add-Html '</tr>'

Add-Html '</thead>'

Add-Html '<tbody>'

foreach ($Related in $SortedRelated) {

    $DisplayId = $Related.ID

    if (
        [string]::IsNullOrWhiteSpace(
            $DisplayId
        )
    ) {

        $DisplayId = "NOT_FOUND"
    }

    $CommandChinese = $Related.Command

    if (
        $Related.Command.Equals(
            "AddQuestProgress",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $CommandChinese =
            "&#22686;&#21152;&#20219;&#21209;&#36914;&#24230;"
    }

    elseif (
        $Related.Command.Equals(
            "AddItemProgress",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $CommandChinese =
            "&#22686;&#21152;&#29289;&#21697;&#36914;&#24230;"
    }

    elseif (
        $Related.Command.Equals(
            "CompleteQuest",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $CommandChinese =
            "&#23436;&#25104;&#20219;&#21209;"
    }

    elseif (
        $Related.Command.Equals(
            "TrackQuest",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $CommandChinese =
            "&#36861;&#36452;&#20219;&#21209;"
    }

    elseif (
        $Related.Command.Equals(
            "UntrackQuest",
            [StringComparison]::OrdinalIgnoreCase
        )
    ) {
        $CommandChinese =
            "&#21462;&#28040;&#36861;&#36452;"
    }

    Add-Html '<tr>'

    Add-Html (
        '<td><b>' +
        (Html-Encode $DisplayId) +
        '</b></td>'
    )

    Add-Html (
        '<td><span class="cmd">' +
        $CommandChinese +
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
        '<tr><td colspan="6">&#27809;&#26377;&#25214;&#21040;&#20219;&#21209;&#30456;&#38364;&#25351;&#20196;&#12290;</td></tr>'
    )
}

Add-Html '</tbody>'
Add-Html '</table>'
Add-Html '</div>'

# ============================================================
# SCAN INFORMATION
# ============================================================

Add-Html '<div class="box">'

Add-Html '<h2>&#25475;&#25551;&#26041;&#24335;</h2>'

Add-Html (
    '<p>&#20351;&#29992; RPG Maker MZ Map JSON &#32080;&#27083;&#36958;&#36852;&#25475;&#25551;&#12290;</p>'
)

Add-Html (
    '<p>&#25475;&#25551;&#31684;&#22285;&#65306;data/MapXXX.json</p>'
)

Add-Html (
    '<p>&#25475;&#25551;&#25554;&#20214;&#65306;QuestSystem_MZ</p>'
)

Add-Html (
    '<p>&#20027;&#35201;&#25351;&#20196;&#65306;StartQuest</p>'
)

Add-Html (
    '<p>ID &#25475;&#25551;&#38918;&#24207;&#65306;001 &#8594; 002 &#8594; 003 &#8594; ...</p>'
)

Add-Html (
    '<p>&#19981;&#39023;&#31034; X / Y &#22352;&#27161;&#12290;</p>'
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
Write-Host "HTML created:" -ForegroundColor Green
Write-Host $HtmlPath

Write-Host ""
Write-Host "=============================================="
Write-Host " ALL REPORTS CREATED"
Write-Host "=============================================="
Write-Host ""

Write-Host "Quest count : " $SortedQuests.Count
Write-Host "Duplicate   : " $DuplicateGroups.Count
Write-Host "Unused      : " $UnusedIds.Count
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
    Write-Host "HTML could not be opened automatically." `
        -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"