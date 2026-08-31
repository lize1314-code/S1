/*:
 * @target MZ
 * @plugindesc v1.0 修正任務追蹤與小地圖位置重疊、遊戲視窗縮放後位置沒有更新
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * UI_MapQuestLayout_Fix v1.0
 * ============================================================================
 *
 * 用途：
 *
 * 1. 修正 MiniMap_MZ 小地圖位置沒有隨遊戲畫面正確更新的問題。
 * 2. 修正小地圖與任務追蹤視窗重疊。
 * 3. 任務追蹤固定在左上方。
 * 4. 小地圖固定在右上方。
 * 5. 遊戲視窗縮放時自動重新計算位置。
 * 6. 支援 Playtest 視窗尺寸變化。
 * 7. 支援瀏覽器 resize。
 * 8. 支援手機 orientationchange。
 * 9. 不修改 QuestSystem_MZ 原本任務資料與任務邏輯。
 * 10. 不修改 MiniMap_MZ 原本地圖繪製邏輯。
 *
 * ============================================================================
 * ★ 插件順序
 * ============================================================================
 *
 * 請放在以下兩個插件的最下面：
 *
 * MiniMap_MZ
 * QuestSystem_MZ_並排版_v1.3.1
 * UI_MapQuestLayout_Fix
 *
 * ============================================================================
 */

