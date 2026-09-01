/*:
 * @target MV MZ
 * @plugindesc Touch not to avoid the event symbols when moving.
 * @author Shitsudo Kei
 *
 * @help There are no plugin commands in this plugin.
 * This plugin is compatible with RPG Maker MV and MZ.
 *
 * -Features
 * Reduce the pathfinding limit on touch moves to avoid event symbols and increase the encounter rate with symbol encounters.
 * Caution：Due to the impact of the change, the default touch-move pathfinding ability changes.
 *
 * I will not be responsible for any problems that may occur. Please understand. 
 * -License
 * This plugin is distributed under the MIT license.
 * Feel free to use it.
 * http://opensource.org/licenses/mit-license.php
 */
/*:ja
 * @target MV MZ
 * @plugindesc タッチ移動時イベントシンボルを避けないようにします。
 * @author 湿度ケイ
 *
 * @help このプラグインには、プラグインコマンドはありません。
 * このプラグインは、RPGツクールMVとMZに対応しています。
 *
 * ■概要
 * タッチ移動時の経路探索上限を減らすことで、イベントシンボルを避けないようにし、シンボルエンカウントとのエンカウント率を上げます。
 * ※注意：副作用として通常のタッチ移動のスペックを大きく損ないます。
 *
 * ■ライセンス表記
 * このプラグインは MIT ライセンスで配布されます。
 * ご自由にお使いください。
 * http://opensource.org/licenses/mit-license.php
 */

/*:zh
 * @target MV MZ
 * @plugindesc 在触摸移动时不会避开事件符号。
 * @author Shitsudo Kei
 *
 * @help 本插件没有插件命令。
 * 本插件兼容 RPG Maker MV 和 MZ。
 *
 * ■ 概要
 * 通过减少触摸移动时的路径搜索上限，
 * 使角色不再自动避开事件符号，
 * 从而提高与符号遭遇战的遭遇率。
 *
 * ※ 注意：作为副作用，会严重降低普通触摸移动的表现。
 *
 * ■ 许可证
 * 本插件基于 MIT 许可证发布。
 * 你可以自由使用本插件。
 * http://opensource.org/licenses/mit-license.php
 */

(function() {

    //
    // overwrite
    //
    Game_Character.prototype.searchLimit = function() {
        return 2;
    };

})();


/*:
 * ============================================================================
 * Virtual Joystick Extension
 * ============================================================================
 * 在完全保留原 TouchMoveForSymbolEncount 功能的基礎上追加虛擬搖桿。
 * ============================================================================
 */

(function() {
    "use strict";

    const JOYSTICK_ID = "tmse-virtual-joystick";

    let joystick = null;
    let stick = null;
    let activePointerId = null;
    let currentDirection = 0;
    let lastMoveTime = 0;

    const OUTER_SIZE = 150;
    const STICK_SIZE = 64;
    const MOVE_INTERVAL = 170;

    function canUseJoystick() {
        if (!$gamePlayer) return false;
        if (!$gameMap) return false;

        if ($gameMessage && $gameMessage.isBusy()) {
            return false;
        }

        if (
            SceneManager._scene &&
            !(SceneManager._scene instanceof Scene_Map)
        ) {
            return false;
        }

        if ($gameMap.isEventRunning()) {
            return false;
        }

        return true;
    }

    function createJoystick() {
        if (joystick || !document.body) {
            return;
        }

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

    function updateJoystickPosition() {
        if (!joystick) {
            return;
        }

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

    function resetStick() {
        if (!joystick || !stick) {
            return;
        }

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

    function getDirection(dx, dy) {

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance < 15) {
            return 0;
        }

        const angle =
            Math.atan2(dy, dx) * 180 / Math.PI;

        if (
            angle >= -22.5 &&
            angle < 22.5
        ) {
            return 6;
        }

        if (
            angle >= 22.5 &&
            angle < 67.5
        ) {
            return 2;
        }

        if (
            angle >= 67.5 &&
            angle < 112.5
        ) {
            return 2;
        }

        if (
            angle >= 112.5 &&
            angle < 157.5
        ) {
            return 2;
        }

        if (
            angle >= 157.5 ||
            angle < -157.5
        ) {
            return 4;
        }

        if (
            angle >= -157.5 &&
            angle < -112.5
        ) {
            return 8;
        }

        if (
            angle >= -112.5 &&
            angle < -67.5
        ) {
            return 8;
        }

        if (
            angle >= -67.5 &&
            angle < -22.5
        ) {
            return 8;
        }

        return 0;
    }

    function processPointer(clientX, clientY) {

        if (!joystick || !stick) {
            return;
        }

        const rect =
            joystick.getBoundingClientRect();

        const cx =
            rect.left + rect.width / 2;

        const cy =
            rect.top + rect.height / 2;

        let dx =
            clientX - cx;

        let dy =
            clientY - cy;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        const maxDistance =
            Math.max(
                1,
                rect.width / 2 -
                stick.getBoundingClientRect().width / 2
            );

        if (distance > maxDistance) {

            dx =
                dx / distance *
                maxDistance;

            dy =
                dy / distance *
                maxDistance;
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

    function movePlayerByJoystick() {

        if (!currentDirection) {
            return;
        }

        if (!canUseJoystick()) {
            return;
        }

        const now =
            performance.now();

        if (
            now - lastMoveTime <
            MOVE_INTERVAL
        ) {
            return;
        }

        lastMoveTime = now;

        /*
         * 使用 RPG Maker 原生移動方式。
         * 不修改原本 TouchMoveForSymbolEncount 的 searchLimit。
         */
        $gamePlayer.executeMove(
            currentDirection
        );
    }

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

    function onPointerMove(event) {

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

    function onPointerUp(event) {

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
            visible ? "block" : "none";

        if (
            !visible &&
            activePointerId !== null
        ) {
            resetStick();
        }
    }


    //==================================================
    // Scene_Map
    //==================================================

    const _Scene_Map_start =
        Scene_Map.prototype.start;

    Scene_Map.prototype.start =
        function() {

            _Scene_Map_start.call(this);

            setTimeout(() => {

                createJoystick();

                updateJoystickPosition();

                updateVisibility();

            }, 0);
        };


    const _Scene_Map_update =
        Scene_Map.prototype.update;

    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(this);

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
    // 視窗大小 / 手機橫豎轉
    //==================================================

    window.addEventListener(
        "resize",
        () => {
            updateJoystickPosition();
        }
    );

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
    // 防止搖桿觸控傳給 RPG Maker 原生觸控移動
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