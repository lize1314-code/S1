/*:
 * @target MZ
 * @plugindesc v1.0.0 手機自動縮放遊戲畫面，保持16:9
 * @author ChatGPT
 *
 * @help
 * ============================================================================
 * MobileScreenScale
 * ============================================================================
 *
 * RPG Maker MZ 手機畫面自動縮放插件
 *
 * 適用：
 *   Screen Width  = 1280
 *   Screen Height = 720
 *
 * 功能：
 *   - 手機瀏覽器自動放大遊戲畫面
 *   - 保持原始 16:9 比例
 *   - 不拉伸遊戲畫面
 *   - 手機旋轉後重新計算
 *   - Android Chrome 支援
 *   - iPhone Safari 支援
 *   - 電腦版不修改 MZ 原本的縮放
 *   - 不修改 rmmz_core.js
 *
 * ============================================================================
 */

(() => {
    "use strict";

    // -------------------------------------------------------------------------
    // 判斷是否為手機
    // -------------------------------------------------------------------------

    function isMobileDevice() {
        const ua = navigator.userAgent || navigator.vendor || "";

        return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    }

    // -------------------------------------------------------------------------
    // 取得手機 viewport
    // -------------------------------------------------------------------------

    function getViewportWidth() {
        return Math.max(
            document.documentElement.clientWidth || 0,
            window.innerWidth || 0
        );
    }

    function getViewportHeight() {
        return Math.max(
            document.documentElement.clientHeight || 0,
            window.innerHeight || 0
        );
    }

    // -------------------------------------------------------------------------
    // 更新遊戲畫面
    // -------------------------------------------------------------------------

    function updateMobileScale() {

        if (!isMobileDevice()) {
            return;
        }

        if (!Graphics) {
            return;
        }

        if (!Graphics._canvas) {
            return;
        }

        const canvas = Graphics._canvas;

        const gameWidth = Graphics.width;
        const gameHeight = Graphics.height;

        if (!gameWidth || !gameHeight) {
            return;
        }

        const viewportWidth = getViewportWidth();
        const viewportHeight = getViewportHeight();

        if (viewportWidth <= 0 || viewportHeight <= 0) {
            return;
        }

        // -------------------------------------------------------------
        // 計算保持原始比例的最大尺寸
        // -------------------------------------------------------------

        const scaleX = viewportWidth / gameWidth;
        const scaleY = viewportHeight / gameHeight;

        const scale = Math.min(scaleX, scaleY);

        const displayWidth = Math.floor(gameWidth * scale);
        const displayHeight = Math.floor(gameHeight * scale);

        // -------------------------------------------------------------
        // Canvas 顯示設定
        // -------------------------------------------------------------

        canvas.style.position = "fixed";

        canvas.style.width = displayWidth + "px";
        canvas.style.height = displayHeight + "px";

        canvas.style.left = "50%";
        canvas.style.top = "50%";

        canvas.style.transform = "translate(-50%, -50%)";

        canvas.style.margin = "0";
        canvas.style.padding = "0";

        canvas.style.maxWidth = "none";
        canvas.style.maxHeight = "none";

        canvas.style.display = "block";

        canvas.style.objectFit = "contain";
    }

    // -------------------------------------------------------------------------
    // 延遲更新
    // -------------------------------------------------------------------------

    function refreshScale() {

        setTimeout(updateMobileScale, 100);
        setTimeout(updateMobileScale, 500);
        setTimeout(updateMobileScale, 1000);
    }

    // -------------------------------------------------------------------------
    // SceneManager 初始化完成
    // -------------------------------------------------------------------------

    const _SceneManager_initialize = SceneManager.initialize;

    SceneManager.initialize = function() {

        _SceneManager_initialize.call(this);

        refreshScale();
    };

    // -------------------------------------------------------------------------
    // 瀏覽器尺寸改變
    // -------------------------------------------------------------------------

    window.addEventListener("resize", function() {

        refreshScale();

    });

    // -------------------------------------------------------------------------
    // 手機旋轉
    // -------------------------------------------------------------------------

    window.addEventListener("orientationchange", function() {

        setTimeout(function() {

            updateMobileScale();

        }, 500);

    });

    // -------------------------------------------------------------------------
    // Visual Viewport
    // -------------------------------------------------------------------------

    if (window.visualViewport) {

        window.visualViewport.addEventListener("resize", function() {

            refreshScale();

        });

    }

    // -------------------------------------------------------------------------
    // 頁面載入完成
    // -------------------------------------------------------------------------

    window.addEventListener("load", function() {

        refreshScale();

    });

})();