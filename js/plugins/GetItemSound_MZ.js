/*:
 * @target MZ
 * @plugindesc 獲得／扣除物品＋金錢自動音效：12種音效
 * @author Custom
 *
 * @param Normal Get SE
 * @text 普通物品－獲得音效
 * @type file
 * @dir audio/se/
 * @default Item3
 *
 * @param Normal Lose SE
 * @text 普通物品－扣除音效
 * @type file
 * @dir audio/se/
 * @default Cancel2
 *
 * @param Weapon Get SE
 * @text 武器－獲得音效
 * @type file
 * @dir audio/se/
 * @default Equip1
 *
 * @param Weapon Lose SE
 * @text 武器－扣除音效
 * @type file
 * @dir audio/se/
 * @default Cancel2
 *
 * @param Armor Get SE
 * @text 防具－獲得音效
 * @type file
 * @dir audio/se/
 * @default Equip2
 *
 * @param Armor Lose SE
 * @text 防具－扣除音效
 * @type file
 * @dir audio/se/
 * @default Cancel2
 *
 * @param Rare Get SE
 * @text 稀有物品－獲得音效
 * @type file
 * @dir audio/se/
 * @default Item1
 *
 * @param Rare Lose SE
 * @text 稀有物品－扣除音效
 * @type file
 * @dir audio/se/
 * @default Cancel2
 *
 * @param Quest Get SE
 * @text 任務物品－獲得音效
 * @type file
 * @dir audio/se/
 * @default Decision2
 *
 * @param Quest Lose SE
 * @text 任務物品－扣除音效
 * @type file
 * @dir audio/se/
 * @default Cancel2
 *
 * @param Gold Get SE
 * @text 金錢－增加音效
 * @type file
 * @dir audio/se/
 * @default Coin
 *
 * @param Gold Lose SE
 * @text 金錢－扣除音效
 * @type file
 * @dir audio/se/
 * @default Buzzer1
 *
 * @param Volume
 * @text 音量
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param Pitch
 * @text 音調
 * @type number
 * @min 50
 * @max 150
 * @default 100
 *
 * @param Pan
 * @text 聲道
 * @type number
 * @min -100
 * @max 100
 * @default 0
 *
 * @help
 * ================================================================
 * GetItemSound_MZ
 * ================================================================
 *
 * 自動播放：
 *
 * 普通物品：
 *   獲得 → 普通物品獲得音效
 *   扣除 → 普通物品扣除音效
 *
 * 武器：
 *   獲得 → 武器獲得音效
 *   扣除 → 武器扣除音效
 *
 * 防具：
 *   獲得 → 防具獲得音效
 *   扣除 → 防具扣除音效
 *
 * 稀有物品：
 *   獲得 → 稀有物品獲得音效
 *   扣除 → 稀有物品扣除音效
 *
 * 任務物品：
 *   獲得 → 任務物品獲得音效
 *   扣除 → 任務物品扣除音效
 *
 * 金錢：
 *   增加 → 金錢增加音效
 *   扣除 → 金錢扣除音效
 *
 * ================================================================
 * 【稀有物品】
 *
 * 物品／武器／防具備註加入：
 *
 * <RareItem>
 *
 * ================================================================
 * 【任務物品】
 *
 * 物品備註加入：
 *
 * <QuestItem>
 *
 * ================================================================
 * 【分類優先順序】
 *
 * 任務物品
 * ↓
 * 稀有物品
 * ↓
 * 武器
 * ↓
 * 防具
 * ↓
 * 普通物品
 *
 * ================================================================
 * 【金錢】
 *
 * ◆增減金錢：+100
 * → 播放金錢增加音效
 *
 * ◆增減金錢：-100
 * → 播放金錢扣除音效
 *
 * 商店購買商品時扣除金錢，
 * 也會自動播放金錢扣除音效。
 *
 * ================================================================
 */

