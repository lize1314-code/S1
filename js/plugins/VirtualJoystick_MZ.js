/*:
 * @target MV MZ
 * @plugindesc Virtual Direction Buttons MZ - 四方向按鍵
 * @author Custom
 *
 * @help
 * ------------------------------------------------------------
 * Virtual Direction Buttons MZ
 * ------------------------------------------------------------
 *
 * 四方向虛擬按鍵：
 *
 *             ▲
 *             上
 *
 *        ◀ 左     右 ▶
 *
 *             下
 *             ▼
 *
 * RPG Maker：
 * 上 = 8
 * 下 = 2
 * 左 = 4
 * 右 = 6
 *
 * 功能：
 * - 左下角四方向按鍵
 * - 按住按鍵可連續移動
 * - 不修改 RPG Maker 原生點擊移動
 * - 按鍵觸控不會觸發地圖點擊移動
 * - 對話時隱藏
 * - 事件執行時隱藏
 * - 選單時隱藏
 * - 自動適應手機橫向／直向
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

    const BUTTONS_ID =
        "virtual-direction-buttons-mz";


    // 整組按鍵大小
    const DESKTOP_SIZE = 156;

    const MOBILE_SIZE = 144;


    // 單顆按鍵大小
    const DESKTOP_BUTTON = 50;

    const MOBILE_BUTTON = 46;


    // 按鍵間距
    const BUTTON_GAP = 4;


    // 左邊距離
    const LEFT_MARGIN = 16;


    // 下方距離
    const BOTTOM_MARGIN = 16;


    // 按鍵移動速度
    // 數值越大，移動越慢
    const MOVE_INTERVAL = 140;


    //============================================================
    // 變數
    //============================================================

    let buttonsContainer = null;

    let activeButton = null;

    let activeDirection = 0;

    let lastMoveTime = 0;


    //============================================================
    // 判斷是否可以使用
    //============================================================

    function canUseButtons() {

        if (!$gamePlayer) {
            return false;
        }


        if (!$gameMap) {
            return false;
        }


        // 只允許地圖場景
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
        if (
            $gameMap.isEventRunning()
        ) {

            return false;
        }


        return true;
    }


    //============================================================
    // 建立方向按鍵
    //============================================================

    function createButtons() {

        if (buttonsContainer) {
            return;
        }


        if (!document.body) {
            return;
        }


        // 防止重複
        const old =
            document.getElementById(
                BUTTONS_ID
            );


        if (old) {
            old.remove();
        }


        //========================================================
        // 建立容器
        //========================================================

        buttonsContainer =
            document.createElement("div");


        buttonsContainer.id =
            BUTTONS_ID;


        Object.assign(
            buttonsContainer.style,
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

                zIndex:
                    "99999",

                pointerEvents:
                    "none",

                userSelect:
                    "none",

                WebkitUserSelect:
                    "none",

                WebkitTouchCallout:
                    "none",

                touchAction:
                    "none"
            }
        );


        document.body.appendChild(
            buttonsContainer
        );


        //========================================================
        // 建立四個方向
        //========================================================

        createButton(
            "up",
            "▲",
            8
        );


        createButton(
            "left",
            "◀",
            4
        );


        createButton(
            "right",
            "▶",
            6
        );


        createButton(
            "down",
            "▼",
            2
        );


        updateButtonPosition();
    }


    //============================================================
    // 建立單顆按鍵
    //============================================================

    function createButton(
        name,
        text,
        direction
    ) {

        const button =
            document.createElement("div");


        button.dataset.direction =
            direction;


        button.dataset.name =
            name;


        button.textContent =
            text;


        Object.assign(
            button.style,
            {

                position:
                    "absolute",

                display:
                    "flex",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                width:
                    DESKTOP_BUTTON + "px",

                height:
                    DESKTOP_BUTTON + "px",

                borderRadius:
                    "12px",

                background:
                    "rgba(70,70,70,0.65)",

                border:
                    "2px solid rgba(255,255,255,0.45)",

                color:
                    "#ffffff",

                fontSize:
                    "28px",

                fontWeight:
                    "bold",

                boxSizing:
                    "border-box",

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
                    "transparent",

                cursor:
                    "pointer",

                transition:
                    "transform 0.05s"
            }
        );


        //========================================================
        // Pointer Down
        //========================================================

        button.addEventListener(
            "pointerdown",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                if (
                    !canUseButtons()
                ) {

                    return;
                }


                activeButton =
                    button;


                activeDirection =
                    direction;


                button.style.transform =
                    "scale(0.92)";


                try {

                    button.setPointerCapture(
                        event.pointerId
                    );

                } catch (error) {}


                movePlayer();
            },
            {
                passive: false
            }
        );


        //========================================================
        // Pointer Move
        //========================================================

        button.addEventListener(
            "pointermove",
            function(event) {

                if (
                    activeButton !==
                    button
                ) {

                    return;
                }


                event.preventDefault();

                event.stopPropagation();


                movePlayer();
            },
            {
                passive: false
            }
        );


        //========================================================
        // Pointer Up
        //========================================================

        button.addEventListener(
            "pointerup",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                releaseButton(
                    button
                );
            },
            {
                passive: false
            }
        );


        //========================================================
        // Pointer Cancel
        //========================================================

        button.addEventListener(
            "pointercancel",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                releaseButton(
                    button
                );
            },
            {
                passive: false
            }
        );


        //========================================================
        // Lost Pointer Capture
        //========================================================

        button.addEventListener(
            "lostpointercapture",
            function() {

                releaseButton(
                    button
                );
            }
        );


        //========================================================
        // Touch 事件
        //========================================================

        [
            "touchstart",
            "touchmove",
            "touchend",
            "touchcancel"
        ].forEach(
            function(type) {

                button.addEventListener(
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


        buttonsContainer.appendChild(
            button
        );
    }


    //============================================================
    // 放開按鍵
    //============================================================

    function releaseButton(
        button
    ) {

        if (
            button
        ) {

            button.style.transform =
                "scale(1)";
        }


        if (
            activeButton ===
            button
        ) {

            activeButton =
                null;

            activeDirection =
                0;
        }
    }


    //============================================================
    // 移動角色
    //============================================================

    function movePlayer() {

        if (
            !activeDirection
        ) {

            return;
        }


        if (
            !canUseButtons()
        ) {

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


        $gamePlayer.executeMove(
            activeDirection
        );
    }


    //============================================================
    // 更新按鍵位置
    //============================================================

    function updateButtonPosition() {

        if (
            !buttonsContainer
        ) {

            return;
        }


        const mobile =
            window.innerWidth <= 760;


        const containerSize =
            mobile
                ? MOBILE_SIZE
                : DESKTOP_SIZE;


        const buttonSize =
            mobile
                ? MOBILE_BUTTON
                : DESKTOP_BUTTON;


        buttonsContainer.style.width =
            containerSize + "px";


        buttonsContainer.style.height =
            containerSize + "px";


        const buttons =
            buttonsContainer.children;


        for (
            let i = 0;
            i < buttons.length;
            i++
        ) {

            buttons[i].style.width =
                buttonSize + "px";


            buttons[i].style.height =
                buttonSize + "px";


            buttons[i].style.fontSize =
                mobile
                    ? "24px"
                    : "28px";
        }


        const center =
            containerSize / 2;


        const offset =
            (containerSize -
            buttonSize) / 2;


        const gap =
            BUTTON_GAP;


        // 上
        const up =
            buttonsContainer.querySelector(
                '[data-name="up"]'
            );


        if (up) {

            up.style.left =
                offset + "px";

            up.style.top =
                "0px";
        }


        // 左
        const left =
            buttonsContainer.querySelector(
                '[data-name="left"]'
            );


        if (left) {

            left.style.left =
                "0px";

            left.style.top =
                offset + "px";
        }


        // 右
        const right =
            buttonsContainer.querySelector(
                '[data-name="right"]'
            );


        if (right) {

            right.style.left =
                (
                    containerSize -
                    buttonSize
                ) + "px";

            right.style.top =
                offset + "px";
        }


        // 下
        const down =
            buttonsContainer.querySelector(
                '[data-name="down"]'
            );


        if (down) {

            down.style.left =
                offset + "px";

            down.style.top =
                (
                    containerSize -
                    buttonSize
                ) + "px";
        }
    }


    //============================================================
    // 顯示／隱藏
    //============================================================

    function updateVisibility() {

        if (
            !buttonsContainer
        ) {

            return;
        }


        const scene =
            SceneManager._scene;


        let visible =
            true;


        // 非地圖
        if (
            !(scene instanceof Scene_Map)
        ) {

            visible =
                false;
        }


        // 對話
        if (
            $gameMessage &&
            $gameMessage.isBusy()
        ) {

            visible =
                false;
        }


        // 事件
        if (
            $gameMap &&
            $gameMap.isEventRunning()
        ) {

            visible =
                false;
        }


        buttonsContainer.style.display =
            visible
                ? "block"
                : "none";


        if (!visible) {

            if (activeButton) {

                activeButton.style.transform =
                    "scale(1)";
            }


            activeButton =
                null;


            activeDirection =
                0;
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

                    createButtons();

                    updateButtonPosition();

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


            createButtons();

            updateButtonPosition();

            updateVisibility();


            //======================================================
            // 按住方向鍵持續移動
            //======================================================

            if (
                activeButton &&
                activeDirection
            ) {

                movePlayer();
            }
        };


    //============================================================
    // 視窗大小改變
    //============================================================

    window.addEventListener(
        "resize",
        function() {

            updateButtonPosition();

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

                    updateButtonPosition();

                },
                100
            );
        }
    );


    //============================================================
    // RPG Maker TouchInput 隔離
    //
    // 只有方向鍵區域會被攔截。
    //
    // 地圖其他位置：
    //     完全保持原生點擊移動。
    //============================================================

    function isButtonTarget(
        target
    ) {

        return (
            buttonsContainer &&
            target &&
            buttonsContainer.contains(
                target
            )
        );
    }


    function isButtonTouchEvent(
        event
    ) {

        return (
            event &&
            isButtonTarget(
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
                        isButtonTouchEvent(
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
    // RPG Maker TouchInput
    // 忽略方向鍵觸控
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
                        isButtonTouchEvent(
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
                        isButtonTouchEvent(
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
                        isButtonTouchEvent(
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