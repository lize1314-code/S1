/*:
 * @target MZ
 * @plugindesc 世界地圖城市名稱顯示插件－讀取事件「註解」
 * @author Custom
 *
 * @param World Map ID
 * @text 世界地圖ID
 * @type number
 * @min 1
 * @default 3
 *
 * @help
 * ============================================================
 * 世界地圖城市名稱顯示插件
 * ============================================================
 *
 * 使用方法：
 *
 * ① 在世界地圖建立一個事件
 *
 * ② 打開事件內容
 *
 * ③ 選擇：
 *    流程控制 → 註解...
 *
 * ④ 輸入：
 *
 *    <CityName:晨曦城>
 *
 * ⑤ 遊戲中會在該事件位置顯示：
 *
 *    晨曦城
 *
 * ============================================================
 * 可選設定
 * ============================================================
 *
 * 城市名稱：
 *
 *    <CityName:晨曦城>
 *
 * X軸位置：
 *
 *    <CityNameOffsetX:0>
 *
 * Y軸位置：
 *
 *    <CityNameOffsetY:-36>
 *
 * 例如：
 *
 *    <CityName:晨曦城>
 *    <CityNameOffsetX:0>
 *    <CityNameOffsetY:-50>
 *
 * ============================================================
 *
 * 插件會讀取事件的：
 *
 * ◆註解：<CityName:晨曦城>
 *
 * 不需要使用事件「備註」欄位。
 *
 * ============================================================
 */

