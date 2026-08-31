/*:
 * @target MZ
 * @plugindesc v1.2.2 小地圖系統：玩家、NPC、事件、手機自適應、與任務視窗並排
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * MiniMap_MZ v1.2.2
 * ============================================================================
 *
 * 功能：
 *
 * 1. 顯示目前地圖
 * 2. 玩家藍色標記
 * 3. <MiniMap> 事件黃色標記
 * 4. 玩家移動同步
 * 5. 地圖切換自動更新
 * 6. 電腦 / 手機自適應
 * 7. 與 QuestSystem_MZ 任務視窗自動並排
 *
 * ============================================================================
 *
 * 事件備註：
 *
 * <MiniMap>
 *
 * 就會在小地圖顯示黃色標記。
 *
 * ============================================================================
 *
 * @param Map Width
 * @text 小地圖寬度
 * @type number
 * @min 150
 * @max 600
 * @default 300
 *
 * @param Map Height
 * @text 小地圖高度
 * @type number
 * @min 100
 * @max 400
 * @default 200
 *
 * @param Map Margin
 * @text 小地圖邊距
 * @type number
 * @min 0
 * @default 15
 *
 * @param Map Top
 * @text 小地圖上方位置
 * @type number
 * @min 0
 * @default 15
 *
 * @param Border Width
 * @text 邊框寬度
 * @type number
 * @min 1
 * @max 10
 * @default 3
 *
 * @param Background Opacity
 * @text 背景透明度
 * @type number
 * @min 0
 * @max 255
 * @default 180
 *
 * @param Player Size
 * @text 玩家標記大小
 * @type number
 * @min 2
 * @max 20
 * @default 8
 *
 * @param Event Size
 * @text 事件標記大小
 * @type number
 * @min 2
 * @max 20
 * @default 6
 *
 * @param Update Rate
 * @text 更新速度
 * @type number
 * @min 1
 * @max 60
 * @default 10
 *
 * @param Show Events
 * @text 顯示事件
 * @type boolean
 * @on 顯示
 * @off 隱藏
 * @default true
 *
 * @param Show Player
 * @text 顯示玩家
 * @type boolean
 * @on 顯示
 * @off 隱藏
 * @default true
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "MiniMap_MZ";

    const P =
        PluginManager.parameters(
            PLUGIN_NAME
        );

    const MAP_WIDTH =
        Number(
            P["Map Width"] || 300
        );

    const MAP_HEIGHT =
        Number(
            P["Map Height"] || 200
        );

    const MAP_MARGIN =
        Number(
            P["Map Margin"] || 15
        );

    const MAP_TOP =
        Number(
            P["Map Top"] || 15
        );

    const BORDER_WIDTH =
        Number(
            P["Border Width"] || 3
        );

    const BACKGROUND_OPACITY =
        Number(
            P["Background Opacity"] || 180
        );

    const PLAYER_SIZE =
        Number(
            P["Player Size"] || 8
        );

    const EVENT_SIZE =
        Number(
            P["Event Size"] || 6
        );

    const UPDATE_RATE =
        Number(
            P["Update Rate"] || 10
        );

    const SHOW_EVENTS =
        String(
            P["Show Events"] || "true"
        ) === "true";

    const SHOW_PLAYER =
        String(
            P["Show Player"] || "true"
        ) === "true";

    // =========================================================================
    // 小地圖 Window
    // =========================================================================

    class Window_MiniMap
        extends Window_Base {

        initialize(rect) {

            super.initialize(rect);

            this._lastMapId = -1;
            this._lastPlayerX = -1;
            this._lastPlayerY = -1;
            this._frameCounter = 0;

            this.opacity = 255;
            this.backOpacity = 0;

            this.refresh();
        }

        update() {

            super.update();

            this._frameCounter++;

            if (
                this._frameCounter <
                UPDATE_RATE
            ) {
                return;
            }

            this._frameCounter = 0;

            if (
                !$gameMap ||
                !$gamePlayer
            ) {
                return;
            }

            const mapId =
                $gameMap.mapId();

            const px =
                $gamePlayer.x;

            const py =
                $gamePlayer.y;

            if (
                mapId !==
                this._lastMapId
            ) {

                this._lastMapId =
                    mapId;

                this._lastPlayerX =
                    px;

                this._lastPlayerY =
                    py;

                this.refresh();

                return;
            }

            if (
                px !== this._lastPlayerX ||
                py !== this._lastPlayerY
            ) {

                this._lastPlayerX = px;
                this._lastPlayerY = py;

                this.refresh();
            }
        }

        refresh() {

            this.contents.clear();

            if (!$gameMap) {
                return;
            }

            this.drawBackground();
            this.drawMap();

            if (SHOW_EVENTS) {
                this.drawEvents();
            }

            if (SHOW_PLAYER) {
                this.drawPlayer();
            }

            this.drawBorder();
        }

        // =====================================================================
        // 背景
        // =====================================================================

        drawBackground() {

            this.contents.paintOpacity =
                BACKGROUND_OPACITY;

            this.contents.fillRect(
                0,
                0,
                this.contentsWidth(),
                this.contentsHeight(),
                "#111111"
            );

            this.contents.paintOpacity =
                255;
        }

        // =====================================================================
        // 地圖縮放
        // =====================================================================

        mapScale() {

            const mapWidth =
                $gameMap.width();

            const mapHeight =
                $gameMap.height();

            return {
                scaleX:
                    this.contentsWidth() /
                    Math.max(1, mapWidth),

                scaleY:
                    this.contentsHeight() /
                    Math.max(1, mapHeight)
            };
        }

        // =====================================================================
        // 判斷通行
        // =====================================================================

        isPassable(x, y) {

            if (
                x < 0 ||
                y < 0 ||
                x >= $gameMap.width() ||
                y >= $gameMap.height()
            ) {
                return false;
            }

            return (
                $gameMap.isPassable(x, y, 2) ||
                $gameMap.isPassable(x, y, 4) ||
                $gameMap.isPassable(x, y, 6) ||
                $gameMap.isPassable(x, y, 8)
            );
        }

        // =====================================================================
        // 畫地圖
        // =====================================================================

        drawMap() {

            const scale =
                this.mapScale();

            const mapWidth =
                $gameMap.width();

            const mapHeight =
                $gameMap.height();

            for (
                let y = 0;
                y < mapHeight;
                y++
            ) {

                for (
                    let x = 0;
                    x < mapWidth;
                    x++
                ) {

                    const px =
                        Math.floor(
                            x *
                            scale.scaleX
                        );

                    const py =
                        Math.floor(
                            y *
                            scale.scaleY
                        );

                    const pw =
                        Math.max(
                            1,
                            Math.ceil(
                                scale.scaleX
                            )
                        );

                    const ph =
                        Math.max(
                            1,
                            Math.ceil(
                                scale.scaleY
                            )
                        );

                    if (
                        this.isPassable(
                            x,
                            y
                        )
                    ) {

                        this.contents.paintOpacity =
                            180;

                        this.contents.fillRect(
                            px,
                            py,
                            pw,
                            ph,
                            "#666666"
                        );

                    } else {

                        this.contents.paintOpacity =
                            80;

                        this.contents.fillRect(
                            px,
                            py,
                            pw,
                            ph,
                            "#202020"
                        );
                    }
                }
            }

            this.contents.paintOpacity =
                255;
        }

        // =====================================================================
        // 事件
        // =====================================================================

        drawEvents() {

            const scale =
                this.mapScale();

            for (
                const event of
                $gameMap.events()
            ) {

                if (!event) continue;

                if (event._erased) {
                    continue;
                }

                const data =
                    event.event();

                if (!data) continue;

                const note =
                    data.note || "";

                if (
                    !/<MiniMap>/i.test(
                        note
                    )
                ) {
                    continue;
                }

                const px =
                    Math.floor(
                        (
                            event.x +
                            0.5
                        ) *
                        scale.scaleX
                    );

                const py =
                    Math.floor(
                        (
                            event.y +
                            0.5
                        ) *
                        scale.scaleY
                    );

                this.drawCircle(
                    px,
                    py,
                    EVENT_SIZE,
                    "#ffff00"
                );
            }
        }

        // =====================================================================
        // 玩家
        // =====================================================================

        drawPlayer() {

            if (!$gamePlayer) {
                return;
            }

            const scale =
                this.mapScale();

            const px =
                Math.floor(
                    (
                        $gamePlayer.x +
                        0.5
                    ) *
                    scale.scaleX
                );

            const py =
                Math.floor(
                    (
                        $gamePlayer.y +
                        0.5
                    ) *
                    scale.scaleY
                );

            this.drawCircle(
                px,
                py,
                PLAYER_SIZE + 2,
                "#ffffff"
            );

            this.drawCircle(
                px,
                py,
                PLAYER_SIZE,
                "#00aaff"
            );
        }

        // =====================================================================
        // 圓形
        // =====================================================================

        drawCircle(
            x,
            y,
            radius,
            color
        ) {

            const context =
                this.contents.context;

            context.save();

            context.fillStyle =
                color;

            context.beginPath();

            context.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            context.fill();

            context.restore();

            if (
                this.contents._baseTexture
            ) {
                this.contents
                    ._baseTexture
                    .update();
            }
        }

        // =====================================================================
        // 邊框
        // =====================================================================

        drawBorder() {

            const width =
                this.contentsWidth();

            const height =
                this.contentsHeight();

            this.contents.paintOpacity =
                255;

            this.contents.fillRect(
                0,
                0,
                width,
                BORDER_WIDTH,
                "#ffffff"
            );

            this.contents.fillRect(
                0,
                height - BORDER_WIDTH,
                width,
                BORDER_WIDTH,
                "#ffffff"
            );

            this.contents.fillRect(
                0,
                0,
                BORDER_WIDTH,
                height,
                "#ffffff"
            );

            this.contents.fillRect(
                width - BORDER_WIDTH,
                0,
                BORDER_WIDTH,
                height,
                "#ffffff"
            );
        }
    }

    // =========================================================================
    // Scene_Map 建立小地圖
    // =========================================================================

    const _Scene_Map_createAllWindows =
        Scene_Map.prototype.createAllWindows;

    Scene_Map.prototype.createAllWindows =
        function() {

            _Scene_Map_createAllWindows.call(
                this
            );

            this.createMiniMap();

            if (
                this.updateTopHudLayout
            ) {
                this.updateTopHudLayout();
            }
        };

    // =========================================================================
    // 建立
    // =========================================================================

    Scene_Map.prototype.createMiniMap =
        function() {

            const width =
                Math.min(
                    MAP_WIDTH,
                    Graphics.boxWidth -
                    MAP_MARGIN * 2
                );

            const height =
                Math.min(
                    MAP_HEIGHT,
                    Graphics.boxHeight -
                    MAP_TOP -
                    MAP_MARGIN
                );

            const rect =
                new Rectangle(
                    Graphics.boxWidth -
                    width -
                    MAP_MARGIN,

                    MAP_TOP,

                    width,
                    height
                );

            this._miniMap =
                new Window_MiniMap(
                    rect
                );

            this._miniMap.z = 21;

            this.addWindow(
                this._miniMap
            );

            // ---------------------------------------------------------------
            // ★ 如果 QuestSystem_MZ 存在
            // ★ 立刻交給共同版面系統
            // ---------------------------------------------------------------

            if (
                this.updateTopHudLayout
            ) {
                this.updateTopHudLayout();
            }
        };

    // =========================================================================
    // Scene_Map 更新
    // =========================================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;

    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(
                this
            );

            if (this._miniMap) {

                this._miniMap.update();
            }
        };

    // =========================================================================
    // 舊版相容
    // =========================================================================

    Scene_Map.prototype.updateMiniMapPosition =
        function() {

            if (
                this.updateTopHudLayout
            ) {

                this.updateTopHudLayout();

                return;
            }

            if (!this._miniMap) {
                return;
            }

            const width =
                this._miniMap.width;

            this._miniMap.x =
                Graphics.boxWidth -
                width -
                MAP_MARGIN;

            this._miniMap.y =
                MAP_TOP;
        };

    // =========================================================================
    // 瀏覽器大小改變
    // =========================================================================

    window.addEventListener(
        "resize",
        () => {

            setTimeout(
                () => {

                    const scene =
                        SceneManager._scene;

                    if (
                        scene instanceof
                        Scene_Map
                    ) {

                        if (
                            scene.updateTopHudLayout
                        ) {

                            scene
                                .updateTopHudLayout();
                        }

                        if (
                            scene._miniMap
                        ) {

                            scene._miniMap.refresh();
                        }
                    }

                },
                150
            );
        }
    );

    // =========================================================================
    // 手機旋轉
    // =========================================================================

    window.addEventListener(
        "orientationchange",
        () => {

            setTimeout(
                () => {

                    const scene =
                        SceneManager._scene;

                    if (
                        scene instanceof
                        Scene_Map
                    ) {

                        if (
                            scene.updateTopHudLayout
                        ) {

                            scene
                                .updateTopHudLayout();
                        }

                        if (
                            scene._miniMap
                        ) {

                            scene._miniMap.refresh();
                        }
                    }

                },
                500
            );
        }
    );

})();