(() => {
    "use strict";

    const pluginName = "GetItemSound_MZ";
    const params = PluginManager.parameters(pluginName);

    // ============================================================
    // 物品音效
    // ============================================================

    const normalGetSe = String(
        params["Normal Get SE"] || "Item3"
    );

    const normalLoseSe = String(
        params["Normal Lose SE"] || "Cancel2"
    );

    const weaponGetSe = String(
        params["Weapon Get SE"] || "Equip1"
    );

    const weaponLoseSe = String(
        params["Weapon Lose SE"] || "Cancel2"
    );

    const armorGetSe = String(
        params["Armor Get SE"] || "Equip2"
    );

    const armorLoseSe = String(
        params["Armor Lose SE"] || "Cancel2"
    );

    const rareGetSe = String(
        params["Rare Get SE"] || "Item1"
    );

    const rareLoseSe = String(
        params["Rare Lose SE"] || "Cancel2"
    );

    const questGetSe = String(
        params["Quest Get SE"] || "Decision2"
    );

    const questLoseSe = String(
        params["Quest Lose SE"] || "Cancel2"
    );

    // ============================================================
    // 金錢音效
    // ============================================================

    const goldGetSe = String(
        params["Gold Get SE"] || "Coin"
    );

    const goldLoseSe = String(
        params["Gold Lose SE"] || "Buzzer1"
    );

    // ============================================================
    // SE 基本設定
    // ============================================================

    const volume = Number(
        params["Volume"] || 90
    );

    const pitch = Number(
        params["Pitch"] || 100
    );

    const pan = Number(
        params["Pan"] || 0
    );

    // ============================================================
    // 建立 SE
    // ============================================================

    function makeSe(name) {
        if (!name) {
            return null;
        }

        return {
            name: name,
            volume: volume,
            pitch: pitch,
            pan: pan
        };
    }

    // ============================================================
    // 備註標籤判斷
    // ============================================================

    function hasMeta(item, tag) {
        return (
            item &&
            item.meta &&
            item.meta[tag] !== undefined
        );
    }

    // ============================================================
    // 判斷物品音效
    // ============================================================

    function getItemSound(item, isGain) {
        if (!item) {
            return null;
        }

        // --------------------------------------------------------
        // 任務物品
        // --------------------------------------------------------

        if (hasMeta(item, "QuestItem")) {
            return makeSe(
                isGain
                    ? questGetSe
                    : questLoseSe
            );
        }

        // --------------------------------------------------------
        // 稀有物品
        // --------------------------------------------------------

        if (hasMeta(item, "RareItem")) {
            return makeSe(
                isGain
                    ? rareGetSe
                    : rareLoseSe
            );
        }

        // --------------------------------------------------------
        // 武器
        // --------------------------------------------------------

        if (DataManager.isWeapon(item)) {
            return makeSe(
                isGain
                    ? weaponGetSe
                    : weaponLoseSe
            );
        }

        // --------------------------------------------------------
        // 防具
        // --------------------------------------------------------

        if (DataManager.isArmor(item)) {
            return makeSe(
                isGain
                    ? armorGetSe
                    : armorLoseSe
            );
        }

        // --------------------------------------------------------
        // 普通物品
        // --------------------------------------------------------

        if (DataManager.isItem(item)) {
            return makeSe(
                isGain
                    ? normalGetSe
                    : normalLoseSe
            );
        }

        return null;
    }

    // ============================================================
    // 物品增減
    // ============================================================

    const _Game_Party_gainItem =
        Game_Party.prototype.gainItem;

    Game_Party.prototype.gainItem =
        function(item, amount, includeEquip) {

            const isGain = amount > 0;
            const isLose = amount < 0;

            let se = null;

            if (item && (isGain || isLose)) {
                se = getItemSound(
                    item,
                    isGain
                );
            }

            // 執行原本的增減物品
            _Game_Party_gainItem.call(
                this,
                item,
                amount,
                includeEquip
            );

            // 播放物品音效
            if (se) {
                AudioManager.playSe(se);
            }
        };

    // ============================================================
    // 金錢增減
    // ============================================================

    const _Game_Party_gainGold =
        Game_Party.prototype.gainGold;

    Game_Party.prototype.gainGold =
        function(amount) {

            const isGain = amount > 0;
            const isLose = amount < 0;

            // 執行原本的金錢增減
            _Game_Party_gainGold.call(
                this,
                amount
            );

            // 金錢增加
            if (isGain) {
                const se = makeSe(goldGetSe);

                if (se) {
                    AudioManager.playSe(se);
                }
            }

            // 金錢扣除
            if (isLose) {
                const se = makeSe(goldLoseSe);

                if (se) {
                    AudioManager.playSe(se);
                }
            }
        };

})();