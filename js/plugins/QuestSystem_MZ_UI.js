/*:
 * @target MZ
 * @plugindesc v1.4.6 任務系統 UI：自動顯示追蹤任務、任務列表、詳細資料、提示視窗
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * QuestSystem MZ UI
 * ============================================================================
 *
 * 插件順序：
 *
 * 1. QuestSystem_MZ_Core.js
 * 2. QuestSystem_MZ_Progress.js
 * 3. QuestSystem_MZ_UI.js
 *
 * ============================================================================
 * 地圖任務追蹤
 * ============================================================================
 *
 * ★ 只要存在正在追蹤的任務，就自動顯示任務視窗。
 *
 * ★ 不需要另外執行 ShowTracker。
 *
 * ★ 即使之前執行 HideTracker，只要仍有正在追蹤的任務，
 *   系統也會自動再次顯示。
 *
 * ★ 沒有正在追蹤的任務時，自動隱藏。
 *
 * ============================================================================
 * 任務追蹤顯示
 * ============================================================================
 *
 * 目前位置：村長家
 *
 * 任務
 *
 * 【支線】艾娜的蘑菇孢子
 * 取得蘑菇孢子                         0 / 5
 *
 * ============================================================================
 *
 * 任務名稱：
 *
 * 主線 = 藍色
 * 支線 = 黃色
 * 完成 = 綠色
 *
 * 任務目標：
 *
 * 白色
 *
 * 任務進度：
 *
 * 白色
 *
 * 任務目標與進度：
 *
 * 同一行
 *
 * ============================================================================
 *
 * MiniMap 不由本插件控制。
 *
 * MiniMap_MZ 自己負責位置與大小。
 *
 * 本插件不使用 window.resize。
 *
 * ============================================================================
 *
 * @command OpenQuestScene
 * @text 開啟任務介面
 */

