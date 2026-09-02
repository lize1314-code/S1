/*:
 * @target MZ
 * @plugindesc MobileScreenScale - 1280x720 手機橫向滿版版
 * @author Custom
 *
 * @help
 * ============================================================
 * MobileScreenScale.js
 * ============================================================
 *
 * 專門配合 RPG Maker MZ：
 *
 *     畫面寬度：1280
 *     畫面高度：720
 *
 * 主要用途：
 *
 * 1. 手機橫向滿版
 * 2. 16:9 等比例縮放
 * 3. 不拉伸遊戲畫面
 * 4. 自動置中
 * 5. 支援手機旋轉
 * 6. 支援瀏海與安全區域
 * 7. 禁止手機網頁滑動
 * 8. 禁止瀏覽器雙指縮放
 * 9. 電腦瀏覽器正常顯示
 * 10. 不修改 RPG Maker MZ 內部解析度
 *
 * ============================================================
 */

(function() {
    "use strict";

    // =========================================================
    // RPG Maker MZ 遊戲解析度
    // =========================================================

    const GAME_WIDTH = 1280;
    const GAME_HEIGHT = 720;

    const GAME_RATIO =
        GAME_WIDTH / GAME_HEIGHT;

    // =========================================================
    // 基本 CSS
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

                touch-action: none;

                -webkit-text-size-adjust: 100%;
            }

            body {
                width: 100%;
                height: 100%;

                margin: 0;
                padding: 0;

                overflow: hidden;

                background: #000;

                touch-action: none;

                overscroll-behavior: none;

                user-select: none;
                -webkit-user-select: none;

                -webkit-touch-callout: none;

                -webkit-tap-highlight-color:
                    transparent;
            }

            /*
             * RPG Maker MZ Canvas
             */

            #GameCanvas {

                position: fixed !important;

                left: 50% !important;
                top: 50% !important;

                margin: 0 !important;
                padding: 0 !important;

                transform:
                    translate(-50%, -50%) !important;

                transform-origin:
                    center center !important;

                max-width: none !important;
                max-height: none !important;

                display: block !important;

                touch-action: none !important;
            }

            /*
             * 防止其他 Canvas 造成頁面尺寸增加
             */

            canvas {
                display: block;
            }

        `;

        document.head.appendChild(style);
    }

    // =========================================================
    // 建立 / 修正 viewport
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
    // 找到 RPG Maker Canvas
    // =========================================================

    function getGameCanvas() {

        return (
            document.getElementById(
                "GameCanvas"
            ) ||
            document.querySelector(
                "canvas"
            )
        );
    }

    // =========================================================
    // 判斷手機
    // =========================================================

    function isMobileDevice() {

        return (
            /Android|iPhone|iPad|iPod|Windows Phone/i
                .test(navigator.userAgent)
            ||
            (
                navigator.maxTouchPoints > 0 &&
                Math.max(
                    window.innerWidth,
                    window.innerHeight
                ) <= 1400
            )
        );
    }

    // =========================================================
    // 取得目前真正可用的螢幕尺寸
    // =========================================================

    function getViewportSize() {

        let width =
            window.innerWidth;

        let height =
            window.innerHeight;

        /*
         * VisualViewport 在手機瀏覽器
         * 通常比 innerWidth / innerHeight
         * 更準確。
         */

        if (
            window.visualViewport
        ) {

            const viewport =
                window.visualViewport;

            if (
                viewport.width > 0 &&
                viewport.height > 0
            ) {

                width =
                    viewport.width;

                height =
                    viewport.height;
            }
        }

        return {
            width: width,
            height: height
        };
    }

    // =========================================================
    // 橫向判斷
    // =========================================================

    function isLandscape() {

        const size =
            getViewportSize();

        return (
            size.width >= size.height
        );
    }

    // =========================================================
    // 計算遊戲畫面
    // =========================================================

    function resizeGame() {

        const canvas =
            getGameCanvas();

        if (!canvas) {
            return;
        }

        const viewport =
            getViewportSize();

        let viewportWidth =
            viewport.width;

        let viewportHeight =
            viewport.height;

        if (
            viewportWidth <= 0 ||
            viewportHeight <= 0
        ) {
            return;
        }

        // =====================================================
        // 手機橫向
        // =====================================================

        if (
            isMobileDevice() &&
            isLandscape()
        ) {

            /*
             * 16:9 等比例縮放
             *
             * 使用「較小比例」
             * 確保整個遊戲畫面完整顯示。
             */

            const scaleX =
                viewportWidth /
                GAME_WIDTH;

            const scaleY =
                viewportHeight /
                GAME_HEIGHT;

            const scale =
                Math.min(
                    scaleX,
                    scaleY
                );

            const displayWidth =
                GAME_WIDTH * scale;

            const displayHeight =
                GAME_HEIGHT * scale;

            canvas.style.width =
                displayWidth + "px";

            canvas.style.height =
                displayHeight + "px";

            canvas.style.left =
                "50%";

            canvas.style.top =
                "50%";

            canvas.style.transform =
                "translate(-50%, -50%)";

            canvas.style.position =
                "fixed";

            canvas.style.margin =
                "0";

            canvas.style.padding =
                "0";

            return;
        }

        // =====================================================
        // 手機直向
        // =====================================================

        if (
            isMobileDevice() &&
            !isLandscape()
        ) {

            /*
             * 遊戲是 16:9 橫向。
             *
             * 直向時不強行拉伸。
             * 保持 16:9 比例並置中。
             */

            const scaleX =
                viewportWidth /
                GAME_WIDTH;

            const scaleY =
                viewportHeight /
                GAME_HEIGHT;

            const scale =
                Math.min(
                    scaleX,
                    scaleY
                );

            const displayWidth =
                GAME_WIDTH * scale;

            const displayHeight =
                GAME_HEIGHT * scale;

            canvas.style.width =
                displayWidth + "px";

            canvas.style.height =
                displayHeight + "px";

            canvas.style.left =
                "50%";

            canvas.style.top =
                "50%";

            canvas.style.transform =
                "translate(-50%, -50%)";

            canvas.style.position =
                "fixed";

            return;
        }

        // =====================================================
        // 電腦 / 平板
        // =====================================================

        const scaleX =
            viewportWidth /
            GAME_WIDTH;

        const scaleY =
            viewportHeight /
            GAME_HEIGHT;

        const scale =
            Math.min(
                scaleX,
                scaleY
            );

        const displayWidth =
            GAME_WIDTH * scale;

        const displayHeight =
            GAME_HEIGHT * scale;

        canvas.style.width =
            displayWidth + "px";

        canvas.style.height =
            displayHeight + "px";

        canvas.style.left =
            "50%";

        canvas.style.top =
            "50%";

        canvas.style.transform =
            "translate(-50%, -50%)";

        canvas.style.position =
            "fixed";

        canvas.style.margin =
            "0";

        canvas.style.padding =
            "0";
    }

    // =========================================================
    // 防止手機瀏覽器操作網頁
    // =========================================================

    function preventBrowserGestures() {

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
         * 防止手機上下拖曳網頁。
         *
         * 注意：
         * 不在這裡攔截 touchstart / touchend，
         * 避免影響 RPG Maker 及虛擬搖桿。
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
    // Safe Area
    // =========================================================

    function setupSafeArea() {

        document.documentElement.style
            .setProperty(
                "--safe-area-top",
                "env(safe-area-inset-top)"
            );

        document.documentElement.style
            .setProperty(
                "--safe-area-right",
                "env(safe-area-inset-right)"
            );

        document.documentElement.style
            .setProperty(
                "--safe-area-bottom",
                "env(safe-area-inset-bottom)"
            );

        document.documentElement.style
            .setProperty(
                "--safe-area-left",
                "env(safe-area-inset-left)"
            );
    }

    // =========================================================
    // 延遲重新計算
    // =========================================================

    let resizeTimer = null;

    function requestResize() {

        if (resizeTimer) {

            clearTimeout(
                resizeTimer
            );
        }

        resizeTimer =
            setTimeout(
                function() {

                    resizeGame();

                    setupSafeArea();

                },
                80
            );
    }

    // =========================================================
    // 初始化
    // =========================================================

    function initialize() {

        setupViewport();

        createStyle();

        setupSafeArea();

        preventBrowserGestures();

        resizeGame();

        /*
         * RPG Maker MZ Canvas
         * 可能在初始化後才建立，
         * 所以重新計算數次。
         */

        setTimeout(
            resizeGame,
            100
        );

        setTimeout(
            resizeGame,
            300
        );

        setTimeout(
            resizeGame,
            700
        );

        setTimeout(
            resizeGame,
            1200
        );
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
    // 視窗大小變化
    // =========================================================

    window.addEventListener(
        "resize",
        requestResize
    );

    // =========================================================
    // 手機旋轉
    // =========================================================

    window.addEventListener(
        "orientationchange",
        function() {

            setTimeout(
                requestResize,
                100
            );

            setTimeout(
                requestResize,
                400
            );

            setTimeout(
                requestResize,
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
            requestResize
        );
    }

    // =========================================================
    // RPG Maker MZ 啟動後再次調整
    // =========================================================

    const waitForCanvas =
        setInterval(
            function() {

                const canvas =
                    getGameCanvas();

                if (canvas) {

                    resizeGame();

                    clearInterval(
                        waitForCanvas
                    );
                }

            },
            100
        );

    // 最多等待 10 秒
    setTimeout(
        function() {

            clearInterval(
                waitForCanvas
            );

        },
        10000
    );

})();