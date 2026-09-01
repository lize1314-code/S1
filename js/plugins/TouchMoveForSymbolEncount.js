/*:
 * @target MV MZ
 * @plugindesc TouchMoveForSymbolEncount + Virtual Joystick 完整整合版
 * @author Shitsudo Kei / Integrated
 *
 * @help
 * 完全保留原 TouchMoveForSymbolEncount.js 功能，
 * 並追加虛擬搖桿。
 *
 * 原插件功能：
 * Game_Character.prototype.searchLimit() = 2
 *
 * 新增功能：
 * 1. 左下角虛擬搖桿
 * 2. 搖桿控制角色移動
 * 3. 保留 RPG Maker 原生點擊地圖移動
 * 4. 搖桿與地圖點擊移動互不干擾
 * 5. 搖桿較大的操作死區，降低靈敏度
 * 6. 移動間隔較長，避免角色移動過快
 * 7. 對話、事件、選單時自動隱藏搖桿
 * 8. 手機橫豎畫面自動調整
 *
 * 建議：
 * TouchMoveForSymbolEncount + Virtual Joystick 整合版 ON
 * 原 TouchMoveForSymbolEncount.js OFF
 * VirtualJoystick_MZ.js OFF
 * SmoothTouchMove.js OFF
 *
 * 注意：
 * 本插件沒有改動 RPG Maker 原生點擊移動功能。
 */

/*:ja
 * @target MV MZ
 * @plugindesc TouchMoveForSymbolEncount + Virtual Joystick
 * @author Shitsudo Kei / Integrated
 */

/*:zh
 * @target MV MZ
 * @plugindesc TouchMoveForSymbolEncount + Virtual Joystick 整合版
 * @author Shitsudo Kei / Integrated
 */