(() => {

    "use strict";


    // =========================================================================
    // 插件名稱
    // =========================================================================

    const PLUGIN_NAME =
        "UI_MapQuestLayout_Fix";


    // =========================================================================
    // 版面設定
    // =========================================================================

    // 左右安全邊距
    const SIDE_MARGIN =
        15;

    // 小地圖距離右側
    const MAP_RIGHT_MARGIN =
        20;

    // 小地圖距離頂部
    const MAP_TOP =
        75;

    // 任務視窗與小地圖之間的距離
    const GAP =
        15;


    // =========================================================================
    // 預設任務視窗尺寸
    // =========================================================================

    const DEFAULT_TRACKER_WIDTH =
        360;

    const DEFAULT_TRACKER_HEIGHT =
        175;


    // =========================================================================
    // 取得目前遊戲實際寬度
    // =========================================================================

    function getScreenWidth() {

        return Number(
            Graphics.width ||
            Graphics.boxWidth ||
            1280
        );

    }


    // =========================================================================
    // 取得目前遊戲實際高度
    // =========================================================================

    function getScreenHeight() {

        return Number(
            Graphics.height ||
            Graphics.boxHeight ||
            720
        );

    }


    // =========================================================================
    // 取得遊戲畫面尺寸
    // =========================================================================

    function getScreenSize() {

        return {

            width:
                getScreenWidth(),

            height:
                getScreenHeight()

        };

    }


    // =========================================================================
    // 修正 MiniMap
    // =========================================================================

    function updateMiniMapLayout(scene) {

        if (!scene) {
            return;
        }


        if (!scene._miniMap) {
            return;
        }


        const miniMap =
            scene._miniMap;


        const mapWidth =
            Number(
                miniMap.width ||
                0
            );


        const mapHeight =
            Number(
                miniMap.height ||
                0
            );


        if (
            mapWidth <= 0 ||
            mapHeight <= 0
        ) {
            return;
        }


        const screen =
            getScreenSize();


        // ================================================================
        // 計算右上角位置
        // ================================================================

        let x =
            screen.width -
            mapWidth -
            MAP_RIGHT_MARGIN;


        let y =
            MAP_TOP;


        // ================================================================
        // 防止超出畫面左側
        // ================================================================

        if (
            x <
            SIDE_MARGIN
        ) {

            x =
                SIDE_MARGIN;

        }


        // ================================================================
        // 防止超出畫面下方
        // ================================================================

        const maxY =
            screen.height -
            mapHeight -
            SIDE_MARGIN;


        if (
            y >
            maxY
        ) {

            y =
                Math.max(
                    SIDE_MARGIN,
                    maxY
                );

        }


        // ================================================================
        // 套用位置
        // ================================================================

        const newX =
            Math.floor(x);

        const newY =
            Math.floor(y);


        if (
            miniMap.x !==
            newX
        ) {

            miniMap.x =
                newX;

        }


        if (
            miniMap.y !==
            newY
        ) {

            miniMap.y =
                newY;

        }


        // ================================================================
        // 小地圖層級
        // ================================================================

        miniMap.z =
            5;

    }


    // =========================================================================
    // 修正任務追蹤視窗
    // =========================================================================

    function updateQuestTrackerLayout(scene) {

        if (!scene) {
            return;
        }


        if (!scene._questTracker) {
            return;
        }


        const tracker =
            scene._questTracker;


        const screen =
            getScreenSize();


        // ================================================================
        // 取得小地圖寬度
        // ================================================================

        let mapWidth =
            300;


        if (
            scene._miniMap
        ) {

            mapWidth =
                Number(
                    scene._miniMap.width ||
                    300
                );

        }


        // ================================================================
        // 計算任務視窗可使用的最大寬度
        //
        // 左側：
        //
        // 15 px
        // + 任務視窗
        // + 15 px
        // + 小地圖
        // + 20 px
        //
        // 確保兩個視窗不重疊
        // ================================================================

        const availableWidth =
            screen.width -
            SIDE_MARGIN -
            mapWidth -
            GAP -
            MAP_RIGHT_MARGIN;


        // ================================================================
        // 取得目前任務視窗寬度
        // ================================================================

        let trackerWidth =
            Number(
                tracker.width ||
                DEFAULT_TRACKER_WIDTH
            );


        // ================================================================
        // 限制最大寬度
        // ================================================================

        trackerWidth =
            Math.min(
                trackerWidth,
                availableWidth
            );


        // ================================================================
        // 最小寬度
        // ================================================================

        trackerWidth =
            Math.max(
                220,
                trackerWidth
            );


        // ================================================================
        // 防止極窄畫面造成超出
        // ================================================================

        trackerWidth =
            Math.min(
                trackerWidth,
                Math.max(
                    220,
                    screen.width -
                    SIDE_MARGIN * 2
                )
            );


        // ================================================================
        // 任務視窗高度
        // ================================================================

        let trackerHeight =
            Number(
                tracker.height ||
                DEFAULT_TRACKER_HEIGHT
            );


        trackerHeight =
            Math.min(
                trackerHeight,
                Math.max(
                    120,
                    screen.height -
                    SIDE_MARGIN * 2
                )
            );


        // ================================================================
        // 左上角位置
        // ================================================================

        const trackerX =
            SIDE_MARGIN;


        const trackerY =
            SIDE_MARGIN;


        // ================================================================
        // 更新尺寸
        // ================================================================

        const finalWidth =
            Math.floor(
                trackerWidth
            );


        const finalHeight =
            Math.floor(
                trackerHeight
            );


        let sizeChanged =
            false;


        if (
            tracker.width !==
            finalWidth
        ) {

            tracker.width =
                finalWidth;

            sizeChanged =
                true;

        }


        if (
            tracker.height !==
            finalHeight
        ) {

            tracker.height =
                finalHeight;

            sizeChanged =
                true;

        }


        // ================================================================
        // 更新位置
        // ================================================================

        tracker.x =
            Math.floor(
                trackerX
            );


        tracker.y =
            Math.floor(
                trackerY
            );


        // ================================================================
        // 如果尺寸改變，重新建立 contents
        // ================================================================

        if (sizeChanged) {

            if (
                typeof tracker.createContents ===
                "function"
            ) {

                tracker.createContents();

            }


            if (
                typeof tracker.refresh ===
                "function"
            ) {

                tracker.refresh();

            }

        }


        // ================================================================
        // 任務視窗層級
        // ================================================================

        tracker.z =
            10;

    }


    // =========================================================================
    // 統一更新 UI 位置
    // =========================================================================

    function updateLayout(scene) {

        if (!scene) {
            return;
        }


        if (
            !(scene instanceof Scene_Map)
        ) {
            return;
        }


        updateMiniMapLayout(
            scene
        );


        updateQuestTrackerLayout(
            scene
        );

    }


    // =========================================================================
    // Scene_Map 建立所有視窗
    // =========================================================================

    const _Scene_Map_createAllWindows =
        Scene_Map.prototype.createAllWindows;


    Scene_Map.prototype.createAllWindows =
        function() {

            _Scene_Map_createAllWindows.call(
                this
            );


            // -------------------------------------------------------------
            // 建立完成後立即修正一次
            // -------------------------------------------------------------

            updateLayout(
                this
            );

        };


    // =========================================================================
    // Scene_Map 更新
    //
    // ★ 重要
    //
    // 這裡故意放在原本 Scene_Map.update 後面。
    //
    // 因為：
    //
    // MiniMap_MZ
    //        ↓
    // QuestSystem_MZ
    //        ↓
    // 本插件最後修正
    //
    // 因此不管前面的插件如何改變位置，
    // 最後都會重新放到正確的位置。
    // =========================================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;


    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(
                this
            );


            updateLayout(
                this
            );

        };


    // =========================================================================
    // Resize
    //
    // 遊戲視窗大小改變時重新計算
    // =========================================================================

    window.addEventListener(
        "resize",
        function() {

            setTimeout(
                function() {

                    const scene =
                        SceneManager._scene;


                    if (
                        scene instanceof Scene_Map
                    ) {

                        updateLayout(
                            scene
                        );

                    }

                },
                100
            );

        }
    );


    // =========================================================================
    // Orientation Change
    //
    // 手機橫向 / 直向切換
    // =========================================================================

    window.addEventListener(
        "orientationchange",
        function() {

            setTimeout(
                function() {

                    const scene =
                        SceneManager._scene;


                    if (
                        scene instanceof Scene_Map
                    ) {

                        updateLayout(
                            scene
                        );


                        // -------------------------------------------------
                        // 畫面旋轉後重新刷新小地圖
                        // -------------------------------------------------

                        if (
                            scene._miniMap &&
                            typeof scene._miniMap.refresh ===
                            "function"
                        ) {

                            scene._miniMap.refresh();

                        }

                    }

                },
                300
            );

        }
    );


    // =========================================================================
    // Graphics resize 保險機制
    //
    // 某些 MZ Playtest 情況下：
    //
    // window.resize
    //
    // 不一定與 Graphics 尺寸更新完全同步。
    //
    // 因此每幀仍會檢查。
    // =========================================================================

    let lastWidth =
        0;


    let lastHeight =
        0;


    function checkScreenSizeChanged() {

        const width =
            getScreenWidth();


        const height =
            getScreenHeight();


        if (
            width !==
            lastWidth ||
            height !==
            lastHeight
        ) {

            lastWidth =
                width;


            lastHeight =
                height;


            const scene =
                SceneManager._scene;


            if (
                scene instanceof Scene_Map
            ) {

                updateLayout(
                    scene
                );

            }

        }

    }


    // =========================================================================
    // 在 Scene_Map 更新時監測尺寸
    // =========================================================================

    const _Scene_Map_updateSizeCheck =
        Scene_Map.prototype.update;


    Scene_Map.prototype.update =
        function() {

            _Scene_Map_updateSizeCheck.call(
                this
            );


            checkScreenSizeChanged();

        };


    // =========================================================================
    // 防止 Scene_Map.update 被其他插件覆蓋後，
    // 仍能在場景建立完成時修正。
    // =========================================================================

    const _Scene_Map_start =
        Scene_Map.prototype.start;


    Scene_Map.prototype.start =
        function() {

            _Scene_Map_start.call(
                this
            );


            setTimeout(
                function() {

                    const scene =
                        SceneManager._scene;


                    if (
                        scene instanceof Scene_Map
                    ) {

                        updateLayout(
                            scene
                        );

                    }

                },
                50
            );

        };


    // =========================================================================
    // Debug
    // =========================================================================

    console.log(
        "=================================================="
    );


    console.log(
        PLUGIN_NAME +
        " v1.0 已啟用"
    );


    console.log(
        "MiniMap：右上角固定定位"
    );


    console.log(
        "QuestTracker：左上角固定定位"
    );


    console.log(
        "Resize：自動重新定位"
    );


    console.log(
        "=================================================="
    );


})();