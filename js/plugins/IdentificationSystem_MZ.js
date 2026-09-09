/*:
 * @target MZ
 * @plugindesc v3.0.0 完整物品鑑定系統 Lv.1～Lv.3／資料庫驅動／付費鑑定
 * @author Hope of Light
 *
 * @help
 * ============================================================================
 * IdentificationSystem_MZ.js
 * ============================================================================
 *
 * 《希望之光》完整鑑定系統
 *
 * ============================================================================
 * 【核心功能】
 * ============================================================================
 *
 * ★ 完全資料庫驅動
 * ★ 不寫死物品 ID
 * ★ 可無限增加未鑑定物品
 * ★ 支援 Lv.1～Lv.3
 * ★ 支援鑑定師等級限制
 * ★ 支援 Item → Item
 * ★ 支援 Item → Weapon
 * ★ 支援 Item → Armor
 * ★ 自動搜尋玩家持有的未鑑定物品
 * ★ 自動顯示鑑定費用
 * ★ 自動檢查金幣
 * ★ 自動扣除鑑定費
 * ★ 自動移除未鑑定物品
 * ★ 自動取得鑑定後物品
 * ★ 鑑定完成結果畫面
 * ★ 金幣不足不會消耗物品
 * ★ 鑑定等級不足不會消耗物品
 *
 * ============================================================================
 * 【未鑑定物品】
 * ============================================================================
 *
 * 所有未鑑定物品必須建立在：
 *
 * 資料庫 → 物品
 *
 * 不要建立成武器或防具。
 *
 * ============================================================================
 * 【Note 標籤】
 * ============================================================================
 *
 * <IdentifyLevel:1>
 * <IdentifyResult:item:31>
 * <IdentifyFee:30>
 *
 * 或：
 *
 * <IdentifyLevel:2>
 * <IdentifyResult:weapon:101>
 * <IdentifyFee:350>
 *
 * 或：
 *
 * <IdentifyLevel:3>
 * <IdentifyResult:armor:205>
 * <IdentifyFee:1800>
 *
 * ============================================================================
 * 【IdentifyLevel】
 * ============================================================================
 *
 * 1 = Lv.1 初級鑑定
 * 2 = Lv.2 高級鑑定
 * 3 = Lv.3 大師級鑑定
 *
 * ============================================================================
 * 【IdentifyResult】
 * ============================================================================
 *
 * <IdentifyResult:item:ID>
 * <IdentifyResult:weapon:ID>
 * <IdentifyResult:armor:ID>
 *
 * ============================================================================
 * 【IdentifyFee】
 * ============================================================================
 *
 * <IdentifyFee:500>
 *
 * 表示鑑定需要 500G。
 *
 * ============================================================================
 * 【插件指令】
 * ============================================================================
 *
 * Open Identification
 * 開啟鑑定介面
 *
 * Set Appraiser Level
 * 設定鑑定師等級
 *
 * Get Appraiser Level
 * 將鑑定師等級寫入變數
 *
 * ============================================================================
 *
 * @param defaultLevel
 * @text 預設鑑定師等級
 * @type number
 * @min 1
 * @max 3
 * @default 1
 *
 * @param windowWidth
 * @text 鑑定視窗寬度
 * @type number
 * @min 600
 * @default 1100
 *
 * @param windowHeight
 * @text 鑑定視窗高度
 * @type number
 * @min 400
 * @default 650
 *
 * @param backgroundOpacity
 * @text 視窗背景透明度
 * @type number
 * @min 0
 * @max 255
 * @default 230
 *
 * @command openIdentification
 * @text Open Identification
 * @desc 開啟物品鑑定介面。
 *
 * @command setAppraiserLevel
 * @text Set Appraiser Level
 * @desc 設定目前鑑定師等級。
 *
 * @arg level
 * @text Level
 * @type number
 * @min 1
 * @max 3
 * @default 1
 *
 * @command getAppraiserLevel
 * @text Get Appraiser Level
 * @desc 將目前鑑定師等級寫入指定變數。
 *
 * @arg variableId
 * @text Variable
 * @type variable
 * @default 1
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "IdentificationSystem_MZ";

    const params = PluginManager.parameters(PLUGIN_NAME);

    const DEFAULT_LEVEL =
        Math.max(
            1,
            Math.min(
                3,
                Number(params.defaultLevel || 1)
            )
        );

    const WINDOW_WIDTH =
        Math.max(
            600,
            Number(params.windowWidth || 1100)
        );

    const WINDOW_HEIGHT =
        Math.max(
            400,
            Number(params.windowHeight || 650)
        );

    const BACKGROUND_OPACITY =
        Math.max(
            0,
            Math.min(
                255,
                Number(params.backgroundOpacity || 230)
            )
        );

    const MAX_IDENTIFY_LEVEL = 3;

    const LEVEL_NAMES = {
        1: "Lv.1 初級鑑定",
        2: "Lv.2 高級鑑定",
        3: "Lv.3 大師級鑑定"
    };

    // =========================================================================
    // Game_System
    // =========================================================================

    const _Game_System_initialize =
        Game_System.prototype.initialize;

    Game_System.prototype.initialize =
        function() {

            _Game_System_initialize.call(this);

            this._identificationAppraiserLevel =
                DEFAULT_LEVEL;
        };

    Game_System.prototype.appraiserLevel =
        function() {

            if (!this._identificationAppraiserLevel) {
                this._identificationAppraiserLevel =
                    DEFAULT_LEVEL;
            }

            let level =
                Number(
                    this._identificationAppraiserLevel
                );

            if (!Number.isFinite(level)) {
                level = DEFAULT_LEVEL;
            }

            level =
                Math.floor(level);

            return Math.max(
                1,
                Math.min(
                    MAX_IDENTIFY_LEVEL,
                    level
                )
            );
        };

    Game_System.prototype.setAppraiserLevel =
        function(level) {

            level =
                Number(level);

            if (!Number.isFinite(level)) {
                level = DEFAULT_LEVEL;
            }

            level =
                Math.floor(level);

            level =
                Math.max(
                    1,
                    Math.min(
                        MAX_IDENTIFY_LEVEL,
                        level
                    )
                );

            this._identificationAppraiserLevel =
                level;
        };

    // =========================================================================
    // Note 資料解析
    // =========================================================================

    function getIdentificationData(item) {

        if (!item) {
            return null;
        }

        /*
         * 未鑑定品必須是資料庫「物品」。
         */

        if (!$dataItems || !$dataItems.includes(item)) {
            return null;
        }

        const note =
            String(item.note || "");

        // ---------------------------------------------------------------------
        // IdentifyLevel
        // ---------------------------------------------------------------------

        const levelMatch =
            note.match(
                /<IdentifyLevel\s*:\s*(\d+)\s*>/i
            );

        // ---------------------------------------------------------------------
        // IdentifyResult
        // ---------------------------------------------------------------------

        const resultMatch =
            note.match(
                /<IdentifyResult\s*:\s*(item|weapon|armor)\s*:\s*(\d+)\s*>/i
            );

        // ---------------------------------------------------------------------
        // IdentifyFee
        // ---------------------------------------------------------------------

        const feeMatch =
            note.match(
                /<IdentifyFee\s*:\s*(\d+)\s*>/i
            );

        if (
            !levelMatch ||
            !resultMatch ||
            !feeMatch
        ) {
            return null;
        }

        const level =
            Number(levelMatch[1]);

        const resultType =
            String(
                resultMatch[1]
            ).toLowerCase();

        const resultId =
            Number(resultMatch[2]);

        const fee =
            Number(feeMatch[1]);

        // ---------------------------------------------------------------------
        // 資料驗證
        // ---------------------------------------------------------------------

        if (
            !Number.isInteger(level) ||
            level < 1 ||
            level > MAX_IDENTIFY_LEVEL
        ) {
            return null;
        }

        if (
            !Number.isInteger(resultId) ||
            resultId <= 0
        ) {
            return null;
        }

        if (
            !Number.isInteger(fee) ||
            fee < 0
        ) {
            return null;
        }

        // ---------------------------------------------------------------------
        // 找到鑑定結果
        // ---------------------------------------------------------------------

        let result = null;

        if (resultType === "item") {

            result =
                $dataItems[resultId];

        } else if (resultType === "weapon") {

            result =
                $dataWeapons[resultId];

        } else if (resultType === "armor") {

            result =
                $dataArmors[resultId];

        }

        if (!result) {
            return null;
        }

        return {
            level: level,
            resultType: resultType,
            resultId: resultId,
            fee: fee,
            result: result
        };
    }

    // =========================================================================
    // 是否為未鑑定品
    // =========================================================================

    function isIdentificationItem(item) {

        return !!getIdentificationData(item);
    }

    // =========================================================================
    // 鑑定師是否可以鑑定
    // =========================================================================

    function canAppraise(item) {

        const data =
            getIdentificationData(item);

        if (!data) {
            return false;
        }

        return (
            $gameSystem.appraiserLevel()
            >= data.level
        );
    }

    // =========================================================================
    // 物品類型名稱
    // =========================================================================

    function resultTypeName(type) {

        switch (type) {

            case "item":
                return "道具";

            case "weapon":
                return "武器";

            case "armor":
                return "防具";

            default:
                return "";
        }
    }

    // =========================================================================
    // Plugin Commands
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "openIdentification",
        function() {

            SceneManager.push(
                Scene_Identification
            );
        }
    );

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "setAppraiserLevel",
        function(args) {

            const level =
                Number(args.level || 1);

            $gameSystem.setAppraiserLevel(
                level
            );
        }
    );

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "getAppraiserLevel",
        function(args) {

            const variableId =
                Number(
                    args.variableId || 0
                );

            if (variableId > 0) {

                $gameVariables.setValue(
                    variableId,
                    $gameSystem.appraiserLevel()
                );
            }
        }
    );

    // =========================================================================
    // Window_IdentificationTitle
    // =========================================================================

    class Window_IdentificationTitle
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this.opacity = 255;

            this.refresh();
        }

        refresh() {

            this.contents.clear();

            const width =
                this.contentsWidth();

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "物品鑑定所",
                0,
                0,
                width,
                "center"
            );

            this.resetTextColor();

            this.drawText(
                "鑑定師",
                20,
                this.lineHeight(),
                100
            );

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                LEVEL_NAMES[
                    $gameSystem.appraiserLevel()
                ],
                120,
                this.lineHeight(),
                220
            );

            this.resetTextColor();

            this.drawText(
                `持有金幣：${$gameParty.gold().toLocaleString()}G`,
                width - 280,
                this.lineHeight(),
                260,
                "right"
            );
        }
    }

    // =========================================================================
    // Window_IdentificationList
    // =========================================================================

    class Window_IdentificationList
        extends Window_Selectable {

        initialize(rect) {

            super.initialize(rect);

            this._data = [];

            this.refresh();

            this.select(0);

            this.activate();
        }

        maxItems() {

            return this._data.length;
        }

        item() {

            return this._data[
                this.index()
            ];
        }

        makeItemList() {

            this._data = [];

            if (!$gameParty) {
                return;
            }

            /*
             * 自動掃描所有物品。
             *
             * 不需要寫死 202～591。
             */

            for (
                let i = 1;
                i < $dataItems.length;
                i++
            ) {

                const item =
                    $dataItems[i];

                if (!item) {
                    continue;
                }

                if (!isIdentificationItem(item)) {
                    continue;
                }

                if (!$gameParty.hasItem(item)) {
                    continue;
                }

                this._data.push(item);
            }
        }

        refresh() {

            this.makeItemList();

            this.contents.clear();

            this.drawAllItems();

            this.callUpdateHelp();
        }

        drawItem(index) {

            const item =
                this._data[index];

            if (!item) {
                return;
            }

            const rect =
                this.itemLineRect(index);

            const data =
                getIdentificationData(item);

            this.changePaintOpacity(
                canAppraise(item)
            );

            this.drawItemName(
                item,
                rect.x,
                rect.y,
                rect.width - 190
            );

            if (data) {

                this.changeTextColor(
                    ColorManager.systemColor()
                );

                this.drawText(
                    `Lv.${data.level}`,
                    rect.x + rect.width - 185,
                    rect.y,
                    55,
                    "center"
                );

                this.resetTextColor();

                this.drawText(
                    `${data.fee.toLocaleString()}G`,
                    rect.x + rect.width - 120,
                    rect.y,
                    110,
                    "right"
                );
            }

            this.changePaintOpacity(true);
        }

        isEnabled(item) {

            return canAppraise(item);
        }

        processOk() {

            const item =
                this.item();

            if (!item) {

                SoundManager.playBuzzer();

                return;
            }

            if (!isIdentificationItem(item)) {

                SoundManager.playBuzzer();

                return;
            }

            if (!canAppraise(item)) {

                SoundManager.playBuzzer();

                this.callHandler(
                    "cannot"
                );

                return;
            }

            if (!$gameParty.hasItem(item)) {

                SoundManager.playBuzzer();

                return;
            }

            const data =
                getIdentificationData(item);

            if (
                !data ||
                $gameParty.gold() < data.fee
            ) {

                SoundManager.playBuzzer();

                this.callHandler(
                    "nogold"
                );

                return;
            }

            this.callHandler("ok");
        }
    }

    // =========================================================================
    // Window_IdentificationInfo
    // =========================================================================

    class Window_IdentificationInfo
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this._item = null;

            this.refresh();
        }

        setItem(item) {

            if (this._item === item) {
                return;
            }

            this._item = item;

            this.refresh();
        }

        refresh() {

            this.contents.clear();

            const item =
                this._item;

            if (!item) {

                this.changeTextColor(
                    ColorManager.systemColor()
                );

                this.drawText(
                    "請選擇要鑑定的物品。",
                    0,
                    0,
                    this.contentsWidth(),
                    "center"
                );

                this.resetTextColor();

                return;
            }

            const data =
                getIdentificationData(item);

            if (!data) {
                return;
            }

            let y = 0;

            // -----------------------------------------------------------------
            // 未鑑定品
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "未鑑定品",
                0,
                y,
                120
            );

            this.resetTextColor();

            this.drawItemName(
                item,
                130,
                y,
                this.contentsWidth() - 130
            );

            y += this.lineHeight();

            // -----------------------------------------------------------------
            // 持有數量
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "持有數量",
                0,
                y,
                120
            );

            this.resetTextColor();

            this.drawText(
                String(
                    $gameParty.numItems(item)
                ),
                130,
                y,
                this.contentsWidth() - 130
            );

            y += this.lineHeight();

            // -----------------------------------------------------------------
            // 鑑定等級
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "鑑定等級",
                0,
                y,
                120
            );

            this.resetTextColor();

            this.drawText(
                LEVEL_NAMES[data.level],
                130,
                y,
                this.contentsWidth() - 130
            );

            y += this.lineHeight();

            // -----------------------------------------------------------------
            // 鑑定費用
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "鑑定費用",
                0,
                y,
                120
            );

            this.resetTextColor();

            this.drawText(
                `${data.fee.toLocaleString()} G`,
                130,
                y,
                this.contentsWidth() - 130
            );

            y += this.lineHeight();

            // -----------------------------------------------------------------
            // 持有金幣
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "持有金幣",
                0,
                y,
                120
            );

            this.resetTextColor();

            this.drawText(
                `${$gameParty.gold().toLocaleString()} G`,
                130,
                y,
                this.contentsWidth() - 130
            );

            y += this.lineHeight() + 10;

            // -----------------------------------------------------------------
            // 鑑定結果
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "鑑定結果",
                0,
                y,
                this.contentsWidth()
            );

            this.resetTextColor();

            y += this.lineHeight();

            this.drawItemName(
                data.result,
                0,
                y,
                this.contentsWidth()
            );

            y += this.lineHeight();

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                `類型：${resultTypeName(data.resultType)}`,
                0,
                y,
                this.contentsWidth()
            );

            this.resetTextColor();

            y += this.lineHeight() + 10;

            // -----------------------------------------------------------------
            // 未鑑定物品說明
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "物品說明",
                0,
                y,
                this.contentsWidth()
            );

            this.resetTextColor();

            y += this.lineHeight();

            this.drawTextEx(
                item.description || "沒有說明。",
                0,
                y
            );

            y += this.lineHeight() * 3;

            // -----------------------------------------------------------------
            // 狀態
            // -----------------------------------------------------------------

            const currentLevel =
                $gameSystem.appraiserLevel();

            if (currentLevel < data.level) {

                this.changeTextColor(
                    ColorManager.powerUpColor()
                );

                this.drawText(
                    `需要 ${LEVEL_NAMES[data.level]}`,
                    0,
                    y,
                    this.contentsWidth()
                );

                this.resetTextColor();

            } else if (
                $gameParty.gold() < data.fee
            ) {

                this.changeTextColor(
                    ColorManager.powerUpColor()
                );

                this.drawText(
                    "金幣不足，無法鑑定。",
                    0,
                    y,
                    this.contentsWidth()
                );

                this.resetTextColor();

            } else {

                this.changeTextColor(
                    ColorManager.systemColor()
                );

                this.drawText(
                    "可以進行鑑定。",
                    0,
                    y,
                    this.contentsWidth()
                );

                this.resetTextColor();
            }
        }
    }

    // =========================================================================
    // Window_IdentificationConfirm
    // =========================================================================

    class Window_IdentificationConfirm
        extends Window_Command {

        initialize(rect) {

            super.initialize(rect);

            this.openness = 0;

            this.deactivate();
        }

        makeCommandList() {

            this.addCommand(
                "確定鑑定",
                "ok"
            );

            this.addCommand(
                "取消",
                "cancel"
            );
        }
    }

    // =========================================================================
    // Window_IdentificationResult
    // =========================================================================

    class Window_IdentificationResult
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this._unidentified = null;
            this._result = null;
            this._data = null;

            this.openness = 0;
        }

        setResult(
            unidentified,
            result,
            data
        ) {

            this._unidentified =
                unidentified;

            this._result =
                result;

            this._data =
                data;

            this.refresh();

            this.open();

            this.activate();
        }

        refresh() {

            this.contents.clear();

            if (
                !this._unidentified ||
                !this._result ||
                !this._data
            ) {
                return;
            }

            const width =
                this.contentsWidth();

            let y = 0;

            // -----------------------------------------------------------------
            // 標題
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "★ 鑑定完成！",
                0,
                y,
                width,
                "center"
            );

            this.resetTextColor();

            y += this.lineHeight() + 15;

            // -----------------------------------------------------------------
            // 未鑑定品
            // -----------------------------------------------------------------

            this.drawItemName(
                this._unidentified,
                0,
                y,
                width,
                "center"
            );

            y += this.lineHeight();

            this.drawText(
                "↓",
                0,
                y,
                width,
                "center"
            );

            y += this.lineHeight();

            // -----------------------------------------------------------------
            // 結果
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawItemName(
                this._result,
                0,
                y,
                width
            );

            this.resetTextColor();

            y += this.lineHeight() + 10;

            // -----------------------------------------------------------------
            // 類型
            // -----------------------------------------------------------------

            this.drawText(
                `類型：${resultTypeName(
                    this._data.resultType
                )}`,
                0,
                y,
                width,
                "center"
            );

            y += this.lineHeight();

            // -----------------------------------------------------------------
            // 費用
            // -----------------------------------------------------------------

            this.drawText(
                `鑑定費：${this._data.fee.toLocaleString()} G`,
                0,
                y,
                width,
                "center"
            );

            y += this.lineHeight() + 10;

            // -----------------------------------------------------------------
            // 結果說明
            // -----------------------------------------------------------------

            this.drawTextEx(
                this._result.description || "沒有說明。",
                20,
                y
            );
        }
    }

    // =========================================================================
    // Scene_Identification
    // =========================================================================

    class Scene_Identification
        extends Scene_MenuBase {

        create() {

            super.create();

            this._selectedItem = null;
            this._selectedData = null;

            this._messageWaiting = false;
            this._showingResult = false;

            this.createTitleWindow();
            this.createListWindow();
            this.createInfoWindow();
            this.createConfirmWindow();
            this.createResultWindow();

            this.refreshInfo();
        }

        // ---------------------------------------------------------------------
        // Title
        // ---------------------------------------------------------------------

        createTitleWindow() {

            const rect =
                this.titleWindowRect();

            this._titleWindow =
                new Window_IdentificationTitle(
                    rect
                );

            this.addWindow(
                this._titleWindow
            );
        }

        titleWindowRect() {

            const ww =
                Math.min(
                    WINDOW_WIDTH,
                    Graphics.boxWidth
                );

            const wh =
                this.calcWindowHeight(
                    3,
                    false
                );

            const x =
                Math.floor(
                    (Graphics.boxWidth - ww) / 2
                );

            const y =
                Math.floor(
                    Math.max(
                        0,
                        (Graphics.boxHeight - WINDOW_HEIGHT) / 2
                    )
                );

            return new Rectangle(
                x,
                y,
                ww,
                wh
            );
        }

        // ---------------------------------------------------------------------
        // List
        // ---------------------------------------------------------------------

        createListWindow() {

            const rect =
                this.listWindowRect();

            this._listWindow =
                new Window_IdentificationList(
                    rect
                );

            this._listWindow.setHandler(
                "ok",
                this.onItemOk.bind(this)
            );

            this._listWindow.setHandler(
                "cancel",
                this.popScene.bind(this)
            );

            this._listWindow.setHandler(
                "cannot",
                this.onCannotIdentify.bind(this)
            );

            this._listWindow.setHandler(
                "nogold",
                this.onNotEnoughGold.bind(this)
            );

            this.addWindow(
                this._listWindow
            );
        }

        listWindowRect() {

            const titleHeight =
                this.titleWindowRect().height;

            const ww =
                Math.floor(
                    Math.min(
                        WINDOW_WIDTH,
                        Graphics.boxWidth
                    ) * 0.48
                );

            const x =
                Math.floor(
                    (Graphics.boxWidth - Math.min(
                        WINDOW_WIDTH,
                        Graphics.boxWidth
                    )) / 2
                );

            const y =
                this.titleWindowRect().y +
                titleHeight;

            const h =
                Graphics.boxHeight - y;

            return new Rectangle(
                x,
                y,
                ww,
                h
            );
        }

        // ---------------------------------------------------------------------
        // Info
        // ---------------------------------------------------------------------

        createInfoWindow() {

            const rect =
                this.infoWindowRect();

            this._infoWindow =
                new Window_IdentificationInfo(
                    rect
                );

            this.addWindow(
                this._infoWindow
            );
        }

        infoWindowRect() {

            const titleHeight =
                this.titleWindowRect().height;

            const totalWidth =
                Math.min(
                    WINDOW_WIDTH,
                    Graphics.boxWidth
                );

            const baseX =
                Math.floor(
                    (Graphics.boxWidth - totalWidth) / 2
                );

            const listWidth =
                Math.floor(
                    totalWidth * 0.48
                );

            const x =
                baseX + listWidth;

            const y =
                this.titleWindowRect().y +
                titleHeight;

            const w =
                totalWidth - listWidth;

            const h =
                Graphics.boxHeight - y;

            return new Rectangle(
                x,
                y,
                w,
                h
            );
        }

        // ---------------------------------------------------------------------
        // Confirm
        // ---------------------------------------------------------------------

        createConfirmWindow() {

            const ww = 320;

            const wh =
                this.calcWindowHeight(
                    2,
                    true
                );

            const wx =
                Math.floor(
                    (Graphics.boxWidth - ww) / 2
                );

            const wy =
                Math.floor(
                    (Graphics.boxHeight - wh) / 2
                );

            const rect =
                new Rectangle(
                    wx,
                    wy,
                    ww,
                    wh
                );

            this._confirmWindow =
                new Window_IdentificationConfirm(
                    rect
                );

            this._confirmWindow.setHandler(
                "ok",
                this.onConfirmOk.bind(this)
            );

            this._confirmWindow.setHandler(
                "cancel",
                this.onConfirmCancel.bind(this)
            );

            this.addWindow(
                this._confirmWindow
            );
        }

        // ---------------------------------------------------------------------
        // Result
        // ---------------------------------------------------------------------

        createResultWindow() {

            const ww =
                Math.min(
                    600,
                    Graphics.boxWidth - 80
                );

            const wh =
                Math.min(
                    360,
                    Graphics.boxHeight - 80
                );

            const wx =
                Math.floor(
                    (Graphics.boxWidth - ww) / 2
                );

            const wy =
                Math.floor(
                    (Graphics.boxHeight - wh) / 2
                );

            const rect =
                new Rectangle(
                    wx,
                    wy,
                    ww,
                    wh
                );

            this._resultWindow =
                new Window_IdentificationResult(
                    rect
                );

            this.addWindow(
                this._resultWindow
            );
        }

        // ---------------------------------------------------------------------
        // 更新
        // ---------------------------------------------------------------------

        update() {

            super.update();

            if (
                this._showingResult
            ) {

                this.updateResultWindow();

                return;
            }

            if (
                this._listWindow &&
                this._infoWindow
            ) {

                this._infoWindow.setItem(
                    this._listWindow.item()
                );
            }

            if (
                this._messageWaiting &&
                !$gameMessage.isBusy()
            ) {

                this._messageWaiting =
                    false;

                this._listWindow.refresh();

                this._listWindow.activate();

                this.refreshInfo();
            }
        }

        // ---------------------------------------------------------------------
        // 更新資訊
        // ---------------------------------------------------------------------

        refreshInfo() {

            if (
                this._infoWindow &&
                this._listWindow
            ) {

                this._infoWindow.setItem(
                    this._listWindow.item()
                );
            }

            if (this._titleWindow) {
                this._titleWindow.refresh();
            }
        }

        // ---------------------------------------------------------------------
        // 選擇物品
        // ---------------------------------------------------------------------

        onItemOk() {

            const item =
                this._listWindow.item();

            if (!item) {

                SoundManager.playBuzzer();

                return;
            }

            const data =
                getIdentificationData(item);

            if (!data) {

                SoundManager.playBuzzer();

                return;
            }

            // -------------------------------------------------------------
            // 鑑定師等級
            // -------------------------------------------------------------

            if (!canAppraise(item)) {

                SoundManager.playBuzzer();

                this.onCannotIdentify();

                return;
            }

            // -------------------------------------------------------------
            // 物品
            // -------------------------------------------------------------

            if (!$gameParty.hasItem(item)) {

                SoundManager.playBuzzer();

                return;
            }

            // -------------------------------------------------------------
            // 金幣
            // -------------------------------------------------------------

            if (
                $gameParty.gold() < data.fee
            ) {

                SoundManager.playBuzzer();

                this.onNotEnoughGold();

                return;
            }

            this._selectedItem =
                item;

            this._selectedData =
                data;

            this._confirmWindow.select(0);

            this._confirmWindow.open();

            this._confirmWindow.activate();

            this._listWindow.deactivate();
        }

        // ---------------------------------------------------------------------
        // 鑑定師等級不足
        // ---------------------------------------------------------------------

        onCannotIdentify() {

            const item =
                this._listWindow.item();

            const data =
                getIdentificationData(item);

            if (!data) {
                return;
            }

            const current =
                $gameSystem.appraiserLevel();

            this.showMessage(
                `需要 ${LEVEL_NAMES[data.level]} 才能鑑定。\n` +
                `目前鑑定師等級：Lv.${current}`
            );
        }

        // ---------------------------------------------------------------------
        // 金幣不足
        // ---------------------------------------------------------------------

        onNotEnoughGold() {

            const item =
                this._listWindow.item();

            const data =
                getIdentificationData(item);

            if (!data) {
                return;
            }

            this.showMessage(
                `金幣不足，無法進行鑑定。\n` +
                `需要 ${data.fee.toLocaleString()}G。`
            );
        }

        // ---------------------------------------------------------------------
        // 確認鑑定
        // ---------------------------------------------------------------------

        onConfirmOk() {

            const item =
                this._selectedItem;

            const data =
                this._selectedData;

            if (!item || !data) {

                this.closeConfirm();

                return;
            }

            // -------------------------------------------------------------
            // 再次確認鑑定師等級
            // -------------------------------------------------------------

            if (!canAppraise(item)) {

                this.closeConfirm();

                SoundManager.playBuzzer();

                this.showMessage(
                    "目前鑑定師等級不足。"
                );

                return;
            }

            // -------------------------------------------------------------
            // 再次確認物品
            // -------------------------------------------------------------

            if (!$gameParty.hasItem(item)) {

                this.closeConfirm();

                SoundManager.playBuzzer();

                this.showMessage(
                    "找不到要鑑定的物品。"
                );

                return;
            }

            // -------------------------------------------------------------
            // 再次確認金幣
            // -------------------------------------------------------------

            if (
                $gameParty.gold() < data.fee
            ) {

                this.closeConfirm();

                SoundManager.playBuzzer();

                this.showMessage(
                    "金幣不足，無法進行鑑定。"
                );

                return;
            }

            // -------------------------------------------------------------
            // 確認結果
            // -------------------------------------------------------------

            const result =
                data.result;

            if (!result) {

                this.closeConfirm();

                SoundManager.playBuzzer();

                this.showMessage(
                    "鑑定資料錯誤：找不到鑑定結果。"
                );

                return;
            }

            // -------------------------------------------------------------
            // 執行鑑定
            // -------------------------------------------------------------

            $gameParty.loseGold(
                data.fee
            );

            $gameParty.loseItem(
                item,
                1,
                false
            );

            $gameParty.gainItem(
                result,
                1,
                false
            );

            SoundManager.playShop();

            this.closeConfirm();

            this._listWindow.refresh();

            this._titleWindow.refresh();

            this._infoWindow.setItem(
                this._listWindow.item()
            );

            this.showIdentificationResult(
                item,
                result,
                data
            );
        }

        // ---------------------------------------------------------------------
        // 顯示結果
        // ---------------------------------------------------------------------

        showIdentificationResult(
            unidentified,
            result,
            data
        ) {

            this._showingResult =
                true;

            this._resultWindow.setResult(
                unidentified,
                result,
                data
            );

            this._listWindow.deactivate();
        }

        // ---------------------------------------------------------------------
        // 結果視窗更新
        // ---------------------------------------------------------------------

        updateResultWindow() {

            if (
                !this._resultWindow ||
                !this._resultWindow.isOpen()
            ) {
                return;
            }

            if (
                Input.isTriggered("ok") ||
                Input.isTriggered("cancel") ||
                TouchInput.isTriggered()
            ) {

                this._resultWindow.close();

                this._showingResult =
                    false;

                this._selectedItem =
                    null;

                this._selectedData =
                    null;

                this._listWindow.refresh();

                this._titleWindow.refresh();

                this._listWindow.activate();

                if (
                    this._listWindow.maxItems() > 0
                ) {

                    this._listWindow.select(
                        Math.min(
                            this._listWindow.index(),
                            this._listWindow.maxItems() - 1
                        )
                    );

                } else {

                    this._listWindow.select(-1);
                }

                this.refreshInfo();
            }
        }

        // ---------------------------------------------------------------------
        // 取消確認
        // ---------------------------------------------------------------------

        onConfirmCancel() {

            this.closeConfirm();

            this._listWindow.activate();
        }

        // ---------------------------------------------------------------------
        // 關閉確認
        // ---------------------------------------------------------------------

        closeConfirm() {

            this._confirmWindow.close();

            this._confirmWindow.deactivate();

            this._selectedItem =
                null;

            this._selectedData =
                null;
        }

        // ---------------------------------------------------------------------
        // 顯示訊息
        // ---------------------------------------------------------------------

        showMessage(text) {

            $gameMessage.add(text);

            this._messageWaiting =
                true;

            this._listWindow.deactivate();
        }
    }

    // =========================================================================
    // 對外 API
    // =========================================================================

    window.IdentificationSystemMZ = {

        version: "3.0.0",

        getIdentificationData:
            getIdentificationData,

        isIdentificationItem:
            isIdentificationItem,

        canAppraise:
            canAppraise,

        appraiserLevel:
            function() {

                return $gameSystem.appraiserLevel();
            },

        setAppraiserLevel:
            function(level) {

                $gameSystem.setAppraiserLevel(
                    level
                );
            },

        levelName:
            function(level) {

                return LEVEL_NAMES[level] || "";
            }
    };

    window.Scene_Identification =
        Scene_Identification;

    window.Window_IdentificationList =
        Window_IdentificationList;

    window.Window_IdentificationInfo =
        Window_IdentificationInfo;

})();