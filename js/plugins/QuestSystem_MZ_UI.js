/*:
 * @target MZ
 * @plugindesc v1.5.2 任務系統 UI：任務追蹤、任務列表、詳細資料、完成提示
 * @author ChatGPT
 *
 * @help
 * QuestSystem_MZ_UI v1.5.2
 *
 * 插件順序：
 * 1. QuestSystem_MZ_Core v1.5.1
 * 2. QuestSystem_MZ_Core_Report v1.5.1
 * 3. QuestSystem_MZ_Progress v1.5.1
 * 4. QuestSystem_MZ_UI v1.5.2
 *
 * 重要：
 * - needReport=true 的任務完成後留在追蹤器，直到 ReportQuest。
 * - needReport=false 的任務完成後立即從追蹤器消失。
 * - 任務完成提示視窗固定顯示在任務追蹤器右側，不再顯示於畫面下方。
 * - 不控制 MiniMap。
 * - 不每幀重繪任務內容，只在任務資料改變時刷新。
 *
 * @command OpenQuestScene
 * @text 開啟任務介面
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "QuestSystem_MZ_UI";
    const VERSION = "1.5.2";

    if (window.QuestSystemMZ_UI_v152) {
        console.warn(
            `${PLUGIN_NAME} v${VERSION} 已載入，跳過重複載入。`
        );
        return;
    }

    window.QuestSystemMZ_UI_v152 = true;

    if (!window.QuestSystemMZ) {
        console.error(
            `${PLUGIN_NAME}：找不到 QuestSystem_MZ_Core。請確認插件順序。`
        );
        return;
    }

    // =========================================================================
    // Core 設定
    // =========================================================================

    const config =
        window.QuestSystemMZ.config || {};

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
    // 判斷：是否為「完成、等待回報」
    // =========================================================================

    function isWaitingReport(
        quest
    ) {

        return !!(
            quest &&
            quest.status === "completed" &&
            quest.needReport === true &&
            quest.reported !== true
        );

    }


    // =========================================================================
    // 取得正在追蹤的任務
    // =========================================================================

    function getTrackedQuests() {

        if (
            !$gameSystem ||
            typeof $gameSystem.trackedQuests !==
            "function"
        ) {

            return [];

        }


        const list =
            $gameSystem.trackedQuests();


        if (
            !Array.isArray(list)
        ) {

            return [];

        }


        return list.filter(
            quest => {

                if (
                    !quest ||
                    quest.tracked !== true
                ) {

                    return false;

                }


                // -------------------------------------------------------------
                // 進行中任務
                // -------------------------------------------------------------

                if (
                    quest.status ===
                    "active"
                ) {

                    return true;

                }


                // -------------------------------------------------------------
                // 完成、等待回報
                // -------------------------------------------------------------

                return isWaitingReport(
                    quest
                );

            }
        );

    }


    // =========================================================================
    // 任務顏色
    // =========================================================================

    function questColor(
        win,
        quest
    ) {

        // ---------------------------------------------------------------------
        // 完成 = 綠色
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
    // 任務分類前綴
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
    // 任務資料簽名
    //
    // 用來判斷任務是否真的改變。
    // 避免每一幀重新繪製整個視窗。
    // =========================================================================

    function questSignature(
        list
    ) {

        if (
            !Array.isArray(list)
        ) {

            return "";

        }


        return list
            .map(
                quest => {

                    if (
                        !quest
                    ) {

                        return "";

                    }


                    return [

                        quest.id,

                        quest.name,

                        quest.status,

                        quest.progress,

                        quest.amount,

                        quest.tracked,

                        quest.objective,

                        quest.reportText,

                        quest.reported,

                        quest.needReport

                    ].join("|");

                }
            )
            .join("||");

    }


    // =========================================================================
    // Window_QuestTracker
    // =========================================================================

    class Window_QuestTracker
        extends Window_Base {

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
        // Refresh
        // =====================================================================

        refresh() {

            this.contents.clear();


            const quests =
                getTrackedQuests();


            // -----------------------------------------------------------------
            // 沒有任務
            // -----------------------------------------------------------------

            if (
                quests.length ===
                0
            ) {

                this._questSignature =
                    "";

                this.hide();

                return;

            }


            // -----------------------------------------------------------------
            // 顯示
            // -----------------------------------------------------------------

            this.show();


            this._questSignature =
                questSignature(
                    quests
                );


            let y =
                0;


            const fs =
                TRACKER_FONT_SIZE;


            // =================================================================
            // 目前位置
            // =================================================================

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
                fs;


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.drawText(
                `目前位置：${locationName}`,
                8,
                y,
                this.contentsWidth() - 16,
                30,
                "left"
            );


            y +=
                38;


            // =================================================================
            // 任務標題
            // =================================================================

            this.contents.fontSize =
                fs + 2;


            this.drawText(
                "任務",
                8,
                y,
                this.contentsWidth() - 16,
                32,
                "left"
            );


            y +=
                36;


            // =================================================================
            // 任務內容
            // =================================================================

            for (
                const quest of quests
            ) {

                if (
                    !quest
                ) {

                    continue;

                }


                // -------------------------------------------------------------
                // 任務名稱
                // -------------------------------------------------------------

                this.contents.fontSize =
                    fs;


                questColor(
                    this,
                    quest
                );


                this.drawText(
                    questPrefix(quest) +
                    String(
                        quest.name ||
                        ""
                    ),
                    8,
                    y,
                    this.contentsWidth() - 16,
                    30,
                    "left"
                );


                y +=
                    30;


                // -------------------------------------------------------------
                // 目標與進度
                // -------------------------------------------------------------

                this.contents.fontSize =
                    Math.max(
                        14,
                        fs - 2
                    );


                this.changeTextColor(
                    ColorManager.normalColor()
                );


                const progressText =
                    `${Number(
                        quest.progress || 0
                    )} / ${Number(
                        quest.amount || 0
                    )}`;


                const progressWidth =
                    100;


                const objectiveWidth =
                    Math.max(
                        80,
                        this.contentsWidth() -
                        progressWidth -
                        20
                    );


                this.drawText(
                    String(
                        quest.objective ||
                        ""
                    ),
                    8,
                    y,
                    objectiveWidth,
                    28,
                    "left"
                );


                this.drawText(
                    progressText,
                    this.contentsWidth() -
                    progressWidth,
                    y,
                    progressWidth,
                    28,
                    "right"
                );


                y +=
                    30;


                // -------------------------------------------------------------
                // 等待回報
                // -------------------------------------------------------------

                if (
                    isWaitingReport(
                        quest
                    )
                ) {

                    this.changeTextColor(
                        ColorManager.textColor(
                            COMPLETE_COLOR
                        )
                    );


                    this.contents.fontSize =
                        Math.max(
                            13,
                            fs - 3
                        );


                    this.drawText(
                        String(
                            quest.reportText ||
                            "任務完成，請回報。"
                        ),
                        8,
                        y,
                        this.contentsWidth() - 16,
                        26,
                        "left"
                    );


                    y +=
                        28;

                }


                y +=
                    5;


                if (
                    y >
                    this.contentsHeight() - 25
                ) {

                    break;

                }

            }


            this.resetTextColor();

        }

    }


    // =========================================================================
    // Window_QuestMessage
    //
    // 任務完成提示視窗
    //
    // ★ 新位置：
    //    任務追蹤器右側
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
        // 顯示訊息
        // =====================================================================

        showMessage(
            title,
            name,
            duration = 180
        ) {

            this._title =
                String(
                    title ||
                    ""
                );


            this._name =
                String(
                    name ||
                    ""
                );


            this._timer =
                Number(
                    duration ||
                    180
                );


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


            if (
                this._timer >
                0
            ) {

                this._timer--;

            }


            if (
                this._timer <=
                0
            ) {

                this.hide();

            }

        }


        // =====================================================================
        // Refresh
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
                10,
                4,
                this.contentsWidth() - 20,
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
                10,
                46,
                this.contentsWidth() - 20,
                34,
                "center"
            );


            this.resetTextColor();

        }

    }


    // =========================================================================
    // Scene_Map：建立所有 Quest 視窗
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


            this.refreshQuestTracker();

        };


    // =========================================================================
    // 建立任務追蹤器
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
                        220,
                        Graphics.boxWidth -
                        TRACKER_X -
                        15
                    )
                );


            const height =
                Math.min(
                    TRACKER_HEIGHT,
                    Math.max(
                        120,
                        Graphics.boxHeight -
                        TRACKER_Y -
                        15
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
    // 建立任務完成提示
    //
    // ★★★ 位置固定在任務追蹤器右側 ★★★
    // =========================================================================

    Scene_Map.prototype.createQuestMessageWindow =
        function() {

            if (
                this._questMessageWindow
            ) {

                return;

            }


            const tracker =
                this._questTracker;


            const gap =
                15;


            const margin =
                15;


            const trackerX =
                tracker
                    ? tracker.x
                    : TRACKER_X;


            const trackerY =
                tracker
                    ? tracker.y
                    : TRACKER_Y;


            const trackerWidth =
                tracker
                    ? tracker.width
                    : TRACKER_WIDTH;


            // -------------------------------------------------------------
            // 任務視窗右側
            // -------------------------------------------------------------

            let x =
                trackerX +
                trackerWidth +
                gap;


            let width =
                Math.min(
                    500,
                    Graphics.boxWidth -
                    x -
                    margin
                );


            // -------------------------------------------------------------
            // 如果右側空間太小：
            //
            // 仍然放右側，不移到下面。
            // -------------------------------------------------------------

            if (
                width <
                220
            ) {

                width =
                    Math.min(
                        300,
                        Math.max(
                            180,
                            Graphics.boxWidth -
                            margin * 2
                        )
                    );


                x =
                    Math.max(
                        margin,
                        Graphics.boxWidth -
                        width -
                        margin
                    );

            }


            const height =
                120;


            const rect =
                new Rectangle(
                    x,
                    trackerY,
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
    // 更新 HUD 位置
    //
    // ★ 任務完成提示跟著任務追蹤器
    // =========================================================================

    Scene_Map.prototype.updateTopHudLayout =
        function() {

            if (
                !this._questTracker
            ) {

                return;

            }


            // -----------------------------------------------------------------
            // 任務追蹤器
            // -----------------------------------------------------------------

            this._questTracker.x =
                TRACKER_X;


            this._questTracker.y =
                TRACKER_Y;


            const width =
                Math.min(
                    TRACKER_WIDTH,
                    Math.max(
                        220,
                        Graphics.boxWidth -
                        TRACKER_X -
                        15
                    )
                );


            const height =
                Math.min(
                    TRACKER_HEIGHT,
                    Math.max(
                        120,
                        Graphics.boxHeight -
                        TRACKER_Y -
                        15
                    )
                );


            if (
                this._questTracker.width !==
                width ||
                this._questTracker.height !==
                height
            ) {

                this._questTracker.width =
                    width;


                this._questTracker.height =
                    height;


                this._questTracker.createContents();

            }


            // -----------------------------------------------------------------
            // ★ 任務完成提示視窗
            //
            // 固定在任務追蹤器右側
            // -----------------------------------------------------------------

            if (
                this._questMessageWindow
            ) {

                const gap =
                    15;


                const margin =
                    15;


                const x =
                    this._questTracker.x +
                    this._questTracker.width +
                    gap;


                let messageWidth =
                    Math.min(
                        500,
                        Graphics.boxWidth -
                        x -
                        margin
                    );


                let messageX =
                    x;


                // -------------------------------------------------------------
                // 右側空間不足
                // -------------------------------------------------------------

                if (
                    messageWidth <
                    220
                ) {

                    messageWidth =
                        Math.min(
                            300,
                            Math.max(
                                180,
                                Graphics.boxWidth -
                                margin * 2
                            )
                        );


                    messageX =
                        Math.max(
                            margin,
                            Graphics.boxWidth -
                            messageWidth -
                            margin
                        );

                }


                const changed =
                    this._questMessageWindow.x !==
                        messageX ||

                    this._questMessageWindow.y !==
                        this._questTracker.y ||

                    this._questMessageWindow.width !==
                        messageWidth;


                this._questMessageWindow.x =
                    messageX;


                this._questMessageWindow.y =
                    this._questTracker.y;


                if (
                    changed
                ) {

                    this._questMessageWindow.width =
                        messageWidth;


                    this._questMessageWindow.height =
                        120;


                    this._questMessageWindow.createContents();


                    this._questMessageWindow.refresh();

                }

            }

        };


    // =========================================================================
    // 刷新任務追蹤器
    // =========================================================================

    Scene_Map.prototype.refreshQuestTracker =
        function() {

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


            this.updateTopHudLayout();


            const quests =
                getTrackedQuests();


            const signature =
                questSignature(
                    quests
                );


            // -----------------------------------------------------------------
            // ★ 任務資料改變才重繪
            // -----------------------------------------------------------------

            if (
                this._questTracker._questSignature !==
                signature
            ) {

                this._questTracker.refresh();

            }


            // -----------------------------------------------------------------
            // 沒有任務直接隱藏
            // -----------------------------------------------------------------

            if (
                quests.length ===
                0
            ) {

                this._questTracker.hide();

            } else {

                this._questTracker.show();

            }

        };


    // =========================================================================
    // Scene_Map Update
    //
    // ★ 不再每幀 refresh()
    //
    // 只比較任務 Signature。
    // =========================================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;


    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(
                this
            );


            if (
                !this._questTracker
            ) {

                return;

            }


            const quests =
                getTrackedQuests();


            const signature =
                questSignature(
                    quests
                );


            // -----------------------------------------------------------------
            // 任務狀態有變化
            // -----------------------------------------------------------------

            if (
                signature !==
                this._questTracker._questSignature
            ) {

                this._questTracker.refresh();

            }


            // -----------------------------------------------------------------
            // 任務為 0
            // -----------------------------------------------------------------

            if (
                quests.length ===
                0
            ) {

                this._questTracker.hide();

            } else {

                this._questTracker.show();

            }

        };


    // =========================================================================
    // 顯示任務完成 / 開始提示
    //
    // Core v1.5.1 使用：
    //
    // showQuestMessage(
    //     "任務完成！",
    //     quest.name
    // )
    //
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


            // -------------------------------------------------------------
            // 每次顯示前重新計算右側位置
            // -------------------------------------------------------------

            this.updateTopHudLayout();


            if (
                this._questMessageWindow
            ) {

                this._questMessageWindow.showMessage(
                    title,
                    name,
                    180
                );

            }

        };


    // =========================================================================
    // Window_QuestList
    // =========================================================================

    class Window_QuestList
        extends Window_Selectable {

        initialize(
            rect
        ) {

            super.initialize(
                rect
            );


            this.refresh();


            this.select(
                this.maxItems() > 0
                    ? 0
                    : -1
            );

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


            if (
                Array.isArray(
                    $gameSystem._quests
                )
            ) {

                return $gameSystem._quests.length;

            }


            return 0;

        }


        // =====================================================================
        // 取得任務
        // =====================================================================

        item(
            index = this.index()
        ) {

            if (
                !$gameSystem ||
                !Array.isArray(
                    $gameSystem._quests
                )
            ) {

                return null;

            }


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
        // Refresh
        // =====================================================================

        refresh() {

            if (
                $gameSystem &&
                typeof $gameSystem.initQuestSystem ===
                "function"
            ) {

                $gameSystem.initQuestSystem();

            }


            this.createContents();


            this.drawAllItems();

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
                90;


            questColor(
                this,
                quest
            );


            this.contents.fontSize =
                20;


            this.drawText(
                questPrefix(quest) +
                String(
                    quest.name ||
                    ""
                ),
                rect.x,
                rect.y,
                rect.width -
                progressWidth,
                rect.height,
                "left"
            );


            this.changeTextColor(
                ColorManager.normalColor()
            );


            this.contents.fontSize =
                18;


            this.drawText(
                `${Number(
                    quest.progress ||
                    0
                )} / ${Number(
                    quest.amount ||
                    0
                )}`,
                rect.x,
                rect.y,
                rect.width,
                rect.height,
                "right"
            );

        }


        // =====================================================================
        // Help
        // =====================================================================

        updateHelp() {

            if (
                !this._helpWindow
            ) {

                return;

            }


            const quest =
                this.item();


            this._helpWindow.setText(
                quest
                    ? String(
                        quest.description ||
                        quest.objective ||
                        ""
                    )
                    : ""
            );

        }

    }


    // =========================================================================
    // Window_QuestDetail
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
                quest ||
                null;


            this.refresh();

        }


        // =====================================================================
        // 換行文字
        // =====================================================================

        drawWrappedText(
            text,
            x,
            y,
            width,
            lineHeight = 30
        ) {

            const value =
                String(
                    text ||
                    ""
                );


            const chars =
                value.split(
                    ""
                );


            let line =
                "";


            let yy =
                y;


            for (
                const ch of chars
            ) {

                const test =
                    line +
                    ch;


                if (
                    this.textWidth(test) >
                    width &&
                    line.length >
                    0
                ) {

                    this.drawText(
                        line,
                        x,
                        yy,
                        width,
                        lineHeight,
                        "left"
                    );


                    yy +=
                        lineHeight;


                    line =
                        ch;

                } else {

                    line =
                        test;

                }

            }


            if (
                line.length >
                0
            ) {

                this.drawText(
                    line,
                    x,
                    yy,
                    width,
                    lineHeight,
                    "left"
                );


                yy +=
                    lineHeight;

            }


            return yy;

        }


        // =====================================================================
        // Refresh
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


            const width =
                this.contentsWidth() -
                20;


            let y =
                0;


            // -----------------------------------------------------------------
            // 任務名稱
            // -----------------------------------------------------------------

            this.contents.fontSize =
                26;


            questColor(
                this,
                quest
            );


            this.drawText(
                questPrefix(quest) +
                String(
                    quest.name ||
                    ""
                ),
                0,
                y,
                this.contentsWidth(),
                38,
                "left"
            );


            y +=
                48;


            // -----------------------------------------------------------------
            // 任務目標
            // -----------------------------------------------------------------

            this.contents.fontSize =
                18;


            this.changeTextColor(
                ColorManager.systemColor()
            );


            this.drawText(
                "任務目標",
                0,
                y,
                this.contentsWidth(),
                30,
                "left"
            );


            y +=
                34;


            this.changeTextColor(
                ColorManager.normalColor()
            );


            y =
                this.drawWrappedText(
                    quest.objective ||
                    "",
                    10,
                    y,
                    width,
                    30
                );


            y +=
                15;


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
                30,
                "left"
            );


            y +=
                34;


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
                `${Number(
                    quest.progress ||
                    0
                )} / ${Number(
                    quest.amount ||
                    0
                )}`,
                0,
                y,
                this.contentsWidth(),
                40,
                "center"
            );


            y +=
                52;


            // -----------------------------------------------------------------
            // 任務完成
            // -----------------------------------------------------------------

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


                y +=
                    42;


                // -------------------------------------------------------------
                // 等待回報
                // -------------------------------------------------------------

                if (
                    isWaitingReport(
                        quest
                    )
                ) {

                    this.contents.fontSize =
                        20;


                    this.changeTextColor(
                        ColorManager.textColor(
                            COMPLETE_COLOR
                        )
                    );


                    y =
                        this.drawWrappedText(
                            quest.reportText ||
                            "任務完成，請回報村長。",
                            10,
                            y,
                            width,
                            30
                        );

                }

            }


            this.resetTextColor();

        }

    }


    // =========================================================================
    // Scene_QuestDetail
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
                        Graphics.boxWidth -
                        40
                    )
                );


            const height =
                Math.min(
                    WINDOW_HEIGHT,
                    Math.max(
                        220,
                        Graphics.boxHeight -
                        40
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


            this._detailWindow =
                new Window_QuestDetail(
                    new Rectangle(
                        x,
                        y,
                        width,
                        height
                    )
                );


            this._detailWindow.setQuest(
                this._quest
            );


            this.addWindow(
                this._detailWindow
            );

        }

    }


    // =========================================================================
    // Scene_Quest
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
                        Graphics.boxWidth -
                        40
                    )
                );


            const height =
                Math.min(
                    WINDOW_HEIGHT,
                    Math.max(
                        220,
                        Graphics.boxHeight -
                        40
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
            // Enter
            // -------------------------------------------------------------

            this._questList.setHandler(
                "ok",
                this.onQuestOk.bind(
                    this
                )
            );


            // -------------------------------------------------------------
            // ESC
            // -------------------------------------------------------------

            this._questList.setHandler(
                "cancel",
                this.popScene.bind(
                    this
                )
            );


            this._questList.activate();

        }


        // =====================================================================
        // 選擇任務
        // =====================================================================

        onQuestOk() {

            const quest =
                this._questList.item();


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

    }


    // =========================================================================
    // Plugin Command
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "OpenQuestScene",
        () => {

            SceneManager.push(
                Scene_Quest
            );

        }
    );


    // =========================================================================
    // 對外公開
    // =========================================================================

    window.QuestSystemMZ_UI = {

        version:
            VERSION,

        Window_QuestTracker:
            Window_QuestTracker,

        Window_QuestMessage:
            Window_QuestMessage,

        Window_QuestList:
            Window_QuestList,

        Window_QuestDetail:
            Window_QuestDetail,

        Scene_Quest:
            Scene_Quest,

        Scene_QuestDetail:
            Scene_QuestDetail,

        isWaitingReport:
            isWaitingReport,

        trackedQuests:
            getTrackedQuests

    };


    // =========================================================================
    // 完成載入
    // =========================================================================

    console.log(
        `QuestSystem_MZ_UI v${VERSION} loaded.`
    );

})();