/*:
 * @target MZ
 * @plugindesc VirtualJoystick_MZ - 180x180 手機虛擬搖桿版
 * @author Custom
 *
 * @help
 * ============================================================
 * VirtualJoystick_MZ.js
 * ============================================================
 *
 * 功能：
 * 1. 左下角顯示虛擬搖桿
 * 2. 搖桿大小 180 x 180
 * 3. 搖桿完整範圍禁止地圖點擊
 * 4. 搖桿範圍外仍可使用地圖點擊移動
 * 5. 支援手機觸控
 * 6. 支援電腦滑鼠
 * 7. 四方向移動
 * 8. 防止搖桿觸控傳給 RPG Maker 地圖
 * 9. 支援手機旋轉
 * 10. 不修改 TouchMoveForSymbolEncount
 * 11. 不修改 Game_Character.prototype.searchLimit
 *
 * 建議：
 *
 * VirtualJoystick_MZ.js        ON
 * TouchMoveForSymbolEncount.js OFF
 * SmoothTouchMove.js           OFF
 *
 * ============================================================
 */

(function() {
    "use strict";

    // =========================================================
    // 基本設定
    // =========================================================

    const JOYSTICK_ID = "virtual-joystick-mz";

    // =========================================================
    // 搖桿尺寸
    // =========================================================

    const DESKTOP_SIZE = 180;
    const MOBILE_SIZE  = 180;

    // =========================================================
    // 中心球尺寸
    // =========================================================

    const DESKTOP_STICK = 78;
    const MOBILE_STICK  = 78;

    // =========================================================
    // 中心死區
    // =========================================================

    const DEAD_ZONE = 32;

    // =========================================================
    // 移動間隔
    // 數值越大，移動越慢
    // =========================================================

    const MOVE_INTERVAL = 140;

    // =========================================================
    // 左下位置
    // =========================================================

    const LEFT_MARGIN = 16;
    const BOTTOM_MARGIN = 16;

    // =========================================================
    // 判斷手機
    // =========================================================

    function isMobileDevice() {

        return (
            /Android|iPhone|iPad|iPod|Windows Phone/i.test(
                navigator.userAgent
            )
            ||
            (
                navigator.maxTouchPoints > 0 &&
                window.innerWidth <= 1024
            )
        );
    }

    // =========================================================
    // 取得搖桿尺寸
    // =========================================================

    function getJoystickSize() {

        return isMobileDevice()
            ? MOBILE_SIZE
            : DESKTOP_SIZE;
    }

    // =========================================================
    // 取得中心球尺寸
    // =========================================================

    function getStickSize() {

        return isMobileDevice()
            ? MOBILE_STICK
            : DESKTOP_STICK;
    }

    // =========================================================
    // 建立搖桿
    // =========================================================

    function createJoystick() {

        if (
            document.getElementById(
                JOYSTICK_ID
            )
        ) {
            return;
        }

        const size =
            getJoystickSize();

        const stickSize =
            getStickSize();

        // =====================================================
        // 搖桿外圈
        // =====================================================

        const joystick =
            document.createElement("div");

        joystick.id =
            JOYSTICK_ID;

        joystick.style.position =
            "fixed";

        joystick.style.left =
            "max(" +
            LEFT_MARGIN +
            "px, env(safe-area-inset-left))";

        joystick.style.bottom =
            "max(" +
            BOTTOM_MARGIN +
            "px, env(safe-area-inset-bottom))";

        joystick.style.width =
            size + "px";

        joystick.style.height =
            size + "px";

        joystick.style.borderRadius =
            "50%";

        joystick.style.background =
            "rgba(0,0,0,0.25)";

        joystick.style.border =
            "3px solid rgba(255,255,255,0.45)";

        joystick.style.boxSizing =
            "border-box";

        joystick.style.zIndex =
            "999999";

        /*
         * 搖桿本身禁止瀏覽器手勢
         */
        joystick.style.touchAction =
            "none";

        joystick.style.userSelect =
            "none";

        joystick.style.webkitUserSelect =
            "none";

        joystick.style.webkitTouchCallout =
            "none";

        joystick.style.webkitTapHighlightColor =
            "transparent";

        joystick.style.pointerEvents =
            "auto";

        // =====================================================
        // 中心球
        // =====================================================

        const stick =
            document.createElement("div");

        stick.style.position =
            "absolute";

        stick.style.width =
            stickSize + "px";

        stick.style.height =
            stickSize + "px";

        stick.style.left =
            "50%";

        stick.style.top =
            "50%";

        stick.style.transform =
            "translate(-50%, -50%)";

        stick.style.borderRadius =
            "50%";

        stick.style.background =
            "rgba(255,255,255,0.55)";

        stick.style.border =
            "3px solid rgba(255,255,255,0.8)";

        stick.style.boxShadow =
            "0 2px 8px rgba(0,0,0,0.35)";

        stick.style.boxSizing =
            "border-box";

        /*
         * 中心球不接收事件，
         * 由外圈統一接收。
         */
        stick.style.pointerEvents =
            "none";

        joystick.appendChild(
            stick
        );

        document.body.appendChild(
            joystick
        );

        // =====================================================
        // 狀態
        // =====================================================

        let active = false;

        let pointerId = null;

        let lastDirection = 0;

        let lastMoveTime = 0;

        // =====================================================
        // 判斷是否在搖桿範圍
        //
        // 整個 180 x 180 區域
        // 都禁止地圖點擊
        // =====================================================

        function isJoystickTarget(
            target
        ) {

            return (
                target === joystick ||
                joystick.contains(target)
            );
        }

        // =====================================================
        // 計算方向
        // =====================================================

        function getDirection(
            dx,
            dy
        ) {

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            // -------------------------------------------------
            // 死區
            // -------------------------------------------------

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

            /*
             * RPG Maker MZ：
             *
             * 2 = 下
             * 4 = 左
             * 6 = 右
             * 8 = 上
             */

            // 右
            if (
                angle >= -45 &&
                angle < 45
            ) {

                return 6;
            }

            // 下
            if (
                angle >= 45 &&
                angle < 135
            ) {

                return 2;
            }

            // 左
            if (
                angle >= 135 ||
                angle < -135
            ) {

                return 4;
            }

            // 上
            return 8;
        }

        // =====================================================
        // 移動玩家
        // =====================================================

        function movePlayer(
            direction
        ) {

            if (!direction) {
                return;
            }

            const now =
                performance.now();

            if (
                now -
                lastMoveTime <
                MOVE_INTERVAL
            ) {

                return;
            }

            lastMoveTime =
                now;

            if (
                typeof $gamePlayer ===
                "undefined"
            ) {

                return;
            }

            if (!$gamePlayer) {
                return;
            }

            // -------------------------------------------------
            // 事件執行中不移動
            // -------------------------------------------------

            if (
                $gameMap &&
                $gameMap.isEventRunning()
            ) {

                return;
            }

            // -------------------------------------------------
            // 訊息視窗開啟時不移動
            // -------------------------------------------------

            if (
                $gameMessage &&
                $gameMessage.isBusy()
            ) {

                return;
            }

            $gamePlayer.executeMove(
                direction
            );
        }

        // =====================================================
        // 重設搖桿
        // =====================================================

        function resetJoystick() {

            active = false;

            pointerId = null;

            lastDirection = 0;

            stick.style.left =
                "50%";

            stick.style.top =
                "50%";

            stick.style.transform =
                "translate(-50%, -50%)";
        }

        // =====================================================
        // 更新搖桿位置
        // =====================================================

        function updateJoystick(
            clientX,
            clientY
        ) {

            const rect =
                joystick.getBoundingClientRect();

            const centerX =
                rect.left +
                rect.width / 2;

            const centerY =
                rect.top +
                rect.height / 2;

            let dx =
                clientX -
                centerX;

            let dy =
                clientY -
                centerY;

            // -------------------------------------------------
            // 搖桿最大移動距離
            // -------------------------------------------------

            const maxDistance =
                rect.width / 2 -
                stickSize / 2 -
                6;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            // -------------------------------------------------
            // 限制中心球移動範圍
            // -------------------------------------------------

            if (
                distance >
                maxDistance
            ) {

                const ratio =
                    maxDistance /
                    distance;

                dx *= ratio;

                dy *= ratio;
            }

            // -------------------------------------------------
            // 移動中心球
            // -------------------------------------------------

            stick.style.left =
                "calc(50% + " +
                dx +
                "px)";

            stick.style.top =
                "calc(50% + " +
                dy +
                "px)";

            stick.style.transform =
                "translate(-50%, -50%)";

            // -------------------------------------------------
            // 判斷方向
            // -------------------------------------------------

            const direction =
                getDirection(
                    dx,
                    dy
                );

            if (direction) {

                lastDirection =
                    direction;

                movePlayer(
                    direction
                );
            }
        }

        // =====================================================
        // Pointer Down
        // =====================================================

        joystick.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

                active = true;

                pointerId =
                    event.pointerId;

                try {

                    joystick.setPointerCapture(
                        pointerId
                    );

                } catch (e) {}

                updateJoystick(
                    event.clientX,
                    event.clientY
                );

            },
            true
        );

        // =====================================================
        // Pointer Move
        // =====================================================

        joystick.addEventListener(
            "pointermove",
            function(event) {

                if (
                    !active ||
                    event.pointerId !==
                    pointerId
                ) {

                    return;
                }

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

                updateJoystick(
                    event.clientX,
                    event.clientY
                );

            },
            true
        );

        // =====================================================
        // Pointer Up
        // =====================================================

        joystick.addEventListener(
            "pointerup",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

                resetJoystick();

            },
            true
        );

        // =====================================================
        // Pointer Cancel
        // =====================================================

        joystick.addEventListener(
            "pointercancel",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

                resetJoystick();

            },
            true
        );

        // =====================================================
        // Lost Pointer Capture
        // =====================================================

        joystick.addEventListener(
            "lostpointercapture",
            function() {

                resetJoystick();

            }
        );

        // =====================================================
        // Touch Start
        // =====================================================

        joystick.addEventListener(
            "touchstart",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // Touch Move
        // =====================================================

        joystick.addEventListener(
            "touchmove",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // Touch End
        // =====================================================

        joystick.addEventListener(
            "touchend",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

                resetJoystick();

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // Touch Cancel
        // =====================================================

        joystick.addEventListener(
            "touchcancel",
            function(event) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();

                resetJoystick();

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // 文件層級 TouchStart
        //
        // 只有搖桿範圍才攔截。
        // =====================================================

        document.addEventListener(
            "touchstart",
            function(event) {

                for (
                    let i = 0;
                    i <
                    event.changedTouches.length;
                    i++
                ) {

                    const touch =
                        event.changedTouches[i];

                    const element =
                        document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );

                    if (
                        element &&
                        isJoystickTarget(
                            element
                        )
                    ) {

                        event.preventDefault();

                        event.stopPropagation();

                        event.stopImmediatePropagation();

                        return;
                    }
                }

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // 文件層級 TouchMove
        // =====================================================

        document.addEventListener(
            "touchmove",
            function(event) {

                for (
                    let i = 0;
                    i <
                    event.changedTouches.length;
                    i++
                ) {

                    const touch =
                        event.changedTouches[i];

                    const element =
                        document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );

                    if (
                        element &&
                        isJoystickTarget(
                            element
                        )
                    ) {

                        event.preventDefault();

                        event.stopPropagation();

                        event.stopImmediatePropagation();

                        return;
                    }
                }

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // 文件層級 TouchEnd
        // =====================================================

        document.addEventListener(
            "touchend",
            function(event) {

                for (
                    let i = 0;
                    i <
                    event.changedTouches.length;
                    i++
                ) {

                    const touch =
                        event.changedTouches[i];

                    const element =
                        document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );

                    if (
                        element &&
                        isJoystickTarget(
                            element
                        )
                    ) {

                        event.preventDefault();

                        event.stopPropagation();

                        event.stopImmediatePropagation();

                        resetJoystick();

                        return;
                    }
                }

            },
            {
                capture: true,
                passive: false
            }
        );

        // =====================================================
        // RPG Maker MZ TouchInput 保護
        //
        // 搖桿區域：
        // 不讓 MZ 地圖收到點擊。
        //
        // 搖桿外：
        // 完全保留原本地圖點擊。
        // =====================================================

        if (
            typeof TouchInput !==
            "undefined"
        ) {

            const originalTouchStart =
                TouchInput._onTouchStart;

            const originalTouchMove =
                TouchInput._onTouchMove;

            const originalTouchEnd =
                TouchInput._onTouchEnd;

            // -------------------------------------------------
            // Touch Start
            // -------------------------------------------------

            TouchInput._onTouchStart =
                function(event) {

                    const touch =
                        event.changedTouches &&
                        event.changedTouches[0]
                            ? event.changedTouches[0]
                            : event;

                    const element =
                        document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );

                    if (
                        element &&
                        isJoystickTarget(
                            element
                        )
                    ) {

                        return;
                    }

                    return originalTouchStart.apply(
                        this,
                        arguments
                    );
                };

            // -------------------------------------------------
            // Touch Move
            // -------------------------------------------------

            TouchInput._onTouchMove =
                function(event) {

                    const touches =
                        event.changedTouches;

                    if (touches) {

                        for (
                            let i = 0;
                            i < touches.length;
                            i++
                        ) {

                            const touch =
                                touches[i];

                            const element =
                                document.elementFromPoint(
                                    touch.clientX,
                                    touch.clientY
                                );

                            if (
                                element &&
                                isJoystickTarget(
                                    element
                                )
                            ) {

                                return;
                            }
                        }
                    }

                    return originalTouchMove.apply(
                        this,
                        arguments
                    );
                };

            // -------------------------------------------------
            // Touch End
            // -------------------------------------------------

            TouchInput._onTouchEnd =
                function(event) {

                    const touches =
                        event.changedTouches;

                    if (touches) {

                        for (
                            let i = 0;
                            i < touches.length;
                            i++
                        ) {

                            const touch =
                                touches[i];

                            const element =
                                document.elementFromPoint(
                                    touch.clientX,
                                    touch.clientY
                                );

                            if (
                                element &&
                                isJoystickTarget(
                                    element
                                )
                            ) {

                                return;
                            }
                        }
                    }

                    return originalTouchEnd.apply(
                        this,
                        arguments
                    );
                };
        }

        // =====================================================
        // 顯示 / 隱藏
        // =====================================================

        function updateVisibility() {

            const scene =
                SceneManager._scene;

            const isMap =
                scene instanceof Scene_Map;

            const messageBusy =
                $gameMessage &&
                $gameMessage.isBusy();

            const eventRunning =
                $gameMap &&
                $gameMap.isEventRunning();

            if (
                isMap &&
                !messageBusy &&
                !eventRunning
            ) {

                joystick.style.display =
                    "block";

            } else {

                joystick.style.display =
                    "none";

                resetJoystick();
            }
        }

        // =====================================================
        // SceneManager 更新
        // =====================================================

        const _SceneManager_updateMain =
            SceneManager.updateMain;

        SceneManager.updateMain =
            function() {

                _SceneManager_updateMain.apply(
                    this,
                    arguments
                );

                updateVisibility();
            };

        // =====================================================
        // 螢幕尺寸改變
        // =====================================================

        window.addEventListener(
            "resize",
            function() {

                const newSize =
                    getJoystickSize();

                const newStickSize =
                    getStickSize();

                joystick.style.width =
                    newSize + "px";

                joystick.style.height =
                    newSize + "px";

                stick.style.width =
                    newStickSize + "px";

                stick.style.height =
                    newStickSize + "px";

                resetJoystick();
            }
        );

        // =====================================================
        // 手機方向改變
        // =====================================================

        window.addEventListener(
            "orientationchange",
            function() {

                setTimeout(
                    function() {

                        const newSize =
                            getJoystickSize();

                        const newStickSize =
                            getStickSize();

                        joystick.style.width =
                            newSize + "px";

                        joystick.style.height =
                            newSize + "px";

                        stick.style.width =
                            newStickSize + "px";

                        stick.style.height =
                            newStickSize + "px";

                        resetJoystick();

                    },
                    200
                );
            }
        );
    }

    // =========================================================
    // RPG Maker MZ 啟動後建立
    // =========================================================

    const _Scene_Boot_start =
        Scene_Boot.prototype.start;

    Scene_Boot.prototype.start =
        function() {

            _Scene_Boot_start.apply(
                this,
                arguments
            );

            setTimeout(
                function() {

                    createJoystick();

                },
                100
            );
        };

})();