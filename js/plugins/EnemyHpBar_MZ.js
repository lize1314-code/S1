/*:
 * @target MZ
 * @plugindesc v1.0.0 戰鬥怪物HP血條，顯示於敵人上方
 * @author ChatGPT
 *
 * @param Bar Width
 * @text 血條寬度
 * @type number
 * @min 60
 * @default 140
 *
 * @param Bar Height
 * @text 血條高度
 * @type number
 * @min 4
 * @default 14
 *
 * @param Bar Y Offset
 * @text 血條垂直位置
 * @type number
 * @min -200
 * @default -20
 *
 * @param Show Name
 * @text 顯示怪物名稱
 * @type boolean
 * @on 顯示
 * @off 不顯示
 * @default true
 *
 * @param Show HP Text
 * @text 顯示HP數值
 * @type boolean
 * @on 顯示
 * @off 不顯示
 * @default false
 *
 * @param Name Font Size
 * @text 名稱文字大小
 * @type number
 * @min 10
 * @default 20
 *
 * @param HP Font Size
 * @text HP文字大小
 * @type number
 * @min 10
 * @default 16
 *
 * @param HP Color
 * @text HP文字顏色
 * @type string
 * @default #FFFFFF
 *
 * @param Bar Background
 * @text 血條背景
 * @type string
 * @default #333333
 *
 * @param Bar Color
 * @text 血條顏色
 * @type string
 * @default #E53935
 *
 * @param Border Color
 * @text 邊框顏色
 * @type string
 * @default #000000
 *
 * @param Opacity
 * @text 血條透明度
 * @type number
 * @min 0
 * @max 255
 * @default 255
 *
 * @param Show Dead
 * @text 死亡後顯示
 * @type boolean
 * @on 顯示
 * @off 隱藏
 * @default false
 *
 * @help
 * ============================================================================
 * EnemyHpBar_MZ
 * ============================================================================
 *
 * RPG Maker MZ 敵人HP血條插件。
 *
 * 功能：
 *
 * 1. 在敵人上方顯示HP血條
 * 2. 敵人受傷後即時更新
 * 3. 支援多個敵人
 * 4. 可顯示敵人名稱
 * 5. 可顯示目前HP / 最大HP
 * 6. 敵人死亡後可隱藏
 * 7. 可調整血條大小與位置
 *
 * 預設效果：
 *
 *              變異哥布林
 *           ┌──────────────┐
 *           │██████████░░░░│
 *           └──────────────┘
 *                    👹
 *
 * ============================================================================
 */