(() => {
    "use strict";

    const pluginName = "WorldMapCityName_MZ";
    const params = PluginManager.parameters(pluginName);

    const WORLD_MAP_ID = Number(
        params["World Map ID"] || 3
    );


    // ============================================================
    // 取得事件註解
    // ============================================================

    function getEventComments(event) {

        if (!event) {
            return "";
        }

        const data = event.event();

        if (!data || !data.pages) {
            return "";
        }

        let text = "";

        // 搜尋所有事件頁
        for (const page of data.pages) {

            if (!page || !page.list) {
                continue;
            }

            for (const command of page.list) {

                // 108 = 第一行註解
                // 408 = 後續註解
                if (
                    command.code === 108 ||
                    command.code === 408
                ) {

                    if (
                        command.parameters &&
                        command.parameters.length > 0
                    ) {

                        text +=
                            String(command.parameters[0]) +
                            "\n";
                    }
                }
            }
        }

        return text;
    }


    // ============================================================
    // 取得城市名稱
    // ============================================================

    function getCityName(event) {

        const comments =
            getEventComments(event);

        const match =
            comments.match(
                /<CityName\s*:\s*(.*?)>/i
            );

        if (!match) {
            return "";
        }

        return String(match[1]).trim();
    }


    // ============================================================
    // 取得 X 偏移
    // ============================================================

    function getOffsetX(event) {

        const comments =
            getEventComments(event);

        const match =
            comments.match(
                /<CityNameOffsetX\s*:\s*(-?\d+(?:\.\d+)?)>/i
            );

        if (!match) {
            return 0;
        }

        return Number(match[1]);
    }


    // ============================================================
    // 取得 Y 偏移
    // ============================================================

    function getOffsetY(event) {

        const comments =
            getEventComments(event);

        const match =
            comments.match(
                /<CityNameOffsetY\s*:\s*(-?\d+(?:\.\d+)?)>/i
            );

        if (!match) {
            return -36;
        }

        return Number(match[1]);
    }


    // ============================================================
    // 城市名稱 Sprite
    // ============================================================

    function CityNameSprite(event) {

        Sprite.call(this);

        this._event = event;

        this._bitmap =
            new Bitmap(320, 60);

        this.bitmap =
            this._bitmap;

        this.anchor.x = 0.5;
        this.anchor.y = 1.0;

        this.z = 100;

        this._lastName = "";
        this._lastOffsetX = null;
        this._lastOffsetY = null;

        this.redraw();
    }


    CityNameSprite.prototype =
        Object.create(Sprite.prototype);

    CityNameSprite.prototype.constructor =
        CityNameSprite;


    // ============================================================
    // 重新繪製城市名稱
    // ============================================================

    CityNameSprite.prototype.redraw =
        function() {

            const name =
                getCityName(this._event);

            const offsetX =
                getOffsetX(this._event);

            const offsetY =
                getOffsetY(this._event);

            this._bitmap.clear();

            if (!name) {

                this._lastName = "";
                this._lastOffsetX = offsetX;
                this._lastOffsetY = offsetY;

                return;
            }

            this._bitmap.fontFace =
                $gameSystem.mainFontFace();

            this._bitmap.fontSize = 24;

            this._bitmap.textColor =
                "#ffffff";

            this._bitmap.outlineWidth = 6;

            this._bitmap.outlineColor =
                "rgba(0,0,0,0.9)";

            this._bitmap.drawText(
                name,
                0,
                0,
                320,
                45,
                "center"
            );

            this._lastName = name;
            this._lastOffsetX = offsetX;
            this._lastOffsetY = offsetY;
        };


    // ============================================================
    // 更新
    // ============================================================

    CityNameSprite.prototype.update =
        function() {

            Sprite.prototype.update.call(this);

            if (!$gameMap || !this._event) {
                return;
            }

            if (this._event._erased) {

                this.visible = false;

                return;
            }


            // 只在指定世界地圖顯示
            if (
                $gameMap.mapId() !==
                WORLD_MAP_ID
            ) {

                this.visible = false;

                return;
            }


            const name =
                getCityName(this._event);

            const offsetX =
                getOffsetX(this._event);

            const offsetY =
                getOffsetY(this._event);


            // 沒有城市名稱
            if (!name) {

                this.visible = false;

                return;
            }


            this.visible = true;


            // 如果註解內容有變化，重新繪製
            if (
                this._lastName !== name ||
                this._lastOffsetX !== offsetX ||
                this._lastOffsetY !== offsetY
            ) {

                this.redraw();
            }


            // 取得事件螢幕位置
            const screenX =
                this._event.screenX();

            const screenY =
                this._event.screenY();


            // 城市名稱跟隨事件
            this.x =
                screenX + offsetX;

            this.y =
                screenY + offsetY;
        };


    // ============================================================
    // Scene_Map
    // ============================================================

    const _Scene_Map_createAllWindows =
        Scene_Map.prototype.createAllWindows;


    Scene_Map.prototype.createAllWindows =
        function() {

            _Scene_Map_createAllWindows.call(this);

            this.createCityNames();
        };


    // ============================================================
    // 建立所有城市名稱
    // ============================================================

    Scene_Map.prototype.createCityNames =
        function() {

            this._cityNameSprites = [];

            if (!$gameMap) {
                return;
            }


            // 只在世界地圖建立
            if (
                $gameMap.mapId() !==
                WORLD_MAP_ID
            ) {
                return;
            }


            const events =
                $gameMap.events();


            for (let i = 0; i < events.length; i++) {

                const event =
                    events[i];

                if (!event) {
                    continue;
                }


                const name =
                    getCityName(event);


                // 沒有 CityName 就跳過
                if (!name) {
                    continue;
                }


                const sprite =
                    new CityNameSprite(event);


                this._cityNameSprites.push(
                    sprite
                );


                this.addChild(sprite);
            }
        };


    // ============================================================
    // Scene_Map 更新
    // ============================================================

    const _Scene_Map_update =
        Scene_Map.prototype.update;


    Scene_Map.prototype.update =
        function() {

            _Scene_Map_update.call(this);


            if (!this._cityNameSprites) {
                return;
            }


            for (
                let i = 0;
                i < this._cityNameSprites.length;
                i++
            ) {

                const sprite =
                    this._cityNameSprites[i];

                if (sprite) {
                    sprite.update();
                }
            }
        };


})();