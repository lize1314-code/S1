/*:
 * @target MZ
 * @plugindesc v1.3.0 小地圖系統：玩家、事件、手機自適應、任務並排、指定地圖隱藏
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * MiniMap_MZ v1.3.0
 * ============================================================================
 *
 * 功能：
 *
 * 1. 顯示目前地圖的小地圖
 * 2. 玩家顯示藍色圓點
 * 3. 指定事件顯示黃色圓點
 * 4. 玩家移動時同步更新
 * 5. 小地圖固定右上角
 * 6. 自動避開右上角 MZ 選單
 * 7. 支援 1280 × 720
 * 8. 支援手機橫向
 * 9. 地圖切換後自動更新
 * 10. 可指定地圖隱藏小地圖
 * 11. 與 QuestSystem_MZ 任務視窗並排
 *
 * ============================================================================
 *
 * 事件顯示方式：
 *
 * 在事件的「備註」加入：
 *
 * <MiniMap>
 *
 * 該事件就會顯示黃色標記。
 *
 * ============================================================================
 *
 * 隱藏小地圖：
 *
 * 插件參數：
 *
 * 「隱藏小地圖的地圖ID」
 *
 * 例如：
 *
 * 28
 *
 * 多張地圖：
 *
 * 28,29,30
 *
 * ============================================================================
 */

