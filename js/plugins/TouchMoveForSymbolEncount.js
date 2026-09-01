/*:
 * @target MZ
 * @plugindesc TouchMoveForSymbolEncount + Virtual Joystick 整合版
 * @author Shitsudo Kei / Integrated
 *
 * @help
 * 將 TouchMoveForSymbolEncount 的功能與虛擬搖桿整合為單一插件。
 *
 * 功能：
 * 1. 保留原插件：Game_Character.prototype.searchLimit() = 2
 * 2. 左下角顯示虛擬搖桿
 * 3. 支援八方向移動
 * 4. 使用 Game_Player.executeMove()，可正常觸發地圖事件接觸判定
 * 5. 事件、選單、訊息播放時自動隱藏搖桿
 * 6. 不需要另外啟用 VirtualJoystick_MZ.js
 *
 * 建議：
 * - 本插件 ON
 * - TouchMoveForSymbolEncount.js OFF
 * - VirtualJoystick_MZ.js OFF
 * - SmoothTouchMove.js 建議 OFF
 */

(() => {
    "use strict";

    //==================================================
    // TouchMoveForSymbolEncount 原功能
    //==================================================

    Game_Character.prototype.searchLimit = function() {
        return 2;
    };

    //==================================================
    // Virtual Joystick
    //==================================================

    const JOYSTICK_ID = "tmse-virtual-joystick";

    let joystick = null;
    let stick = null;
    let activePointerId = null;
    let currentDirection = 0;
    let lastMoveTime = 0;

    const OUTER_SIZE = 150;
    const STICK_SIZE = 64;
    const MOVE_INTERVAL = 85;

    //==================================================
    // 是否可以使用搖桿
    //==================================================

    function canUseJoystick() {
        if (!$gamePlayer) return false;
        if (!$gameMap) return false;

        if ($gameMessage && $gameMessage.isBusy()) {
            return false;
        }

        if (SceneManager._scene &&
            !(SceneManager._scene instanceof Scene_Map)) {
            return false;
        }

        if ($gameMap.isEventRunning()) {
            return false;
        }

        return true;
    }

    //==================================================
    // 建立搖桿
    //==================================================

    function createJoystick() {
        if (joystick || !document.body) return;

        joystick = document.createElement("div");
        joystick.id = JOYSTICK_ID;

        Object.assign(joystick.style, {
            position: "fixed",
            left: "max(12px, env(safe-area-inset-left))",
            bottom: "max(12px, env(safe-area-inset-bottom))",
            width: OUTER_SIZE + "px",
            height: OUTER_SIZE + "px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            border: "2px solid rgba(255,255,255,0.22)",
            boxSizing: "border-box",
            zIndex: "99999",
            pointerEvents: "auto",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none"
        });

        stick = document.createElement("div");

        Object.assign(stick.style, {
            position: "absolute",
            width: STICK_SIZE + "px",
            height: STICK_SIZE + "px",
            left: ((OUTER_SIZE - STICK_SIZE) / 2) + "px",
            top: ((OUTER_SIZE - STICK_SIZE) / 2) + "px",
            borderRadius: "50%",
            background: "rgba(255,224,138,0.80)",
            border: "2px solid rgba(255,255,255,0.55)",
            boxSizing: "border-box",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
            pointerEvents: "none"
        });

        joystick.appendChild(stick);
        document.body.appendChild(joystick);

        joystick.addEventListener(
            "pointerdown",
            onPointerDown,
            { passive: false }
        );

        joystick.addEventListener(
            "pointermove",
            onPointerMove,
            { passive: false }
        );

        joystick.addEventListener(
            "pointerup",
            onPointerUp,
            { passive: false }
        );

        joystick.addEventListener(
            "pointercancel",
            onPointerUp,
            { passive: false }
        );

        joystick.addEventListener(
            "lostpointercapture",
            onPointerUp,
            { passive: false }
        );

        updateJoystickPosition();
    }

    //==================================================
    // 手機尺寸
    //==================================================

    function updateJoystickPosition() {
        if (!joystick) return;

        const mobile = window.innerWidth <= 760;
        const size = mobile ? 132 : 150;
        const stickSize = mobile ? 58 : 64;

        joystick.style.width = size + "px";
        joystick.style.height = size + "px";

        if (stick) {
            stick.style.width = stickSize + "px";
            stick.style.height = stickSize + "px";
            stick.style.left =
                ((size - stickSize) / 2) + "px";
            stick.style.top =
                ((size - stickSize) / 2) + "px";
        }
    }

    //==================================================
    // 重置搖桿
    //==================================================

    function resetStick() {
        if (!joystick || !stick) return;

        const size =
            joystick.getBoundingClientRect().width;

        const stickSize =
            stick.getBoundingClientRect().width;

        stick.style.left =
            ((size - stickSize) / 2) + "px";

        stick.style.top =
            ((size - stickSize) / 2) + "px";

        activePointerId = null;
        currentDirection = 0;
    }

    //==================================================
    // 方向判定
    //==================================================

    function getDirection(dx, dy) {
        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance < 15) {
            return 0;
        }

        const angle =
            Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -22.5 && angle < 22.5) {
            return 6;
        }

        if (angle >= 22.5 && angle < 157.5) {
            return 2;
        }

        if (angle >= 157.5 || angle < -157.5) {
            return 4;
        }

        return 8;
    }

    //==================================================
    // 移動搖桿
    //==================================================

    function processPointer(clientX, clientY) {
        if (!joystick || !stick) return;

        const rect =
            joystick.getBoundingClientRect();

        const cx =
            rect.left + rect.width / 2;

        const cy =
            rect.top + rect.height / 2;

        let dx = clientX - cx;
        let dy = clientY - cy;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        const maxDistance =
            Math.max(
                1,
                rect.width / 2 -
                stick.getBoundingClientRect().width / 2
            );

        if (distance > maxDistance) {
            dx = dx / distance * maxDistance;
            dy = dy / distance * maxDistance;
        }

        const stickRect =
            stick.getBoundingClientRect();

        const baseX =
            rect.width / 2 -
            stickRect.width / 2;

        const baseY =
            rect.height / 2 -
            stickRect.height / 2;

        stick.style.left =
            (baseX + dx) + "px";

        stick.style.top =
            (baseY + dy) + "px";

        currentDirection =
            getDirection(dx, dy);
    }

    //==================================================
    // 執行角色移動
    //==================================================

    function movePlayerByJoystick() {
        if (!currentDirection) return;
        if (!canUseJoystick()) return;

        const now = performance.now();

        if (now - lastMoveTime < MOVE_INTERVAL) {
            return;
        }

        lastMoveTime = now;

        $gamePlayer.executeMove(currentDirection);
    }

    //==================================================
    // Pointer Down
    //==================================================

    function onPointerDown(event) {
        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!canUseJoystick()) {
            return;
        }

        activePointerId = event.pointerId;

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

    function onPointerMove(event) {
        if (
            activePointerId !== event.pointerId
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

    function onPointerUp(event) {
        if (
            activePointerId !== null &&
            event.pointerId !== activePointerId
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        resetStick();
    }

    //==================================================
    // 顯示／隱藏
    //==================================================

    function updateVisibility() {
        if (!joystick) return;

        const scene = SceneManager._scene;

        const visible =
            scene instanceof Scene_Map &&
            (!$gameMessage ||
             !$gameMessage.isBusy()) &&
            (!$gameMap ||
             !$gameMap.isEventRunning());

        joystick.style.display =
            visible ? "block" : "none";

        if (
            !visible &&
            activePointerId !== null
        ) {
            resetStick();
        }
    }

    //==================================================
    // Scene_Map 啟動
    //==================================================

    const _Scene_Map_start =
        Scene_Map.prototype.start;

    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);

        setTimeout(() => {
            createJoystick();
            updateJoystickPosition();
            updateVisibility();
        }, 0);
    };

    //==================================================
    // Scene_Map 更新
    //==================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;

    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);

        createJoystick();
        updateJoystickPosition();
        updateVisibility();

        if (activePointerId !== null) {
            movePlayerByJoystick();
        }
    };

    //==================================================
    // 螢幕大小變化
    //==================================================

    window.addEventListener("resize", () => {
        updateJoystickPosition();
    });

    window.addEventListener(
        "orientationchange",
        () => {
            setTimeout(
                updateJoystickPosition,
                100
            );
        }
    );

    //==================================================
    // 防止搖桿觸控冒泡
    //==================================================

    document.addEventListener(
        "touchstart",
        event => {
            if (
                joystick &&
                joystick.contains(event.target)
            ) {
                event.preventDefault();
            }
        },
        { passive: false }
    );

    document.addEventListener(
        "touchmove",
        event => {
            if (
                joystick &&
                joystick.contains(event.target)
            ) {
                event.preventDefault();
            }
        },
        { passive: false }
    );

    document.addEventListener(
        "touchend",
        event => {
            if (
                joystick &&
                joystick.contains(event.target)
            ) {
                event.preventDefault();
            }
        },
        { passive: false }
    );

})();