(function() {
    "use strict";

    //==================================================
    // TouchMoveForSymbolEncount 原始功能
    //==================================================

    Game_Character.prototype.searchLimit = function() {
        return 2;
    };


    //==================================================
    // Virtual Joystick 設定
    //==================================================

    const JOYSTICK_ID = "tmse-virtual-joystick";

    let joystick = null;
    let stick = null;

    let activePointerId = null;

    let currentDirection = 0;

    let lastMoveTime = 0;

    // 搖桿外圈大小
    const OUTER_SIZE = 150;

    // 搖桿中心按鈕大小
    const STICK_SIZE = 64;

    // 死區
    // 數值越大，越不靈敏
    const DEAD_ZONE = 25;

    // 移動間隔
    // 數值越大，移動越慢
    const MOVE_INTERVAL = 140;


    //==================================================
    // 判斷是否可以使用搖桿
    //==================================================

    function canUseJoystick() {

        if (!$gamePlayer) {
            return false;
        }

        if (!$gameMap) {
            return false;
        }

        // 對話中禁止
        if (
            $gameMessage &&
            $gameMessage.isBusy()
        ) {
            return false;
        }

        // 非地圖場景禁止
        if (
            SceneManager._scene &&
            !(SceneManager._scene instanceof Scene_Map)
        ) {
            return false;
        }

        // 事件執行中禁止
        if ($gameMap.isEventRunning()) {
            return false;
        }

        return true;
    }


    //==================================================
    // 建立虛擬搖桿
    //==================================================

    function createJoystick() {

        if (
            joystick ||
            !document.body
        ) {
            return;
        }

        joystick =
            document.createElement("div");

        joystick.id =
            JOYSTICK_ID;


        //==================================================
        // 搖桿外圈
        //==================================================

        Object.assign(
            joystick.style,
            {
                position: "fixed",

                left:
                    "max(12px, env(safe-area-inset-left))",

                bottom:
                    "max(12px, env(safe-area-inset-bottom))",

                width:
                    OUTER_SIZE + "px",

                height:
                    OUTER_SIZE + "px",

                borderRadius:
                    "50%",

                background:
                    "rgba(255,255,255,0.10)",

                border:
                    "2px solid rgba(255,255,255,0.22)",

                boxSizing:
                    "border-box",

                zIndex:
                    "99999",

                pointerEvents:
                    "auto",

                touchAction:
                    "none",

                userSelect:
                    "none",

                WebkitUserSelect:
                    "none",

                WebkitTouchCallout:
                    "none"
            }
        );


        //==================================================
        // 搖桿中心
        //==================================================

        stick =
            document.createElement("div");


        Object.assign(
            stick.style,
            {
                position:
                    "absolute",

                width:
                    STICK_SIZE + "px",

                height:
                    STICK_SIZE + "px",

                left:
                    ((OUTER_SIZE - STICK_SIZE) / 2) +
                    "px",

                top:
                    ((OUTER_SIZE - STICK_SIZE) / 2) +
                    "px",

                borderRadius:
                    "50%",

                background:
                    "rgba(255,224,138,0.80)",

                border:
                    "2px solid rgba(255,255,255,0.55)",

                boxSizing:
                    "border-box",

                boxShadow:
                    "0 4px 14px rgba(0,0,0,0.35)",

                pointerEvents:
                    "none",

                touchAction:
                    "none"
            }
        );


        joystick.appendChild(stick);

        document.body.appendChild(
            joystick
        );


        //==================================================
        // Pointer 事件
        //==================================================

        joystick.addEventListener(
            "pointerdown",
            onPointerDown,
            {
                passive: false
            }
        );


        joystick.addEventListener(
            "pointermove",
            onPointerMove,
            {
                passive: false
            }
        );


        joystick.addEventListener(
            "pointerup",
            onPointerUp,
            {
                passive: false
            }
        );


        joystick.addEventListener(
            "pointercancel",
            onPointerUp,
            {
                passive: false
            }
        );


        joystick.addEventListener(
            "lostpointercapture",
            onPointerUp,
            {
                passive: false
            }
        );


        //==================================================
        // 原生 Touch 事件
        // 直接在搖桿本身攔截
        //==================================================

        [
            "touchstart",
            "touchmove",
            "touchend",
            "touchcancel"
        ].forEach(
            function(type) {

                joystick.addEventListener(
                    type,
                    function(event) {

                        event.preventDefault();

                        event.stopImmediatePropagation();

                    },
                    {
                        passive: false
                    }
                );

            }
        );


        updateJoystickPosition();
    }


    //==================================================
    // 搖桿大小調整
    //==================================================

    function updateJoystickPosition() {

        if (!joystick) {
            return;
        }

        const mobile =
            window.innerWidth <= 760;

        const size =
            mobile ? 132 : 150;

        const stickSize =
            mobile ? 58 : 64;


        joystick.style.width =
            size + "px";

        joystick.style.height =
            size + "px";


        if (stick) {

            stick.style.width =
                stickSize + "px";

            stick.style.height =
                stickSize + "px";


            stick.style.left =
                ((size - stickSize) / 2) +
                "px";

            stick.style.top =
                ((size - stickSize) / 2) +
                "px";
        }
    }


    //==================================================
    // 搖桿歸位
    //==================================================

    function resetStick() {

        if (
            !joystick ||
            !stick
        ) {
            return;
        }

        const size =
            joystick.getBoundingClientRect()
                .width;

        const stickSize =
            stick.getBoundingClientRect()
                .width;

        stick.style.left =
            ((size - stickSize) / 2) +
            "px";

        stick.style.top =
            ((size - stickSize) / 2) +
            "px";

        activePointerId =
            null;

        currentDirection =
            0;
    }


    //==================================================
    // 判斷方向
    //==================================================

    function getDirection(
        dx,
        dy
    ) {

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        // 死區
        if (
            distance <
            DEAD_ZONE
        ) {
            return 0;
        }


        const angle =
            Math.atan2(
                dy,
                dx
            ) *
            180 /
            Math.PI;


        //==================================================
        // 右
        //==================================================

        if (
            angle >= -22.5 &&
            angle < 22.5
        ) {
            return 6;
        }


        //==================================================
        // 下
        //==================================================

        if (
            angle >= 22.5 &&
            angle < 157.5
        ) {
            return 2;
        }


        //==================================================
        // 左
        //==================================================

        if (
            angle >= 157.5 ||
            angle < -157.5
        ) {
            return 4;
        }


        //==================================================
        // 上
        //==================================================

        if (
            angle >= -157.5 &&
            angle < -22.5
        ) {
            return 8;
        }


        return 0;
    }


    //==================================================
    // 處理搖桿位置
    //==================================================

    function processPointer(
        clientX,
        clientY
    ) {

        if (
            !joystick ||
            !stick
        ) {
            return;
        }


        const rect =
            joystick.getBoundingClientRect();


        const cx =
            rect.left +
            rect.width / 2;

        const cy =
            rect.top +
            rect.height / 2;


        let dx =
            clientX - cx;

        let dy =
            clientY - cy;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const stickRect =
            stick.getBoundingClientRect();


        const maxDistance =
            Math.max(
                1,
                rect.width / 2 -
                stickRect.width / 2
            );


        //==================================================
        // 限制搖桿最大距離
        //==================================================

        if (
            distance >
            maxDistance
        ) {

            dx =
                dx /
                distance *
                maxDistance;

            dy =
                dy /
                distance *
                maxDistance;
        }


        const baseX =
            rect.width / 2 -
            stickRect.width / 2;

        const baseY =
            rect.height / 2 -
            stickRect.height / 2;


        stick.style.left =
            (baseX + dx) +
            "px";

        stick.style.top =
            (baseY + dy) +
            "px";


        currentDirection =
            getDirection(
                dx,
                dy
            );
    }


    //==================================================
    // 搖桿移動角色
    //==================================================

    function movePlayerByJoystick() {

        if (
            !currentDirection
        ) {
            return;
        }


        if (
            !canUseJoystick()
        ) {
            return;
        }


        const now =
            performance.now();


        // 控制移動速度
        if (
            now -
            lastMoveTime <
            MOVE_INTERVAL
        ) {
            return;
        }


        lastMoveTime =
            now;


        // 使用 RPG Maker 原生移動
        $gamePlayer.executeMove(
            currentDirection
        );
    }


    //==================================================
    // Pointer Down
    //==================================================

    function onPointerDown(
        event
    ) {

        // 滑鼠只接受左鍵
        if (
            event.pointerType ===
            "mouse" &&
            event.button !== 0
        ) {
            return;
        }


        event.preventDefault();

        event.stopPropagation();


        if (
            !canUseJoystick()
        ) {
            return;
        }


        activePointerId =
            event.pointerId;


        try {

            joystick.setPointerCapture(
                event.pointerId
            );

        } catch (_) {}


        processPointer(
            event.clientX,
            event.clientY
        );


        movePlayerByJoystick();
    }


    //==================================================
    // Pointer Move
    //==================================================

    function onPointerMove(
        event
    ) {

        if (
            activePointerId !==
            event.pointerId
        ) {
            return;
        }


        event.preventDefault();

        event.stopPropagation();


        processPointer(
            event.clientX,
            event.clientY
        );


        movePlayerByJoystick();
    }


    //==================================================
    // Pointer Up
    //==================================================

    function onPointerUp(
        event
    ) {

        if (
            activePointerId !== null &&
            event.pointerId !==
            activePointerId
        ) {
            return;
        }


        event.preventDefault();

        event.stopPropagation();


        resetStick();
    }


    //==================================================
    // 顯示 / 隱藏搖桿
    //==================================================

    function updateVisibility() {

        if (!joystick) {
            return;
        }


        const scene =
            SceneManager._scene;


        const visible =
            scene instanceof Scene_Map &&
            !$gameMessage.isBusy() &&
            !$gameMap.isEventRunning();


        joystick.style.display =
            visible
                ? "block"
                : "none";


        if (
            !visible &&
            activePointerId !== null
        ) {
            resetStick();
        }
    }


    //==================================================
    // Scene_Map Start
    //==================================================

    const _Scene_Map_start =
        Scene_Map.prototype.start;


    Scene_Map.prototype.start =
        function() {

            _Scene_Map_start.call(
                this
            );


            setTimeout(
                () => {

                    createJoystick();

                    updateJoystickPosition();

                    updateVisibility();

                },
                0
            );
        };


    //==================================================
    // Scene_Map Update
    //==================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;


    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(
                this
            );


            createJoystick();

            updateJoystickPosition();

            updateVisibility();


            if (
                activePointerId !== null
            ) {

                movePlayerByJoystick();
            }
        };


    //==================================================
    // 視窗大小變更
    //==================================================

    window.addEventListener(
        "resize",
        function() {

            updateJoystickPosition();

        }
    );


    //==================================================
    // 手機橫豎轉
    //==================================================

    window.addEventListener(
        "orientationchange",
        function() {

            setTimeout(
                function() {

                    updateJoystickPosition();

                },
                100
            );
        }
    );


    //==================================================
    // 搖桿與 RPG Maker 原生 TouchInput 完全隔離
    //
    // 只有碰到搖桿才攔截。
    // 地圖其他地方完全不攔截。
    //==================================================

    function isJoystickTarget(
        target
    ) {

        return (
            joystick &&
            target &&
            joystick.contains(target)
        );
    }


    function isJoystickTouchEvent(
        event
    ) {

        return (
            event &&
            isJoystickTarget(
                event.target
            )
        );
    }


    //==================================================
    // 第一層：
    // Capture 階段攔截搖桿 Touch
    //==================================================

    [
        "touchstart",
        "touchmove",
        "touchend",
        "touchcancel"
    ].forEach(
        function(type) {

            document.addEventListener(
                type,
                function(event) {

                    if (
                        isJoystickTouchEvent(
                            event
                        )
                    ) {

                        event.preventDefault();

                        event.stopImmediatePropagation();
                    }

                },
                {
                    passive: false,
                    capture: true
                }
            );

        }
    );


    //==================================================
    // 第二層：
    // 直接讓 RPG Maker TouchInput 忽略搖桿
    //==================================================

    if (
        typeof TouchInput !==
        "undefined"
    ) {

        const _TouchInput_onTouchStart =
            TouchInput._onTouchStart;

        const _TouchInput_onTouchMove =
            TouchInput._onTouchMove;

        const _TouchInput_onTouchEnd =
            TouchInput._onTouchEnd;


        TouchInput._onTouchStart =
            function(event) {

                if (
                    isJoystickTouchEvent(
                        event
                    )
                ) {
                    return;
                }

                _TouchInput_onTouchStart.call(
                    this,
                    event
                );
            };


        TouchInput._onTouchMove =
            function(event) {

                if (
                    isJoystickTouchEvent(
                        event
                    )
                ) {
                    return;
                }

                _TouchInput_onTouchMove.call(
                    this,
                    event
                );
            };


        TouchInput._onTouchEnd =
            function(event) {

                if (
                    isJoystickTouchEvent(
                        event
                    )
                ) {
                    return;
                }

                _TouchInput_onTouchEnd.call(
                    this,
                    event
                );
            };

    }

})();