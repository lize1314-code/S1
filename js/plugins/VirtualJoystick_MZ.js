/*:
 * @target MV MZ
 * @plugindesc Virtual Joystick MZ - 獨立虛擬搖桿防點擊衝突版
 * @author Custom
 *
 * @help
 * ------------------------------------------------------------
 * VirtualJoystick_MZ
 * ------------------------------------------------------------
 *
 * 功能：
 * 1. 左下角圓形虛擬搖桿
 * 2. 上下左右四方向移動
 * 3. 可斜向操作，但角色只會採用最接近的四方向
 * 4. 按住搖桿可持續移動
 * 5. 搖桿區域完全禁止地圖點擊
 * 6. 搖桿以外區域保留 RPG Maker 原生點擊移動
 * 7. 對話時隱藏
 * 8. 事件執行時隱藏
 * 9. 非地圖場景隱藏
 * 10. 自動適應手機橫向／直向
 *
 * 本插件完全獨立。
 *
 * 建議：
 *
 * VirtualJoystick_MZ.js          ON
 * TouchMoveForSymbolEncount.js   OFF
 * SmoothTouchMove.js             OFF
 *
 * ------------------------------------------------------------
 */

(function() {

    "use strict";


    //============================================================
    // 設定
    //============================================================

    const JOYSTICK_ID =
        "virtual-joystick-mz";


    // 桌面搖桿大小
    const DESKTOP_SIZE = 150;


    // 手機搖桿大小
    const MOBILE_SIZE = 132;


    // 桌面中心球大小
    const DESKTOP_STICK_SIZE = 64;


    // 手機中心球大小
    const MOBILE_STICK_SIZE = 58;


    // 左邊距離
    const LEFT_MARGIN = 16;


    // 下方距離
    const BOTTOM_MARGIN = 16;


    // 搖桿死區
    // 越大越不敏感
    const DEAD_ZONE = 25;


    // 角色移動間隔
    // 越大移動越慢
    const MOVE_INTERVAL = 140;


    //============================================================
    // 變數
    //============================================================

    let joystick = null;

    let stick = null;

    let activePointerId = null;

    let currentDirection = 0;

    let lastMoveTime = 0;


    //============================================================
    // 判斷是否可以使用搖桿
    //============================================================

    function canUseJoystick() {

        if (!$gamePlayer) {
            return false;
        }


        if (!$gameMap) {
            return false;
        }


        // 只在地圖使用
        if (
            SceneManager._scene &&
            !(SceneManager._scene instanceof Scene_Map)
        ) {
            return false;
        }


        // 對話中禁止
        if (
            $gameMessage &&
            $gameMessage.isBusy()
        ) {
            return false;
        }


        // 事件執行中禁止
        if (
            $gameMap.isEventRunning()
        ) {
            return false;
        }


        return true;
    }


    //============================================================
    // 建立搖桿
    //============================================================

    function createJoystick() {

        if (joystick) {
            return;
        }


        if (!document.body) {
            return;
        }


        const oldJoystick =
            document.getElementById(
                JOYSTICK_ID
            );


        if (oldJoystick) {
            oldJoystick.remove();
        }


        //========================================================
        // 外圈
        //========================================================

        joystick =
            document.createElement("div");


        joystick.id =
            JOYSTICK_ID;


        Object.assign(
            joystick.style,
            {

                position:
                    "fixed",

                left:
                    LEFT_MARGIN + "px",

                bottom:
                    BOTTOM_MARGIN + "px",

                width:
                    DESKTOP_SIZE + "px",

                height:
                    DESKTOP_SIZE + "px",

                borderRadius:
                    "50%",

                background:
                    "rgba(80,80,80,0.45)",

                border:
                    "3px solid rgba(255,255,255,0.35)",

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
                    "none",

                WebkitTapHighlightColor:
                    "transparent"
            }
        );


        //========================================================
        // 中心球
        //========================================================

        stick =
            document.createElement("div");


        Object.assign(
            stick.style,
            {

                position:
                    "absolute",

                width:
                    DESKTOP_STICK_SIZE + "px",

                height:
                    DESKTOP_STICK_SIZE + "px",

                left:
                    (
                        DESKTOP_SIZE -
                        DESKTOP_STICK_SIZE
                    ) / 2 + "px",

                top:
                    (
                        DESKTOP_SIZE -
                        DESKTOP_STICK_SIZE
                    ) / 2 + "px",

                borderRadius:
                    "50%",

                background:
                    "rgba(220,220,220,0.85)",

                border:
                    "2px solid rgba(255,255,255,0.8)",

                boxSizing:
                    "border-box",

                boxShadow:
                    "0 4px 12px rgba(0,0,0,0.35)",

                pointerEvents:
                    "none",

                touchAction:
                    "none"
            }
        );


        joystick.appendChild(
            stick
        );


        document.body.appendChild(
            joystick
        );


        //========================================================
        // Pointer Down
        //========================================================

        joystick.addEventListener(
            "pointerdown",
            onPointerDown,
            {
                passive: false
            }
        );


        //========================================================
        // Pointer Move
        //========================================================

        joystick.addEventListener(
            "pointermove",
            onPointerMove,
            {
                passive: false
            }
        );


        //========================================================
        // Pointer Up
        //========================================================

        joystick.addEventListener(
            "pointerup",
            onPointerUp,
            {
                passive: false
            }
        );


        //========================================================
        // Pointer Cancel
        //========================================================

        joystick.addEventListener(
            "pointercancel",
            onPointerUp,
            {
                passive: false
            }
        );


        //========================================================
        // Lost Pointer Capture
        //========================================================

        joystick.addEventListener(
            "lostpointercapture",
            onPointerUp,
            {
                passive: false
            }
        );


        //========================================================
        // Touch 事件
        //
        // 搖桿自己的區域完全禁止地圖 Touch
        //========================================================

        const touchEvents = [
            "touchstart",
            "touchmove",
            "touchend",
            "touchcancel"
        ];


        touchEvents.forEach(
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


    //============================================================
    // 更新搖桿尺寸
    //============================================================

    function updateJoystickPosition() {

        if (!joystick) {
            return;
        }


        const mobile =
            window.innerWidth <= 760;


        const size =
            mobile
                ? MOBILE_SIZE
                : DESKTOP_SIZE;


        const stickSize =
            mobile
                ? MOBILE_STICK_SIZE
                : DESKTOP_STICK_SIZE;


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
                (
                    size -
                    stickSize
                ) / 2 + "px";


            stick.style.top =
                (
                    size -
                    stickSize
                ) / 2 + "px";
        }
    }


    //============================================================
    // 搖桿歸位
    //============================================================

    function resetStick() {

        if (
            !joystick ||
            !stick
        ) {
            return;
        }


        const rect =
            joystick.getBoundingClientRect();


        const stickRect =
            stick.getBoundingClientRect();


        stick.style.left =
            (
                rect.width -
                stickRect.width
            ) / 2 + "px";


        stick.style.top =
            (
                rect.height -
                stickRect.height
            ) / 2 + "px";


        activePointerId =
            null;


        currentDirection =
            0;
    }


    //============================================================
    // 判斷方向
    //
    // 上 = 8
    // 下 = 2
    // 左 = 4
    // 右 = 6
    //============================================================

    function getDirection(
        dx,
        dy
    ) {

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        //========================================================
        // 死區
        //========================================================

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


        //========================================================
        // 右
        //========================================================

        if (
            angle >= -45 &&
            angle < 45
        ) {

            return 6;
        }


        //========================================================
        // 下
        //========================================================

        if (
            angle >= 45 &&
            angle < 135
        ) {

            return 2;
        }


        //========================================================
        // 左
        //========================================================

        if (
            angle >= 135 ||
            angle < -135
        ) {

            return 4;
        }


        //========================================================
        // 上
        //========================================================

        return 8;
    }


    //============================================================
    // 處理搖桿位置
    //============================================================

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


        //========================================================
        // 搖桿中心
        //========================================================

        const centerX =
            rect.left +
            rect.width / 2;


        const centerY =
            rect.top +
            rect.height / 2;


        //========================================================
        // 計算手指距離
        //========================================================

        let dx =
            clientX -
            centerX;


        let dy =
            clientY -
            centerY;


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
                stickRect.width / 2 -
                3
            );


        //========================================================
        // 限制最大距離
        //========================================================

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


        //========================================================
        // 中心位置
        //========================================================

        const baseX =
            rect.width / 2 -
            stickRect.width / 2;


        const baseY =
            rect.height / 2 -
            stickRect.height / 2;


        stick.style.left =
            baseX +
            dx +
            "px";


        stick.style.top =
            baseY +
            dy +
            "px";


        //========================================================
        // 計算方向
        //========================================================

        currentDirection =
            getDirection(
                dx,
                dy
            );
    }


    //============================================================
    // 搖桿移動角色
    //============================================================

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


        //========================================================
        // 控制速度
        //========================================================

        if (
            now -
            lastMoveTime <
            MOVE_INTERVAL
        ) {

            return;
        }


        lastMoveTime =
            now;


        //========================================================
        // RPG Maker 原生移動
        //========================================================

        $gamePlayer.executeMove(
            currentDirection
        );
    }


    //============================================================
    // Pointer Down
    //============================================================

    function onPointerDown(
        event
    ) {

        // 滑鼠只接受左鍵
        if (
            event.pointerType === "mouse" &&
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

        } catch (error) {}


        processPointer(
            event.clientX,
            event.clientY
        );


        movePlayerByJoystick();
    }


    //============================================================
    // Pointer Move
    //============================================================

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


    //============================================================
    // Pointer Up
    //============================================================

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


    //============================================================
    // 顯示／隱藏搖桿
    //============================================================

    function updateVisibility() {

        if (!joystick) {
            return;
        }


        const scene =
            SceneManager._scene;


        let visible =
            true;


        //========================================================
        // 非地圖場景
        //========================================================

        if (
            !(scene instanceof Scene_Map)
        ) {

            visible =
                false;
        }


        //========================================================
        // 對話
        //========================================================

        if (
            $gameMessage &&
            $gameMessage.isBusy()
        ) {

            visible =
                false;
        }


        //========================================================
        // 事件
        //========================================================

        if (
            $gameMap &&
            $gameMap.isEventRunning()
        ) {

            visible =
                false;
        }


        joystick.style.display =
            visible
                ? "block"
                : "none";


        if (!visible) {

            resetStick();
        }
    }


    //============================================================
    // Scene_Map Start
    //============================================================

    const _Scene_Map_start =
        Scene_Map.prototype.start;


    Scene_Map.prototype.start =
        function() {

            _Scene_Map_start.call(
                this
            );


            setTimeout(
                function() {

                    createJoystick();

                    updateJoystickPosition();

                    updateVisibility();

                },
                0
            );
        };


    //============================================================
    // Scene_Map Update
    //============================================================

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


            //======================================================
            // 按住搖桿持續移動
            //======================================================

            if (
                activePointerId !== null
            ) {

                movePlayerByJoystick();
            }
        };


    //============================================================
    // 視窗大小變更
    //============================================================

    window.addEventListener(
        "resize",
        function() {

            updateJoystickPosition();

        }
    );


    //============================================================
    // 手機橫豎轉
    //============================================================

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


    //============================================================
    // RPG Maker TouchInput 隔離
    //
    // ★ 重要 ★
    //
    // 搖桿整個區域：
    //     TouchInput 完全忽略
    //
    // 搖桿外面：
    //     RPG Maker 原生點擊移動正常運作
    //============================================================

    function isJoystickTarget(
        target
    ) {

        return (
            joystick &&
            target &&
            joystick.contains(
                target
            )
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


    //============================================================
    // Capture 階段攔截
    //============================================================

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


    //============================================================
    // RPG Maker TouchInput 防護
    //============================================================

    if (
        typeof TouchInput !==
        "undefined"
    ) {

        //========================================================
        // Touch Start
        //========================================================

        const _TouchInput_onTouchStart =
            TouchInput._onTouchStart;


        if (
            typeof _TouchInput_onTouchStart ===
            "function"
        ) {

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
        }


        //========================================================
        // Touch Move
        //========================================================

        const _TouchInput_onTouchMove =
            TouchInput._onTouchMove;


        if (
            typeof _TouchInput_onTouchMove ===
            "function"
        ) {

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
        }


        //========================================================
        // Touch End
        //========================================================

        const _TouchInput_onTouchEnd =
            TouchInput._onTouchEnd;


        if (
            typeof _TouchInput_onTouchEnd ===
            "function"
        ) {

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
    }

})();