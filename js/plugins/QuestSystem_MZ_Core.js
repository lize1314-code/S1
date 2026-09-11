/*:
 * @target MZ
 * @plugindesc v1.5.1 任務系統核心：任務資料、開始、進度、完成、追蹤、回報狀態、開關
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * QuestSystem_MZ_Core v1.5.1
 * ============================================================================
 *
 * 【插件順序】
 *
 * 1. QuestSystem_MZ_Core v1.5.1
 * 2. QuestSystem_MZ_Core_Report v1.5.1
 * 3. QuestSystem_MZ_Progress v1.5.1
 * 4. QuestSystem_MZ_UI v1.5.1
 *
 * ============================================================================
 *
 * 【任務系統功能】
 *
 * 1. 建立任務
 * 2. 開始任務
 * 3. 任務進度
 * 4. 任務完成
 * 5. 任務追蹤
 * 6. 主線 / 支線
 * 7. 任務開始開關
 * 8. 任務完成開關
 * 9. 任務完成音效
 * 10. 任務完成通知
 * 11. needReport 任務回報設定
 * 12. reportText 任務回報提示
 * 13. 任務資料存檔
 * 14. 舊存檔資料兼容
 *
 * ============================================================================
 *
 * 【needReport】
 *
 * true：
 * 任務完成後需要 NPC 回報。
 *
 * false：
 * 任務完成後立即結束，不需要回報。
 *
 * ============================================================================
 *
 * 【範例】
 *
 * Quest 001
 *
 * 森林的異變
 *
 * type       = kill
 * target     = 1
 * amount     = 5
 * needReport = true
 *
 * 完成 5 隻哥布林：
 *
 * 5 / 5
 * 任務完成，請回報村長。
 *
 * 玩家回到村長處：
 *
 * ReportQuest 001
 *
 * 任務正式結束。
 *
 * ============================================================================
 *
 * Quest 002
 *
 * 抵達晨曦城
 *
 * type       = count
 * target     = 1
 * amount     = 1
 * needReport = false
 *
 * 完成後立即從任務追蹤器消失。
 *
 * ============================================================================
 *
 * @param Max Track
 * @text 地圖最多追蹤任務
 * @type number
 * @min 1
 * @max 10
 * @default 1
 *
 * @param Window Width
 * @text 任務視窗寬度
 * @type number
 * @min 300
 * @default 760
 *
 * @param Window Height
 * @text 任務視窗高度
 * @type number
 * @min 200
 * @default 520
 *
 * @param Tracker Width
 * @text 任務追蹤器寬度
 * @type number
 * @min 220
 * @default 360
 *
 * @param Tracker Height
 * @text 任務追蹤器高度
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
 * @text 任務追蹤 X
 * @type number
 * @min 0
 * @default 15
 *
 * @param Tracker Y
 * @text 任務追蹤 Y
 * @type number
 * @min 0
 * @default 15
 *
 * @param Show Tracker
 * @text 預設顯示任務追蹤
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
 * @default 村長請你前往森林調查異變。
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
 * @arg needReport
 * @text 是否需要回報
 * @type boolean
 * @on 需要回報
 * @off 不需要回報
 * @default true
 *
 * @arg reportText
 * @text 回報提示文字
 * @type multiline_string
 * @default 任務完成，請回報村長。
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
 * ============================================================================
 */

