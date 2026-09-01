/*:
 * @target MZ
 * @plugindesc v1.0.0 手機虛擬搖桿：支援觸控移動、鍵盤操作與自動適應畫面
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * VirtualJoystick_MZ v1.0.0
 * ============================================================================
 *
 * 功能：
 *
 * 1. 手機左下角顯示虛擬搖桿。
 * 2. 手指拖動搖桿控制 RPG Maker MZ 玩家移動。
 * 3. 支援上下左右與斜向輸入。
 * 4. 電腦鍵盤操作不受影響。
 * 5. 自動依照遊戲畫面大小調整位置。
 * 6. 支援手機橫向 / 直向。
 * 7. 支援觸控。
 * 8. 不需要修改地圖事件。
 * 9. 不需要修改角色設定。
 * 10. 不影響 QuestSystem_MZ。
 * 11. 不影響 MiniMap_MZ。
 *
 * ============================================================================
 *
 * 操作方式：
 *
 * 手指放在圓形搖桿上：
 *
 *        ↑
 *        |
 *    ←   ●   →
 *        |
 *        ↓
 *
 * 手指往哪個方向拖，角色就往哪個方向走。
 *
 * ============================================================================
 *
 * @param Enabled
 * @text 啟用虛擬搖桿
 * @type boolean
 * @on 啟用
 * @off 停用
 * @default true
 *
 * @param Joystick Size
 * @text 搖桿外圈大小
 * @type number
 * @min 80
 * @max 220
 * @default 140
 *
 * @param Knob Size
 * @text 搖桿中心大小
 * @type number
 * @min 30
 * @max 100
 * @default 58
 *
 * @param Left Margin
 * @text 左側距離
 * @type number
 * @min 0
 * @max 200
 * @default 25
 *
 * @param Bottom Margin
 * @text 下方距離
 * @type number
 * @min 0
 * @max 200
 * @default 30
 *
 * @param Opacity
 * @text 搖桿透明度
 * @type number
 * @min 0
 * @max 255
 * @default 150
 *
 * @param Dead Zone
 * @text 搖桿死區
 * @type number
 * @min 0
 * @max 50
 * @default 15
 *
 * @param Direction Threshold
 * @text 方向判定角度
 * @type number
 * @min 5
 * @max 90
 * @default 25
 *
 * @param Move Interval
 * @text 移動間隔
 * @type number
 * @min 1
 * @max 30
 * @default 5
 *
 * @param Show On Desktop
 * @text 電腦也顯示搖桿
 * @type boolean
 * @on 顯示
 * @off 隱藏
 * @default true
 *
 * @param Hide During Events
 * @text 對話時隱藏
 * @type boolean
 * @on 隱藏
 * @off 顯示
 * @default true
 *
 * @param Hide During Menu
 * @text 開啟選單時隱藏
 * @type boolean
 * @on 隱藏
 * @off 顯示
 * @default true
 *
 * @param Background Color
 * @text 搖桿外圈顏色
 * @type string
 * @default rgba(80,80,80,0.65)
 *
 * @param Knob Color
 * @text 搖桿中心顏色
 * @type string
 * @default rgba(220,220,220,0.85)
 *
 * @command ShowJoystick
 * @text 顯示虛擬搖桿
 *
 * @command HideJoystick
 * @text 隱藏虛擬搖桿
 *
 * @command ResetJoystick
 * @text 重設搖桿位置
 */

