/*:
 * @target MZ
 * @plugindesc MobileScreenScale - 1280x720 電腦＋手機橫向自適應版
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
 *
 * 【電腦】
 * 1. 1280 x 720 正常顯示
 * 2. 自動置中
 * 3. 視窗不足時自動縮小
 *
 * 【手機橫向】
 * 4. 自動適應手機螢幕
 * 5. 保持 16:9
 * 6. 不變形
 * 7. 自動置中
 * 8. 支援瀏海安全區域
 * 9. 支援手機旋轉
 *
 * 【其他】
 * 10. 禁止網頁捲動
 * 11. 禁止雙指縮放
 * 12. 不修改 RPG Maker MZ 內部解析度
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

    // =========================================================
    // 找到 RPG Maker MZ Canvas
    // =========================================================

    function getGameCanvas() {

        // RPG Maker MZ 正確 ID
        let canvas =
            document.getElementById("gameCanvas");

        if (canvas) {
            return canvas;
        }

        // 備用
        canvas =
            document.querySelector(
                "canvas#gameCanvas"
            );

        if (canvas) {
            return canvas;
        }

        return null;
    }

    // =========================================================
    // 建立 CSS
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

                touch-action: none;

                user-select: none;
                -webkit-user-select: none;

                -webkit-touch-callout: none;

                -webkit-tap-highlight-color:
                    transparent;
            }

            /*
             * RPG Maker MZ Canvas
             */

            #gameCanvas {

                position: fixed !important;

                margin: 0 !important;
                padding: 0 !important;

                display: block !important;

                transform-origin:
                    center center !important;

                touch-action: none !important;

                max-width: none !important;
                max-height: none !important;
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

        viewport.content =
            "width=device-width," +
            "height=device-height," +
            "initial-scale=1.0," +
            "minimum-scale=1.0," +
            "maximum-scale=1.0," +
            "user-scalable=no," +
            "viewport-fit=cover";
    }

    // =========================================================
    // 取得可用視窗尺寸
    // =========================================================

    function getViewportSize() {

        let width =
            window.innerWidth;

        let height =
            window.innerHeight;

        /*
         * VisualViewport
         * 手機瀏覽器通常更準確
         */

        if (
            window.visualViewport &&
            window.visualViewport.width > 0 &&
            window.visualViewport.height > 0
        ) {

            width =
                window.visualViewport.width;

            height =
                window.visualViewport.height;
        }

        return {
            width: width,
            height: height
        };
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
                window.innerWidth <= 1024
            )
        );
    }

    // =========================================================
    // 調整遊戲畫面
    // =========================================================

    function resizeGame() {

        const canvas =
            getGameCanvas();

        if (!canvas) {
            return;
        }

        const viewport =
            getViewportSize();

        const viewportWidth =
            viewport.width;

        const viewportHeight =
            viewport.height;

        if (
            viewportWidth <= 0 ||
            viewportHeight <= 0
        ) {
            return;
        }

        // =====================================================
        // 計算等比例縮放
        // =====================================================

        const scaleX =
            viewportWidth /
            GAME_WIDTH;

        const scaleY =
            viewportHeight /
            GAME_HEIGHT;

        /*
         * 永遠使用較小比例。
         *
         * 確保整個 1280x720
         * 不會超出螢幕。
         */

        let scale =
            Math.min(
                scaleX,
                scaleY
            );

        // =====================================================
        // 電腦螢幕
        // =====================================================

        if (!isMobileDevice()) {

            /*
             * 如果電腦螢幕夠大：
             *
             * 直接顯示 1280 x 720
             *
             * 不放大。
             */

            scale =
                Math.min(
                    scale,
                    1
                );
        }

        // =====================================================
        // 最終顯示尺寸
        // =====================================================

        const displayWidth =
            GAME_WIDTH * scale;

        const displayHeight =
            GAME_HEIGHT * scale;

        // =====================================================
        // 套用
        // =====================================================

        canvas.style.position =
            "fixed";

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

        canvas.style.margin =
            "0";

        canvas.style.padding =
            "0";

        canvas.style.maxWidth =
            "none";

        canvas.style.maxHeight =
            "none";
    }

    // =========================================================
    // 安全區域
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
    // 防止手機網頁滑動
    // =========================================================

    function preventBrowserScroll() {

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

        document.addEventListener(
            "touchmove",
            function(event) {

                /*
                 * 只有多指觸控完全禁止，
                 * 避免影響虛擬搖桿。
                 */

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
    // 延遲重新調整
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
                50
            );
    }

    // =========================================================
    // 等待 Canvas 建立
    // =========================================================

    function waitForCanvas() {

        const canvas =
            getGameCanvas();

        if (!canvas) {

            setTimeout(
                waitForCanvas,
                100
            );

            return;
        }

        resizeGame();

        /*
         * RPG Maker MZ 啟動過程中
         * 再重新計算幾次。
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
    // 初始化
    // =========================================================

    function initialize() {

        setupViewport();

        createStyle();

        setupSafeArea();

        preventBrowserScroll();

        waitForCanvas();
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
    // 視窗尺寸改變
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

})();