/*:
 * @target MZ
 * @plugindesc QuestSystem MZ Core Report v1.5.1 - 任務回報系統
 * @author OpenAI
 *
 * @help
 * ============================================================================
 * QuestSystem_MZ_Core_Report v1.5.1
 * ============================================================================
 *
 * 【功能】
 *
 * 本插件負責 QuestSystem 的「任務回報」功能。
 *
 * 任務完成後：
 *
 * 1. 如果 needReport = true
 *    → 任務會保持在任務追蹤器中
 *    → 顯示「任務完成，請回報……」
 *    → 必須向指定 NPC 執行 ReportQuest 才會正式結束。
 *
 * 2. 如果 needReport = false
 *    → 任務完成後立即結束
 *    → 不需要 NPC 回報。
 *
 * ============================================================================
 * 【插件順序】
 *
 * 1. QuestSystem_MZ_Core
 * 2. QuestSystem_MZ_Core_Report
 * 3. QuestSystem_MZ_Progress
 * 4. QuestSystem_MZ_UI
 *
 * ============================================================================
 *
 * 【插件指令】
 *
 * ReportQuest
 *    任務回報
 *
 * 參數：
 *    questId = 任務ID
 *
 * 範例：
 *
 * ReportQuest
 * questId = 001
 *
 * ============================================================================
 *
 * 【事件範例】
 *
 * 村長事件：
 *
 * ◆條件分歧：腳本
 * $gameSystem.quest("001") &&
 * $gameSystem.quest("001").status === "completed" &&
 * $gameSystem.quest("001").needReport === true
 *
 * ◆顯示文字：
 * 「看來你已經完成任務了。」
 *
 * ◆插件指令：
 * QuestSystem_MZ_Core_Report
 * → ReportQuest
 * → 任務ID：001
 *
 * ◆顯示文字：
 * 「辛苦你了，謝謝你的幫忙。」
 *
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "QuestSystem_MZ_Core_Report";
    const VERSION = "1.5.1";

    // =========================================================================
    // 檢查 Core
    // =========================================================================

    if (!$gameSystem || typeof $gameSystem.quest !== "function") {
        console.warn(
            `[${PLUGIN_NAME} v${VERSION}] QuestSystem_MZ_Core 尚未載入。`
        );
    }

    // =========================================================================
    // 輔助：取得任務
    // =========================================================================

    function getQuest(questId) {
        if (!$gameSystem) {
            return null;
        }

        if (typeof $gameSystem.quest !== "function") {
            return null;
        }

        return $gameSystem.quest(String(questId));
    }

    // =========================================================================
    // 任務回報
    // =========================================================================

    function reportQuest(questId) {
        const id = String(questId);
        const quest = getQuest(id);

        // ---------------------------------------------------------------------
        // 任務不存在
        // ---------------------------------------------------------------------

        if (!quest) {
            console.warn(
                `[${PLUGIN_NAME} v${VERSION}] 找不到任務：${id}`
            );
            return false;
        }

        // ---------------------------------------------------------------------
        // 任務尚未完成
        // ---------------------------------------------------------------------

        if (quest.status !== "completed") {
            console.warn(
                `[${PLUGIN_NAME} v${VERSION}] 任務尚未完成，無法回報：${id}`
            );
            return false;
        }

        // ---------------------------------------------------------------------
        // 任務不需要回報
        // ---------------------------------------------------------------------

        if (quest.needReport !== true) {
            console.log(
                `[${PLUGIN_NAME} v${VERSION}] 任務不需要回報：${id}`
            );

            // 保險處理：
            // 不需要回報的任務完成後，不應繼續顯示在追蹤器。
            quest.tracked = false;
            quest.reported = true;

            refreshQuestUI();

            return true;
        }

        // ---------------------------------------------------------------------
        // 已經回報
        // ---------------------------------------------------------------------

        if (quest.reported === true) {
            console.log(
                `[${PLUGIN_NAME} v${VERSION}] 任務已經回報：${id}`
            );

            quest.tracked = false;

            refreshQuestUI();

            return true;
        }

        // ---------------------------------------------------------------------
        // 正式完成回報
        // ---------------------------------------------------------------------

        quest.reported = true;
        quest.tracked = false;

        // ---------------------------------------------------------------------
        // 完成 Switch
        //
        // Core 完成任務時通常已經處理 completeSwitch。
        // 這裡不重複修改，以避免破壞 Core 的任務流程。
        // ---------------------------------------------------------------------

        // ---------------------------------------------------------------------
        // 更新 UI
        // ---------------------------------------------------------------------

        refreshQuestUI();

        // ---------------------------------------------------------------------
        // 任務完成提示
        // ---------------------------------------------------------------------

        playReportNotification(quest);

        console.log(
            `[${PLUGIN_NAME} v${VERSION}] 任務回報完成：${id} - ${quest.name}`
        );

        return true;
    }

    // =========================================================================
    // UI 更新
    // =========================================================================

    function refreshQuestUI() {
        if (!$gameSystem) {
            return;
        }

        // Core 提供的 UI 更新函式
        if (typeof $gameSystem.refreshQuestUI === "function") {
            $gameSystem.refreshQuestUI();
        }

        // 地圖 Scene
        if (
            typeof SceneManager !== "undefined" &&
            SceneManager._scene
        ) {
            const scene = SceneManager._scene;

            if (typeof scene.refreshQuestTracker === "function") {
                scene.refreshQuestTracker();
            }

            if (typeof scene.refreshQuestWindows === "function") {
                scene.refreshQuestWindows();
            }

            if (scene._questTracker) {
                if (
                    typeof scene._questTracker.refresh === "function"
                ) {
                    scene._questTracker.refresh();
                }
            }
        }
    }

    // =========================================================================
    // 回報通知
    // =========================================================================

    function playReportNotification(quest) {
        if (!$gameSystem) {
            return;
        }

        // 優先使用 Core 的任務通知
        if (
            typeof $gameSystem.playQuestNotification === "function"
        ) {
            try {
                $gameSystem.playQuestNotification(
                    quest,
                    "reported"
                );
                return;
            } catch (e) {
                console.warn(
                    `[${PLUGIN_NAME} v${VERSION}] `
                    + `Core 通知函式執行失敗：`,
                    e
                );
            }
        }

        // 如果 Core 沒有通知函式，
        // 這裡不強制播放 SE 或建立視窗，
        // 避免與 UI 插件產生衝突。
    }

    // =========================================================================
    // Game_System：公開 ReportQuest
    // =========================================================================

    if (typeof Game_System !== "undefined") {

        Game_System.prototype.reportQuest = function(questId) {
            return reportQuest(questId);
        };

    }

    // =========================================================================
    // Plugin Command
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "ReportQuest",
        function(args) {

            const questId = String(
                args.questId ||
                args.id ||
                ""
            ).trim();

            if (!questId) {
                console.warn(
                    `[${PLUGIN_NAME} v${VERSION}] `
                    + `ReportQuest 缺少任務ID。`
                );
                return;
            }

            reportQuest(questId);
        }
    );

    // =========================================================================
    // 兼容舊式呼叫
    //
    // 可以直接使用：
    //
    // $gameSystem.reportQuest("001")
    //
    // 或：
    //
    // $gameSystem.ReportQuest("001")
    // =========================================================================

    if (typeof Game_System !== "undefined") {

        Game_System.prototype.ReportQuest = function(questId) {
            return this.reportQuest(questId);
        };

    }

    // =========================================================================
    // Scene_Map：重新整理任務追蹤器
    // =========================================================================

    if (typeof Scene_Map !== "undefined") {

        const _Scene_Map_start =
            Scene_Map.prototype.start;

        Scene_Map.prototype.start = function() {

            _Scene_Map_start.call(this);

            if (
                typeof this.refreshQuestTracker === "function"
            ) {
                this.refreshQuestTracker();
            }
        };

    }

    // =========================================================================
    // DataManager：存檔資料相容性
    // =========================================================================
    //
    // 主要資料由 Core 管理。
    // 這裡只負責確保舊存檔沒有 reported 時，
    // 不會因為 Report 插件而產生錯誤。
    //

    if (typeof DataManager !== "undefined") {

        const _DataManager_extractSaveContents =
            DataManager.extractSaveContents;

        DataManager.extractSaveContents = function(contents) {

            _DataManager_extractSaveContents.call(
                this,
                contents
            );

            if (
                typeof $gameSystem !== "undefined" &&
                $gameSystem &&
                Array.isArray($gameSystem._quests)
            ) {

                $gameSystem._quests.forEach(quest => {

                    if (!quest) {
                        return;
                    }

                    // 舊任務沒有 reported 時，
                    // 預設為 false。
                    if (
                        quest.reported === undefined
                    ) {
                        quest.reported = false;
                    }

                    // 舊任務沒有 needReport 時，
                    // 交由 Core 的 normalizeQuestData 處理。
                    if (
                        quest.needReport === undefined
                    ) {
                        quest.needReport = true;
                    }

                    // 已經回報的任務不可繼續追蹤。
                    if (quest.reported === true) {
                        quest.tracked = false;
                    }

                });

                refreshQuestUI();
            }

        };

    }

    // =========================================================================
    // 開發者除錯工具
    // =========================================================================

    window.QuestSystem_Report = {

        version: VERSION,

        reportQuest: function(questId) {
            return reportQuest(questId);
        },

        getQuest: function(questId) {
            return getQuest(questId);
        },

        refresh: function() {
            refreshQuestUI();
        }

    };

    // =========================================================================
    // 完成載入訊息
    // =========================================================================

    console.log(
        `[${PLUGIN_NAME}] v${VERSION} loaded.`
    );

})();