(() => {
    "use strict";


    // =========================================================================
    // 插件名稱
    // =========================================================================

    const PLUGIN_NAME =
        "QuestSystem_MZ_Core";


    const VERSION =
        "1.5.1";


    // =========================================================================
    // 插件參數
    // =========================================================================

    const P =
        PluginManager.parameters(
            PLUGIN_NAME
        );


    const MAX_TRACK =
        Math.max(
            1,
            Number(
                P["Max Track"] || 1
            )
        );


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
    // ★ 任務完成音效
    //
    // 修正：
    // 防止 Plugin Manager 中的換行符號
    // %0D%0A 被當成檔名的一部分。
    //
    // =========================================================================

    const COMPLETE_SE_RAW =
        String(
            P["Complete SE"] ||
            "Applause1"
        );


    const COMPLETE_SE =
        COMPLETE_SE_RAW
            .split(/\r?\n/)[0]
            .trim()
            .replace(/^.*[\\\/]/, "")
            .replace(/\.(ogg|m4a|wav|mp3)$/i, "");


    // =========================================================================
    // 建立全域 QuestSystemMZ
    // =========================================================================

    window.QuestSystemMZ =
        window.QuestSystemMZ || {};


    const QuestSystemMZ =
        window.QuestSystemMZ;


    // =========================================================================
    // 提供其他 Quest 插件使用的設定
    // =========================================================================

    QuestSystemMZ.version =
        VERSION;


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
    // 任務 ID 標準化
    // =========================================================================

    function normalizeQuestId(
        id
    ) {

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
        completeSwitch,
        needReport,
        reportText
    ) {

        return {

            id:
                normalizeQuestId(
                    id
                ),

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
                category === "side"
                    ? "side"
                    : "main",

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
                ),

            needReport:
                needReport === false
                    ? false
                    : true,

            reportText:
                String(
                    reportText ||
                    "任務完成，請回報村長。"
                ),

            reported:
                false

        };

    }


    // =========================================================================
    // 正規化舊任務資料
    // =========================================================================

    function normalizeQuestData(
        quest
    ) {

        if (!quest) {
            return null;
        }


        quest.id =
            normalizeQuestId(
                quest.id
            );


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
            quest.category === "side"
                ? "side"
                : "main";


        quest.startSwitch =
            Number(
                quest.startSwitch || 0
            );


        quest.completeSwitch =
            Number(
                quest.completeSwitch || 0
            );


        // ---------------------------------------------------------------------
        // 舊版本沒有 needReport：
        //
        // 預設 true。
        //
        // 這樣可以保留原本「完成後等待回報」的行為。
        // ---------------------------------------------------------------------

        if (
            quest.needReport === undefined
        ) {

            quest.needReport =
                true;

        } else {

            quest.needReport =
                quest.needReport !== false;

        }


        // ---------------------------------------------------------------------
        // 回報文字
        // ---------------------------------------------------------------------

        quest.reportText =
            String(
                quest.reportText ||
                "任務完成，請回報村長。"
            );


        // ---------------------------------------------------------------------
        // reported
        // ---------------------------------------------------------------------

        if (
            quest.reported === undefined
        ) {

            quest.reported =
                false;

        } else {

            quest.reported =
                quest.reported === true;

        }


        // ---------------------------------------------------------------------
        // 任務狀態
        // ---------------------------------------------------------------------

        if (
            quest.status === "completed"
        ) {

            quest.status =
                "completed";


            quest.progress =
                quest.amount;


            // ---------------------------------------------------------------
            // 不需要回報
            // ---------------------------------------------------------------

            if (
                quest.needReport === false
            ) {

                quest.reported =
                    true;

                quest.tracked =
                    false;

            }

            // ---------------------------------------------------------------
            // 需要回報
            // ---------------------------------------------------------------

            else {

                if (
                    quest.reported === true
                ) {

                    quest.tracked =
                        false;

                } else {

                    quest.tracked =
                        true;

                }

            }

        }

        // ---------------------------------------------------------------------
        // 尚未完成
        // ---------------------------------------------------------------------

        else {

            quest.status =
                "active";


            if (
                quest.tracked === undefined
            ) {

                quest.tracked =
                    true;

            }

        }


        return quest;

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

            if (
                !Array.isArray(
                    this._quests
                )
            ) {

                this._quests =
                    [];

            }


            const unique =
                [];


            const table =
                {};


            for (
                const originalQuest
                of this._quests
            ) {

                const quest =
                    normalizeQuestData(
                        originalQuest
                    );


                if (!quest) {
                    continue;
                }


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


                        if (
                            quest.needReport ===
                            false
                        ) {

                            old.needReport =
                                false;

                            old.reported =
                                true;

                            old.tracked =
                                false;

                        } else {

                            old.needReport =
                                true;

                            old.reported =
                                quest.reported ===
                                true;

                            old.tracked =
                                old.reported !==
                                true;

                        }

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


    // =========================================================================
    // 取得任務
    // =========================================================================

    Game_System.prototype.quest =
        function(id) {

            this.initQuestSystem();


            const questId =
                normalizeQuestId(
                    id
                );


            return this._quests.find(
                quest =>
                    quest &&
                    quest.id ===
                    questId
            ) || null;

        };


    // =========================================================================
    // 取得全部任務
    // =========================================================================

    Game_System.prototype.allQuests =
        function() {

            this.initQuestSystem();


            return this._quests;

        };


    // =========================================================================
    // 取得進行中任務
    // =========================================================================

    Game_System.prototype.activeQuests =
        function() {

            this.initQuestSystem();


            return this._quests.filter(
                quest =>
                    quest &&
                    quest.status ===
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
                quest =>
                    quest &&
                    quest.status ===
                    "completed"
            );

        };


    // =========================================================================
    // 取得正在追蹤的任務
    // =========================================================================
    //
    // 進行中：
    //
    // active + tracked
    //
    // 已完成但需要回報：
    //
    // completed
    // + needReport
    // + reported !== true
    // + tracked
    //
    // =========================================================================

    Game_System.prototype.trackedQuests =
        function() {

            this.initQuestSystem();


            return this._quests.filter(
                quest => {

                    if (!quest) {
                        return false;
                    }


                    // ---------------------------------------------------------
                    // 進行中任務
                    // ---------------------------------------------------------

                    if (
                        quest.status ===
                        "active"
                    ) {

                        return (
                            quest.tracked ===
                            true
                        );

                    }


                    // ---------------------------------------------------------
                    // 完成但等待回報
                    // ---------------------------------------------------------

                    if (
                        quest.status ===
                        "completed"
                    ) {

                        return (
                            quest.needReport ===
                            true &&

                            quest.reported !==
                            true &&

                            quest.tracked ===
                            true
                        );

                    }


                    return false;

                }
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
            completeSwitch,
            needReport,
            reportText
        ) {

            this.initQuestSystem();


            const questId =
                normalizeQuestId(
                    id
                );


            // -----------------------------------------------------------------
            // 已經存在
            // -----------------------------------------------------------------

            const oldQuest =
                this.quest(
                    questId
                );


            if (oldQuest) {

                // -------------------------------------------------------------
                // 已完成任務
                // -------------------------------------------------------------

                if (
                    oldQuest.status ===
                    "completed"
                ) {

                    oldQuest.progress =
                        oldQuest.amount;


                    if (
                        oldQuest.needReport ===
                        true &&
                        oldQuest.reported !==
                        true
                    ) {

                        oldQuest.tracked =
                            true;

                    } else {

                        oldQuest.tracked =
                            false;

                    }


                    this.refreshQuestUI();


                    return oldQuest;

                }


                // -------------------------------------------------------------
                // 已經進行中的任務
                // -------------------------------------------------------------

                if (
                    oldQuest.status ===
                    "active"
                ) {

                    if (
                        !oldQuest.tracked
                    ) {

                        this.trackQuest(
                            oldQuest.id
                        );

                    }


                    return oldQuest;

                }

            }


            // -----------------------------------------------------------------
            // 建立新任務
            // -----------------------------------------------------------------

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

                    completeSwitch,

                    needReport,

                    reportText

                );


            this._quests.push(
                quest
            );


            // -----------------------------------------------------------------
            // 開始任務開關
            // -----------------------------------------------------------------

            if (
                quest.startSwitch >
                0 &&
                $gameSwitches
            ) {

                $gameSwitches.setValue(
                    quest.startSwitch,
                    true
                );

            }


            // -----------------------------------------------------------------
            // 任務開始通知
            // -----------------------------------------------------------------

            this.playQuestNotification(
                "start",
                quest
            );


            // -----------------------------------------------------------------
            // 更新 UI
            // -----------------------------------------------------------------

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
                this.quest(
                    id
                );


            if (!quest) {
                return;
            }


            // -----------------------------------------------------------------
            // 只有 active 任務可以增加進度
            // -----------------------------------------------------------------

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


            // -----------------------------------------------------------------
            // 達成目標
            // -----------------------------------------------------------------

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


            // -----------------------------------------------------------------
            // 更新 UI
            // -----------------------------------------------------------------

            this.refreshQuestUI();

        };


    // =========================================================================
    // 完成任務
    // =========================================================================

    Game_System.prototype.completeQuest =
        function(id) {

            const quest =
                this.quest(
                    id
                );


            if (!quest) {
                return;
            }


            // -----------------------------------------------------------------
            // 已經完成
            // -----------------------------------------------------------------

            if (
                quest.status ===
                "completed"
            ) {

                quest.progress =
                    quest.amount;


                if (
                    quest.needReport ===
                    true &&
                    quest.reported !==
                    true
                ) {

                    quest.tracked =
                        true;

                } else {

                    quest.tracked =
                        false;

                }


                this.refreshQuestUI();


                return;

            }


            // -----------------------------------------------------------------
            // ★ 任務完成
            // -----------------------------------------------------------------

            quest.progress =
                quest.amount;


            quest.status =
                "completed";


            // -----------------------------------------------------------------
            // ★ 不需要回報
            //
            // 完成後立即消失
            // -----------------------------------------------------------------

            if (
                quest.needReport ===
                false
            ) {

                quest.reported =
                    true;

                quest.tracked =
                    false;

            }

            // -----------------------------------------------------------------
            // ★ 需要回報
            //
            // 完成後保留追蹤
            // -----------------------------------------------------------------

            else {

                quest.reported =
                    false;

                quest.tracked =
                    true;

            }


            // -----------------------------------------------------------------
            // 任務完成開關
            // -----------------------------------------------------------------

            if (
                quest.completeSwitch >
                0 &&
                $gameSwitches
            ) {

                $gameSwitches.setValue(
                    quest.completeSwitch,
                    true
                );

            }


            // -----------------------------------------------------------------
            // 任務完成通知
            // -----------------------------------------------------------------

            this.playQuestNotification(
                "complete",
                quest
            );


            // -----------------------------------------------------------------
            // 更新 UI
            // -----------------------------------------------------------------

            this.refreshQuestUI();

        };


    // =========================================================================
    // 追蹤任務
    // =========================================================================

    Game_System.prototype.trackQuest =
        function(id) {

            const quest =
                this.quest(
                    id
                );


            if (!quest) {
                return;
            }


            // -----------------------------------------------------------------
            // 只有以下兩種可以追蹤：
            //
            // 1. active
            // 2. completed + needReport
            // -----------------------------------------------------------------

            const canTrack =
                quest.status ===
                "active" ||

                (
                    quest.status ===
                    "completed" &&

                    quest.needReport ===
                    true &&

                    quest.reported !==
                    true
                );


            if (!canTrack) {

                return;

            }


            const tracked =
                this.trackedQuests();


            // -----------------------------------------------------------------
            // 超過最大追蹤數
            // -----------------------------------------------------------------

            if (
                !quest.tracked &&
                tracked.length >=
                MAX_TRACK
            ) {

                const first =
                    tracked[0];


                if (first) {

                    first.tracked =
                        false;

                }

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
                this.quest(
                    id
                );


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


            if (
                scene &&
                typeof scene.refreshQuestTracker ===
                "function"
            ) {

                scene.refreshQuestTracker();

            }


            if (
                scene &&
                typeof scene.updateTopHudLayout ===
                "function"
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

            if (!quest) {
                return;
            }


            // -----------------------------------------------------------------
            // 任務完成音效
            // -----------------------------------------------------------------

            if (
                type ===
                "complete" &&

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


            // -----------------------------------------------------------------
            // UI 通知
            // -----------------------------------------------------------------

            const scene =
                SceneManager._scene;


            if (
                scene &&
                typeof scene.showQuestMessage ===
                "function"
            ) {

                let message;


                if (
                    type ===
                    "complete"
                ) {

                    message =
                        "任務完成！";

                } else {

                    message =
                        "接受任務";

                }


                // -------------------------------------------------------------
                // ★ 修正：
                //
                // 不把 quest.name 當成 duration 傳入。
                // -------------------------------------------------------------

                scene.showQuestMessage(
                    message +
                    " " +
                    String(
                        quest.name ||
                        ""
                    )
                );

            }

        };


    // =========================================================================
    // Plugin Command：開始任務
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "StartQuest",
        args => {

            const id =
                args.questId ||
                "001";


            const questName =
                args.questName ||
                "新任務";


            const description =
                args.description ||
                "";


            const objective =
                args.objective ||
                "";


            const type =
                args.type ||
                "count";


            const target =
                args.target ||
                "1";


            const amount =
                Number(
                    args.amount ||
                    1
                );


            const category =
                args.category ||
                "main";


            const startSwitch =
                Number(
                    args.startSwitch ||
                    0
                );


            const completeSwitch =
                Number(
                    args.completeSwitch ||
                    0
                );


            // -----------------------------------------------------------------
            // needReport
            //
            // Plugin Manager 的 boolean 會以字串傳入。
            // -----------------------------------------------------------------

            const needReport =
                String(
                    args.needReport ??
                    "true"
                ) ===
                "true";


            const reportText =
                args.reportText ||
                "任務完成，請回報村長。";


            const quest =
                $gameSystem.startQuest(

                    id,

                    questName,

                    description,

                    objective,

                    type,

                    target,

                    amount,

                    category,

                    startSwitch,

                    completeSwitch,

                    needReport,

                    reportText

                );


            // -----------------------------------------------------------------
            // 新任務自動追蹤
            // -----------------------------------------------------------------

            if (
                quest &&
                quest.status ===
                "active"
            ) {

                $gameSystem.trackQuest(
                    quest.id
                );

            }

        }
    );


    // =========================================================================
    // Plugin Command：增加任務進度
    // =========================================================================

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


    // =========================================================================
    // Plugin Command：完成任務
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
    // Plugin Command：追蹤任務
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
    // Plugin Command：取消追蹤
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
    // Plugin Command：隱藏任務追蹤
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
    // Plugin Command：顯示任務追蹤
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


    // =========================================================================
    // 開發者除錯工具
    // =========================================================================

    window.QuestSystemMZ_Core =
        {

            version:
                VERSION,

            normalizeQuestId:
                normalizeQuestId,

            makeQuest:
                makeQuest,

            normalizeQuestData:
                normalizeQuestData

        };


    // =========================================================================
    // 完成載入
    // =========================================================================

    console.log(
        "========================================"
    );

    console.log(
        "QuestSystem_MZ_Core v" +
        VERSION +
        " loaded."
    );

    console.log(
        "Complete SE:",
        COMPLETE_SE
    );

    console.log(
        "Max Track:",
        MAX_TRACK
    );

    console.log(
        "========================================"
    );

})();