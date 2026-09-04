/*:
 * @target MZ
 * @plugindesc v1.4.1 任務系統：任務列表、追蹤、擊殺/收集計數、自動開關、任務/小地圖並排
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * QuestSystem_MZ v1.4.1
 * ============================================================================
 *
 * 功能：
 * 1. 任務列表
 * 2. 任務詳細說明
 * 3. 主線 / 支線
 * 4. 任務追蹤
 * 5. 擊殺敵人任務
 * 6. 收集物品任務
 * 7. 一般計數任務
 * 8. 任務完成音效
 * 9. 任務開始開關
 * 10. 任務完成開關
 * 11. 防止同一任務重複接受
 * 12. 任務追蹤視窗
 * 13. 與 MiniMap_MZ 自動並排
 * 14. 電腦 / 手機畫面自動調整
 *
 * ============================================================================
 *
 * @param Max Track
 * @text 地圖最多追蹤任務
 * @type number
 * @min 1
 * @max 5
 * @default 1
 *
 * @param Window Width
 * @text 任務列表視窗寬度
 * @type number
 * @min 300
 * @default 760
 *
 * @param Window Height
 * @text 任務列表視窗高度
 * @type number
 * @min 200
 * @default 520
 *
 * @param Tracker Width
 * @text 地圖任務追蹤寬度
 * @type number
 * @min 220
 * @default 360
 *
 * @param Tracker Height
 * @text 地圖任務追蹤高度
 * @type number
 * @min 120
 * @default 205
 *
 * @param Tracker Font Size
 * @text 任務追蹤文字大小
 * @type number
 * @min 12
 * @default 18
 *
 * @param Tracker X
 * @text 任務追蹤左側位置
 * @type number
 * @min 0
 * @default 15
 *
 * @param Tracker Y
 * @text 任務追蹤上方位置
 * @type number
 * @min 0
 * @default 15
 *
 * @param Show Tracker
 * @text 顯示地圖任務
 * @type boolean
 * @on 顯示
 * @off 隱藏
 * @default true
 *
 * @param Complete SE
 * @text 任務完成音效
 * @type file
 * @dir audio/se/
 * @default Applause1
 *
 * @command OpenQuestScene
 * @text 開啟任務介面
 *
 * @command StartQuest
 * @text 開始任務
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * @arg questName
 * @text 任務名稱
 * @type string
 * @default 森林的異變
 *
 * @arg description
 * @text 任務描述
 * @type multiline_string
 * @default 村長請米潔牙前往森林，調查哥布林異變事件。
 *
 * @arg objective
 * @text 任務目標
 * @type string
 * @default 擊殺森林哥布林
 *
 * @arg type
 * @text 目標類型
 * @type select
 * @option 擊殺敵人
 * @value kill
 * @option 收集物品
 * @value item
 * @option 一般計數
 * @value count
 * @default kill
 *
 * @arg target
 * @text 目標ID
 * @type string
 * @default 1
 *
 * @arg amount
 * @text 需要數量
 * @type number
 * @min 1
 * @default 5
 *
 * @arg category
 * @text 任務分類
 * @type select
 * @option 主線
 * @value main
 * @option 支線
 * @value side
 * @default main
 *
 * @arg startSwitch
 * @text 開始任務時開關
 * @type switch
 * @default 0
 *
 * @arg completeSwitch
 * @text 完成任務時開關
 * @type switch
 * @default 0
 *
 * @command AddQuestProgress
 * @text 增加任務進度
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * @arg amount
 * @text 增加數量
 * @type number
 * @min 1
 * @default 1
 *
 * @command CompleteQuest
 * @text 完成任務
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * @command TrackQuest
 * @text 追蹤任務
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * @command UntrackQuest
 * @text 取消追蹤
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * @command HideTracker
 * @text 隱藏任務追蹤
 *
 * @command ShowTracker
 * @text 顯示任務追蹤
 *
 * @command AddItemProgress
 * @text 收集任務進度
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 002
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "QuestSystem_MZ";
    const P = PluginManager.parameters(PLUGIN_NAME);

    const MAX_TRACK =
        Number(P["Max Track"] || 1);

    const WINDOW_WIDTH =
        Number(P["Window Width"] || 760);

    const WINDOW_HEIGHT =
        Number(P["Window Height"] || 520);

    const TRACKER_WIDTH =
        Number(P["Tracker Width"] || 360);

    const TRACKER_HEIGHT =
        Number(P["Tracker Height"] || 205);

    const TRACKER_FONT_SIZE =
        Number(P["Tracker Font Size"] || 18);

    const TRACKER_X =
        Number(P["Tracker X"] || 15);

    const TRACKER_Y =
        Number(P["Tracker Y"] || 15);

    const SHOW_TRACKER =
        String(
            P["Show Tracker"] || "true"
        ) === "true";

    const COMPLETE_SE =
        String(
            P["Complete SE"] ||
            "Applause1"
        );


    function normalizeQuestId(id) {

        const value =
            String(id ?? "").trim();

        if (/^\d+$/.test(value)) {

            return value.padStart(
                3,
                "0"
            );
        }

        return value;
    }


    function makeQuest(
        id,
        name,
        description,
        objective,
        type,
        target,
        amount,
        category,
        startSwitch,
        completeSwitch
    ) {

        return {

            id:
                normalizeQuestId(id),

            name:
                String(name || ""),

            description:
                String(description || ""),

            objective:
                String(objective || ""),

            type:
                String(type || "count"),

            target:
                String(target || "1"),

            amount:
                Math.max(
                    1,
                    Number(amount || 1)
                ),

            progress:
                0,

            category:
                category || "main",

            status:
                "active",

            tracked:
                true,

            startSwitch:
                Number(startSwitch || 0),

            completeSwitch:
                Number(completeSwitch || 0)
        };
    }


    const _Game_System_initialize =
        Game_System.prototype.initialize;


    Game_System.prototype.initialize =
        function() {

            _Game_System_initialize.call(
                this
            );

            this.initQuestSystem();
        };


    Game_System.prototype.initQuestSystem =
        function() {

            if (!this._quests) {

                this._quests = [];
            }

            const unique = [];
            const table = {};


            for (
                const quest of this._quests
            ) {

                if (!quest) {
                    continue;
                }

                quest.id =
                    normalizeQuestId(
                        quest.id
                    );


                if (!table[quest.id]) {

                    table[quest.id] =
                        quest;

                    unique.push(
                        quest
                    );

                } else {

                    const old =
                        table[quest.id];


                    old.progress =
                        Math.max(
                            Number(
                                old.progress ||
                                0
                            ),

                            Number(
                                quest.progress ||
                                0
                            )
                        );


                    if (
                        quest.status ===
                        "completed"
                    ) {

                        old.status =
                            "completed";

                        old.tracked =
                            false;
                    }
                }
            }


            this._quests =
                unique;


            if (
                this._questTrackerVisible ===
                undefined
            ) {

                this._questTrackerVisible =
                    SHOW_TRACKER;
            }
        };


    Game_System.prototype.quest =
        function(id) {

            this.initQuestSystem();


            const questId =
                normalizeQuestId(id);


            return this._quests.find(
                q =>
                    q.id ===
                    questId
            );
        };


    Game_System.prototype.activeQuests =
        function() {

            this.initQuestSystem();


            return this._quests.filter(
                q =>
                    q.status ===
                    "active"
            );
        };


    Game_System.prototype.completedQuests =
        function() {

            this.initQuestSystem();


            return this._quests.filter(
                q =>
                    q.status ===
                    "completed"
            );
        };


    Game_System.prototype.trackedQuests =
        function() {

            this.initQuestSystem();


            return this._quests.filter(
                q =>
                    q.status ===
                    "active" &&
                    q.tracked
            );
        };


    Game_System.prototype.startQuest =
        function(
            id,
            name,
            description,
            objective,
            type,
            target,
            amount,
            category,
            startSwitch,
            completeSwitch
        ) {

            this.initQuestSystem();


            const questId =
                normalizeQuestId(id);


            const oldQuest =
                this.quest(
                    questId
                );


            if (oldQuest) {

                this.refreshQuestUI();

                return oldQuest;
            }


            const quest =
                makeQuest(
                    questId,
                    name,
                    description,
                    objective,
                    type,
                    target,
                    amount,
                    category,
                    startSwitch,
                    completeSwitch
                );


            this._quests.push(
                quest
            );


            if (
                quest.startSwitch > 0 &&
                $gameSwitches
            ) {

                $gameSwitches.setValue(
                    quest.startSwitch,
                    true
                );
            }


            this.playQuestNotification(
                "start",
                quest
            );


            this.refreshQuestUI();


            return quest;
        };


    Game_System.prototype.addQuestProgress =
        function(
            id,
            amount
        ) {

            const quest =
                this.quest(id);


            if (!quest) {
                return;
            }


            if (
                quest.status !==
                "active"
            ) {

                return;
            }


            quest.progress +=
                Number(
                    amount || 1
                );


            if (
                quest.progress >=
                quest.amount
            ) {

                quest.progress =
                    quest.amount;


                this.completeQuest(
                    quest.id
                );


                return;
            }


            this.refreshQuestUI();
        };


    Game_System.prototype.completeQuest =
        function(id) {

            const quest =
                this.quest(id);


            if (!quest) {
                return;
            }


            if (
                quest.status ===
                "completed"
            ) {

                return;
            }


            quest.progress =
                quest.amount;


            quest.status =
                "completed";


            quest.tracked =
                false;


            if (
                quest.completeSwitch > 0 &&
                $gameSwitches
            ) {

                $gameSwitches.setValue(
                    quest.completeSwitch,
                    true
                );
            }


            this.playQuestNotification(
                "complete",
                quest
            );


            this.refreshQuestUI();
        };


    Game_System.prototype.trackQuest =
        function(id) {

            const quest =
                this.quest(id);


            if (!quest) {
                return;
            }


            if (
                quest.status !==
                "active"
            ) {

                return;
            }


            const tracked =
                this.trackedQuests();


            if (
                !quest.tracked &&
                tracked.length >=
                MAX_TRACK
            ) {

                tracked[0].tracked =
                    false;
            }


            quest.tracked =
                true;


            this.refreshQuestUI();
        };


    Game_System.prototype.untrackQuest =
        function(id) {

            const quest =
                this.quest(id);


            if (!quest) {
                return;
            }


            quest.tracked =
                false;


            this.refreshQuestUI();
        };


    Game_System.prototype.refreshQuestUI =
        function() {

            const scene =
                SceneManager._scene;


            if (
                scene &&
                scene.refreshQuestTracker
            ) {

                scene.refreshQuestTracker();
            }


            if (
                scene &&
                scene.updateTopHudLayout
            ) {

                scene.updateTopHudLayout();
            }
        };


    Game_System.prototype.playQuestNotification =
        function(
            type,
            quest
        ) {

            if (
                type === "complete" &&
                COMPLETE_SE
            ) {

                AudioManager.playSe({

                    name:
                        COMPLETE_SE,

                    volume:
                        90,

                    pitch:
                        100,

                    pan:
                        0
                });
            }


            const scene =
                SceneManager._scene;


            if (
                scene &&
                scene.showQuestMessage
            ) {

                scene.showQuestMessage(

                    type === "complete"
                        ? "任務完成！"
                        : "接受任務",

                    quest.name
                );
            }
        };


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "StartQuest",
        args => {

            const id =
                args.questId ||
                "001";


            const quest =
                $gameSystem.startQuest(

                    id,

                    args.questName ||
                    "新任務",

                    args.description ||
                    "",

                    args.objective ||
                    "",

                    args.type ||
                    "count",

                    args.target ||
                    "1",

                    Number(
                        args.amount ||
                        1
                    ),

                    args.category ||
                    "main",

                    Number(
                        args.startSwitch ||
                        0
                    ),

                    Number(
                        args.completeSwitch ||
                        0
                    )
                );


            if (
                quest.status ===
                "active"
            ) {

                $gameSystem.trackQuest(
                    id
                );
            }
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "AddQuestProgress",
        args => {

            $gameSystem.addQuestProgress(

                args.questId,

                Number(
                    args.amount ||
                    1
                )
            );
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "CompleteQuest",
        args => {

            $gameSystem.completeQuest(
                args.questId
            );
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "TrackQuest",
        args => {

            $gameSystem.trackQuest(
                args.questId
            );
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "UntrackQuest",
        args => {

            $gameSystem.untrackQuest(
                args.questId
            );
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "HideTracker",
        () => {

            $gameSystem._questTrackerVisible =
                false;


            $gameSystem.refreshQuestUI();
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "ShowTracker",
        () => {

            $gameSystem._questTrackerVisible =
                true;


            $gameSystem.refreshQuestUI();
        }
    );


    PluginManager.registerCommand(
        PLUGIN_NAME,
        "AddItemProgress",
        args => {

            const quest =
                $gameSystem.quest(
                    args.questId
                );


            if (!quest) {
                return;
            }


            if (
                quest.type !==
                "item"
            ) {

                return;
            }


            const itemId =
                Number(
                    quest.target
                );


            const item =
                $dataItems[itemId];


            if (!item) {
                return;
            }


            const count =
                $gameParty.numItems(
                    item
                );


            quest.progress =
                Math.min(
                    count,
                    quest.amount
                );


            if (
                quest.progress >=
                quest.amount
            ) {

                $gameSystem.completeQuest(
                    quest.id
                );

            } else {

                $gameSystem.refreshQuestUI();
            }
        }
    );


    const _BattleManager_processVictory =
        BattleManager.processVictory;


    BattleManager.processVictory =
        function() {

            processQuestEnemyKills();


            _BattleManager_processVictory.call(
                this
            );
        };


    function processQuestEnemyKills() {

        if (!$gameSystem) {
            return;
        }


        const quests =
            $gameSystem.activeQuests();


        if (!quests.length) {
            return;
        }


        for (
            const enemy of
            $gameTroop.members()
        ) {

            if (
                !enemy ||
                !enemy.isDead()
            ) {

                continue;
            }


            const databaseEnemy =
                enemy.enemy();


            if (!databaseEnemy) {
                continue;
            }


            const note =
                databaseEnemy.note ||
                "";


            const matches = [];


            const regex =
                /<QuestEnemy\s*:\s*([^>]+)>/gi;


            let match;


            while (
                (match =
                    regex.exec(note))
            ) {

                matches.push(
                    String(
                        match[1]
                    ).trim()
                );
            }


            if (!matches.length) {
                continue;
            }


            for (
                const quest of
                quests
            ) {

                if (
                    quest.type !==
                    "kill"
                ) {

                    continue;
                }


                if (
                    matches.includes(
                        String(
                            quest.target
                        )
                    )
                ) {

                    $gameSystem.addQuestProgress(
                        quest.id,
                        1
                    );
                }
            }
        }
    }


    // ============================================================
    // 任務追蹤視窗
    // ============================================================

    class Window_QuestTracker
        extends Window_Base {

        initialize(rect) {

            super.initialize(
                rect
            );


            this.opacity =
                225;


            this.refresh();
        }


        refresh() {

            this.contents.clear();


            if (!$gameSystem) {

                this.visible =
                    false;

                return;
            }


            if (
                !$gameSystem
                    ._questTrackerVisible
            ) {

                this.visible =
                    false;

                return;
            }


            const quests =
                $gameSystem
                    .trackedQuests();


            if (!quests.length) {

                this.visible =
                    false;

                return;
            }


            this.visible =
                true;


            let y =
                0;


            // ========================================================
            // ★ 目前角色位置
            // 放在「任務」文字上面
            // ========================================================

            let locationName =
                "未知地圖";


            if (
                $gameMap &&
                $dataMapInfos
            ) {

                const mapId =
                    $gameMap.mapId();


                const mapInfo =
                    $dataMapInfos[mapId];


                if (
                    mapInfo &&
                    mapInfo.name
                ) {

                    locationName =
                        mapInfo.name;
                }
            }


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.contents.fontSize =
                Math.max(
                    14,
                    TRACKER_FONT_SIZE - 2
                );


            this.drawText(

                "目前位置：" +
                locationName,

                8,

                y,

                this.contentsWidth() -
                16,

                28,

                "left"
            );


            y +=
                32;


            // ========================================================
            // 任務標題
            // ========================================================

            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.contents.fontSize =
                TRACKER_FONT_SIZE + 2;


            this.drawText(

                "📜 任務",

                0,

                y,

                this.contentsWidth(),

                30,

                "left"
            );


            y +=
                32;


            // ========================================================
            // 任務內容
            // ========================================================

            for (
                const quest of quests
            ) {

                this.changeTextColor(
                    ColorManager.normalColor()
                );


                this.contents.fontSize =
                    TRACKER_FONT_SIZE;


                this.drawText(

                    quest.name,

                    0,

                    y,

                    this.contentsWidth(),

                    28,

                    "left"
                );


                y +=
                    28;


                this.contents.fontSize =
                    Math.max(
                        14,
                        TRACKER_FONT_SIZE - 2
                    );


                this.drawText(

                    quest.objective,

                    8,

                    y,

                    this.contentsWidth() -
                    16,

                    26,

                    "left"
                );


                y +=
                    26;


                this.changeTextColor(
                    ColorManager.systemColor()
                );


                this.contents.fontSize =
                    TRACKER_FONT_SIZE;


                this.drawText(

                    quest.progress +
                    " / " +
                    quest.amount,

                    8,

                    y,

                    this.contentsWidth() -
                    16,

                    28,

                    "right"
                );


                y +=
                    34;
            }
        }
    }


    // ============================================================
    // Scene_Map：建立任務追蹤
    // ============================================================

    const _Scene_Map_createAllWindows =
        Scene_Map.prototype.createAllWindows;


    Scene_Map.prototype.createAllWindows =
        function() {

            _Scene_Map_createAllWindows.call(
                this
            );


            this.createQuestTracker();


            this.createQuestMessageWindow();


            this.updateTopHudLayout();
        };


    Scene_Map.prototype.createQuestTracker =
        function() {

            const rect =
                new Rectangle(

                    TRACKER_X,

                    TRACKER_Y,

                    TRACKER_WIDTH,

                    TRACKER_HEIGHT
                );


            this._questTracker =
                new Window_QuestTracker(
                    rect
                );


            this._questTracker.z =
                20;


            this.addWindow(
                this._questTracker
            );


            this.updateTopHudLayout();
        };


    // ============================================================
    // 任務 + 小地圖排版
    // ============================================================

    Scene_Map.prototype.updateTopHudLayout =
        function() {

            if (
                !this._questTracker
            ) {

                return;
            }


            const screenW =
                Graphics.boxWidth;


            const screenH =
                Graphics.boxHeight;


            const margin =
                15;


            const gap =
                15;


            const mapDesiredWidth =
                300;


            const taskDesiredWidth =
                TRACKER_WIDTH;


            const available =
                screenW -
                margin * 2 -
                gap;


            let taskWidth =
                taskDesiredWidth;


            let mapWidth =
                mapDesiredWidth;


            if (
                taskWidth +
                mapWidth >
                available
            ) {

                taskWidth =
                    Math.floor(
                        available *
                        0.52
                    );


                mapWidth =
                    available -
                    taskWidth;
            }


            taskWidth =
                Math.max(
                    180,
                    taskWidth
                );


            mapWidth =
                Math.max(
                    150,
                    mapWidth
                );


            this._questTracker.x =
                margin;


            this._questTracker.y =
                TRACKER_Y;


            this._questTracker.width =
                taskWidth;


            this._questTracker.height =
                Math.min(

                    TRACKER_HEIGHT,

                    screenH -
                    TRACKER_Y -
                    margin
                );


            if (
                this._miniMap
            ) {

                this._miniMap.x =
                    this._questTracker.x +
                    this._questTracker.width +
                    gap;


                this._miniMap.y =
                    this._questTracker.y;


                this._miniMap.width =
                    mapWidth;


                this._miniMap.height =
                    Math.min(

                        this._miniMap.height,

                        screenH -
                        this._questTracker.y -
                        margin
                    );


                if (
                    this._miniMap.refresh
                ) {

                    this._miniMap.refresh();
                }
            }
        };


    // ============================================================
    // 更新任務追蹤
    // ============================================================

    Scene_Map.prototype.refreshQuestTracker =
        function() {

            if (
                this._questTracker
            ) {

                this._questTracker.refresh();
            }


            this.updateTopHudLayout();
        };


    // ============================================================
    // 任務提示
    // ============================================================

    Scene_Map.prototype.showQuestMessage =
        function(
            title,
            name
        ) {

            if (
                !this._questMessageWindow
            ) {

                this.createQuestMessageWindow();
            }


            this._questMessageWindow.showMessage(

                title,

                name
            );
        };


    Scene_Map.prototype.createQuestMessageWindow =
        function() {

            const width =
                Math.min(
                    500,
                    Graphics.boxWidth - 40
                );


            const height =
                120;


            const x =
                (
                    Graphics.boxWidth -
                    width
                ) / 2;


            const y =
                70;


            const rect =
                new Rectangle(

                    x,

                    y,

                    width,

                    height
                );


            this._questMessageWindow =
                new Window_QuestMessage(
                    rect
                );


            this._questMessageWindow.z =
                50;


            this.addWindow(
                this._questMessageWindow
            );
        };


    class Window_QuestMessage
        extends Window_Base {

        initialize(rect) {

            super.initialize(
                rect
            );


            this.opacity =
                245;


            this._timer =
                0;


            this.hide();
        }


        showMessage(
            title,
            name
        ) {

            this._title =
                title;


            this._name =
                name;


            this._timer =
                180;


            this.refresh();


            this.show();
        }


        update() {

            super.update();


            if (
                !this.visible
            ) {

                return;
            }


            this._timer--;


            if (
                this._timer <=
                0
            ) {

                this.hide();
            }
        }


        refresh() {

            this.contents.clear();


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.contents.fontSize =
                24;


            this.drawText(

                this._title ||
                "",

                0,

                0,

                this.contentsWidth(),

                36,

                "center"
            );


            this.changeTextColor(
                ColorManager.normalColor()
            );


            this.contents.fontSize =
                20;


            this.drawText(

                this._name ||
                "",

                0,

                42,

                this.contentsWidth(),

                32,

                "center"
            );
        }
    }


    // ============================================================
    // 任務列表
    // ============================================================

    class Window_QuestList
        extends Window_Selectable {

        initialize(rect) {

            super.initialize(
                rect
            );


            this.refresh();


            this.activate();


            this.select(0);
        }


        maxItems() {

            return $gameSystem

                ? $gameSystem._quests.length

                : 0;
        }


        item(index) {

            return $gameSystem

                ? $gameSystem._quests[index]

                : null;
        }


        drawItem(index) {

            const quest =
                this.item(index);


            if (!quest) {
                return;
            }


            const rect =
                this.itemLineRect(
                    index
                );


            this.changeTextColor(

                quest.status ===
                "completed"

                    ? ColorManager.textColor(3)

                    : ColorManager.normalColor()
            );


            const prefix =
                quest.category ===
                "main"

                    ? "【主線】"

                    : "【支線】";


            this.drawText(

                prefix +
                quest.name,

                rect.x,

                rect.y,

                rect.width -
                100,

                rect.height
            );


            this.drawText(

                quest.progress +
                "/" +
                quest.amount,

                rect.x,

                rect.y,

                rect.width,

                rect.height,

                "right"
            );
        }


        refresh() {

            this.contents.clear();


            this.createContents();


            this.drawAllItems();
        }
    }


    // ============================================================
    // 任務詳細
    // ============================================================

    class Window_QuestDetail
        extends Window_Base {

        initialize(rect) {

            super.initialize(
                rect
            );


            this._quest =
                null;


            this.refresh();
        }


        setQuest(quest) {

            if (
                this._quest ===
                quest
            ) {

                return;
            }


            this._quest =
                quest;


            this.refresh();
        }


        refresh() {

            this.contents.clear();


            if (
                !this._quest
            ) {

                return;
            }


            const q =
                this._quest;


            let y =
                0;


            this.contents.fontSize =
                26;


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.drawText(

                q.name,

                0,

                y,

                this.contentsWidth(),

                40,

                "center"
            );


            y +=
                50;


            this.contents.fontSize =
                20;


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.drawText(

                "任務說明",

                0,

                y,

                this.contentsWidth(),

                32
            );


            y +=
                35;


            this.changeTextColor(
                ColorManager.normalColor()
            );


            for (
                const line of
                q.description.split("\n")
            ) {

                this.drawText(

                    line,

                    0,

                    y,

                    this.contentsWidth(),

                    30
                );


                y +=
                    30;
            }


            y +=
                15;


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.drawText(

                "任務目標",

                0,

                y,

                this.contentsWidth(),

                32
            );


            y +=
                35;


            this.changeTextColor(
                ColorManager.normalColor()
            );


            this.drawText(

                q.objective,

                10,

                y,

                this.contentsWidth() -
                20,

                32
            );


            y +=
                40;


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.drawText(

                "進度",

                0,

                y,

                this.contentsWidth(),

                32
            );


            y +=
                35;


            this.changeTextColor(
                ColorManager.normalColor()
            );


            this.drawText(

                q.progress +
                " / " +
                q.amount,

                0,

                y,

                this.contentsWidth(),

                40,

                "center"
            );


            y +=
                55;


            if (
                q.status ===
                "completed"
            ) {

                this.changeTextColor(
                    ColorManager.textColor(3)
                );


                this.drawText(

                    "✓ 任務完成",

                    0,

                    y,

                    this.contentsWidth(),

                    40,

                    "center"
                );
            }
        }
    }


    // ============================================================
    // 任務 Scene
    // ============================================================

    class Scene_Quest
        extends Scene_MenuBase {

        create() {

            super.create();


            this.createQuestWindows();
        }


        createQuestWindows() {

            const width =
                Math.min(

                    WINDOW_WIDTH,

                    Graphics.boxWidth -
                    40
                );


            const height =
                Math.min(

                    WINDOW_HEIGHT,

                    Graphics.boxHeight -
                    40
                );


            const x =
                (
                    Graphics.boxWidth -
                    width
                ) / 2;


            const y =
                (
                    Graphics.boxHeight -
                    height
                ) / 2;


            const listWidth =
                Math.floor(
                    width *
                    0.38
                );


            const detailWidth =
                width -
                listWidth;


            this._questList =
                new Window_QuestList(

                    new Rectangle(

                        x,

                        y,

                        listWidth,

                        height
                    )
                );


            this._questDetail =
                new Window_QuestDetail(

                    new Rectangle(

                        x +
                        listWidth,

                        y,

                        detailWidth,

                        height
                    )
                );


            this.addWindow(
                this._questList
            );


            this.addWindow(
                this._questDetail
            );


            this._questList.setHandler(

                "cancel",

                this.popScene.bind(
                    this
                )
            );


            this._questList.setHandler(

                "ok",

                this.onQuestOk.bind(
                    this
                )
            );


            this.updateQuestDetail();
        }


        update() {

            super.update();


            this.updateQuestDetail();
        }


        updateQuestDetail() {

            const quest =
                this._questList.item(

                    this._questList.index()
                );


            this._questDetail.setQuest(
                quest
            );
        }


        onQuestOk() {

            const quest =
                this._questList.item(

                    this._questList.index()
                );


            if (
                quest &&
                quest.status ===
                "active"
            ) {

                $gameSystem.trackQuest(
                    quest.id
                );
            }


            this._questList.activate();
        }
    }


    // ============================================================
    // 開啟任務介面
    // ============================================================

    PluginManager.registerCommand(

        PLUGIN_NAME,

        "OpenQuestScene",

        () => {

            SceneManager.push(
                Scene_Quest
            );
        }
    );


    // ============================================================
    // 地圖轉移後自動更新目前位置
    // ============================================================

    const _QuestSystem_Game_Player_performTransfer =
        Game_Player.prototype.performTransfer;


    Game_Player.prototype.performTransfer =
        function() {

            _QuestSystem_Game_Player_performTransfer.call(
                this
            );


            setTimeout(
                () => {

                    const scene =
                        SceneManager._scene;


                    if (
                        scene &&
                        scene.refreshQuestTracker
                    ) {

                        scene.refreshQuestTracker();
                    }

                },
                50
            );
        };


    // ============================================================
    // 視窗大小改變
    // ============================================================

    window.addEventListener(

        "resize",

        () => {

            setTimeout(

                () => {

                    const scene =
                        SceneManager._scene;


                    if (
                        scene instanceof
                            Scene_Map &&

                        scene.updateTopHudLayout
                    ) {

                        scene.updateTopHudLayout();
                    }

                },

                100
            );
        }
    );

})();