(() => {

    "use strict";


    // =========================================================================
    // 確認 QuestSystem Core
    // =========================================================================

    if (
        !window.QuestSystemMZ
    ) {

        console.error(
            "QuestSystem_MZ_UI：找不到 QuestSystem_MZ_Core.js，請確認插件順序。"
        );

        return;
    }


    // =========================================================================
    // QuestSystem
    // =========================================================================

    const QuestSystemMZ =
        window.QuestSystemMZ;


    const config =
        QuestSystemMZ.config || {};


    // =========================================================================
    // Core 設定
    // =========================================================================

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


    // =========================================================================
    // 顏色
    // =========================================================================

    const MAIN_COLOR =
        4;


    const SIDE_COLOR =
        14;


    const COMPLETE_COLOR =
        3;


    // =========================================================================
    // 任務顏色
    // =========================================================================

    function questColor(
        win,
        quest
    ) {

        // ---------------------------------------------------------------------
        // 完成任務 = 綠色
        // ---------------------------------------------------------------------

        if (
            quest &&
            quest.status ===
            "completed"
        ) {

            win.changeTextColor(
                ColorManager.textColor(
                    COMPLETE_COLOR
                )
            );

            return;
        }


        // ---------------------------------------------------------------------
        // 主線 = 藍色
        // ---------------------------------------------------------------------

        if (
            quest &&
            quest.category ===
            "main"
        ) {

            win.changeTextColor(
                ColorManager.textColor(
                    MAIN_COLOR
                )
            );

            return;
        }


        // ---------------------------------------------------------------------
        // 支線 = 黃色
        // ---------------------------------------------------------------------

        win.changeTextColor(
            ColorManager.textColor(
                SIDE_COLOR
            )
        );
    }


    // =========================================================================
    // 任務分類
    // =========================================================================

    function questPrefix(
        quest
    ) {

        if (
            quest &&
            quest.category ===
            "main"
        ) {

            return "【主線】";
        }


        return "【支線】";
    }


    // =========================================================================
    // 取得正在追蹤的任務
    // =========================================================================

    function trackedQuests() {

        if (
            !$gameSystem
        ) {

            return [];
        }


        if (
            !$gameSystem.trackedQuests
        ) {

            return [];
        }


        const quests =
            $gameSystem.trackedQuests();


        if (
            !Array.isArray(
                quests
            )
        ) {

            return [];
        }


        return quests;
    }


    // =========================================================================
    // 建立任務追蹤視窗
    // =========================================================================

    class Window_QuestTracker
        extends Window_Base {


        // =====================================================================
        // 初始化
        // =====================================================================

        initialize(
            rect
        ) {

            super.initialize(
                rect
            );


            this.opacity =
                225;


            this._questSignature =
                "";


            this.refresh();
        }


        // =====================================================================
        // 任務資料簽名
        // =====================================================================

        questSignature(
            quests
        ) {

            if (
                !Array.isArray(
                    quests
                )
            ) {

                return "";
            }


            return quests
                .map(
                    quest =>
                        [
                            quest.id,
                            quest.name,
                            quest.status,
                            quest.progress,
                            quest.amount,
                            quest.tracked,
                            quest.objective
                        ].join(":")
                )
                .join("|");
        }


        // =====================================================================
        // 刷新
        // =====================================================================

        refresh() {

            this.contents.clear();


            // -----------------------------------------------------------------
            // 沒有 Game_System
            // -----------------------------------------------------------------

            if (
                !$gameSystem
            ) {

                this.hide();

                return;
            }


            // -----------------------------------------------------------------
            // 取得正在追蹤的任務
            // -----------------------------------------------------------------

            const quests =
                trackedQuests();


            // -----------------------------------------------------------------
            // ★★★ 核心功能 ★★★
            //
            // 只要有正在追蹤的任務：
            //
            // 強制設定：
            //
            // _questTrackerVisible = true
            //
            // 並且：
            //
            // this.show()
            //
            // -----------------------------------------------------------------

            if (
                quests.length > 0
            ) {

                $gameSystem._questTrackerVisible =
                    true;


                this.show();

            } else {

                $gameSystem._questTrackerVisible =
                    false;


                this.hide();

                return;
            }


            // -----------------------------------------------------------------
            // 任務資料簽名
            // -----------------------------------------------------------------

            this._questSignature =
                this.questSignature(
                    quests
                );


            // -----------------------------------------------------------------
            // 起始位置
            // -----------------------------------------------------------------

            let y =
                0;


            // =================================================================
            // 目前位置
            // =================================================================

            let locationName =
                "未知地圖";


            if (
                $gameMap &&
                $dataMapInfos
            ) {

                const mapId =
                    $gameMap.mapId();


                const mapInfo =
                    $dataMapInfos[
                        mapId
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


            // =================================================================
            // 任務標題
            // =================================================================

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


            // =================================================================
            // 正在追蹤的任務
            // =================================================================

            for (
                const quest of quests
            ) {

                if (
                    !quest
                ) {

                    continue;
                }


                // =============================================================
                // 任務名稱
                // =============================================================

                this.contents.fontSize =
                    TRACKER_FONT_SIZE;


                questColor(
                    this,
                    quest
                );


                this.drawText(
                    questPrefix(
                        quest
                    ) +
                    (
                        quest.name ||
                        ""
                    ),
                    0,
                    y,
                    this.contentsWidth(),
                    28,
                    "left"
                );


                y += 28;


                // =============================================================
                // 任務目標 + 任務進度
                //
                // ★ 同一行
                // ★ 白色
                // =============================================================

                this.contents.fontSize =
                    Math.max(
                        14,
                        TRACKER_FONT_SIZE - 2
                    );


                this.changeTextColor(
                    ColorManager.normalColor()
                );


                const progressText =
                    String(
                        quest.progress
                    ) +
                    " / " +
                    String(
                        quest.amount
                    );


                const progressWidth =
                    100;


                const objectiveWidth =
                    Math.max(
                        80,
                        this.contentsWidth() -
                        progressWidth -
                        16
                    );


                // -------------------------------------------------------------
                // 任務目標
                // -------------------------------------------------------------

                this.drawText(
                    quest.objective || "",
                    8,
                    y,
                    objectiveWidth,
                    26,
                    "left"
                );


                // -------------------------------------------------------------
                // 任務進度
                // -------------------------------------------------------------

                this.drawText(
                    progressText,
                    this.contentsWidth() -
                    progressWidth,
                    y,
                    progressWidth,
                    26,
                    "right"
                );


                y += 34;
            }


            // -----------------------------------------------------------------
            // 再次確認顏色回到正常白色
            // -----------------------------------------------------------------

            this.changeTextColor(
                ColorManager.normalColor()
            );
        }
    }


    // =========================================================================
    // Scene_Map 建立視窗
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


            // -------------------------------------------------------------
            // 建立完成後立即檢查
            // -------------------------------------------------------------

            this.updateQuestTrackerAutoShow();
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
    // ★★★ Scene_Map 每幀自動檢查任務追蹤 ★★★
    // =========================================================================
    //
    // 這是本次最重要的修正。
    //
    // 不再依賴：
    //
    //     refreshQuestUI()
    //
    // 的執行時機。
    //
    // 而是每幀確認：
    //
    //     是否有正在追蹤的任務？
    //
    // 有：
    //
    //     → 顯示
    //
    // 沒有：
    //
    //     → 隱藏
    //
    // =========================================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;


    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(
                this
            );


            this.updateQuestTrackerAutoShow();
        };


    // =========================================================================
    // 自動顯示／隱藏任務追蹤
    // =========================================================================

    Scene_Map.prototype.updateQuestTrackerAutoShow =
        function() {

            if (
                !$gameSystem
            ) {

                return;
            }


            // -----------------------------------------------------------------
            // 確保視窗存在
            // -----------------------------------------------------------------

            if (
                !this._questTracker
            ) {

                this.createQuestTracker();
            }


            if (
                !this._questTracker
            ) {

                return;
            }


            // -----------------------------------------------------------------
            // 取得目前正在追蹤的任務
            // -----------------------------------------------------------------

            const quests =
                trackedQuests();


            // =================================================================
            // 有正在追蹤的任務
            // =================================================================

            if (
                quests.length > 0
            ) {

                // -------------------------------------------------------------
                // 強制設定為顯示
                // -------------------------------------------------------------

                $gameSystem._questTrackerVisible =
                    true;


                // -------------------------------------------------------------
                // 強制顯示視窗
                // -------------------------------------------------------------

                if (
                    !this._questTracker.visible
                ) {

                    this._questTracker.show();
                }


                // -------------------------------------------------------------
                // 檢查任務內容是否改變
                // -------------------------------------------------------------

                const signature =
                    quests
                        .map(
                            quest =>
                                [
                                    quest.id,
                                    quest.name,
                                    quest.status,
                                    quest.progress,
                                    quest.amount,
                                    quest.tracked,
                                    quest.objective
                                ].join(":")
                        )
                        .join("|");


                if (
                    this._questTracker._questSignature !==
                    signature
                ) {

                    this._questTracker._questSignature =
                        signature;


                    this._questTracker.refresh();
                }


                return;
            }


            // =================================================================
            // 沒有正在追蹤的任務
            // =================================================================

            $gameSystem._questTrackerVisible =
                false;


            if (
                this._questTracker.visible
            ) {

                this._questTracker.hide();
            }
        };


    // =========================================================================
    // 任務視窗位置
    // =========================================================================
    //
    // ★ 只處理 QuestTracker
    //
    // ★ 不處理 MiniMap
    //
    // ★ 不修改 MiniMap：
    //
    //     _miniMap.x
    //     _miniMap.y
    //     _miniMap.width
    //     _miniMap.height
    //
    // =========================================================================

    Scene_Map.prototype.updateTopHudLayout =
        function() {

            if (
                !this._questTracker
            ) {

                return;
            }


            const margin =
                15;


            const width =
                Math.min(
                    TRACKER_WIDTH,
                    Math.max(
                        180,
                        Graphics.boxWidth -
                        margin * 2
                    )
                );


            const height =
                Math.min(
                    TRACKER_HEIGHT,
                    Math.max(
                        120,
                        Graphics.boxHeight -
                        TRACKER_Y -
                        margin
                    )
                );


            this._questTracker.x =
                margin;


            this._questTracker.y =
                Math.max(
                    10,
                    TRACKER_Y
                );


            this._questTracker.width =
                width;


            this._questTracker.height =
                height;
        };


    // =========================================================================
    // 刷新任務追蹤
    // =========================================================================

    Scene_Map.prototype.refreshQuestTracker =
        function() {

            if (
                !this._questTracker
            ) {

                this.createQuestTracker();
            }


            if (
                this._questTracker
            ) {

                this._questTracker.refresh();
            }


            this.updateTopHudLayout();


            // -------------------------------------------------------------
            // 再次執行自動顯示
            // -------------------------------------------------------------

            this.updateQuestTrackerAutoShow();
        };


    // =========================================================================
    // 任務提示視窗
    // =========================================================================

    class Window_QuestMessage
        extends Window_Base {


        initialize(
            rect
        ) {

            super.initialize(
                rect
            );


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


        // =====================================================================
        // 顯示
        // =====================================================================

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


        // =====================================================================
        // 更新
        // =====================================================================

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


        // =====================================================================
        // 刷新
        // =====================================================================

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
                Math.floor(
                    (
                        Graphics.boxWidth -
                        width
                    ) / 2
                );


            const y =
                70;


            this._questMessageWindow =
                new Window_QuestMessage(
                    new Rectangle(
                        x,
                        y,
                        width,
                        height
                    )
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
    // 任務列表
    // =========================================================================

    class Window_QuestList
        extends Window_Selectable {


        initialize(
            rect
        ) {

            super.initialize(
                rect
            );


            this._lastQuestSignature =
                "";


            this.refresh();


            this.select(
                this.maxItems() > 0
                    ? 0
                    : -1
            );


            this.activate();
        }


        // =====================================================================
        // 任務數量
        // =====================================================================

        maxItems() {

            if (
                !$gameSystem
            ) {

                return 0;
            }


            $gameSystem.initQuestSystem();


            return (
                $gameSystem._quests
                    ? $gameSystem._quests.length
                    : 0
            );
        }


        // =====================================================================
        // 取得任務
        // =====================================================================

        item(
            index
        ) {

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


        // =====================================================================
        // 每行高度
        // =====================================================================

        itemHeight() {

            return 44;
        }


        // =====================================================================
        // 任務資料簽名
        // =====================================================================

        questSignature() {

            if (
                !$gameSystem
            ) {

                return "";
            }


            $gameSystem.initQuestSystem();


            return (
                $gameSystem._quests || []
            )
                .map(
                    quest =>
                        [
                            quest.id,
                            quest.status,
                            quest.progress,
                            quest.amount,
                            quest.tracked
                        ].join(":")
                )
                .join("|");
        }


        // =====================================================================
        // 畫任務
        // =====================================================================

        drawItem(
            index
        ) {

            const quest =
                this.item(
                    index
                );


            if (
                !quest
            ) {

                return;
            }


            const rect =
                this.itemLineRect(
                    index
                );


            const progressWidth =
                80;


            const nameWidth =
                Math.max(
                    100,
                    rect.width -
                    progressWidth -
                    10
                );


            // -------------------------------------------------------------
            // 任務名稱顏色
            // -------------------------------------------------------------

            questColor(
                this,
                quest
            );


            this.contents.fontSize =
                20;


            this.drawText(
                questPrefix(
                    quest
                ) +
                (
                    quest.name ||
                    ""
                ),
                rect.x,
                rect.y,
                nameWidth,
                rect.height,
                "left"
            );


            // -------------------------------------------------------------
            // 進度
            // -------------------------------------------------------------

            this.changeTextColor(
                quest.status ===
                    "completed"
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


        // =====================================================================
        // 刷新
        // =====================================================================

        refresh() {

            this.contents.clear();


            this.createContents();


            this.drawAllItems();


            this._lastQuestSignature =
                this.questSignature();
        }


        // =====================================================================
        // 自動檢查任務資料
        // =====================================================================

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
                            Math.max(
                                0,
                                currentIndex
                            ),
                            this.maxItems() - 1
                        )
                    );
                }
            }
        }
    }


    // =========================================================================
    // 任務詳細資料
    // =========================================================================

    class Window_QuestDetail
        extends Window_Base {


        initialize(
            rect
        ) {

            super.initialize(
                rect
            );


            this._quest =
                null;


            this.refresh();
        }


        // =====================================================================
        // 設定任務
        // =====================================================================

        setQuest(
            quest
        ) {

            this._quest =
                quest;


            this.refresh();
        }


        // =====================================================================
        // 文字換行
        // =====================================================================

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


            if (
                !value
            ) {

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


        // =====================================================================
        // 刷新
        // =====================================================================

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


            // -------------------------------------------------------------
            // 任務名稱
            // -------------------------------------------------------------

            this.contents.fontSize =
                28;


            questColor(
                this,
                quest
            );


            this.drawText(
                questPrefix(
                    quest
                ) +
                (
                    quest.name ||
                    ""
                ),
                0,
                y,
                this.contentsWidth(),
                42,
                "center"
            );


            y += 58;


            // -------------------------------------------------------------
            // 任務說明
            // -------------------------------------------------------------

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


            // -------------------------------------------------------------
            // 任務目標
            // -------------------------------------------------------------

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


            // -------------------------------------------------------------
            // 進度
            // -------------------------------------------------------------

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
                quest.status ===
                    "completed"
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


            // -------------------------------------------------------------
            // 任務完成
            // -------------------------------------------------------------

            if (
                quest.status ===
                "completed"
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


        create() {

            super.create();


            this.createDetailWindow();
        }


        // =====================================================================
        // 建立詳細視窗
        // =====================================================================

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
                    (
                        Graphics.boxWidth -
                        width
                    ) / 2
                );


            const y =
                Math.floor(
                    (
                        Graphics.boxHeight -
                        height
                    ) / 2
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


        // =====================================================================
        // 更新
        // =====================================================================

        update() {

            super.update();


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


        create() {

            super.create();


            this.createQuestListWindow();
        }


        // =====================================================================
        // 建立任務列表
        // =====================================================================

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
                    (
                        Graphics.boxWidth -
                        width
                    ) / 2
                );


            const y =
                Math.floor(
                    (
                        Graphics.boxHeight -
                        height
                    ) / 2
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


            // -------------------------------------------------------------
            // Enter：進入詳細頁
            // -------------------------------------------------------------

            this._questList.setHandler(
                "ok",
                this.onQuestOk.bind(
                    this
                )
            );


            // -------------------------------------------------------------
            // ESC：離開任務介面
            // -------------------------------------------------------------

            this._questList.setHandler(
                "cancel",
                this.onQuestCancel.bind(
                    this
                )
            );


            this._questList.activate();
        }


        // =====================================================================
        // Enter
        // =====================================================================

        onQuestOk() {

            const quest =
                this._questList.item(
                    this._questList.index()
                );


            if (
                !quest
            ) {

                this._questList.activate();

                return;
            }


            questDetailTarget =
                quest;


            SceneManager.push(
                Scene_QuestDetail
            );
        }


        // =====================================================================
        // ESC
        // =====================================================================

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