(() => {

    "use strict";


    // =========================================================================
    // 插件名稱
    // =========================================================================

    const PLUGIN_NAME =
        "VirtualJoystick_MZ";


    // =========================================================================
    // 取得插件參數
    // =========================================================================

    const params =
        PluginManager.parameters(
            PLUGIN_NAME
        );


    const ENABLED =
        String(
            params["Enabled"] || "true"
        ) === "true";


    const JOYSTICK_SIZE =
        Number(
            params["Joystick Size"] || 140
        );


    const KNOB_SIZE =
        Number(
            params["Knob Size"] || 58
        );


    const LEFT_MARGIN =
        Number(
            params["Left Margin"] || 25
        );


    const BOTTOM_MARGIN =
        Number(
            params["Bottom Margin"] || 30
        );


    const OPACITY =
        Number(
            params["Opacity"] || 150
        );


    const DEAD_ZONE =
        Number(
            params["Dead Zone"] || 15
        );


    const DIRECTION_THRESHOLD =
        Number(
            params["Direction Threshold"] || 25
        );


    const MOVE_INTERVAL =
        Number(
            params["Move Interval"] || 5
        );


    const SHOW_ON_DESKTOP =
        String(
            params["Show On Desktop"] || "true"
        ) === "true";


    const HIDE_DURING_EVENTS =
        String(
            params["Hide During Events"] || "true"
        ) === "true";


    const HIDE_DURING_MENU =
        String(
            params["Hide During Menu"] || "true"
        ) === "true";


    const BACKGROUND_COLOR =
        String(
            params["Background Color"] ||
            "rgba(80,80,80,0.65)"
        );


    const KNOB_COLOR =
        String(
            params["Knob Color"] ||
            "rgba(220,220,220,0.85)"
        );


    // =========================================================================
    // 狀態
    // =========================================================================

    let joystickVisible =
        ENABLED;


    let joystickContainer =
        null;


    let joystickBase =
        null;


    let joystickKnob =
        null;


    let activeTouchId =
        null;


    let dragging =
        false;


    let centerX =
        0;


    let centerY =
        0;


    let currentDirection =
        0;


    let moveCounter =
        0;


    let lastScene =
        null;


    // =========================================================================
    // 判斷是否為手機 / 平板
    // =========================================================================

    function isTouchDevice() {

        return (
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0
        );

    }


    // =========================================================================
    // 判斷是否應該顯示
    // =========================================================================

    function shouldShowJoystick() {

        if (!joystickVisible) {
            return false;
        }


        if (
            !SHOW_ON_DESKTOP &&
            !isTouchDevice()
        ) {
            return false;
        }


        const scene =
            SceneManager._scene;


        if (
            !(scene instanceof Scene_Map)
        ) {
            return false;
        }


        if (
            HIDE_DURING_MENU &&
            SceneManager._scene &&
            !(SceneManager._scene instanceof Scene_Map)
        ) {
            return false;
        }


        if (
            HIDE_DURING_EVENTS &&
            $gameMap &&
            $gameMap.isEventRunning()
        ) {
            return false;
        }


        return true;

    }


    // =========================================================================
    // 建立 DOM
    // =========================================================================

    function createJoystick() {

        if (joystickContainer) {
            return;
        }


        // =====================================================================
        // 外層
        // =====================================================================

        joystickContainer =
            document.createElement(
                "div"
            );


        joystickContainer.id =
            "VirtualJoystick_MZ";


        joystickContainer.style.position =
            "fixed";


        joystickContainer.style.zIndex =
            "9999";


        joystickContainer.style.width =
            JOYSTICK_SIZE + "px";


        joystickContainer.style.height =
            JOYSTICK_SIZE + "px";


        joystickContainer.style.left =
            "0px";


        joystickContainer.style.top =
            "0px";


        joystickContainer.style.touchAction =
            "none";


        joystickContainer.style.userSelect =
            "none";


        joystickContainer.style.webkitUserSelect =
            "none";


        joystickContainer.style.pointerEvents =
            "auto";


        // =====================================================================
        // 外圈
        // =====================================================================

        joystickBase =
            document.createElement(
                "div"
            );


        joystickBase.style.position =
            "absolute";


        joystickBase.style.left =
            "0px";


        joystickBase.style.top =
            "0px";


        joystickBase.style.width =
            JOYSTICK_SIZE + "px";


        joystickBase.style.height =
            JOYSTICK_SIZE + "px";


        joystickBase.style.borderRadius =
            "50%";


        joystickBase.style.background =
            BACKGROUND_COLOR;


        joystickBase.style.border =
            "3px solid rgba(255,255,255,0.35)";


        joystickBase.style.boxSizing =
            "border-box";


        joystickBase.style.opacity =
            String(
                Math.max(
                    0,
                    Math.min(
                        1,
                        OPACITY / 255
                    )
                )
            );


        joystickBase.style.boxShadow =
            "0 2px 8px rgba(0,0,0,0.35)";


        // =====================================================================
        // 中心
        // =====================================================================

        joystickKnob =
            document.createElement(
                "div"
            );


        joystickKnob.style.position =
            "absolute";


        joystickKnob.style.width =
            KNOB_SIZE + "px";


        joystickKnob.style.height =
            KNOB_SIZE + "px";


        joystickKnob.style.left =
            (
                JOYSTICK_SIZE -
                KNOB_SIZE
            ) / 2 + "px";


        joystickKnob.style.top =
            (
                JOYSTICK_SIZE -
                KNOB_SIZE
            ) / 2 + "px";


        joystickKnob.style.borderRadius =
            "50%";


        joystickKnob.style.background =
            KNOB_COLOR;


        joystickKnob.style.border =
            "2px solid rgba(255,255,255,0.5)";


        joystickKnob.style.boxSizing =
            "border-box";


        joystickKnob.style.boxShadow =
            "0 2px 6px rgba(0,0,0,0.4)";


        joystickKnob.style.pointerEvents =
            "none";


        joystickKnob.style.transition =
            "transform 0.05s linear";


        // =====================================================================
        // 加入
        // =====================================================================

        joystickBase.appendChild(
            joystickKnob
        );


        joystickContainer.appendChild(
            joystickBase
        );


        document.body.appendChild(
            joystickContainer
        );


        // =====================================================================
        // 觸控事件
        // =====================================================================

        joystickContainer.addEventListener(
            "touchstart",
            onTouchStart,
            {
                passive: false
            }
        );


        joystickContainer.addEventListener(
            "touchmove",
            onTouchMove,
            {
                passive: false
            }
        );


        joystickContainer.addEventListener(
            "touchend",
            onTouchEnd,
            {
                passive: false
            }
        );


        joystickContainer.addEventListener(
            "touchcancel",
            onTouchEnd,
            {
                passive: false
            }
        );


        // =====================================================================
        // Pointer 事件
        //
        // 某些 Android / iOS WebView 會使用 PointerEvent。
        // =====================================================================

        joystickContainer.addEventListener(
            "pointerdown",
            onPointerDown,
            {
                passive: false
            }
        );


        joystickContainer.addEventListener(
            "pointermove",
            onPointerMove,
            {
                passive: false
            }
        );


        joystickContainer.addEventListener(
            "pointerup",
            onPointerUp,
            {
                passive: false
            }
        );


        joystickContainer.addEventListener(
            "pointercancel",
            onPointerUp,
            {
                passive: false
            }
        );


        // =====================================================================
        // 初始位置
        // =====================================================================

        updateJoystickPosition();

    }


    // =========================================================================
    // 計算搖桿位置
    // =========================================================================

    function updateJoystickPosition() {

        if (!joystickContainer) {
            return;
        }


        const width =
            window.innerWidth;


        const height =
            window.innerHeight;


        const x =
            LEFT_MARGIN;


        const y =
            height -
            JOYSTICK_SIZE -
            BOTTOM_MARGIN;


        joystickContainer.style.left =
            Math.max(
                0,
                x
            ) + "px";


        joystickContainer.style.top =
            Math.max(
                0,
                y
            ) + "px";


        centerX =
            x +
            JOYSTICK_SIZE / 2;


        centerY =
            y +
            JOYSTICK_SIZE / 2;

    }


    // =========================================================================
    // Touch Start
    // =========================================================================

    function onTouchStart(event) {

        if (
            !shouldShowJoystick()
        ) {
            return;
        }


        if (
            activeTouchId !== null
        ) {
            return;
        }


        const touch =
            event.changedTouches[0];


        if (!touch) {
            return;
        }


        activeTouchId =
            touch.identifier;


        dragging =
            true;


        event.preventDefault();


        handleJoystickInput(
            touch.clientX,
            touch.clientY
        );

    }


    // =========================================================================
    // Touch Move
    // =========================================================================

    function onTouchMove(event) {

        if (!dragging) {
            return;
        }


        event.preventDefault();


        for (
            let i = 0;
            i < event.changedTouches.length;
            i++
        ) {

            const touch =
                event.changedTouches[i];


            if (
                touch.identifier ===
                activeTouchId
            ) {

                handleJoystickInput(
                    touch.clientX,
                    touch.clientY
                );

                break;

            }

        }

    }


    // =========================================================================
    // Touch End
    // =========================================================================

    function onTouchEnd(event) {

        if (!dragging) {
            return;
        }


        for (
            let i = 0;
            i < event.changedTouches.length;
            i++
        ) {

            const touch =
                event.changedTouches[i];


            if (
                touch.identifier ===
                activeTouchId
            ) {

                activeTouchId =
                    null;

                dragging =
                    false;

                currentDirection =
                    0;

                resetKnob();

                break;

            }

        }

        event.preventDefault();

    }


    // =========================================================================
    // Pointer Down
    // =========================================================================

    function onPointerDown(event) {

        if (
            !shouldShowJoystick()
        ) {
            return;
        }


        if (
            event.pointerType ===
            "mouse"
        ) {
            return;
        }


        dragging =
            true;


        event.preventDefault();


        handleJoystickInput(
            event.clientX,
            event.clientY
        );

    }


    // =========================================================================
    // Pointer Move
    // =========================================================================

    function onPointerMove(event) {

        if (!dragging) {
            return;
        }


        if (
            event.pointerType ===
            "mouse"
        ) {
            return;
        }


        event.preventDefault();


        handleJoystickInput(
            event.clientX,
            event.clientY
        );

    }


    // =========================================================================
    // Pointer Up
    // =========================================================================

    function onPointerUp(event) {

        if (!dragging) {
            return;
        }


        dragging =
            false;


        currentDirection =
            0;


        resetKnob();


        event.preventDefault();

    }


    // =========================================================================
    // 計算搖桿方向
    // =========================================================================

    function handleJoystickInput(
        clientX,
        clientY
    ) {

        const rect =
            joystickContainer.getBoundingClientRect();


        const cx =
            rect.left +
            JOYSTICK_SIZE / 2;


        const cy =
            rect.top +
            JOYSTICK_SIZE / 2;


        let dx =
            clientX -
            cx;


        let dy =
            clientY -
            cy;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const maxDistance =
            (
                JOYSTICK_SIZE -
                KNOB_SIZE
            ) / 2;


        // =====================================================================
        // 死區
        // =====================================================================

        const deadZone =
            maxDistance *
            (
                DEAD_ZONE /
                100
            );


        if (
            distance <=
            deadZone
        ) {

            currentDirection =
                0;


            resetKnob();


            return;

        }


        // =====================================================================
        // 限制中心按鈕移動距離
        // =====================================================================

        const ratio =
            Math.min(
                1,
                maxDistance /
                distance
            );


        const knobX =
            dx *
            ratio;


        const knobY =
            dy *
            ratio;


        joystickKnob.style.transform =
            "translate(" +
            knobX +
            "px," +
            knobY +
            "px)";


        // =====================================================================
        // 計算角度
        //
        // Canvas / DOM：
        //
        // 右 = 0
        // 下 = 90
        // 左 = 180
        // 上 = -90
        // =====================================================================

        const angle =
            Math.atan2(
                dy,
                dx
            ) *
            180 /
            Math.PI;


        currentDirection =
            directionFromAngle(
                angle
            );

    }


    // =========================================================================
    // 角度轉 RPG Maker 方向
    //
    // RPG Maker：
    //
    // 2 = 下
    // 4 = 左
    // 6 = 右
    // 8 = 上
    // =========================================================================

    function directionFromAngle(
        angle
    ) {

        // ---------------------------------------------------------------------
        // 右
        // ---------------------------------------------------------------------

        if (
            angle >=
            -DIRECTION_THRESHOLD &&
            angle <=
            DIRECTION_THRESHOLD
        ) {

            return 6;

        }


        // ---------------------------------------------------------------------
        // 下
        // ---------------------------------------------------------------------

        if (
            angle >
            DIRECTION_THRESHOLD &&
            angle <
            180 -
            DIRECTION_THRESHOLD
        ) {

            return 2;

        }


        // ---------------------------------------------------------------------
        // 左
        // ---------------------------------------------------------------------

        if (
            angle >=
            180 -
            DIRECTION_THRESHOLD ||
            angle <=
            -180 +
            DIRECTION_THRESHOLD
        ) {

            return 4;

        }


        // ---------------------------------------------------------------------
        // 上
        // ---------------------------------------------------------------------

        if (
            angle <
            -DIRECTION_THRESHOLD &&
            angle >
            -180 +
            DIRECTION_THRESHOLD
        ) {

            return 8;

        }


        return 0;

    }


    // =========================================================================
    // 重設中心按鈕
    // =========================================================================

    function resetKnob() {

        if (!joystickKnob) {
            return;
        }


        joystickKnob.style.transform =
            "translate(0px,0px)";

    }


    // =========================================================================
    // 執行玩家移動
    // =========================================================================

    function updatePlayerMovement() {

        if (
            !dragging
        ) {
            return;
        }


        if (
            currentDirection ===
            0
        ) {
            return;
        }


        if (!$gamePlayer) {
            return;
        }


        if (
            $gameMap &&
            $gameMap.isEventRunning()
        ) {
            return;
        }


        if (
            $gameMessage &&
            $gameMessage.isBusy()
        ) {
            return;
        }


        moveCounter++;


        if (
            moveCounter <
            MOVE_INTERVAL
        ) {
            return;
        }


        moveCounter =
            0;


        // =====================================================================
        // 讓 RPG Maker 原生移動系統處理移動
        // =====================================================================

        if (
            !$gamePlayer.isMoving()
        ) {

            $gamePlayer.executeMove(
                currentDirection
            );

        }

    }


    // =========================================================================
    // 顯示
    // =========================================================================

    function showJoystick() {

        joystickVisible =
            true;


        if (!joystickContainer) {
            createJoystick();
        }


        if (
            joystickContainer
        ) {

            joystickContainer.style.display =
                "block";

        }


        updateJoystickPosition();

    }


    // =========================================================================
    // 隱藏
    // =========================================================================

    function hideJoystick() {

        joystickVisible =
            false;


        dragging =
            false;


        currentDirection =
            0;


        resetKnob();


        if (
            joystickContainer
        ) {

            joystickContainer.style.display =
                "none";

        }

    }


    // =========================================================================
    // Plugin Command：Show
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "ShowJoystick",
        function() {

            showJoystick();

        }
    );


    // =========================================================================
    // Plugin Command：Hide
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "HideJoystick",
        function() {

            hideJoystick();

        }
    );


    // =========================================================================
    // Plugin Command：Reset
    // =========================================================================

    PluginManager.registerCommand(
        PLUGIN_NAME,
        "ResetJoystick",
        function() {

            updateJoystickPosition();

        }
    );


    // =========================================================================
    // Scene_Map 啟動
    // =========================================================================

    const _Scene_Map_start =
        Scene_Map.prototype.start;


    Scene_Map.prototype.start =
        function() {

            _Scene_Map_start.call(
                this
            );


            if (
                ENABLED
            ) {

                if (
                    !joystickContainer
                ) {

                    createJoystick();

                }

                updateJoystickPosition();

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


            if (
                ENABLED
            ) {

                updatePlayerMovement();

                updateJoystickVisibility();

            }

        };


    // =========================================================================
    // 顯示 / 隱藏狀態
    // =========================================================================

    function updateJoystickVisibility() {

        if (
            !joystickContainer
        ) {
            return;
        }


        const shouldShow =
            shouldShowJoystick();


        if (
            shouldShow
        ) {

            joystickContainer.style.display =
                "block";

        } else {

            joystickContainer.style.display =
                "none";

            dragging =
                false;

            currentDirection =
                0;

            resetKnob();

        }

    }


    // =========================================================================
    // Scene_Map 結束
    // =========================================================================

    const _Scene_Map_terminate =
        Scene_Map.prototype.terminate;


    Scene_Map.prototype.terminate =
        function() {

            dragging =
                false;


            activeTouchId =
                null;


            currentDirection =
                0;


            resetKnob();


            _Scene_Map_terminate.call(
                this
            );

        };


    // =========================================================================
    // 視窗大小改變
    // =========================================================================

    window.addEventListener(
        "resize",
        function() {

            setTimeout(
                function() {

                    updateJoystickPosition();

                },
                100
            );

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

                    updateJoystickPosition();

                },
                300
            );

        }
    );


    // =========================================================================
    // Visual Viewport
    //
    // 部分手機瀏覽器地址列伸縮會改變 viewport。
    // =========================================================================

    if (
        window.visualViewport
    ) {

        window.visualViewport.addEventListener(
            "resize",
            function() {

                updateJoystickPosition();

            }
        );

    }


    // =========================================================================
    // 防止手機瀏覽器雙擊縮放
    // =========================================================================

    document.addEventListener(
        "touchmove",
        function(event) {

            if (
                dragging
            ) {

                event.preventDefault();

            }

        },
        {
            passive: false
        }
    );


    // =========================================================================
    // 啟動
    // =========================================================================

    if (
        ENABLED
    ) {

        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                function() {

                    createJoystick();

                }
            );

        } else {

            createJoystick();

        }

    }


    // =========================================================================
    // Console
    // =========================================================================

    console.log(
        "VirtualJoystick_MZ v1.0.0 已載入"
    );


})();