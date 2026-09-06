/*:
 * @target MZ
 * @plugindesc v1.4.4 任務系統 UI：任務列表、詳細資料、任務追蹤、提示視窗
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * QuestSystem_MZ_UI
 * ============================================================================
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
 * 1. 任務列表
 * 2. 主線 / 支線顯示
 * 3. 任務進度顯示
 * 4. 已完成任務顯示綠色
 * 5. 任務詳細頁
 * 6. 地圖任務追蹤
 * 7. 任務開始提示
 * 8. 任務完成提示
 * 9. MiniMap 自動排版
 * 10. 電腦 / 手機畫面自動調整
 *
 * ============================================================================
 *
 * 地圖任務追蹤：
 *
 * 任務
 *
 * 艾娜的蘑菇孢子
 * 取得蘑菇孢子                         0 / 5
 *
 * ============================================================================
 *
 * 操作：
 *
 * 任務列表：
 *
 * ↑ ↓       選擇任務
 * Enter     進入詳細頁
 * ESC       離開任務介面
 *
 * 任務詳細：
 *
 * ESC       回到任務列表
 *
 * ============================================================================
 *
 * @command OpenQuestScene
 * @text 開啟任務介面
 *
 */

(() => {
    "use strict";

    // =========================================================================
    // 確認 Core
    // =========================================================================

    if (!window.QuestSystemMZ) {

        console.error(
            "QuestSystem_MZ_UI：找不到 QuestSystem_MZ_Core.js，請確認插件順序。"
        );

        return;
    }

    const QuestSystemMZ =
        window.QuestSystemMZ;

    // =========================================================================
    // Core 設定
    // =========================================================================

    const config =
        QuestSystemMZ.config || {};

    const WINDOW_WIDTH =
        Number(
            config.WINDOW_WIDTH || 760
        );

    const WINDOW_HEIGHT =
        Number(
            config.WINDOW_HEIGHT || 520
        );

    const TRACKER_WIDTH =
        Number(
            config.TRACKER_WIDTH || 360
        );

    const TRACKER_HEIGHT =
        Number(
            config.TRACKER_HEIGHT || 205
        );

    const TRACKER_FONT_SIZE =
        Number(
            config.TRACKER_FONT_SIZE || 18
        );

    const TRACKER_X =
        Number(
            config.TRACKER_X || 15
        );

    const TRACKER_Y =
        Number(
            config.TRACKER_Y || 15
        );

    const SHOW_TRACKER =
        config.SHOW_TRACKER !== false;

    // =========================================================================
    // 任務顏色
    // =========================================================================

    const MAIN_COLOR =
        4;

    const SIDE_COLOR =
        14;

    const COMPLETE_COLOR =
        3;

    // =========================================================================
    // 任務顏色判斷
    // =========================================================================

    function questColor(
        windowObject,
        quest
    ) {

        // -------------------------------------------------------------
        // 已完成：綠色
        // -------------------------------------------------------------

        if (
            quest &&
            quest.status === "completed"
        ) {

            windowObject.changeTextColor(
                ColorManager.textColor(
                    COMPLETE_COLOR
                )
            );

            return;
        }

        // -------------------------------------------------------------
        // 主線：藍色
        // -------------------------------------------------------------

        if (
            quest &&
            quest.category === "main"
        ) {

            windowObject.changeTextColor(
                ColorManager.textColor(
                    MAIN_COLOR
                )
            );

            return;
        }

        // -------------------------------------------------------------
        // 支線：黃色
        // -------------------------------------------------------------

        windowObject.changeTextColor(
            ColorManager.textColor(
                SIDE_COLOR
            )
        );
    }

    // =========================================================================
    // 任務前綴
    // =========================================================================

    function questPrefix(
        quest
    ) {

        if (
            quest &&
            quest.category === "main"
        ) {

            return "【主線】";
        }

        return "【支線】";
    }

    // =========================================================================
    // 地圖任務追蹤視窗
    // =========================================================================

    class Window_QuestTracker
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this.opacity =
                225;

            this.refresh();
        }

        // ---------------------------------------------------------------------
        // 刷新
        // ---------------------------------------------------------------------

        refresh() {

            this.contents.clear();

            if (
                !$gameSystem ||
                !SHOW_TRACKER
            ) {

                this.hide();

                return;
            }

            if (
                !$gameSystem._questTrackerVisible
            ) {

                this.hide();

                return;
            }

            const quests =
                $gameSystem.trackedQuests();

            if (
                !quests ||
                quests.length === 0
            ) {

                this.hide();

                return;
            }

            this.show();

            let y =
                0;

            // -----------------------------------------------------------------
            // 目前位置
            // -----------------------------------------------------------------

            let locationName =
                "未知地圖";

            if (
                $gameMap &&
                $dataMapInfos
            ) {

                const mapInfo =
                    $dataMapInfos[
                        $gameMap.mapId()
                    ];

                if (
                    mapInfo &&
                    mapInfo.name
                ) {

                    locationName =
                        mapInfo.name;
                }
            }

            this.contents.fontSize =
                Math.max(
                    14,
                    TRACKER_FONT_SIZE - 2
                );

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "目前位置：" +
                locationName,
                8,
                y,
                this.contentsWidth() - 16,
                28,
                "left"
            );

            y += 32;

            // -----------------------------------------------------------------
            // 任務標題
            // -----------------------------------------------------------------

            this.contents.fontSize =
                TRACKER_FONT_SIZE + 2;

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "任務",
                0,
                y,
                this.contentsWidth(),
                30,
                "left"
            );

            y += 34;

            // -----------------------------------------------------------------
            // 任務列表
            // -----------------------------------------------------------------

            for (
                const quest of quests
            ) {

                if (!quest) {
                    continue;
                }

                // =============================================================
                // 第一行：任務名稱
                // =============================================================

                this.contents.fontSize =
                    TRACKER_FONT_SIZE;

                questColor(
                    this,
                    quest
                );

                this.drawText(
                    quest.name || "",
                    0,
                    y,
                    this.contentsWidth(),
                    28,
                    "left"
                );

                y += 28;

                // =============================================================
                // 第二行：
                //
                // 取得蘑菇孢子                  0 / 5
                //
                // 目標 + 進度同一行
                // =============================================================

                this.contents.fontSize =
                    Math.max(
                        14,
                        TRACKER_FONT_SIZE - 2
                    );

                // -------------------------------------------------------------
                // 任務目標：白色
                // -------------------------------------------------------------

                this.changeTextColor(
                    ColorManager.normalColor()
                );

                this.drawText(
                    quest.objective || "",
                    8,
                    y,
                    this.contentsWidth() - 105,
                    26,
                    "left"
                );

                // -------------------------------------------------------------
                // 任務進度：白色
                // -------------------------------------------------------------

                this.changeTextColor(
                    ColorManager.normalColor()
                );

                this.drawText(
                    String(
                        quest.progress
                    ) +
                    " / " +
                    String(
                        quest.amount
                    ),
                    this.contentsWidth() - 100,
                    y,
                    100,
                    26,
                    "right"
                );

                y += 34;
            }
        }
    }

    // =========================================================================
    // Scene_Map：建立所有視窗
    // =========================================================================

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

    // =========================================================================
    // 建立任務追蹤視窗
    // =========================================================================

    Scene_Map.prototype.createQuestTracker =
        function() {

            if (
                this._questTracker
            ) {

                return;
            }

            const width =
                Math.min(
                    TRACKER_WIDTH,
                    Math.max(
                        180,
                        Graphics.boxWidth - 40
                    )
                );

            const height =
                Math.min(
                    TRACKER_HEIGHT,
                    Math.max(
                        120,
                        Graphics.boxHeight - 40
                    )
                );

            const rect =
                new Rectangle(
                    TRACKER_X,
                    TRACKER_Y,
                    width,
                    height
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
        };

    // =========================================================================
    // 任務追蹤 + MiniMap 排版
    // =========================================================================

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

            let taskWidth =
                TRACKER_WIDTH;

            let mapWidth =
                mapDesiredWidth;

            const available =
                screenW -
                margin * 2 -
                gap;

            // -----------------------------------------------------------------
            // 螢幕太小時縮小
            // -----------------------------------------------------------------

            if (
                taskWidth +
                mapWidth >
                available
            ) {

                taskWidth =
                    Math.floor(
                        available * 0.52
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

            // -----------------------------------------------------------------
            // 任務追蹤視窗
            // -----------------------------------------------------------------

            this._questTracker.x =
                margin;

            this._questTracker.y =
                Math.max(
                    10,
                    TRACKER_Y
                );

            this._questTracker.width =
                taskWidth;

            this._questTracker.height =
                Math.min(
                    TRACKER_HEIGHT,
                    Math.max(
                        120,
                        screenH -
                        this._questTracker.y -
                        margin
                    )
                );

            // -----------------------------------------------------------------
            // MiniMap
            // -----------------------------------------------------------------

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

                if (
                    this._miniMap.refresh
                ) {

                    this._miniMap.refresh();
                }
            }
        };

    // =========================================================================
    // 刷新任務追蹤
    // =========================================================================

    Scene_Map.prototype.refreshQuestTracker =
        function() {

            if (
                this._questTracker
            ) {

                this._questTracker.refresh();
            }

            this.updateTopHudLayout();
        };

    // =========================================================================
    // 任務提示視窗
    // =========================================================================

    class Window_QuestMessage
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this.opacity =
                245;

            this._timer =
                0;

            this._title =
                "";

            this._name =
                "";

            this.hide();
        }

        // ---------------------------------------------------------------------
        // 顯示訊息
        // ---------------------------------------------------------------------

        showMessage(
            title,
            name
        ) {

            this._title =
                title || "";

            this._name =
                name || "";

            this._timer =
                180;

            this.refresh();

            this.show();
        }

        // ---------------------------------------------------------------------
        // 更新
        // ---------------------------------------------------------------------

        update() {

            super.update();

            if (
                !this.visible
            ) {

                return;
            }

            this._timer--;

            if (
                this._timer <= 0
            ) {

                this.hide();
            }
        }

        // ---------------------------------------------------------------------
        // 刷新
        // ---------------------------------------------------------------------

        refresh() {

            this.contents.clear();

            this.contents.fontSize =
                24;

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                this._title,
                0,
                0,
                this.contentsWidth(),
                36,
                "center"
            );

            this.contents.fontSize =
                20;

            this.changeTextColor(
                ColorManager.normalColor()
            );

            this.drawText(
                this._name,
                0,
                42,
                this.contentsWidth(),
                32,
                "center"
            );
        }
    }

    // =========================================================================
    // 建立任務提示視窗
    // =========================================================================

    Scene_Map.prototype.createQuestMessageWindow =
        function() {

            if (
                this._questMessageWindow
            ) {

                return;
            }

            const width =
                Math.min(
                    500,
                    Math.max(
                        280,
                        Graphics.boxWidth - 40
                    )
                );

            const height =
                120;

            const x =
                (Graphics.boxWidth - width) / 2;

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

    // =========================================================================
    // 顯示任務提示
    // =========================================================================

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

    // =========================================================================
    // 任務列表視窗
    // =========================================================================

    class Window_QuestList
        extends Window_Selectable {

        initialize(rect) {

            super.initialize(rect);

            this._lastQuestSignature =
                "";

            this.refresh();

            if (
                this.maxItems() > 0
            ) {

                this.select(0);

            } else {

                this.select(-1);
            }

            this.activate();
        }

        // ---------------------------------------------------------------------
        // 任務數量
        // ---------------------------------------------------------------------

        maxItems() {

            if (
                !$gameSystem
            ) {

                return 0;
            }

            $gameSystem.initQuestSystem();

            return $gameSystem._quests.length;
        }

        // ---------------------------------------------------------------------
        // 取得任務
        // ---------------------------------------------------------------------

        item(index) {

            if (
                !$gameSystem
            ) {

                return null;
            }

            $gameSystem.initQuestSystem();

            return (
                $gameSystem._quests[index] ||
                null
            );
        }

        // ---------------------------------------------------------------------
        // 任務資料簽名
        // ---------------------------------------------------------------------

        questSignature() {

            if (
                !$gameSystem
            ) {

                return "";
            }

            $gameSystem.initQuestSystem();

            return $gameSystem._quests
                .map(
                    q =>
                        [
                            q.id,
                            q.status,
                            q.progress,
                            q.amount,
                            q.tracked
                        ].join(":")
                )
                .join("|");
        }

        // ---------------------------------------------------------------------
        // 每行高度
        // ---------------------------------------------------------------------

        itemHeight() {

            return 44;
        }

        // ---------------------------------------------------------------------
        // 畫任務
        // ---------------------------------------------------------------------

        drawItem(index) {

            const quest =
                this.item(index);

            if (!quest) {

                return;
            }

            const rect =
                this.itemLineRect(index);

            const progressWidth =
                80;

            const nameWidth =
                Math.max(
                    100,
                    rect.width -
                    progressWidth -
                    10
                );

            // -----------------------------------------------------------------
            // 任務名稱
            // -----------------------------------------------------------------

            questColor(
                this,
                quest
            );

            this.contents.fontSize =
                20;

            this.drawText(
                questPrefix(quest) +
                (quest.name || ""),
                rect.x,
                rect.y,
                nameWidth,
                rect.height,
                "left"
            );

            // -----------------------------------------------------------------
            // 任務進度
            // -----------------------------------------------------------------

            this.changeTextColor(
                quest.status === "completed"
                    ? ColorManager.textColor(
                        COMPLETE_COLOR
                    )
                    : ColorManager.normalColor()
            );

            this.drawText(
                String(
                    quest.progress
                ) +
                "/" +
                String(
                    quest.amount
                ),
                rect.x +
                nameWidth,
                rect.y,
                progressWidth,
                rect.height,
                "right"
            );
        }

        // ---------------------------------------------------------------------
        // 刷新
        // ---------------------------------------------------------------------

        refresh() {

            this.contents.clear();

            this.createContents();

            this.drawAllItems();

            this._lastQuestSignature =
                this.questSignature();
        }

        // ---------------------------------------------------------------------
        // 自動檢查任務資料變化
        // ---------------------------------------------------------------------

        update() {

            super.update();

            const signature =
                this.questSignature();

            if (
                signature !==
                this._lastQuestSignature
            ) {

                const currentIndex =
                    this.index();

                this.refresh();

                if (
                    this.maxItems() > 0
                ) {

                    this.select(
                        Math.min(
                            currentIndex,
                            this.maxItems() - 1
                        )
                    );
                }
            }
        }
    }

    // =========================================================================
    // 任務詳細資料視窗
    // =========================================================================

    class Window_QuestDetail
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this._quest =
                null;

            this.refresh();
        }

        // ---------------------------------------------------------------------
        // 設定任務
        // ---------------------------------------------------------------------

        setQuest(
            quest
        ) {

            this._quest =
                quest;

            this.refresh();
        }

        // ---------------------------------------------------------------------
        // 換行文字
        // ---------------------------------------------------------------------

        drawWrappedText(
            text,
            x,
            y,
            width,
            lineHeight
        ) {

            const value =
                String(
                    text || ""
                );

            if (!value) {

                return y;
            }

            const lines =
                value.split(
                    /\r?\n/
                );

            for (
                const line of lines
            ) {

                this.drawText(
                    line,
                    x,
                    y,
                    width,
                    lineHeight,
                    "left"
                );

                y += lineHeight;
            }

            return y;
        }

        // ---------------------------------------------------------------------
        // 刷新
        // ---------------------------------------------------------------------

        refresh() {

            this.contents.clear();

            if (
                !this._quest
            ) {

                return;
            }

            const quest =
                this._quest;

            let y =
                0;

            // -----------------------------------------------------------------
            // 任務名稱
            // -----------------------------------------------------------------

            this.contents.fontSize =
                28;

            questColor(
                this,
                quest
            );

            this.drawText(
                questPrefix(quest) +
                (quest.name || ""),
                0,
                y,
                this.contentsWidth(),
                42,
                "center"
            );

            y += 58;

            // -----------------------------------------------------------------
            // 任務說明
            // -----------------------------------------------------------------

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
                32,
                "left"
            );

            y += 36;

            this.changeTextColor(
                ColorManager.normalColor()
            );

            y =
                this.drawWrappedText(
                    quest.description || "",
                    10,
                    y,
                    this.contentsWidth() - 20,
                    30
                );

            y += 18;

            // -----------------------------------------------------------------
            // 任務目標
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "任務目標",
                0,
                y,
                this.contentsWidth(),
                32,
                "left"
            );

            y += 36;

            this.changeTextColor(
                ColorManager.normalColor()
            );

            y =
                this.drawWrappedText(
                    quest.objective || "",
                    10,
                    y,
                    this.contentsWidth() - 20,
                    30
                );

            y += 20;

            // -----------------------------------------------------------------
            // 進度
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.systemColor()
            );

            this.drawText(
                "進度",
                0,
                y,
                this.contentsWidth(),
                32,
                "left"
            );

            y += 36;

            this.contents.fontSize =
                24;

            this.changeTextColor(
                quest.status === "completed"
                    ? ColorManager.textColor(
                        COMPLETE_COLOR
                    )
                    : ColorManager.normalColor()
            );

            this.drawText(
                String(
                    quest.progress
                ) +
                " / " +
                String(
                    quest.amount
                ),
                0,
                y,
                this.contentsWidth(),
                40,
                "center"
            );

            y += 58;

            // -----------------------------------------------------------------
            // 任務完成
            // -----------------------------------------------------------------

            if (
                quest.status === "completed"
            ) {

                this.contents.fontSize =
                    24;

                this.changeTextColor(
                    ColorManager.textColor(
                        COMPLETE_COLOR
                    )
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

    // =========================================================================
    // 任務詳細 Scene
    // =========================================================================

    let questDetailTarget =
        null;

    class Scene_QuestDetail
        extends Scene_MenuBase {

        initialize() {

            super.initialize();

            this._quest =
                questDetailTarget;

            questDetailTarget =
                null;
        }

        // ---------------------------------------------------------------------
        // 建立
        // ---------------------------------------------------------------------

        create() {

            super.create();

            this.createDetailWindow();
        }

        // ---------------------------------------------------------------------
        // 建立詳細視窗
        // ---------------------------------------------------------------------

        createDetailWindow() {

            const width =
                Math.min(
                    WINDOW_WIDTH,
                    Math.max(
                        300,
                        Graphics.boxWidth - 40
                    )
                );

            const height =
                Math.min(
                    WINDOW_HEIGHT,
                    Math.max(
                        200,
                        Graphics.boxHeight - 40
                    )
                );

            const x =
                Math.floor(
                    (Graphics.boxWidth - width) / 2
                );

            const y =
                Math.floor(
                    (Graphics.boxHeight - height) / 2
                );

            this._questDetail =
                new Window_QuestDetail(
                    new Rectangle(
                        x,
                        y,
                        width,
                        height
                    )
                );

            this._questDetail.setQuest(
                this._quest
            );

            this.addWindow(
                this._questDetail
            );
        }

        // ---------------------------------------------------------------------
        // 更新
        // ---------------------------------------------------------------------

        update() {

            super.update();

            // -------------------------------------------------------------
            // ESC：返回任務列表
            // -------------------------------------------------------------

            if (
                Input.isTriggered(
                    "cancel"
                )
            ) {

                SceneManager.pop();
            }
        }
    }

    // =========================================================================
    // 任務列表 Scene
    // =========================================================================

    class Scene_Quest
        extends Scene_MenuBase {

        // ---------------------------------------------------------------------
        // 建立
        // ---------------------------------------------------------------------

        create() {

            super.create();

            this.createQuestListWindow();
        }

        // ---------------------------------------------------------------------
        // 建立任務列表
        // ---------------------------------------------------------------------

        createQuestListWindow() {

            const width =
                Math.min(
                    WINDOW_WIDTH,
                    Math.max(
                        300,
                        Graphics.boxWidth - 40
                    )
                );

            const height =
                Math.min(
                    WINDOW_HEIGHT,
                    Math.max(
                        200,
                        Graphics.boxHeight - 40
                    )
                );

            const x =
                Math.floor(
                    (Graphics.boxWidth - width) / 2
                );

            const y =
                Math.floor(
                    (Graphics.boxHeight - height) / 2
                );

            this._questList =
                new Window_QuestList(
                    new Rectangle(
                        x,
                        y,
                        width,
                        height
                    )
                );

            this.addWindow(
                this._questList
            );

            // -----------------------------------------------------------------
            // Enter：進入詳細頁
            // -----------------------------------------------------------------

            this._questList.setHandler(
                "ok",
                this.onQuestOk.bind(
                    this
                )
            );

            // -----------------------------------------------------------------
            // ESC：離開任務介面
            // -----------------------------------------------------------------

            this._questList.setHandler(
                "cancel",
                this.onQuestCancel.bind(
                    this
                )
            );

            this._questList.activate();
        }

        // ---------------------------------------------------------------------
        // Enter
        // ---------------------------------------------------------------------

        onQuestOk() {

            const index =
                this._questList.index();

            const quest =
                this._questList.item(
                    index
                );

            if (!quest) {

                this._questList.activate();

                return;
            }

            // -------------------------------------------------------------
            // 先設定任務，再進入 Scene
            // -------------------------------------------------------------

            questDetailTarget =
                quest;

            SceneManager.push(
                Scene_QuestDetail
            );
        }

        // ---------------------------------------------------------------------
        // ESC
        // ---------------------------------------------------------------------

        onQuestCancel() {

            SceneManager.pop();
        }
    }

    // =========================================================================
    // 插件指令：開啟任務介面
    // =========================================================================

    PluginManager.registerCommand(
        "QuestSystem_MZ_UI",
        "OpenQuestScene",
        () => {

            SceneManager.push(
                Scene_Quest
            );
        }
    );

    // =========================================================================
    // 對外暴露 Scene
    // =========================================================================

    window.Scene_Quest =
        Scene_Quest;

    window.Scene_QuestDetail =
        Scene_QuestDetail;

})();