(() => {
    "use strict";

    const pluginName = "EnemyHpBar_MZ";
    const parameters = PluginManager.parameters(pluginName);

    const BAR_WIDTH = Number(parameters["Bar Width"] || 140);
    const BAR_HEIGHT = Number(parameters["Bar Height"] || 14);
    const BAR_Y_OFFSET = Number(parameters["Bar Y Offset"] || -20);

    const SHOW_NAME =
        String(parameters["Show Name"] || "true") === "true";

    const SHOW_HP_TEXT =
        String(parameters["Show HP Text"] || "false") === "true";

    const NAME_FONT_SIZE =
        Number(parameters["Name Font Size"] || 20);

    const HP_FONT_SIZE =
        Number(parameters["HP Font Size"] || 16);

    const HP_COLOR =
        String(parameters["HP Color"] || "#FFFFFF");

    const BAR_BACKGROUND =
        String(parameters["Bar Background"] || "#333333");

    const BAR_COLOR =
        String(parameters["Bar Color"] || "#E53935");

    const BORDER_COLOR =
        String(parameters["Border Color"] || "#000000");

    const OPACITY =
        Number(parameters["Opacity"] || 255);

    const SHOW_DEAD =
        String(parameters["Show Dead"] || "false") === "true";


    // =========================================================================
    // 建立敵人HP血條
    // =========================================================================

    class Sprite_EnemyHpBar extends Sprite {

        constructor(enemySprite) {
            super();

            this._enemySprite = enemySprite;
            this._enemy = enemySprite._battler;

            this._lastHp = -1;
            this._lastMhp = -1;
            this._lastName = "";

            this._width = BAR_WIDTH;

            this.bitmap = new Bitmap(
                BAR_WIDTH,
                this.bitmapHeight()
            );

            this.opacity = OPACITY;

            this.anchor.x = 0.5;
            this.anchor.y = 1;

            this.refresh();
        }

        bitmapHeight() {

            let height = BAR_HEIGHT + 8;

            if (SHOW_NAME) {
                height += NAME_FONT_SIZE + 4;
            }

            if (SHOW_HP_TEXT) {
                height += HP_FONT_SIZE + 4;
            }

            return height;
        }

        update() {

            super.update();

            if (!this._enemy) {
                return;
            }

            if (!this._enemy.isAlive() && !SHOW_DEAD) {
                this.visible = false;
                return;
            }

            this.visible = true;

            const hp = this._enemy.hp;
            const mhp = this._enemy.mhp;
            const name = this._enemy.name();

            if (
                hp !== this._lastHp ||
                mhp !== this._lastMhp ||
                name !== this._lastName
            ) {
                this.refresh();
            }

            this.updatePosition();
        }

        updatePosition() {

            if (!this._enemySprite) {
                return;
            }

            const enemyHeight = this._enemySprite.height;

            this.x = 0;
            this.y = -enemyHeight + BAR_Y_OFFSET;
        }

        refresh() {

            if (!this.bitmap) {
                return;
            }

            const enemy = this._enemy;

            if (!enemy) {
                return;
            }

            this._lastHp = enemy.hp;
            this._lastMhp = enemy.mhp;
            this._lastName = enemy.name();

            this.bitmap.clear();

            let currentY = 0;

            // -------------------------------------------------------------
            // 怪物名稱
            // -------------------------------------------------------------

            if (SHOW_NAME) {

                this.bitmap.fontSize = NAME_FONT_SIZE;
                this.bitmap.textColor = "#FFFFFF";
                this.bitmap.outlineColor = "#000000";
                this.bitmap.outlineWidth = 4;

                this.bitmap.drawText(
                    enemy.name(),
                    0,
                    currentY,
                    BAR_WIDTH,
                    NAME_FONT_SIZE + 4,
                    "center"
                );

                currentY += NAME_FONT_SIZE + 4;
            }

            // -------------------------------------------------------------
            // 血條
            // -------------------------------------------------------------

            const barX = 0;
            const barY = currentY;

            // 外框
            this.bitmap.fillRect(
                barX,
                barY,
                BAR_WIDTH,
                BAR_HEIGHT,
                BORDER_COLOR
            );

            // 背景
            this.bitmap.fillRect(
                barX + 2,
                barY + 2,
                BAR_WIDTH - 4,
                BAR_HEIGHT - 4,
                BAR_BACKGROUND
            );

            // HP比例
            let rate = 0;

            if (enemy.mhp > 0) {
                rate = enemy.hp / enemy.mhp;
            }

            rate = Math.max(0, Math.min(1, rate));

            const hpWidth =
                Math.floor((BAR_WIDTH - 4) * rate);

            if (hpWidth > 0) {

                this.bitmap.fillRect(
                    barX + 2,
                    barY + 2,
                    hpWidth,
                    BAR_HEIGHT - 4,
                    BAR_COLOR
                );
            }

            // -------------------------------------------------------------
            // HP文字
            // -------------------------------------------------------------

            if (SHOW_HP_TEXT) {

                currentY += BAR_HEIGHT + 2;

                this.bitmap.fontSize = HP_FONT_SIZE;
                this.bitmap.textColor = HP_COLOR;
                this.bitmap.outlineColor = "#000000";
                this.bitmap.outlineWidth = 3;

                const hpText =
                    enemy.hp + " / " + enemy.mhp;

                this.bitmap.drawText(
                    hpText,
                    0,
                    currentY,
                    BAR_WIDTH,
                    HP_FONT_SIZE + 4,
                    "center"
                );
            }
        }
    }


    // =========================================================================
    // Sprite_Enemy 初始化
    // =========================================================================

    const _Sprite_Enemy_initialize =
        Sprite_Enemy.prototype.initialize;

    Sprite_Enemy.prototype.initialize = function(battler) {

        _Sprite_Enemy_initialize.call(this, battler);

        this.createEnemyHpBar();
    };


    // =========================================================================
    // 建立血條
    // =========================================================================

    Sprite_Enemy.prototype.createEnemyHpBar = function() {

        if (!this._battler) {
            return;
        }

        this._enemyHpBar =
            new Sprite_EnemyHpBar(this);

        this.addChild(this._enemyHpBar);
    };


    // =========================================================================
    // 敵人血條更新
    // =========================================================================

    const _Sprite_Enemy_update =
        Sprite_Enemy.prototype.update;

    Sprite_Enemy.prototype.update = function() {

        _Sprite_Enemy_update.call(this);

        if (this._enemyHpBar) {

            this._enemyHpBar.updatePosition();

        }
    };

})();