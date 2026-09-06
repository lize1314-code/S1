/*:
 * @target MZ
 * @plugindesc v1.4.1 任務系統核心：任務資料、開始、進度、完成、追蹤、開關
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * QuestSystem_MZ_Core
 * ============================================================================
 *
 * 任務系統核心插件。
 *
 * 插件順序：
 *
 * 1. QuestSystem_MZ_Core.js
 * 2. QuestSystem_MZ_Progress.js
 * 3. QuestSystem_MZ_UI.js
 *
 * ============================================================================
 *
 * 功能：
 *
 * 1. 任務資料
 * 2. 開始任務
 * 3. 任務進度
 * 4. 任務完成
 * 5. 主線 / 支線
 * 6. 任務追蹤資料
 * 7. 任務開始開關
 * 8. 任務完成開關
 * 9. 任務完成音效
 * 10. 防止同一任務重複接受
 *
 * ============================================================================
 *
 * 收集物品任務：
 *
 * 收集物品任務由：
 *
 * QuestSystem_MZ_Progress.js
 *
 * 自動處理。
 *
 * 所有實際取得的物品都會自動同步任務進度。
 *
 * 不需要使用 AddItemProgress。
 *
 * ============================================================================
 *
 * 擊殺敵人：
 *
 * 在敵人備註加入：
 *
 * <QuestEnemy:1>
 *
 * ============================================================================
 *
 * 任務資料範例：
 *
 * type   = kill
 * target = 1
 * amount = 5
 *
 * 或：
 *
 * type   = item
 * target = 43
 * amount = 5
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
 * ============================================================================
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
 * @default 村長請米潔雅前往森林，調查哥布林異變事件。
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
 * ============================================================================
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
 * ============================================================================
 *
 * @command CompleteQuest
 * @text 完成任務
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * ============================================================================
 *
 * @command TrackQuest
 * @text 追蹤任務
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * ============================================================================
 *
 * @command UntrackQuest
 * @text 取消追蹤
 *
 * @arg questId
 * @text 任務ID
 * @type string
 * @default 001
 *
 * ============================================================================
 *
 * @command HideTracker
 * @text 隱藏任務追蹤
 *
 * ============================================================================
 *
 * @command ShowTracker
 * @text 顯示任務追蹤
 *
 */