/*:
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
 * @text 小地圖右側距離
 * @type number
 * @min 0
 * @default 20
 *
 * @param Map Top
 * @text 小地圖上方距離
 * @type number
 * @min 0
 * @default 75
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
 * @default 220
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
 *
 * @param Hidden Map IDs
 * @text 隱藏小地圖的地圖ID
 * @type string
 * @default 28
 * @desc 指定地圖時隱藏小地圖。多個地圖請用逗號，例如：28,29,30
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "MiniMap_MZ";

    // =========================================================================
    // 插件參數
    // =========================================================================

    const params = PluginManager.parameters(PLUGIN_NAME);

    const MAP_WIDTH = Number(params["Map Width"] || 300);
    const MAP_HEIGHT = Number(params["Map Height"] || 200);
    const MAP_MARGIN = Number(params["Map Margin"] || 20);
    const MAP_TOP = Number(params["Map Top"] || 75);
    const BORDER_WIDTH = Number(params["Border Width"] || 3);
    const BACKGROUND_OPACITY = Number(
        params["Background Opacity"] || 220
    );
    const PLAYER_SIZE = Number(params["Player Size"] || 8);
    const EVENT_SIZE = Number(params["Event Size"] || 6);
    const UPDATE_RATE = Number(params["Update Rate"] || 10);

    const SHOW_EVENTS =
        String(params["Show Events"] || "true") === "true";

    const SHOW_PLAYER =
        String(params["Show Player"] || "true") === "true";

    // =========================================================================
    // 隱藏小地圖的地圖 ID
    // =========================================================================

    const HIDDEN_MAP_IDS = String(
        params["Hidden Map IDs"] || "28"
    )
        .split(",")
        .map(id => Number(id.trim()))
        .filter(id => Number.isFinite(id) && id > 0);

    function isMiniMapHidden() {
        if (!$gameMap) {
            return false;
        }

        return HIDDEN_MAP_IDS.includes($gameMap.mapId());
    }

    // =========================================================================
    // 小地圖視窗
    // =========================================================================

    class Window_MiniMap extends Window_Base {

        initialize(rect) {
            super.initialize(rect);

            this._lastMapId = 0;
            this._lastPlayerX = -1;
            this._lastPlayerY = -1;
            this._frameCounter = 0;

            this.opacity = 255;
            this.backOpacity = 0;

            this.refresh();
        }

        // =====================================================================
        // 更新
        // =====================================================================

        update() {
            super.update();

            if (isMiniMapHidden()) {
                return;
            }

            this._frameCounter++;

            if (this._frameCounter < UPDATE_RATE) {
                return;
            }

            this._frameCounter = 0;

            if (!$gameMap || !$gamePlayer) {
                return;
            }

            const mapId = $gameMap.mapId();
            const playerX = $gamePlayer.x;
            const playerY = $gamePlayer.y;

            if (mapId !== this._lastMapId) {
                this._lastMapId = mapId;
                this._lastPlayerX = playerX;
                this._lastPlayerY = playerY;

                this.refresh();
                return;
            }

            if (
                playerX !== this._lastPlayerX ||
                playerY !== this._lastPlayerY
            ) {
                this._lastPlayerX = playerX;
                this._lastPlayerY = playerY;

                this.refresh();
            }
        }

        // =====================================================================
        // 重新繪製
        // =====================================================================

        refresh() {
            this.contents.clear();

            if (!$gameMap || !$dataMap) {
                return;
            }

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
        // 地圖縮放
        // =====================================================================

        mapScale() {
            const mapWidth = $gameMap.width();
            const mapHeight = $gameMap.height();

            if (mapWidth <= 0 || mapHeight <= 0) {
                return {
                    scaleX: 1,
                    scaleY: 1
                };
            }

            return {
                scaleX: this.contentsWidth() / mapWidth,
                scaleY: this.contentsHeight() / mapHeight
            };
        }

        // =====================================================================
        // 判斷地圖格是否可以通行
        // =====================================================================

        isPassable(x, y) {
            if (!$gameMap) {
                return false;
            }

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
            const mapWidth = $gameMap.width();
            const mapHeight = $gameMap.height();
            const scale = this.mapScale();

            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {

                    const px = Math.floor(
                        x * scale.scaleX
                    );

                    const py = Math.floor(
                        y * scale.scaleY
                    );

                    const pw = Math.ceil(
                        scale.scaleX
                    );

                    const ph = Math.ceil(
                        scale.scaleY
                    );

                    if (this.isPassable(x, y)) {

                        this.contents.paintOpacity = 180;

                        this.contents.fillRect(
                            px,
                            py,
                            pw,
                            ph,
                            "#666666"
                        );

                    } else {

                        this.contents.paintOpacity = 80;

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

            this.contents.paintOpacity = 255;
        }

        // =====================================================================
        // 畫事件
        // =====================================================================

        drawEvents() {
            if (!$gameMap) {
                return;
            }

            const scale = this.mapScale();
            const events = $gameMap.events();

            events.forEach(event => {

                if (!event) {
                    return;
                }

                if (event._erased) {
                    return;
                }

                const eventData = event.event();

                if (!eventData) {
                    return;
                }

                const note = eventData.note || "";

                // 必須有 <MiniMap>
                if (!/<MiniMap>/i.test(note)) {
                    return;
                }

                const px = Math.floor(
                    (event.x + 0.5) *
                    scale.scaleX
                );

                const py = Math.floor(
                    (event.y + 0.5) *
                    scale.scaleY
                );

                this.drawCircle(
                    px,
                    py,
                    EVENT_SIZE,
                    "#ffff00"
                );
            });
        }

        // =====================================================================
        // 畫玩家
        // =====================================================================

        drawPlayer() {
            if (!$gamePlayer) {
                return;
            }

            const scale = this.mapScale();

            const px = Math.floor(
                ($gamePlayer.x + 0.5) *
                scale.scaleX
            );

            const py = Math.floor(
                ($gamePlayer.y + 0.5) *
                scale.scaleY
            );

            // 白色外框
            this.drawCircle(
                px,
                py,
                PLAYER_SIZE + 2,
                "#ffffff"
            );

            // 藍色玩家點
            this.drawCircle(
                px,
                py,
                PLAYER_SIZE,
                "#00aaff"
            );
        }

        // =====================================================================
        // 畫圓
        // =====================================================================

        drawCircle(x, y, radius, color) {
            const context = this.contents.context;

            context.save();

            context.fillStyle = color;

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
                this.contents._baseTexture &&
                this.contents._baseTexture.update
            ) {
                this.contents._baseTexture.update();
            }
        }

        // =====================================================================
        // 畫邊框
        // =====================================================================

        drawBorder() {
            const width = this.contentsWidth();
            const height = this.contentsHeight();

            this.contents.paintOpacity = 255;

            // 上
            this.contents.fillRect(
                0,
                0,
                width,
                BORDER_WIDTH,
                "#ffffff"
            );

            // 下
            this.contents.fillRect(
                0,
                height - BORDER_WIDTH,
                width,
                BORDER_WIDTH,
                "#ffffff"
            );

            // 左
            this.contents.fillRect(
                0,
                0,
                BORDER_WIDTH,
                height,
                "#ffffff"
            );

            // 右
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

    Scene_Map.prototype.createAllWindows = function() {

        _Scene_Map_createAllWindows.call(this);

        this.createMiniMap();
    };

    // =========================================================================
    // 建立小地圖
    // =========================================================================

    Scene_Map.prototype.createMiniMap = function() {

        const width = Math.min(
            MAP_WIDTH,
            Graphics.boxWidth - MAP_MARGIN * 2
        );

        const height = Math.min(
            MAP_HEIGHT,
            Graphics.boxHeight - MAP_TOP - MAP_MARGIN
        );

        let x;
        let y;

        // -------------------------------------------------------------
        // 如果有 QuestSystem_MZ 任務視窗
        // 就讓小地圖與任務視窗並排
        // -------------------------------------------------------------

        if (this._questTracker) {

            x =
                this._questTracker.x +
                this._questTracker.width +
                15;

            y =
                this._questTracker.y;

        } else {

            x =
                Graphics.boxWidth -
                width -
                MAP_MARGIN;

            y = MAP_TOP;
        }

        const rect = new Rectangle(
            x,
            y,
            width,
            height
        );

        this._miniMap =
            new Window_MiniMap(rect);

        this._miniMap.z = 11;

        // -------------------------------------------------------------
        // ★ 指定地圖自動隱藏
        // -------------------------------------------------------------

        this._miniMap.visible =
            !isMiniMapHidden();

        this.addWindow(this._miniMap);

        // 如果有任務插件，交給任務插件重新排版
        if (this.updateTopHudLayout) {
            this.updateTopHudLayout();
        }
    };

    // =========================================================================
    // Scene_Map 更新
    // =========================================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;

    Scene_Map.prototype.update = function() {

        _Scene_Map_update.call(this);

        if (!this._miniMap) {
            return;
        }

        // -------------------------------------------------------------
        // ★ 進入隱藏地圖 → 隱藏
        // ★ 離開隱藏地圖 → 自動恢復
        // -------------------------------------------------------------

        const shouldShow =
            !isMiniMapHidden();

        this._miniMap.visible =
            shouldShow;

        if (shouldShow) {
            this._miniMap.update();
        }
    };

    // =========================================================================
    // 重新定位
    // =========================================================================

    Scene_Map.prototype.updateMiniMapPosition =
        function() {

            if (!this._miniMap) {
                return;
            }

            if (
                this.updateTopHudLayout &&
                this._questTracker
            ) {

                this.updateTopHudLayout();

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
    // 視窗大小改變
    // =========================================================================

    window.addEventListener(
        "resize",
        function() {

            if (
                SceneManager._scene instanceof
                Scene_Map
            ) {

                setTimeout(
                    function() {

                        const scene =
                            SceneManager._scene;

                        if (
                            scene &&
                            scene.updateTopHudLayout
                        ) {

                            scene.updateTopHudLayout();

                        } else if (
                            scene &&
                            scene.updateMiniMapPosition
                        ) {

                            scene.updateMiniMapPosition();
                        }

                    },
                    100
                );
            }
        }
    );

    // =========================================================================
    // 手機旋轉
    // =========================================================================

    window.addEventListener(
        "orientationchange",
        function() {

            setTimeout(
                function() {

                    if (
                        SceneManager._scene instanceof
                        Scene_Map
                    ) {

                        const scene =
                            SceneManager._scene;

                        if (
                            scene &&
                            scene.updateTopHudLayout
                        ) {

                            scene.updateTopHudLayout();

                        } else if (
                            scene &&
                            scene.updateMiniMapPosition
                        ) {

                            scene.updateMiniMapPosition();
                        }

                        if (
                            scene &&
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