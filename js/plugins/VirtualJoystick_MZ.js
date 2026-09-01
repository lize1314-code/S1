/*:
 * @target MV MZ
 * @plugindesc Virtual Joystick MZ - 獨立虛擬搖桿
 * @author Custom
 *
 * @help
 * ------------------------------------------------------------
 * VirtualJoystick_MZ
 * ------------------------------------------------------------
 *
 * 功能：
 * 1. 左下角顯示虛擬搖桿
 * 2. 控制角色上下左右移動
 * 3. 不修改 TouchMoveForSymbolEncount
 * 4. 不修改 Game_Character.prototype.searchLimit
 * 5. 保留 RPG Maker MZ 原生點擊地圖移動
 * 6. 搖桿觸控不會觸發地圖點擊移動
 * 7. 對話時自動隱藏
 * 8. 事件執行時自動隱藏
 * 9. 選單時自動隱藏
 * 10. 自動適應手機橫向／直向
 *
 * 建議插件設定：
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
    // 基本設定
    //============================================================

    const JOYSTICK_ID =
        "virtual-joystick-mz";


    // 桌面版大小
    const DESKTOP_SIZE = 150;

    const DESKTOP_STICK_SIZE = 64;


    // 手機版大小
    const MOBILE_SIZE = 132;

    const MOBILE_STICK_SIZE = 58;


    // 左邊距離
    const LEFT_MARGIN = 12;


    // 下方距離
    const BOTTOM_MARGIN = 12;


    // 死區
    // 數值越大，搖桿越不敏感
    const DEAD_ZONE = 25;


    // 移動間隔
    // 數值越大，角色移動越慢
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

        // 玩家不存在
        if (!$gamePlayer) {
            return false;
        }


        // 地圖不存在
        if (!$gameMap) {
            return false;
        }


        // 不是地圖場景
        if (
            SceneManager._scene &&
            !(SceneManager._scene instanceof Scene_Map)
        ) {
            return false;
        }


        // 對話中
        if (
            $gameMessage &&
            $gameMessage.isBusy()
        ) {
            return false;
        }


        // 事件執行中
        if ($gameMap.isEventRunning()) {
            return false;
        }


        return true;
    }


    //============================================================
    // 建立虛擬搖桿
    //============================================================

    function createJoystick() {

        if (joystick) {
            return;
        }


        if (!document.body) {
            return;
        }


        // 防止重複建立
        const oldJoystick =
            document.getElementById(
                JOYSTICK_ID
            );


        if (oldJoystick) {

            oldJoystick.remove();

            joystick = null;
        }


        //========================================================
        // 建立外圈
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
                    "2px solid rgba(255,255,255,0.35)",

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
        // 建立中心搖桿
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
        // Pointer 事件
        //========================================================

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


        //========================================================
        // Touch 事件
        //
        // 只阻止搖桿本身。
        // 地圖其他地方完全不阻止。
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


        const isMobile =
            window.innerWidth <= 760;


        const size =
            isMobile
                ? MOBILE_SIZE
                : DESKTOP_SIZE;


        const stickSize =
            isMobile
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
    // 取得方向
    //
    // RPG Maker：
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
            angle >= -22.5 &&
            angle < 22.5
        ) {

            return 6;
        }


        //========================================================
        // 下
        //========================================================

        if (
            angle >= 22.5 &&
            angle < 157.5
        ) {

            return 2;
        }


        //========================================================
        // 左
        //========================================================

        if (
            angle >= 157.5 ||
            angle < -157.5
        ) {

            return 4;
        }


        //========================================================
        // 上
        //========================================================

        if (
            angle >= -157.5 &&
            angle < -22.5
        ) {

            return 8;
        }


        return 0;
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
        // 計算距離
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
                stickRect.width / 2
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
        // 移動中心
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
    // 搖桿控制角色
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
        // 控制移動速度
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
        // 使用 RPG Maker 原生角色移動
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
        // 事件執行
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


        if (
            !visible &&
            activePointerId !== null
        ) {

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
            // 持續移動
            //======================================================

            if (
                activePointerId !== null
            ) {

                movePlayerByJoystick();
            }
        };


    //============================================================
    // 視窗大小改變
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
    // 非常重要：
    //
    // 搖桿區域：
    //     TouchInput 不處理
    //
    // 地圖其他區域：
    //     TouchInput 正常處理
    //
    // 因此：
    //
    // 搖桿 → 搖桿控制
    // 地圖 → 原生點擊移動
    //
    // 兩者不互相干擾。
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
    // Capture 階段攔截搖桿 Touch
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