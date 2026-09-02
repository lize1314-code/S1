/*:
 * @target MZ
 * @plugindesc MobileScreenScale - 1280x720 電腦/手機橫向自適應，修正手機觸控座標
 * @author Custom
 *
 * @help
 * ============================================================
 * MobileScreenScale.js
 * ============================================================
 *
 * RPG Maker MZ：
 *
 *     寬度：1280
 *     高度：720
 *
 * 功能：
 * 1. 電腦正常顯示
 * 2. 手機橫向自動縮放
 * 3. 保持 16:9
 * 4. 自動置中
 * 5. 手機旋轉自動調整
 * 6. 修正手機觸控座標
 * 7. 不攔截 RPG Maker MZ 觸控
 * 8. 不干擾 VirtualJoystick_MZ
 * 9. 不需要 Fullscreen_MZ
 *
 * ============================================================
 */

(function() {
    "use strict";

    // =========================================================
    // 遊戲解析度
    // =========================================================

    const GAME_WIDTH = 1280;
    const GAME_HEIGHT = 720;

    // =========================================================
    // 判斷是否為手機
    // =========================================================

    function isMobileDevice() {

        return (
            /Android|iPhone|iPad|iPod|Windows Phone/i
                .test(navigator.userAgent)
            ||
            (
                navigator.maxTouchPoints > 0 &&
                window.innerWidth <= 1024
            )
        );
    }

    // =========================================================
    // 建立基本 CSS
    //
    // 注意：
    // 不直接設定 Canvas 的 width / height。
    // 交給 RPG Maker MZ Graphics 管理。
    // =========================================================

    function createStyle() {

        if (
            document.getElementById(
                "mobile-screen-scale-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "mobile-screen-scale-style";

        style.textContent = `

            html {
                width: 100%;
                height: 100%;

                margin: 0;
                padding: 0;

                overflow: hidden;

                background: #000;

                overscroll-behavior: none;

                -webkit-text-size-adjust: 100%;
            }

            body {
                width: 100%;
                height: 100%;

                margin: 0;
                padding: 0;

                overflow: hidden;

                background: #000;

                overscroll-behavior: none;

                /*
                 * 不使用 touch-action:none
                 * 避免干擾 RPG Maker MZ。
                 */
                touch-action: manipulation;

                user-select: none;

                -webkit-user-select: none;

                -webkit-touch-callout: none;

                -webkit-tap-highlight-color:
                    transparent;
            }

            /*
             * 不自行設定 Canvas 尺寸。
             *
             * RPG Maker MZ Graphics
             * 會自行設定實際顯示尺寸。
             */

            #gameCanvas {
                touch-action: manipulation !important;
            }

        `;

        document.head.appendChild(style);
    }

    // =========================================================
    // Viewport
    // =========================================================

    function setupViewport() {

        let viewport =
            document.querySelector(
                'meta[name="viewport"]'
            );

        if (!viewport) {

            viewport =
                document.createElement("meta");

            viewport.name =
                "viewport";

            document.head.appendChild(
                viewport
            );
        }

        viewport.setAttribute(
            "content",

            "width=device-width," +
            "height=device-height," +
            "initial-scale=1.0," +
            "minimum-scale=1.0," +
            "maximum-scale=1.0," +
            "user-scalable=no," +
            "viewport-fit=cover"
        );
    }

    // =========================================================
    // 修改 RPG Maker MZ 的縮放計算
    //
    // 這是本版本最重要的部分。
    //
    // TouchInput 會使用 Graphics._realScale
    // 計算觸控座標。
    //
    // 因此：
    // 畫面縮放 = _realScale
    // 觸控座標 = 同一個 _realScale
    //
    // 兩者完全同步。
    // =========================================================

    function setupGraphicsScaling() {

        if (
            typeof Graphics ===
            "undefined"
        ) {
            return;
        }

        // -----------------------------------------------------
        // 強制使用 Stretch Mode
        // -----------------------------------------------------

        Graphics._stretchEnabled = true;

        // -----------------------------------------------------
        // 手機/電腦可用寬度
        // -----------------------------------------------------

        Graphics._stretchWidth =
            function() {

                if (
                    window.visualViewport &&
                    window.visualViewport.width > 0
                ) {

                    return window.visualViewport.width;
                }

                return window.innerWidth;
            };

        // -----------------------------------------------------
        // 手機/電腦可用高度
        // -----------------------------------------------------

        Graphics._stretchHeight =
            function() {

                if (
                    window.visualViewport &&
                    window.visualViewport.height > 0
                ) {

                    return window.visualViewport.height;
                }

                return window.innerHeight;
            };

        // -----------------------------------------------------
        // 重新計算比例
        // -----------------------------------------------------

        Graphics._updateRealScale =
            function() {

                if (
                    this._stretchEnabled &&
                    this._width > 0 &&
                    this._height > 0
                ) {

                    const width =
                        this._stretchWidth();

                    const height =
                        this._stretchHeight();

                    const scaleX =
                        width /
                        this._width;

                    const scaleY =
                        height /
                        this._height;

                    /*
                     * 保持 16:9。
                     *
                     * 使用較小比例，
                     * 確保整個遊戲畫面都能看到。
                     */

                    this._realScale =
                        Math.min(
                            scaleX,
                            scaleY
                        );

                    window.scrollTo(
                        0,
                        0
                    );

                } else {

                    this._realScale =
                        this._defaultScale;
                }
            };
    }

    // =========================================================
    // 更新遊戲畫面
    // =========================================================

    function refreshGraphics() {

        if (
            typeof Graphics ===
            "undefined"
        ) {
            return;
        }

        if (
            !Graphics._canvas
        ) {
            return;
        }

        /*
         * 使用 RPG Maker MZ 原本的
         * _updateAllElements。
         *
         * 它會同步：
         *
         * _realScale
         * Canvas
         * Video
         * Error Printer
         */

        if (
            typeof Graphics._updateAllElements ===
            "function"
        ) {

            Graphics._updateAllElements();

        } else {

            if (
                typeof Graphics._updateRealScale ===
                "function"
            ) {

                Graphics._updateRealScale();
            }

            if (
                typeof Graphics._updateCanvas ===
                "function"
            ) {

                Graphics._updateCanvas();
            }
        }
    }

    // =========================================================
    // Safe Area
    // =========================================================

    function setupSafeArea() {

        const root =
            document.documentElement;

        root.style.setProperty(
            "--safe-area-top",
            "env(safe-area-inset-top)"
        );

        root.style.setProperty(
            "--safe-area-right",
            "env(safe-area-inset-right)"
        );

        root.style.setProperty(
            "--safe-area-bottom",
            "env(safe-area-inset-bottom)"
        );

        root.style.setProperty(
            "--safe-area-left",
            "env(safe-area-inset-left)"
        );
    }

    // =========================================================
    // 防止手機雙指縮放
    //
    // 不攔截單指觸控。
    // =========================================================

    function setupTouchProtection() {

        document.addEventListener(
            "gesturestart",
            function(event) {

                event.preventDefault();

            },
            {
                passive: false
            }
        );

        document.addEventListener(
            "gesturechange",
            function(event) {

                event.preventDefault();

            },
            {
                passive: false
            }
        );

        document.addEventListener(
            "gestureend",
            function(event) {

                event.preventDefault();

            },
            {
                passive: false
            }
        );

        /*
         * 只有多指觸控才阻止。
         *
         * 單指：
         * 完全交給 RPG Maker MZ。
         */

        document.addEventListener(
            "touchmove",
            function(event) {

                if (
                    event.touches &&
                    event.touches.length > 1
                ) {

                    event.preventDefault();
                }

            },
            {
                passive: false
            }
        );
    }

    // =========================================================
    // Resize
    // =========================================================

    let resizeTimer = null;

    function resizeGame() {

        if (resizeTimer) {

            clearTimeout(
                resizeTimer
            );
        }

        resizeTimer =
            setTimeout(
                function() {

                    refreshGraphics();

                    setupSafeArea();

                },
                50
            );
    }

    // =========================================================
    // 等待 RPG Maker MZ Graphics
    // =========================================================

    function waitForGraphics() {

        if (
            typeof Graphics ===
            "undefined"
        ) {

            setTimeout(
                waitForGraphics,
                100
            );

            return;
        }

        if (
            !Graphics._canvas
        ) {

            setTimeout(
                waitForGraphics,
                100
            );

            return;
        }

        /*
         * Graphics 已經建立，
         * 開始套用自適應。
         */

        setupGraphicsScaling();

        refreshGraphics();

        setupSafeArea();

        /*
         * MZ 啟動完成後再更新幾次。
         */

        setTimeout(
            refreshGraphics,
            100
        );

        setTimeout(
            refreshGraphics,
            300
        );

        setTimeout(
            refreshGraphics,
            700
        );
    }

    // =========================================================
    // 初始化
    // =========================================================

    function initialize() {

        setupViewport();

        createStyle();

        setupTouchProtection();

        setupSafeArea();

        waitForGraphics();
    }

    // =========================================================
    // DOM Ready
    // =========================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

    // =========================================================
    // 視窗大小改變
    // =========================================================

    window.addEventListener(
        "resize",
        resizeGame
    );

    // =========================================================
    // 手機旋轉
    // =========================================================

    window.addEventListener(
        "orientationchange",
        function() {

            setTimeout(
                resizeGame,
                100
            );

            setTimeout(
                resizeGame,
                400
            );

            setTimeout(
                resizeGame,
                800
            );
        }
    );

    // =========================================================
    // VisualViewport
    // =========================================================

    if (
        window.visualViewport
    ) {

        window.visualViewport.addEventListener(
            "resize",
            resizeGame
        );
    }

})();