(() => {
    "use strict";

    // =========================================================================
    // 插件名稱
    // =========================================================================

    const PLUGIN_NAME =
        "QuestSystem_MZ_Core";

    // =========================================================================
    // 插件參數
    // =========================================================================

    const P =
        PluginManager.parameters(
            PLUGIN_NAME
        );

    // =========================================================================
    // 任務設定
    // =========================================================================

    const MAX_TRACK =
        Number(
            P["Max Track"] || 1
        );

    // =========================================================================
    // UI 設定
    // =========================================================================

    const WINDOW_WIDTH =
        Number(
            P["Window Width"] || 760
        );

    const WINDOW_HEIGHT =
        Number(
            P["Window Height"] || 520
        );

    const TRACKER_WIDTH =
        Number(
            P["Tracker Width"] || 360
        );

    const TRACKER_HEIGHT =
        Number(
            P["Tracker Height"] || 205
        );

    const TRACKER_FONT_SIZE =
        Number(
            P["Tracker Font Size"] || 18
        );

    const TRACKER_X =
        Number(
            P["Tracker X"] || 15
        );

    const TRACKER_Y =
        Number(
            P["Tracker Y"] || 15
        );

    const SHOW_TRACKER =
        String(
            P["Show Tracker"] || "true"
        ) === "true";

    // =========================================================================
    // 完成音效
    // =========================================================================

    const COMPLETE_SE =
        String(
            P["Complete SE"] ||
            "Applause1"
        );

    // =========================================================================
    // 建立 QuestSystemMZ 全域核心物件
    // =========================================================================

    window.QuestSystemMZ =
        window.QuestSystemMZ || {};

    const QuestSystemMZ =
        window.QuestSystemMZ;

    // =========================================================================
    // 提供給 Progress / UI 使用的設定
    // =========================================================================

    QuestSystemMZ.config = {
        MAX_TRACK,

        WINDOW_WIDTH,

        WINDOW_HEIGHT,

        TRACKER_WIDTH,

        TRACKER_HEIGHT,

        TRACKER_FONT_SIZE,

        TRACKER_X,

        TRACKER_Y,

        SHOW_TRACKER,

        COMPLETE_SE
    };

    // =========================================================================
    // 任務ID標準化
    // =========================================================================

    function normalizeQuestId(id) {

        const value =
            String(
                id ?? ""
            ).trim();

        if (
            /^\d+$/.test(value)
        ) {

            return value.padStart(
                3,
                "0"
            );
        }

        return value;
    }

    // =========================================================================
    // 對外提供任務ID標準化
    // =========================================================================

    QuestSystemMZ.normalizeQuestId =
        normalizeQuestId;

    // =========================================================================
    // 建立任務資料
    // =========================================================================

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
                String(
                    name || ""
                ),

            description:
                String(
                    description || ""
                ),

            objective:
                String(
                    objective || ""
                ),

            type:
                String(
                    type || "count"
                ),

            target:
                String(
                    target || "1"
                ),

            amount:
                Math.max(
                    1,
                    Number(
                        amount || 1
                    )
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
                Number(
                    startSwitch || 0
                ),

            completeSwitch:
                Number(
                    completeSwitch || 0
                )
        };
    }

    // =========================================================================
    // Game_System 初始化
    // =========================================================================

    const _Game_System_initialize =
        Game_System.prototype.initialize;

    Game_System.prototype.initialize =
        function() {

            _Game_System_initialize.call(
                this
            );

            this.initQuestSystem();
        };

    // =========================================================================
    // 初始化任務系統
    // =========================================================================

    Game_System.prototype.initQuestSystem =
        function() {

            if (!this._quests) {

                this._quests = [];
            }

            const unique = [];

            const table = {};

            for (
                const quest
                of this._quests
            ) {

                if (!quest) {
                    continue;
                }

                quest.id =
                    normalizeQuestId(
                        quest.id
                    );

                // -------------------------------------------------------------
                // 補舊存檔可能缺少的資料
                // -------------------------------------------------------------

                quest.name =
                    String(
                        quest.name || ""
                    );

                quest.description =
                    String(
                        quest.description || ""
                    );

                quest.objective =
                    String(
                        quest.objective || ""
                    );

                quest.type =
                    String(
                        quest.type || "count"
                    );

                quest.target =
                    String(
                        quest.target || "1"
                    );

                quest.amount =
                    Math.max(
                        1,
                        Number(
                            quest.amount || 1
                        )
                    );

                quest.progress =
                    Math.max(
                        0,
                        Number(
                            quest.progress || 0
                        )
                    );

                quest.category =
                    quest.category || "main";

                quest.status =
                    quest.status ||
                    "active";

                if (
                    quest.tracked ===
                    undefined
                ) {

                    quest.tracked =
                        quest.status ===
                        "active";
                }

                quest.startSwitch =
                    Number(
                        quest.startSwitch || 0
                    );

                quest.completeSwitch =
                    Number(
                        quest.completeSwitch || 0
                    );

                // -------------------------------------------------------------
                // 防止同一任務重複
                // -------------------------------------------------------------

                if (
                    !table[quest.id]
                ) {

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
                                old.progress || 0
                            ),
                            Number(
                                quest.progress || 0
                            )
                        );

                    if (
                        quest.status ===
                        "completed"
                    ) {

                        old.status =
                            "completed";

                        old.progress =
                            old.amount;

                        old.tracked =
                            false;
                    }
                }
            }

            this._quests =
                unique;

            // -------------------------------------------------------------
            // 任務追蹤顯示
            // -------------------------------------------------------------

            if (
                this._questTrackerVisible ===
                undefined
            ) {

                this._questTrackerVisible =
                    SHOW_TRACKER;
            }
        };

    // =========================================================================
    // 取得任務
    // =========================================================================

    Game_System.prototype.quest =
        function(id) {

            this.initQuestSystem();

            const questId =
                normalizeQuestId(id);

            return this._quests.find(
                q =>
                    q.id === questId
            );
        };

    // =========================================================================
    // 取得進行中的任務
    // =========================================================================

    Game_System.prototype.activeQuests =
        function() {

            this.initQuestSystem();

            return this._quests.filter(
                q =>
                    q.status ===
                    "active"
            );
        };

    // =========================================================================
    // 取得已完成任務
    // =========================================================================

    Game_System.prototype.completedQuests =
        function() {

            this.initQuestSystem();

            return this._quests.filter(
                q =>
                    q.status ===
                    "completed"
            );
        };

    // =========================================================================
    // 取得已追蹤任務
    // =========================================================================

    Game_System.prototype.trackedQuests =
        function() {

            this.initQuestSystem();

            return this._quests.filter(
                q =>
                    q.status === "active" &&
                    q.tracked
            );
        };

    // =========================================================================
    // 開始任務
    // =========================================================================

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

            // -------------------------------------------------------------
            // 防止同一任務重複接受
            // -------------------------------------------------------------

            const oldQuest =
                this.quest(
                    questId
                );

            if (oldQuest) {

                this.refreshQuestUI();

                return oldQuest;
            }

            // -------------------------------------------------------------
            // 建立任務
            // -------------------------------------------------------------

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

            // -------------------------------------------------------------
            // 開始任務時開關
            // -------------------------------------------------------------

            if (
                quest.startSwitch > 0 &&
                $gameSwitches
            ) {

                $gameSwitches.setValue(
                    quest.startSwitch,
                    true
                );
            }

            // -------------------------------------------------------------
            // 任務開始通知
            // -------------------------------------------------------------

            this.playQuestNotification(
                "start",
                quest
            );

            this.refreshQuestUI();

            return quest;
        };

    // =========================================================================
    // 增加任務進度
    // =========================================================================

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

            const add =
                Number(
                    amount || 0
                );

            if (
                add <= 0
            ) {
                return;
            }

            quest.progress +=
                add;

            // -------------------------------------------------------------
            // 達成目標
            // -------------------------------------------------------------

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

    // =========================================================================
    // 完成任務
    // =========================================================================

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

            // -------------------------------------------------------------
            // 任務完成開關
            // -------------------------------------------------------------

            if (
                quest.completeSwitch > 0 &&
                $gameSwitches
            ) {

                $gameSwitches.setValue(
                    quest.completeSwitch,
                    true
                );
            }

            // -------------------------------------------------------------
            // 任務完成通知
            // -------------------------------------------------------------

            this.playQuestNotification(
                "complete",
                quest
            );

            this.refreshQuestUI();
        };

    // =========================================================================
    // 追蹤任務
    // =========================================================================

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

            // -------------------------------------------------------------
            // 超過最大追蹤數
            // -------------------------------------------------------------

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

    // =========================================================================
    // 取消追蹤
    // =========================================================================

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

    // =========================================================================
    // UI 刷新
    // =========================================================================

    Game_System.prototype.refreshQuestUI =
        function() {

            const scene =
                SceneManager._scene;

            // -------------------------------------------------------------
            // 地圖任務追蹤
            // -------------------------------------------------------------

            if (
                scene &&
                scene.refreshQuestTracker
            ) {

                scene.refreshQuestTracker();
            }

            // -------------------------------------------------------------
            // 小地圖 / HUD 排版
            // -------------------------------------------------------------

            if (
                scene &&
                scene.updateTopHudLayout
            ) {

                scene.updateTopHudLayout();
            }
        };

    // =========================================================================
    // 任務通知
    // =========================================================================

    Game_System.prototype.playQuestNotification =
        function(
            type,
            quest
        ) {

            // -------------------------------------------------------------
            // 任務完成音效
            // -------------------------------------------------------------

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

            // -------------------------------------------------------------
            // 通知 UI
            // -------------------------------------------------------------

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

    // =========================================================================
    // 插件指令：開始任務
    // =========================================================================

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
                        args.amount || 1
                    ),

                    args.category ||
                        "main",

                    Number(
                        args.startSwitch || 0
                    ),

                    Number(
                        args.completeSwitch || 0
                    )
                );

            // -------------------------------------------------------------
            // 新任務自動追蹤
            // -------------------------------------------------------------

            if (
                quest &&
                quest.status ===
                "active"
            ) {

                $gameSystem.trackQuest(
                    id
                );
            }
        }
    );

    // =========================================================================
    // 插件指令：增加任務進度
    // =========================================================================
    //
    // 注意：
    //
    // 一般計數任務可以使用此指令。
    //
    // 收集物品任務不需要使用此指令。
    //
    // QuestSystem_MZ_Progress.js
    // 會自動偵測實際取得的物品。
    //
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "AddQuestProgress",
        args => {

            $gameSystem.addQuestProgress(

                args.questId,

                Number(
                    args.amount || 1
                )
            );
        }
    );

    // =========================================================================
    // 插件指令：完成任務
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "CompleteQuest",
        args => {

            $gameSystem.completeQuest(
                args.questId
            );
        }
    );

    // =========================================================================
    // 插件指令：追蹤任務
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "TrackQuest",
        args => {

            $gameSystem.trackQuest(
                args.questId
            );
        }
    );

    // =========================================================================
    // 插件指令：取消追蹤
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "UntrackQuest",
        args => {

            $gameSystem.untrackQuest(
                args.questId
            );
        }
    );

    // =========================================================================
    // 隱藏任務追蹤
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "HideTracker",
        () => {

            $gameSystem._questTrackerVisible =
                false;

            $gameSystem.refreshQuestUI();
        }
    );

    // =========================================================================
    // 顯示任務追蹤
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "ShowTracker",
        () => {

            $gameSystem._questTrackerVisible =
                true;

            $gameSystem.refreshQuestUI();
        }
    );

})();